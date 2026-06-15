# CampusHub: Project Knowledge Base

This file provides a complete, A-to-Z forensic analysis and architectural knowledge base for the **CampusHub** platform. It covers structural properties, components, data flows, routes, schemas, and security controls based on a line-by-line inspection of the 82 active source files (10,429 lines of code).

---

## 📂 Phase 1: Project Codebase Inventory

### 🌲 Folder and File Tree
```text
campushub-swe-lab/
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── vercel.json
├── vite.config.js
├── api/
│   ├── alumni/
│   │   └── index.js
│   ├── assistant/
│   │   └── index.js
│   ├── auth/
│   │   └── index.js
│   ├── clubs/
│   │   └── index.js
│   ├── dashboard/
│   │   └── index.js
│   ├── jobs/
│   │   └── index.js
│   ├── live-classes/
│   │   └── index.js
│   ├── messages/
│   │   └── index.js
│   ├── notes/
│   │   └── index.js
│   ├── notices/
│   │   └── index.js
│   ├── profile/
│   │   └── index.js
│   ├── scholarships/
│   │   └── index.js
│   ├── settings/
│   │   └── index.js
│   └── tests/
│       └── index.js
├── lib/
│   ├── authHandler.js
│   ├── connectMongo.js
│   └── firebaseAdmin.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── server/
│   ├── firebaseAdmin.js
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   ├── db/
│   │   └── connectMongo.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── AlumniProfile.js
│   │   ├── AssistantMessage.js
│   │   ├── Club.js
│   │   ├── DashboardHome.js
│   │   ├── FacultyUser.js
│   │   ├── Job.js
│   │   ├── JobApplication.js
│   │   ├── LiveClass.js
│   │   ├── MockTest.js
│   │   ├── Note.js
│   │   ├── Notice.js
│   │   ├── ProfilePage.js
│   │   ├── Scholarship.js
│   │   ├── ScholarshipApplication.js
│   │   ├── SettingsPage.js
│   │   ├── StudentUser.js
│   │   ├── TestAttempt.js
│   │   └── UserProfile.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── faculty.js
│   │   ├── messages.js
│   │   ├── notices.js
│   │   └── settings.js
│   └── seed/
│       ├── facultyUsersSeed.js
│       ├── seedDashboardData.js
│       ├── seedDemoData.js
│       ├── seedFirebaseUsers.js
│       └── studentUsersSeed.js
└── src/
    ├── App.css
    ├── App.jsx
    ├── firebase.js
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   └── RequireRole.jsx
    ├── hooks/
    │   └── useProfile.js
    ├── layouts/
    │   └── DashboardLayout.jsx
    └── pages/
        ├── Auth.jsx
        ├── Landing.jsx
        └── dashboard/
            ├── AdminHome.jsx
            ├── Alumni.jsx
            ├── Assistant.jsx
            ├── Clubs.jsx
            ├── Courses.jsx
            ├── FacultyCourses.jsx
            ├── FacultyHome.jsx
            ├── Home.jsx
            ├── JobBoard.jsx
            ├── LiveClasses.jsx
            ├── Messages.jsx
            ├── MockTests.jsx
            ├── NotesLibrary.jsx
            ├── NoticeBoard.jsx
            ├── Profile.jsx
            ├── Scholarships.jsx
            ├── SectionPage.jsx
            └── Settings.jsx
```

### 📊 Metric Breakdown
*   **Total Source Code Files:** 82 (JS, JSX, HTML, CSS)
*   **Total Source Code Lines:** 10,429 lines
*   **Largest File:** [src/App.css](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/App.css) (3,240 lines)
*   **Largest Javascript/JSX File:** [src/pages/dashboard/NotesLibrary.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/NotesLibrary.jsx) (534 lines)

---

## 🔍 Phase 2: File-by-File Forensic Log

Below is a detailed trace of the structural configuration of key project files:

