# CodeTrackr Sync Pro Deployment Guide

## Overview
This application consists of three main parts:
1. **Frontend**: React (Vite)
2. **Backend**: Node.js + Express
3. **Database**: MongoDB (Atlas recommended)

## 1. Database Deployment (MongoDB Atlas)
1. Create an account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster.
3. In Database Access, create a user and password.
4. In Network Access, allow access from anywhere (`0.0.0.0/0`) or specific IP ranges of your backend host.
5. Get the connection string (URI) to use for your backend environment variables.

## 2. Backend Deployment (Render or Railway)
### Using Render
1. Create an account on Render (render.com).
2. Create a new "Web Service".
3. Connect your GitHub repository containing the `/server` folder.
4. Set the Root Directory to `server`.
5. Build Command: `npm install`
6. Start Command: `node index.js`
7. Add Environment Variables:
   - `PORT`: 5000 (usually default)
   - `MONGO_URI`: (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: (A strong random string)

_Note on Puppeteer_: If you expand to use Puppeteer for scraping platforms without APIs (e.g., GeeksforGeeks), deploying Puppeteer on Render requires specific configurations since Chromium needs to be installed in the Linux environment. Render provides a specific build environment for Puppeteer if required.

## 3. Frontend Deployment (Vercel)
1. Create an account on Vercel (vercel.com).
2. Create a New Project and connect your GitHub repository.
3. The Root Directory should be `client`.
4. Vercel will auto-detect Vite. The build command will be `npm run build` and output directory `dist`.
5. **IMPORTANT**: You need to update the API base URL in your frontend code before deploying. Change `http://localhost:5000` to your deployed backend URL.
    - _Tip_: Use Vite environment variables (`import.meta.env.VITE_API_URL`) to handle this dynamically between dev and prod.

## 4. Extension Distribution
The `CodeTrackrExtension.zip` file has been automatically bundled and is placed inside the `client/public/` directory so users can download it directly from the Dashboard navigation bar!
