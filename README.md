# CodeTrackr Sync Pro

CodeTrackr Sync Pro is a fullstack web application and Chrome extension built to automatically sync accepted submissions from coding platforms (Codeforces, LeetCode, GFG, CodeChef) directly to organized GitHub repositories. 

## Features
- **Frontend**: A sleek, dark-themed SaaS dashboard built with React (Vite), TailwindCSS, Recharts, and Framer Motion.
- **Backend**: Node.js APIs built with Express, integrated with MongoDB for tracking submissions and auth. 
- **Extension**: A pure Vanilla JS background worker and content-script to detect submissions seamlessly.
- **Background Sync**: Automated node-cron job pushing valid solutions using native Base64 encoding and GitHub REST API.

## Project Structure
- `/client/` - Contains the React dashboard.
- `/server/` - Contains the Express backend API and background logic.
- `/extension/` - Contains the unpacked Chrome Extension code.

## Running Locally

1. **Install Root and folder dependencies** (Optional if you run manually):
   \`cd server && npm install\`
   \`cd client && npm install\`

2. **Configure Environment Variables**
   Inside `/server/`, create a `.env` file containing:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/codetrackr
   JWT_SECRET=supersecretjwtkey_for_dev_only
   ```
   _Note: Make sure your local MongoDB instance is running, or replace with an Atlas URI._

3. **Start the Backend**
   \`cd server && npm run dev (or node index.js)\`

4. **Start the Frontend**
   \`cd client && npm run dev\`
   This will open the application on `http://localhost:5173`.

5. **Load the Chrome Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Turn on "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `/extension` folder from this repository.
