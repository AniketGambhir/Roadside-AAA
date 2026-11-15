# Roadside AAA

Roadside vehicle assistance, mechanic booking and job coordination platform.

## Included
- Customer and mechanic accounts with secure password hashing and JWT sessions
- Vehicle profiles and roadside requests (breakdown repair, towing, jump-start, flat tyre, fuel delivery)
- Verified partner directory and approximate distance sorting
- Mechanic job acceptance and status changes
- Opt-in mechanic location sharing while a job is active; customers can view the latest shared position on OpenStreetMap
- Request timeline, service history and invoice generation when a job is completed with a final price
- Customer complaints and admin complaint resolution
- Admin partner verification, operational KPIs, service revenue and partner earnings reports
- Responsive web UI; no online payments in Phase 1

## Run locally
1. Install Node.js 20+ and PostgreSQL.
2. Run `npm install`.
3. Create a PostgreSQL database and set `DATABASE_URL` in `.env`.
4. Set a strong `JWT_SECRET` and `ADMIN_EMAIL` in `.env`.
5. Run `npm start` and open http://localhost:3000.

## Admin access
The account registered with the exact `ADMIN_EMAIL` value is assigned the admin role automatically. The Render Blueprint currently sets this to the repository owner's Render workspace email. Change it before first admin registration if another administrator should own the platform. Keep admin credentials private.

## Render
The included `render.yaml` describes the Node web service and PostgreSQL database. The web service receives the database connection string through Render's `fromDatabase` reference. Review and approve the Blueprint sync if Render requests approval.

## Operational limits
- Browser location permission is required. The mechanic must keep the partner page open and grant location access for foreground location updates; this is not background tracking.
- Distances are straight-line estimates, not road-route distances or guaranteed ETAs.
- Invoices are service records; online payment processing is intentionally excluded.
- The free Render PostgreSQL plan is temporary and expires after its trial period. Upgrade or migrate to a persistent paid database before relying on production data.
- This is not an emergency dispatch service. For immediate danger, contact local emergency services.
