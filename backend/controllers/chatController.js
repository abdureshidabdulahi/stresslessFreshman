const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const ChatSession = require('../models/ChatSession');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY?.trim();
const GOOGLE_MODEL = process.env.GOOGLE_MODEL?.trim() || 'gemini-2.5-flash';

if (!GOOGLE_API_KEY || GOOGLE_API_KEY.startsWith('your_')) {
  console.warn('Missing or placeholder Google API key. Set GOOGLE_API_KEY in backend/.env with a valid key.');
}

// System prompt shared across all chat interactions
const SYSTEM_PROMPT = `You are an intelligent academic assistant built into the StressLess Freshman app — a platform designed for university and college students. Your role is to help students with:

- Understanding course material, concepts, and topics across all subjects
- Summarizing and creating concise study notes from content they share
- Generating practice quiz questions to help them self-test
- Recommending learning resources, strategies, and study techniques
- Answering academic questions clearly and patiently

Guidelines:
- Keep responses clear, well-structured, and student-friendly
- Use bullet points or numbered lists when it improves clarity
- When generating notes from a document, use the format:
  📄 SUMMARY: (2-3 sentence overview)
  🔑 KEY POINTS: (bullet list of the most important ideas)
  📝 TERMS TO KNOW: (key vocabulary if relevant)
  ❓ PRACTICE QUESTIONS: (2-3 questions to test understanding)
- When recommending resources, format them as:
  [RECOMMENDATION] Title | Type: book/video/website/article | Brief description
- Be encouraging and supportive — students are often stressed. Keep your tone warm and approachable.
- If a question is not related to education or learning, gently redirect the student back to academic topics.`;

// ── Helper: extract text from uploaded file buffer ──
async function extractTextFromFile(buffer, mimetype, originalname) {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalname.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimetype.startsWith('text/') || originalname.endsWith('.txt') || originalname.endsWith('.md')) {
    return buffer.toString('utf-8');
  }

  // Fallback for unrecognised text-like files
  return buffer.toString('utf-8');
}

// ── Helper: build a Gemini request body from session history ──
function buildGeminiContents(session, newUserContent) {
  const contents = [
    {
      role: 'model',
      parts: [{ text: SYSTEM_PROMPT }],
    },
  ];

  session.messages.slice(-20).forEach((m) => {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: newUserContent }],
  });

  return contents;
}

function extractGeminiText(data) {
  const candidate = data.candidates?.[0];
  const content = candidate?.content;
  if (!content) return null;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content.parts)) {
    return content.parts.map((part) => part.text || '').join('').trim();
  }

  if (typeof content.text === 'string') {
    return content.text;
  }

  return null;
}

async function generateTextFromGemini(contents, maxTokens = 1024) {
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY.startsWith('your_')) {
    throw new Error('Missing or invalid Google API key');
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${GOOGLE_MODEL}:generateContent?key=${encodeURIComponent(
    GOOGLE_API_KEY,
  )}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: maxTokens,
        topP: 0.9,
        topK: 40,
        candidateCount: 1,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.message || JSON.stringify(data);
    const userMessage = response.status === 404 && message.includes('Requested entity was not found')
      ? `The requested Gemini model '${GOOGLE_MODEL}' was not found. Verify GOOGLE_MODEL in backend/.env and make sure the Generative Language API is enabled for this key.`
      : message;
    const err = new Error(`Google Gemini error (${response.status}): ${userMessage}`);
    err.response = data;
    throw err;
  }

  const content = extractGeminiText(data);
  if (!content) {
    throw new Error('Google Gemini returned no response content');
  }
  return content;
}

function formatGoogleError(err) {
  const originalMessage =
    err.response?.error?.message ||
    err.response?.data?.error?.message ||
    err.response?.data?.message ||
    err.message ||
    'Unknown AI error';

  if (/invalid|authentication|api key|401/i.test(originalMessage)) {
    return 'Invalid Google API key configured on the server. Update backend/.env with a valid key.';
  }

  return originalMessage;
}

