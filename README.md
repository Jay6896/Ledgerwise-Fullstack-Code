# LedgerWise – AI-Powered Expense Tracker for Small Businesses

LedgerWise is a web application that helps small businesses track sales and expenses, visualize performance, and get AI-driven insights about their business health. The AI analyzes your data to provide a concise breakdown of profitability, trends, and actionable recommendations.

This project was built for the TIC Hackathon 2.0.

# AI Section
## 🇳🇬 Nigerian Business and Tax Advisor (AWS Bedrock & Instructor) This Python script provides an interactive command-line chatbot specialized in offering structured advice strictly related to Nigerian business operations, regulations, and taxation. It utilizes the AWS Bedrock service to access a powerful Large Language Model (LLM) and the instructor library to enforce a strict JSON output format, ensuring reliable and structured responses.

Features -Strictly Focused Advice: Answers only questions related to Nigerian business and tax law. -Guardrail Enforcement: Automatically detects irrelevant questions and returns a professional rejection message. -Structured Output: Uses Pydantic and the instructor library to guarantee the output is a clean, machine-readable JSON object. -Interactive Loop: Allows for continuous conversation until the user decides to exit -Model: Powered by the high-performance Meta Llama 3 70B Instruct model via AWS Bedrock.

Prerequisites Before running this script, you must have the following installed and configured: -Python: Python 3.8 or higher. -AWS Credentials: Your AWS credentials must be configured locally (e.g., via the AWS CLI using aws configure) so that boto3 can authenticate. -Bedrock Access: Ensure the Meta Llama 3 70B Instruct model is enabled for use in your AWS Bedrock console.

Installation -Install the required Python libraries using pip:pip install boto3 pydantic instructor

Important Note on AWS Region -The script uses os.environ.get("AWS_REGION", "us-east-1"). If your Bedrock models are hosted in a different region (e.g., us-west-2 or eu-central-1), -ensure you either:Set the AWS_REGION environment variable in your terminal, ORChange the default value in the script to your desired region.

- Resources Used -Youtube -Gemini

## 🇳🇬 Nigerian Tax & Business Advisor

This is a Python-based command-line tool that uses AI to analyze financial data from a CSV or Excel file. It calculates a company's Nigerian tax liabilities (CIT, TET, and VAT), audits tax payments, and provides both tax compliance recommendations and scannable business growth advice.

This tool is powered by the Llama 3 70B model via AWS Bedrock.

Features

- File Input: Reads financial data directly from .csv or .xlsx files.
- Comprehensive Tax Calculation:
- Compliance Audit: Compares the calculated tax due against a "Profit Tax Paid" field from your file to determine if the company is compliant, underpaid, or has overpaid.
- Dual-AI Advice:
- Tax Compliance: Provides actionable steps for remaining compliant.
- Business Growth: Analyzes financial data (e.g., revenue vs. expenses) to give high-level business advice.

Prerequisites

Python 3.8+
- An AWS Account: You must have access to AWS Bedrock and have enabled access for the meta.llama3-70b-instruct-v1:0 model.
- AWS Credentials: Your AWS access keys must be configured in your environment (e.g., via aws configure or environment variables).

Installation

- Clone this repository or save the Python script (nigerian_tax_calculator.py) to your computer.
- Install the required Python libraries:

# Main App
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