### 1. `src/hooks/useProfile.js`
*   **Purpose:** Standardizes authentication state listeners using Firebase Auth `onAuthStateChanged` and decodes tokens via the backend `/api/auth/me` endpoint.
*   **Imports:** `useEffect`, `useState` (React), `onAuthStateChanged` (Firebase Auth), `auth` (`src/firebase.js`).
*   **Exports:** Default function `useProfile`.
*   **State variables:** `state` (structure: `{ profile, loading, error }`).
*   **Side Effects:** Set up AbortController and mount listeners for Firebase Auth. Attempts mock-bypass loading from local storage token `campushub_mock_token`.
*   **API Calls:** `GET /api/auth/me` (passing Bearer token).
*   **Usage locations:** `src/App.jsx`, `src/components/RequireRole.jsx`, `src/layouts/DashboardLayout.jsx`, `src/pages/dashboard/NoticeBoard.jsx`, etc.

### 2. `src/components/RequireRole.jsx`
*   **Purpose:** Guarantees client-side route protection by enforcing login states and authorized user roles.
*   **Imports:** `Navigate` (React Router), `auth` (`src/firebase.js`), `useProfile` (`src/hooks/useProfile.js`).
*   **Props:** `allowedRoles` (Array), `children` (React Node).
*   **Usage locations:** [src/App.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/App.jsx).

### 3. `src/pages/Auth.jsx`
*   **Purpose:** Manages registration, signing in, Google Auth integration, and mock accounts logins.
*   **Imports:** `useState` (React), `useNavigate`, `useLocation` (React Router), Firebase auth objects (`signInWithPopup`, `GoogleAuthProvider`, etc.), local `auth` & `googleProvider`.
*   **State variables:** `authMode` ('login' | 'signup'), `formData` (`{ fullName, email, password }`), `loading` (Boolean), `error` (String).
*   **Database/API calls:** `POST /api/auth/register`, `POST /api/auth/login`. Bypasses Firebase auth when email includes `@campushub.edu` (writes token prefix `mock-` directly to LocalStorage).
*   **Usage locations:** Configured as `/auth` route elements in [src/App.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/App.jsx).

### 4. `api/notes/index.js`
*   **Purpose:** Handles student note-sharing API (search filtering, downloads registry, approvals and deletions).
*   **Database models referenced:** `Note`, `UserProfile`.
*   **APIs Implemented:**
    *   `GET /api/notes`: Lists notes based on category/search filters, with visibility logic (students only see approved and own pending notes; admins see all).
    *   `POST /api/notes?action=upload`: Submits student/faculty notes.
    *   `POST /api/notes?action=approve`: Updates note status to `approved` (Admin only).
    *   `POST /api/notes?action=download`: Increments download counts.
    *   `POST /api/notes?action=delete`: Deletes a note (Admin only).

---

## 🎨 Phase 3: React Frontend Architecture

### 🕸️ Component Hierarchy
```
App
 └── BrowserRouter
      └── Routes
           ├── Route (path="/") ────────► Landing
           ├── Route (path="/auth") ─────► Auth
           └── Route (path="/dashboard") ─► RequireRole (allowedRoles)
                                             └── DashboardLayout
                                                  └── Outlet (Routes)
                                                       ├── index ─────────► DashboardHomeWrapper (AdminHome | FacultyHome | StudentHome)
                                                       ├── courses ───────► CoursesWrapper (FacultyCourses | CoursesPage)
                                                       ├── notice-board ──► NoticeBoard
                                                       ├── notes-library ─► NotesLibrary
                                                       ├── messages ──────► Messages
                                                       ├── profile ───────► ProfilePage
                                                       ├── club ──────────► ClubsPage
                                                       └── ...
```

---

## 📡 Phase 4: Backend API Matrix

