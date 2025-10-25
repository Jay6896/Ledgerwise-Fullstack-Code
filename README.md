# LedgerWise – AI-Powered Expense Tracker for Small Businesses

LedgerWise is a web application that helps small businesses track sales and expenses, visualize performance, and get AI-driven insights about their business health. The AI analyzes your data to provide a concise breakdown of profitability, trends, and actionable recommendations.

This project was built for the TIC Hackathon 2.0.

## Key Features

- Record sales and expenses with quantity and unit price
- Import CSV/XLSX for fast bulk entry (headers: `name, category, amount, date, quantity, totalamount` where category is `sale` or `expense`)
- Dashboard with totals and top-selling items
- Reports with weekly performance, SDE-based valuation, and PIT estimate (Nigeria, 2026 bands)
- AI insights, analysis, and chat using AWS Bedrock
- Cookie-based authentication with sessions

## Tech Stack

- Frontend: React (Vite + TypeScript), Tailwind CSS, shadcn-ui
- Backend: Flask, SQLAlchemy, Flask-Login, Flask-CORS, python-dotenv
- AI: AWS Bedrock + Pydantic
- Data import: pandas (CSV/XLSX)

## Getting Started (Local Development)

Prerequisites:

- Node.js (18+) and npm
- Python 3.12/3.13

### 1) Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd LW-Frontend-Code
```

### 2) Frontend setup

```bash
npm install
npm run dev
```

The app runs on http://localhost:5173

### 3) Backend setup

Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```properties
SECRET_KEY=supersecretkey
# For local development you can use SQLite (recommended):
DATABASE_URL=sqlite:///instance/app.db
# Optional AWS (only if using AI endpoints with Bedrock and you have access)
AWS_REGION=us-east-1
AWS_DEFAULT_REGION=us-east-1
# If using keys locally (not recommended for prod), set:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

Run the backend API:

```bash
python app.py
```

The API runs on http://localhost:5000

### 4) Login and try it out

- Register a user from the UI (Signup page). This also creates a business profile.
- Add sales/expenses manually or use Import in Sales & Expenses to upload a CSV/XLSX.
- Open Reports to see health score, weekly performance, valuation, and PIT.
- Try Chat for AI Q&A.

## CSV Template

Your CSV must include these lowercase headers:

```
name,category,amount,date,quantity,totalamount
```

- `category` must be `sale` or `expense`
- `date` should be ISO format (YYYY-MM-DD)
- If `totalamount` is blank, the server computes it as `amount * quantity`

A sample full-year profitable dataset is available at:

- `public/sample_profitable_retailer_full_year_2024.csv`

## Notes

- CORS and cookies are configured for local dev (Vite + Flask).
- If Postgres is unavailable locally, the backend falls back to SQLite per `.env`.
- For production, configure a proper DATABASE_URL, HTTPS cookies, and secure env handling.

## License

MIT
