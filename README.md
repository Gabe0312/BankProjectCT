# NexBank

A full-stack banking application with a React frontend and a FastAPI backend. Customers can manage accounts and transactions, while administrators manage customers, accounts, users, and audit records. Data is stored in MongoDB, and protected API routes use JWT-based role authorization.

## Features

- Customer registration and login
- Role-protected customer and administrator dashboards
- Account creation, deposits, withdrawals, and transfers
- Account transaction history
- Administrator tools for managing customers, accounts, and users
- Audit history for banking transactions
- Interactive API documentation through FastAPI's Swagger UI

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Database | MongoDB with Motor/PyMongo |
| Authentication | JWT, Passlib, bcrypt |
| Deployment support | Mangum adapter for AWS Lambda/API Gateway |

## Project Structure

```text
BankProjectCT/
├── backend/
│   ├── app/
│   │   ├── controllers/    # HTTP routes for auth, accounts, customers, and audit
│   │   ├── dependencies/   # JWT authentication and role checks
│   │   ├── database/       # MongoDB connection
│   │   ├── models/         # Pydantic request/response models
│   │   ├── repositories/   # MongoDB data access
│   │   ├── services/       # Banking and authentication logic
│   │   └── main.py         # FastAPI application and router registration
│   ├── requirements.txt
│   └── seed.py             # Optional demo data seeder
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/       # API client
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

The backend uses a layered structure: controllers handle HTTP requests, services apply business rules, repositories access MongoDB, and models validate request data. The frontend contains separate public, customer, and administrator routes; protected pages require a JWT with the appropriate role.

## Local Development

### Prerequisites

- Python and `pip`
- Node.js and `npm`
- A MongoDB instance, either local or hosted

### Configure the backend

Create `backend/.env` and replace each placeholder with your own local or hosted configuration:

```dotenv
MONGODB_URL=YOUR_MONGODB_CONNECTION_STRING
DATABASE_NAME=YOUR_DATABASE_NAME
JWT_SECRET_KEY=YOUR_LONG_RANDOM_SECRET
```

For MongoDB Atlas, set `MONGODB_URL` to your Atlas connection string. These values are placeholders only. Keep `.env` files and real credentials out of source control, and use a securely generated JWT secret.

Install backend dependencies and start the API from the `backend` directory:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On macOS/Linux, activate the virtual environment with `source .venv/bin/activate` instead.

### Configure the frontend

Create `frontend/.env` and replace the placeholder with your deployed backend API base URL:

```dotenv
VITE_API_URL=YOUR_BACKEND_API_BASE_URL
```
Create `frontend/.env.development.local` for the local backend override:

```dotenv
VITE_API_URL=http://localhost:8000
```

If you already have a `frontend/.env.local` containing the localhost override, rename it to `frontend/.env.development.local`. Vite loads `.env.local` in both development and production, which can cause a deployed frontend to call the visitor's localhost instead of the deployed API. The development-only file keeps local development separate from production builds.

Both environment files remain ignored by Git and must be created locally. Never put secrets in `VITE_` variables; Vite includes them in the browser bundle. After changing the production API URL, rebuild with `npm run build`, upload the contents of `frontend/dist` to the frontend S3 bucket, and invalidate `/*` in CloudFront.

Then install dependencies and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). The API is available at `http://127.0.0.1:8000`, with interactive documentation at `http://127.0.0.1:8000/docs`.

## API Overview

All business endpoints are under `/api`. Authentication endpoints are under `/auth`.

| Area | Routes | Access |
| --- | --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login` | Public |
| Customers | `/api/customers` and `/api/customers/{customer_id}` | Administrator |
| Accounts | `/api/accounts`, `/api/accounts/{account_id}` | Role-dependent |
| Account activity | Deposit, withdraw, transfer, nickname, and transaction-history routes under `/api/accounts` | Customer |
| Audit | `/api/audit`, `/api/audit/account/{account_number}`, `/api/audit/customer/{customer_number}` | Administrator |

The exact request and response schemas are available in Swagger UI at `/docs`. Customer routes are scoped to the authenticated customer where applicable; administrator routes require an administrator token.

## Optional Demo Data

`backend/seed.py` can create sample customers and login records. Run it from the `backend` directory after configuring MongoDB:

```bash
python seed.py
```

**Warning:** The seed script deletes all documents in the `customers` and `user_auth` collections before inserting demo records. It also uses demo credentials defined in the script. Only run it against a disposable local database; never run it against production or shared data.

## Build Checks

From the `frontend` directory:

```bash
npm run lint
npm run build
```
