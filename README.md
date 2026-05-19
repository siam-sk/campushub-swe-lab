# CampusHub

CampusHub is a modern MERN-based campus platform serving learning resources, notices, events, and community features. The application uses React+Vite for the frontend, Express/Vercel Serverless for backend APIs.

## 📂 Project Structure

```text
campushub-swe-lab/
├── api/                  # Vercel Serverless API routes (Production Backend)
│   ├── alumni/
│   ├── assistant/
│   ├── auth/
│   ├── clubs/
│   ├── dashboard/
│   ├── jobs/
│   ├── live-classes/
│   ├── notices/
│   ├── profile/
│   ├── scholarships/
│   ├── settings/
│   └── tests/
├── server/               # Local Express server, MongoDB models, and Seeding scripts
│   ├── db/
│   ├── models/
│   ├── routes/
│   └── seed/             # Database & Firebase test data seeds
├── src/                  # React Frontend (Vite)
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── App.jsx
├── public/               # Static assets
├── index.html            # Vite entry point
└── vercel.json           # Vercel deployment configuration
```

## 🚀 Local Development Setup

### 1. Environment Variables

Create `.env` file inside the `/server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

_(Note: Be sure to preserve the `\n` newlines exactly as they appear in your `.env` for the Firebase private key)._

### 2. Install Dependencies

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

### 3. Seed Database and Test Users

To populate the database with dummy students and dashboard data:

```bash
cd server
npm run seed:dashboard
npm run seed:firebase-users
```

**Test Accounts:**

- **Email:** `john.student@campushub.edu`, `tanvir.hasan@campushub.edu`, etc.
- **Password:** `CampusHub@123`

### 4. Run the Application

Start the backend server (runs on `http://localhost:5000`):

```bash
cd server
npm run dev
```

In a new terminal, start the frontend Vite server (runs on `http://localhost:5173` and proxies `/api` to the backend):

```bash
npm run dev
```

## ☁️ Deployment (Vercel)

This project is configured to be deployed as a monolithic full-stack app on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. The framework preset should automatically be detected as **Vite**.
3. In the Vercel **Environment Variables** settings, add the keys from your `server/.env` (`MONGODB_URI`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
4. In your **MongoDB Atlas Dashboard**, make sure to add `0.0.0.0/0` (Allow Access from Anywhere) under **Network Access** so Vercel's dynamic IPs can connect.
5. Deploy. The frontend will build via Vite, and APIs will be automatically deployed as Vercel Serverless Functions from the `/api` directory.

## 🔐 Available APIs

Here is a list of API routes available in the system:

**Auth Handlers** (`/api/auth`)
- `POST /api/auth/register` - Registers a new user.
- `POST /api/auth/login` - Logs in an existing user.
- `GET /api/auth/me` - Validates the `Authorization: Bearer <idToken>` token.

**Dashboard APIs** (`/api/dashboard`)
- `GET /api/dashboard/home?email=...` - Fetches personalized user dashboard stats from MongoDB.
- `GET /api/dashboard/students` - Fetches a list of student profiles.

**Notices API** (`/api/notices`)
- `GET /api/notices?category=...&q=...` - Fetches a list of notices, with optional category and search query filters.
- `POST /api/notices` - Creates a new notice (requires faculty/admin role).

**Other Features (Vercel Serverless / Vercel API Folder)**
- `/api/alumni` - Alumni directory and request handling.
- `/api/assistant` - AI Study Assistant API logic.
- `/api/clubs` - Club directory and join handling.
- `/api/jobs` - Job Board API endpoints.
- `/api/live-classes` - Live class scheduling APIs.
- `/api/profile` - Profile management APIs.
- `/api/scholarships` - Scholarship directory APIs.
- `/api/settings` - Account settings APIs.
- `/api/tests` - Mock test logic APIs.

## Demo Area bypass
Since backend auth is bypassed for showcase/demo purposes, you can dynamically switch roles directly from the Login/Signup page by entering specific emails in the "Email Address" field (passwords can be anything).

- **Student Dashboard**: Use `student@campushub.edu`
- **Faculty Dashboard**: Use `faculty@campushub.edu`
- **Admin Dashboard**: Use `admin@campushub.edu`
