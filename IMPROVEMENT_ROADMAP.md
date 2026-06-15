# CampusHub: Improvement Roadmap

This document maps out recommended security, architectural, and quality improvements for the **CampusHub** project, prioritized by urgency and impact.

---

## 🛑 1. Critical Priority (Immediate Actions Required)

### Securing Mock Authentication Bypasses in Production
*   **Vulnerability:** Bypass mock headers check (`mock-`) in production environments.
*   **Recommendation:** Wrap the mock authentication check in `process.env.NODE_ENV !== 'production'` blocks.
*   **Complexity:** Low
*   **Estimated Dev Time:** 2 hours
*   **Impact:** Critical (Eliminates authentication bypass exploits)

### Add JWT Authentication Checks on Public POST Routes
*   **Vulnerability:** Public mutation endpoints (`/api/clubs`, `/api/jobs`, `/api/live-classes`, `/api/scholarships`, `/api/tests`) accept database writes without checking auth headers.
*   **Recommendation:** Import and verify the auth tokens via `firebaseAdmin` middleware check before performing database insertions.
*   **Complexity:** Medium
*   **Estimated Dev Time:** 1-2 days
*   **Impact:** Critical (Prevents spam and unauthorized database records injections)

---

## ⚡ 2. High Priority (Important Architectural Refactors)

### Unify API and Routing System
*   **Limitation:** Double routing codebases (Vercel Serverless `/api/*` handlers and Express `/server/routes/*` paths). They duplicate database connection setup, authentication decoding, and schema upserts.
*   **Recommendation:** Standardize on one approach:
    *   *Option A:* Fully migrate Express routing to Vercel Serverless by moving all middleware and routing helper setups.
    *   *Option B:* Use Express exclusively and host standard routes on an App Engine or container VM (deprecating the `api/` folder).
*   **Complexity:** High
*   **Estimated Dev Time:** 3-5 days
*   **Impact:** High (Improves maintainability, reduces bugs, and deletes redundant modules)

### Input Validation & Mongoose Schema Sanitization
*   **Limitation:** Backend endpoints pass the request body directly to Mongoose creation queries (e.g. `AlumniProfile.create(req.body || {})`), allowing parameter override attacks.
*   **Recommendation:** Use an input validation library like `zod` or `joi` to validate fields before passing to database layers.
*   **Complexity:** Medium
*   **Estimated Dev Time:** 2-3 days
*   **Impact:** High (Eliminates NoSQL injections and body corruption bugs)

---

## ⚙️ 3. Medium Priority (Feature Completeness & UI/UX)

### Notice Board Creation Portal on UI
*   **Limitation:** Notice Board has `POST` routes on the backend, but the frontend notice creation modals or buttons are completely static.
*   **Recommendation:** Hook up "+ Create Global Notice" in [AdminHome.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/AdminHome.jsx) to open a form modal and send a POST request to `/api/notices`.
*   **Complexity:** Medium
*   **Estimated Dev Time:** 1 day
*   **Impact:** High (Provides functional notice creation for faculty and admins)

### Real-Time Live Lecture Streams
*   **Limitation:** Live Classes are represented by mock external static links.
*   **Recommendation:** Connect live session classrooms to Jitsi, Zoom, or WebRTC modules.
*   **Complexity:** High
*   **Estimated Dev Time:** 1-2 weeks
*   **Impact:** Medium (Makes virtual classrooms interactive)

---

## 📝 4. Low Priority (Cleanups)

### UI Accessibility & Semantic Tag Checks
*   **Limitation:** Direct Messaging screen and Notice lists use icons and emoji buttons without explanatory screen reader label tags (`aria-label`).
*   **Recommendation:** Add semantic descriptors to all icon-only button elements.
*   **Complexity:** Low
*   **Estimated Dev Time:** 4 hours
*   **Impact:** Medium (Enhances platform accessibility)
