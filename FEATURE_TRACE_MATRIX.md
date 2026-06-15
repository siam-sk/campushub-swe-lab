# CampusHub: Feature Trace Matrix

This file provides a complete end-to-end data trace of all 14 features in the CampusHub application. Each feature is traced through:
`UI Element` → `Click/Event Handler` → `Function` → `API Endpoint` → `Backend Logic` → `Mongoose Model` → `Database Collection` → `Response Payload` → `Frontend State Update` → `UI Re-render`.

---

## 🧭 1. Feature Traces (A-to-Z)

### 1. Dashboard
*   **UI Element:** Main Dashboard home grid ([src/pages/dashboard/Home.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Home.jsx)).
*   **Click Handler:** Triggered automatically on mount via `useEffect`.
*   **Function:** `loadHome()` makes a request based on the logged-in user email.
*   **API Endpoint:** `GET /api/dashboard/home?email=<user_email>`
*   **Backend Logic:**
    1.  Looks up `UserProfile` or `StudentUser` matching the email query parameter.
    2.  Compiles custom statistics (My Courses count, New Notices count, Messages count, and GPA).
    3.  Falls back to a `DashboardHome` configuration or hardcoded template if the email has no registered profiles.
*   **Model:** `UserProfile` ([server/models/UserProfile.js](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/server/models/UserProfile.js)) & `StudentUser` ([server/models/StudentUser.js](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/server/models/StudentUser.js)).
*   **Database Collection:** `userprofiles` & `studentusers`.
*   **Response Payload:**
    ```json
    {
      "page": {
        "greetingName": "John",
        "greetingMessage": "Here's what's happening with your studies today",
        "stats": [{"title": "My Courses", "value": "6", "note": "Enrolled", "icon": "📘", "accent": "blue"}],
        "courses": [...],
        "notices": [...],
        "events": [...]
      },
      "source": "mongodb-profile"
    }
    ```
*   **Frontend State Update:** calls `setHomeData(payload.page)`.
*   **UI Re-render:** Re-populates greeting title, stats cards grid, courses progress cards, and notifications sidebar.

### 2. Courses
*   **UI Element:** Search input and Course Cards inside [src/pages/dashboard/Courses.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Courses.jsx).
*   **Click Handler:** `onChange` event in search input calls `setSearchQuery()`.
*   **Function:** `useMemo` filters the course array.
*   **API Endpoint:** *None*. It uses static mock arrays on the frontend.
*   **Backend Logic:** *None*.
*   **Model:** *None*.
*   **Database Collection:** *None*.
*   **Response Payload:** *None*.
*   **Frontend State Update:** State is updated locally through `setSearchQuery` and `setActiveCourse`.
*   **UI Re-render:** Re-filters and displays course grids and selected course detail overlay.

### 3. Notice Board
*   **UI Element:** Notice board board cards and category tabs inside [src/pages/dashboard/NoticeBoard.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/NoticeBoard.jsx).
*   **Click Handler:** Clicking category pills (Holiday, Exam, Event) triggers `setActiveFilter(filter)`.
*   **Function:** `useEffect` triggers loading hook.
*   **API Endpoint:** `GET /api/notices?category=<filter_name>&q=<search_query>`
*   **Backend Logic:**
    1.  Verifies the Bearer JWT token header.
    2.  Resolves target audience rules based on the user's role.
    3.  Filters Mongoose documents using regex query strings.
*   **Model:** `Notice` ([server/models/Notice.js](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/server/models/Notice.js)).
*   **Database Collection:** `notices`.
*   **Response Payload:**
    ```json
    {
      "notices": [
        {
          "_id": "603d...",
          "title": "Holiday Notice",
          "body": "Republic Day suspensions...",
          "category": "Holiday",
          "priority": "Medium",
          "publishAt": "2026-06-14T09:00:00Z"
        }
      ],
      "count": 1,
      "role": "student"
    }
    ```
*   **Frontend State Update:** Calls `setNotices(payload.notices)`.
*   **UI Re-render:** Feeds the notice timeline with cards sorted by publish dates.