| Route Path | Method | Auth Required | Allowed Roles | Request Parameters | DB Collections |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | No | All | `idToken` | `UserProfile` |
| `/api/auth/register` | `POST` | No | All | `idToken` | `UserProfile` |
| `/api/auth/me` | `GET` | Yes (Bearer) | All | *None* | `UserProfile` |
| `/api/notices` | `GET` | Yes (Bearer) | All | `category`, `q` | `Notice` |
| `/api/notices` | `POST` | Yes (Bearer) | `faculty`, `admin` | `{ title, body, category, priority, audienceRoles }` | `Notice` |
| `/api/dashboard/home` | `GET` | No | All | `email` | `UserProfile`, `StudentUser`, `DashboardHome` |
| `/api/notes` | `GET` | Yes (Bearer) | All | `category`, `q` | `Note` |
| `/api/notes` | `POST` | Yes (Bearer) | All | `{ title, code, topic, category, pages }` | `Note` |

---

## 💾 Phase 5: Mongoose Schemas & Database Models

### 🗄️ Collections Topology
The primary models are defined under `server/models/`. Major models include:

1.  **`UserProfile`**: Represents unified logins. Maps `uid` (Firebase UID/Mock UID) and `email` to application `role` (`student` | `faculty` | `admin`).
2.  **`StudentUser`**: Contains school transcript variables (`studentId`, `gpa`, `department`, `year`, `semester`).
3.  **`FacultyUser`**: Holds faculty profile details (`designation`, `officeLocation`, `contactInfo`).
4.  **`Note`**: Holds note submissions, download counters, categories, authors, and approvals (`pending` | `approved`).
5.  **`Notice`**: Contains titles, body content, target audiences (`audienceRoles`), category tags, and creator signatures.

---

## 🔐 Phase 6: Authentication & Authorization Flow

The auth engine permits dual verification paths: Firebase cryptographically-verified tokens and mock testing tokens.

```
[Client Login Form] 
       │
       ├─► Check Email Pattern (@campushub.edu)
       │         │
       │         ├─► [Yes] ──► LocalStorage.setItem('campushub_mock_token', 'mock-<email>')
       │         │
       │         └─► [No] ───► Firebase SDK Auth (signInWithPopup / signInWithEmailAndPassword)
       │                            │
       │                            └─► Extract idToken 
       ▼
[Server API (/api/auth/login)]
       │
       ├─► Check token format (prefix: "mock-")
       │         │
       │         ├─► [Yes] ──► Bypass Firebase Certs Verification. Set Mock Profile payloads.
       │         │
       │         └─► [No] ───► admin.auth().verifyIdToken(token) (RSA validation via Google Certs)
       ▼
[Database Check / Upsert]
       │
       └─► UserProfile.findOneAndUpdate() ──► Return unified session profile
```

---

## 🛡️ Phase 7: Comprehensive Security Audit

Based on our forensic analysis, we highlight these key security limitations:

### 1. Mock Authentication Bypass in Production
*   **Location:** `server/routes/auth.js` and `lib/authHandler.js`.
*   **Vulnerability:** The code checks if the `Authorization` header token starts with the string `'mock-'`. If so, it skips Google Firebase token signatures verification and assigns user status.
*   **Risk:** Highly Critical. Allows anyone to inject headers such as `Authorization: Bearer mock-admin@campushub.edu` in production to completely compromise the database.

### 2. Missing Authentication on Mutations
*   **Location:** `api/clubs/index.js`, `api/jobs/index.js`, `api/live-classes/index.js`, `api/scholarships/index.js`.
*   **Vulnerability:** HTTP `POST` operations on these serverless routes accept JSON parameters and directly update/write to the database without checking JWT authorization tokens.
*   **Risk:** High. Allows malicious scripts to fill the database with fake listings.

### 3. Request Parameter Pollution (Direct Pass to Mongoose)
*   **Location:** `api/alumni/index.js`.
*   **Vulnerability:** Pass raw body variables directly to document creations without filtering fields.
*   **Risk:** Medium. Allows parameter override attacks.
