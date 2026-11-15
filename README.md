# Roadside AAA

A responsive roadside vehicle assistance and mechanic booking platform. Phase 1 includes customer requests, mechanic partner onboarding, admin verification, and job status tracking. No online payments are included.

## Features
- Customer registration/login and vehicle profiles
- Requests for breakdown repair, towing, battery jump-start, flat tyre repair, and fuel delivery
- Verified mechanic directory, with approximate distance sorting when browser location is shared
- Mechanic profile, job acceptance, and status updates
- Admin overview, partner verification, and request monitoring
- Responsive dark automotive interface

## Run locally
1. Install Node.js 20 or newer.
2. Clone this repository and open its folder in VS Code.
3. In the terminal run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and set a long random `JWT_SECRET`.
5. Optional but recommended: set `MONGODB_URI` to a MongoDB database connection string. Without it, the app uses temporary in-memory data that resets when the server restarts.
6. Start:
   ```bash
   npm start
   ```
7. Open http://localhost:3000

## Admin account
Set `ADMIN_EMAIL` to the email address you want to use as administrator. For the first account with that email, register normally, then promote the account in MongoDB by setting `role: "admin"`. Do not expose admin registration publicly.

## Deploy on Render
- Create a new **Web Service** and connect this repository.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables: `JWT_SECRET` (strong random value), `MONGODB_URI` (MongoDB Atlas connection string), and `ADMIN_EMAIL`.
- Render configuration is also included in `render.yaml`.

## Important Phase 1 notes
- Location is optional and only collected after browser permission. Distance is approximate straight-line distance, not road distance.
- This initial release does not provide turn-by-turn maps, background GPS tracking, guaranteed dispatch, emergency-call handling, or payments.
- MongoDB is required for persistent production data. In-memory mode is only for a quick local demo.
- Admin access must be provisioned securely by the project owner.
