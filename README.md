# StudHub 📚

**Live at [studhub.work](https://studhub.work)**

AI-powered student agenda that extracts every deadline from your syllabus in seconds.

---

## What it does

Upload a course syllabus PDF and StudHub uses Google Gemini AI to automatically extract all assignments, quizzes, labs, exams, and discussion posts — complete with due dates, times, and grade weights. Everything gets organized into a clean dashboard so you never miss a deadline.

## Features

- **AI Syllabus Parsing** — Upload a PDF and get every graded task extracted instantly
- **Smart Calendar** — Week view and full semester calendar with urgency color coding
- **Task Management** — Mark complete, edit, delete, or add tasks manually
- **Course Filtering** — Track multiple courses at once with color-coded organization
- **Export to Calendar** — Download a `.ics` file for Google Calendar or Apple Calendar
- **Google OAuth** — Sign in with Google or email/password
- **Guest Mode** — Try it without an account
- **Mobile Responsive** — Works on any device
- **Password Reset** — Email-based password recovery

## Tech Stack

**Frontend**
- React + TypeScript + Vite
- CSS Modules
- Deployed on Vercel

**Backend**
- Flask (Python)
- SQLAlchemy + PostgreSQL
- JWT Authentication
- Deployed on Railway

**AI & Services**
- Google Gemini 2.5 Flash (syllabus parsing)
- Resend (password reset emails)
- Google OAuth 2.0

## Running Locally

**Prerequisites:** Python 3.10+, Node.js 18+

**Backend:**
```bash
cd student-hub/backend
pip install -r requirements.txt
cp .env.example .env   # fill in your API keys
python app.py
```

**Frontend:**
```bash
cd student-hub/frontend
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

## Environment Variables

**Backend `.env`:**
