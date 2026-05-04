# CampusHub

CampusHub is a MERN-based campus platform for learning resources, notices, events, and community.

## Folder structure

```
campushub-swe-lab/
	server/
		index.js
		package.json
		.env.example
		routes/
		models/
		middleware/
	src/
	public/
```

## Client setup

```bash
npm install
npm run dev
```

## Server setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

The server provides a health check endpoint at `GET /api/health`.

## Firebase auth routes

The backend verifies Firebase ID tokens. Registration and login happen on the client via Firebase
Auth, then the client sends the ID token to the API.

- `POST /api/auth/register` with `{ "idToken": "..." }`
- `POST /api/auth/login` with `{ "idToken": "..." }`
- `GET /api/auth/me` with `Authorization: Bearer <idToken>`

## Environment variables

Set the following in `server/.env`:

```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
MONGO_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Team workflow

- Each teammate works on their own branch and commits after each logical change.
- Create PRs to merge into `main`.