### 4. Notes Library
*   **UI Element:** "Upload Note" button modal trigger inside [src/pages/dashboard/NotesLibrary.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/NotesLibrary.jsx).
*   **Click Handler:** Form submission `onSubmit` triggers `handleUploadSubmit(e)`.
*   **Function:** `handleUploadSubmit` makes a POST request to the API.
*   **API Endpoint:** `POST /api/notes`
*   **Backend Logic:**
    1.  Decodes user token.
    2.  If role is `admin` or `faculty`, sets `status` to `'approved'`, else defaults to `'pending'`.
    3.  Resolves subject tags and creates a new Mongoose document.
*   **Model:** `Note` ([server/models/Note.js](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/server/models/Note.js)).
*   **Database Collection:** `notes`.
*   **Response Payload:**
    ```json
    {
      "note": {
        "_id": "603d...",
        "title": "DSA Notes",
        "code": "CSE 3411",
        "topic": "Graphs",
        "category": "Data Structures",
        "author": "John Student",
        "status": "pending"
      }
    }
    ```
*   **Frontend State Update:** Calls `loadNotes()` to refresh lists.
*   **UI Re-render:** Shows new study card (under pending gray overlay if student uploaded).

### 5. Messages
*   **UI Element:** "Send" button and message input inside [src/pages/dashboard/Messages.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Messages.jsx).
*   **Click Handler:** Button click calls `handleSend()`.
*   **Function:** Appends message locally then submits to API.
*   **API Endpoint:** `POST /api/messages`
*   **Backend Logic:** Saves the message to MongoDB with conversation matching IDs.
*   **Model:** Compiled inline inside `api/messages/index.js` (Message Schema).
*   **Database Collection:** `messages`.
*   **Response Payload:**
    ```json
    {
      "message": {
        "conversationId": "sarah",
        "sender": "You",
        "body": "Hello Sarah!",
        "incoming": false,
        "time": "10:15 PM"
      }
    }
    ```
*   **Frontend State Update:** Updates `messages` state list with timestamps.
*   **UI Re-render:** Appends outgoing message bubble at bottom of chat panel.

---

## 🔘 2. Complete Button Registry

| Button Label | Parent Component | Event Handler | Target API | Payload / Impact |
| :--- | :--- | :--- | :--- | :--- |
| **"Continue with Google"**| `Auth.jsx` | `handleGoogleLogin` | `POST /api/auth/login` | `{ idToken }` / Upserts `UserProfile` record |
| **"Sign In"** | `Auth.jsx` | `handleLogin` | `POST /api/auth/login` | `{ email, password }` / Verifies session |
| **"Request Mentorship"** | `Alumni.jsx` | `handleRequest(id)`| `POST /api/alumni/request`| `{ alumniId }` / Flags graduation mentor request |
| **"Send" (AI Assistant)** | `Assistant.jsx` | `handleSend()` | `POST /api/assistant` | `{ body, sender }` / Saves query to MongoDB |
| **"Join" (Clubs)** | `Clubs.jsx` | `handleJoin(id)` | `POST /api/clubs/join` | `{ clubId }` / Increments database member count |
| **"Apply Now" (Jobs)** | `JobBoard.jsx` | `handleApply(id)`| `POST /api/jobs/apply` | `{ jobId, name, email }` / Creates application |
| **"Join Now" (Live Classes)**| `LiveClasses.jsx`| `handleJoin(id)` | `POST /api/live-classes/join`| `{ classId }` / Increments attendees counter |
| **"Start Test" (Mock Tests)**| `MockTests.jsx` | `handleStart(id)`| `POST /api/tests/start` | `{ testId, name }` / Generates `TestAttempt` document |
| **"Apply Now" (Grants)** | `Scholarships.jsx`| `handleApply(id)`| `POST /api/scholarships/apply`| `{ scholarshipId }` / Submits scholarship request |
| **"Save Changes"** | `Settings.jsx` | `handleSave()` | `POST /api/settings` | `{ settings }` / Saves appearance and profile bio |
