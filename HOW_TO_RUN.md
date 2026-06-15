# 🚀 How to Run CampusHub on Any Device

This guide provides step-by-step instructions to set up, configure, and run the **CampusHub** application on any development machine (Windows, macOS, or Linux) using either **Node.js** directly or **Docker** for containerized execution.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your system:

### 1. For Direct Local Setup
* **Node.js**: Version `18.x` or higher (LTS recommended)
* **npm**: Version `9.x` or higher
* **MongoDB**: A running local MongoDB instance or a **MongoDB Atlas** cloud database connection URI.
* **Firebase**: A Firebase Project to configure client-side and server-side Authentication.

### 2. For Containerized Setup (Recommended for "Any Device" compatibility)
* **Docker** & **Docker Compose**

---

## 🛠️ Step 1: Clone and Prepare the Project

1. Clone or download the repository to your local machine:
   ```bash
   git clone <repository-url>
   cd campushub-swe-lab
   ```

2. Make sure you are in the root directory.

---

## 🔑 Step 2: Environment Setup

The application consists of a React/Vite frontend and an Express backend. Both require environment configuration.

### 1. Backend Environment Configurations
Create a `.env` file inside the `server/` directory:
```bash
# Navigate to the server folder
cd server
touch .env
```
Add the following variables to `server/.env`:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campushub

# Firebase Admin SDK Credentials (for verifying user tokens on the backend)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
> ⚠️ **Important**: Preserve the `\n` characters in the private key string exactly as they are exported from your Firebase Service Account JSON.

### 2. Frontend Environment Configurations
Create a `.env` file in the **root** directory of the project:
```bash
# Navigate back to the root folder
cd ..
touch .env
```
Add the following variables to `.env`:
```env
# Firebase Public Web Configuration API keys
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Backend URL connection
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📦 Method A: Direct Local Execution (Standard Node.js)

### 1. Install Dependencies
Run this in the root directory to install frontend packages:
```bash
npm install
```

Run this inside the `server` directory to install backend packages:
```bash
cd server
npm install
cd ..
```

### 2. Seed the Database and Users
To populate MongoDB and Firebase with dummy/test student profiles and dashboard widgets, run the following commands in the `server` directory:
```bash
cd server
npm run seed:dashboard
npm run seed:firebase-users
cd ..
```

### 3. Run the Services
You need to run the backend and frontend simultaneously in separate terminals.

* **Terminal 1 (Backend Server)**:
  ```bash
  cd server
  npm run dev
  ```
  *(Runs on [http://localhost:5000](http://localhost:5000))*

* **Terminal 2 (Frontend Dev Server)**:
  ```bash
  npm run dev
  ```
  *(Runs on [http://localhost:5173](http://localhost:5173))*

---

## 🐳 Method B: Run via Docker (Zero-Install Setup)

If you don't want to install Node.js locally or want to avoid platform-specific dependency conflicts (e.g. native bindings compiler issues), you can run the entire system using Docker.

### 1. Add a `Dockerfile` and `docker-compose.yml`
*(If not already present in the workspace, these files configure the containers).*

**Root `docker-compose.yml`**:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./server
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - CLIENT_ORIGIN=http://localhost:5173
      - MONGODB_URI=mongodb+srv://admin:Cv4Islc4CfMvdNHD@cluster0.elmkg1h.mongodb.net/?appName=Cluster0
      - FIREBASE_PROJECT_ID=campushub-d74db
      - FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@campushub-d74db.iam.gserviceaccount.com
      - FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
    command: npm start

  frontend:
    build:
      context: .
    ports:
      - "5173:5173"
    depends_on:
      - backend
    command: npm run dev -- --host
```

### 2. Build and Start the Containers
In the root directory, simply run:
```bash
docker compose up --build
```
This command automatically installs all dependencies inside the container, hooks up the database, and hosts both application layers.

---

## 🔐 Logins and Testing

### Quick Demo Bypass Logins
Use the following emails to bypass auth for showcase purposes (any password works):
* **Student Dashboard**: `student@campushub.edu`
* **Faculty Dashboard**: `faculty@campushub.edu`
* **Admin Dashboard**: `admin@campushub.edu`

### Seeded Accounts (Use password `CampusHub@123`)
* **Email**: `john.student@campushub.edu`
* **Email**: `tanvir.hasan@campushub.edu`