// ──────────────────────────────────────────────
// POST /api/chat/message
// Send a plain-text message and get an AI reply
// ──────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId, subject } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Load or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      if (!session) return res.status(404).json({ message: 'Session not found' });
    } else {
      session = new ChatSession({ user: req.user._id, messages: [] });
    }

    const userContent = subject
      ? `[Subject: ${subject}]\n\n${message.trim()}`
      : message.trim();

    const contents = buildGeminiContents(session, userContent);
    const reply = await generateTextFromGemini(contents, 1500);

    // Persist messages
    session.messages.push({ role: 'user', content: userContent });
    session.messages.push({ role: 'assistant', content: reply });

    // Set title from first message
    if (session.messages.length <= 2) {
      session.generateTitle();
    }

    await session.save();

    res.json({ reply, sessionId: session._id });
  } catch (err) {
    const errorMessage = formatGoogleError(err);
    console.error('sendMessage error:', errorMessage);
    res.status(500).json({ message: 'Failed to get AI response', error: errorMessage });
  }
};

// ──────────────────────────────────────────────
// POST /api/chat/upload
// Upload a file → AI generates structured notes
// ──────────────────────────────────────────────
exports.uploadAndSummarize = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { sessionId, prompt: userPrompt } = req.body;
    const { buffer, mimetype, originalname } = req.file;

    // Extract text from the file
    let extractedText;
    try {
      extractedText = await extractTextFromFile(buffer, mimetype, originalname);
    } catch (parseErr) {
      return res.status(422).json({ message: 'Could not read file content. Make sure it is a valid PDF, DOCX, or TXT file.' });
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(422).json({ message: 'The file appears to be empty or unreadable.' });
    }

    // Truncate to avoid token limits (~12000 chars ≈ ~3000 tokens)
    const textChunk = extractedText.slice(0, 12000);

    const customInstruction = userPrompt
      ? `The student also said: "${userPrompt}"\n\n`
      : '';

    const userContent = `${customInstruction}Please analyse the following document content and create structured study notes for me.\n\nDocument: "${originalname}"\n\n---\n${textChunk}\n---`;

    // Load or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      if (!session) return res.status(404).json({ message: 'Session not found' });
    } else {
      session = new ChatSession({ user: req.user._id, messages: [] });
    }

    const contents = buildGeminiContents(session, userContent);
    const summary = await generateTextFromGemini(contents, 2000);

    // Persist — store file info on the user message
    session.messages.push({
      role: 'user',
      content: userContent,
      fileInfo: {
        name: originalname,
        type: mimetype.includes('pdf') ? 'pdf' : mimetype.includes('word') ? 'docx' : 'txt',
      },
    });
    session.messages.push({ role: 'assistant', content: summary });

    if (session.messages.length <= 2) {
      session.title = `Notes: ${originalname.replace(/\.[^/.]+$/, '')}`.slice(0, 60);
    }

    await session.save();

    res.json({ summary, sessionId: session._id, filename: originalname });
  } catch (err) {
    const errorMessage = formatGoogleError(err);
    console.error('uploadAndSummarize error:', errorMessage);
    res.status(500).json({ message: 'Failed to process file', error: errorMessage });
  }
};

// ──────────────────────────────────────────────
// GET /api/chat/sessions
// List all sessions for the logged-in user
// ──────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select('title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(50);

    const result = sessions.map((s) => ({
      _id: s._id,
      title: s.title,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
    }));

    res.json(result);
  } catch (err) {
    console.error('getSessions error:', err.message);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

// ──────────────────────────────────────────────
// GET /api/chat/sessions/:id
// Load a full session with all messages
// ──────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error('getSession error:', err.message);
    res.status(500).json({ message: 'Failed to fetch session' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/chat/sessions/:id
// Delete a session
// ──────────────────────────────────────────────
exports.deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error('deleteSession error:', err.message);
    res.status(500).json({ message: 'Failed to delete session' });
  }
};
