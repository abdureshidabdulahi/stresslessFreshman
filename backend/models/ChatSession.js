const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // If the user attached a file with this message
    fileInfo: {
      name: String,
      type: String, // 'pdf' | 'docx' | 'txt' | 'image'
    },
  },
  { timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      maxlength: 100,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

// Auto-generate a title from the first user message
chatSessionSchema.methods.generateTitle = function () {
  const firstUserMsg = this.messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    this.title = firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : '');
  }
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
