# StressLess Freshman 🎓

A MERN stack web application built to help first-year university students plan their academics, track deadlines with live countdowns, and grow through curated learning content.

---

## Features

### 📋 Academic Planning
- Create **Daily**, **Weekly**, and **Monthly** plans
- Add tasks with **Low / Medium / High** priority
- Track progress with a visual completion percentage
- Color-code plans for quick visual identification

### ⏱️ Live Countdown Timers
- Every plan shows a live countdown to its deadline
- Compact view on list pages, full digits (DD:HH:MM:SS) on detail page
- Urgent warning indicator when a deadline is under 6 hours away

### 📚 Learning Library
- 8 pre-written, expert-quality articles — no database required
- Categories: **Motivation**, **Hard Work**, **Results**
- Topics: defeating procrastination, building study systems, managing stress, the compound effect, and more
- Full article reader with clean typography

### 🔐 Authentication
- JWT-based register / login / logout
- Protected routes — all planning features require login
- Content library is publicly accessible (no login required to read)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, React-Toastify |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Fonts | Fraunces (display) + Plus Jakarta Sans (body) |

---

## Project Structure

```
stresslessFreshman/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── planController.js
│   │   └── contentController.js   ← predefined articles, no DB needed
│   ├── middleware/
│   │   └── auth.js                ← JWT protect middleware
│   ├── models/
│   │   ├── User.js
│   │   └── Plan.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── plans.js
│   │   └── content.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── CountdownTimer.js + .css
    │   │   ├── Layout.js + .css
    │   │   └── PlanModal.js + .css
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── LandingPage.js + .css
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── AuthPage.css        ← shared auth styles
    │   │   ├── DashboardPage.js + .css
    │   │   ├── PlansPage.js + .css
    │   │   ├── PlanDetailPage.js + .css
    │   │   ├── ContentPage.js + .css
    │   │   └── ArticlePage.js + .css
    │   ├── utils/
    │   │   └── api.js              ← Axios instance with interceptors
    │   ├── App.js
    │   ├── index.js
    │   └── index.css               ← CSS variables, global styles
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or MongoDB Atlas)

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env and set:
#   MONGO_URI=mongodb://localhost:27017/stresslessfreshman
#   JWT_SECRET=your_secret_key_here
#   CLIENT_URL=http://localhost:3000
```

### 3. Run

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

Open http://localhost:3000

---

## API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Private | Get current user |

### Plans
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/plans | Private | Get all user plans |
| POST | /api/plans | Private | Create a plan |
| GET | /api/plans/:id | Private | Get single plan |
| PUT | /api/plans/:id | Private | Update plan |
| DELETE | /api/plans/:id | Private | Delete plan |
| PATCH | /api/plans/:id/tasks/:taskId | Private | Toggle task completion |

### Content (no auth required)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/content | Public | List all articles |
| GET | /api/content/categories | Public | Get categories |
| GET | /api/content/:id | Public | Get single article |

---

## Content Library Articles

All articles are predefined in `contentController.js` — no database required:

1. The Science of Motivation: Why You Do What You Do
2. Hard Work vs. Smart Work: The Truth No One Tells You
3. What Hard Work Actually Produces: Real Results
4. Defeating Procrastination: A Student's Tactical Guide
5. Building a Study System That Actually Works
6. The Freshman Mindset: Survive and Thrive in Your First Year
7. Long-Term Success: Building Habits That Outlast Willpower
8. Managing Academic Stress Without Burning Out

---

Built for students, by students · StressLess Freshman
