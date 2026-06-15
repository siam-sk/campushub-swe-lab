# CampusHub: Broken Features and Mocks Audit

This document inventories partially implemented modules, dummy UI elements, unconnected endpoints, and architectural discrepancies in the **CampusHub** project.

---

## 🚫 1. Buttons with No Functionality

*   **"Submit Scholarship"**
    *   *Location:* [Scholarships.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Scholarships.jsx) (Line 88)
    *   *Issue:* Button element has no click listeners or modal triggers.
*   **"Post a Job"**
    *   *Location:* [JobBoard.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/JobBoard.jsx) (Line 87)
    *   *Issue:* Triggers a mock alert: `alert('Post Job functionality coming soon!')`.
*   **"+ Add New User" & "Manage Permissions"**
    *   *Location:* [AdminHome.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/AdminHome.jsx) (Lines 47, 49)
    *   *Issue:* Hardcoded buttons with no bound event handler functions.
*   **"+ Create Global Notice"**
    *   *Location:* [AdminHome.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/AdminHome.jsx) (Line 48)
    *   *Issue:* Has no click event and does not open any form modal.
*   **"Save for Later" & "More Details"**
    *   *Location:* [Scholarships.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Scholarships.jsx)
    *   *Issue:* Only trigger dummy browser alert panels.

---

## 📡 2. APIs Not Connected to the UI

*   **Notice Board Creation (`POST /api/notices`)**
    *   *Issue:* The backend allows notice creation for `faculty` and `admin` roles, but the frontend lacks any screen, form, or dashboard page to input notice metadata and execute this request.
*   **Item Listings Insertion (`POST /api/clubs`, `/api/jobs`, `/api/live-classes`, `/api/scholarships`, `/api/tests`)**
    *   *Issue:* Creation logic exists on the backend to insert new clubs, job postings, live sessions, scholarships, and tests, but they can only be invoked by directly calling the API or seeding. The frontend has no listing creation panel.

---

## 🎨 3. UI Elements Connected to Mock/Static Data

*   **Courses Catalog ([Courses.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Courses.jsx))**
    *   *Issue:* The entire courses page is populated using a hardcoded client-side array `courses`. There is no backend endpoint or database collection to track students enrolled courses dynamically.
*   **Academic Events Grid ([Home.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Home.jsx))**
    *   *Issue:* Events such as Mid-term Exams and Tech Fest dates are hardcoded in the frontend.
*   **Direct Messaging Threads List ([Messages.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Messages.jsx))**
    *   *Issue:* The list of contacts (Sarah, Group, Michael, Prof) is a static local array. Although clicking them fetches message logs from MongoDB matching that contact ID, contacts cannot be dynamically added or searched.
*   **GPA Analytics Chart ([Profile.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/Profile.jsx))**
    *   *Issue:* The chart values are static hardcoded assets.

---

## 🚧 4. Partially Implemented Features

*   **AI Assistant (`api/assistant/index.js` & `Assistant.jsx`)**
    *   *Issue:* Clicking "Send" saves the message to MongoDB, but there is no LLM integration or response logic on the backend. The screen will display the user's input, but the bot never replies.
*   **Change Password (`Settings.jsx`)**
    *   *Issue:* The change password form utilizes a dummy 1.5s timeout:
        ```javascript
        setTimeout(() => {
          setUploading(false);
          alert('Password updated successfully!');
        }, 1500);
        ```
        It does not make any Firebase SDK calls to actually update the user credentials.

---

## 💀 5. Dead Routes & Local Server Limits

*   **Dead Component:** [SectionPage.jsx](file:///run/media/shaki/2472D89F72D87750/Apps/CampusHub_Soft/campushub-swe-lab/src/pages/dashboard/SectionPage.jsx) is imported in `App.jsx` but never registered in a `<Route>` path.
*   **Local Backend 404 Errors:** Running the application locally using the Express server (`server/index.js` on port 5000) causes pages like Alumni, Clubs, Job Board, Live Classes, Scholarships, and Mock Tests to return API 404 errors. These routes are missing in Express and only exist under the Vercel production serverless API handlers.
