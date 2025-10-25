import os
import json
import boto3
import pandas as pd
from pydantic import BaseModel, Field
from typing import Literal
import instructor
from instructor import Mode

# --- 1. Define the Structured Output Schema (Pydantic Model) ---
# This defines the exact structure and fields the AI must return.
class TaxCalculationResult(BaseModel):
    """
    Structured result containing Profit Tax (CIT/TET) and VAT calculations,
    plus compliance status and business advice.
    """
    # --- PROFIT TAX SECTION ---
    taxable_profit: float = Field(
        ...,
        description="The final calculated taxable profit (Revenue - Allowable Deductions)."
    )
    cit_rate_applied: float = Field(
        ...,
        description="The Corporate Income Tax (CIT) rate applied (e.g., 20.0 or 30.0)."
    )
    cit_liability: float = Field(
        ...,
        description="The total calculated Corporate Income Tax (CIT) due."
    )
    education_tax_liability: float = Field(
        ...,
        description="The calculated Tertiary Education Tax (TET) due at 3% of the assessable profit."
    )
    total_profit_tax_due: float = Field(
        ...,
        description="The sum of CIT and Education Tax liabilities."
    )
    profit_tax_paid_by_user: float = Field(
        ...,
        description="The amount of *profit tax* (CIT/TET) the user has already paid."
    )
    profit_tax_payment_status_amount: float = Field(
        ...,
        description="The difference between profit tax paid and tax due (Paid - Due). Negative means underpaid, positive means overpaid."
    )
    
    # --- NEW VAT SECTION ---
    vat_output_collected: float = Field(
        ...,
        description="The amount of Output VAT (VAT on Sales) found in the user's data."
    )
    vat_input_paid: float = Field(
        ...,
        description="The amount of Input VAT (VAT on Purchases/Expenses) found in the user's data."
    )
    vat_remittable_due: float = Field(
        ...,
        description="The final VAT liability to be remitted to FIRS (Output VAT - Input VAT)."
    )

    # --- ADVISORY SECTION ---
    compliance_status: Literal[
        "COMPLIANT (Paid in Full)", 
        "NON_COMPLIANT (Underpaid)", 
        "OVERPAID (Refund Due)",
        "UNKNOWN (Check Data)"
    ] = Field(
        ...,
        description="Assessment of *Profit Tax* compliance based on the calculated tax vs. tax paid."
    )
    compliance_recommendation: str = Field(
        ...,
        description="Actionable advice *only* related to tax compliance (both Profit Tax and VAT), payment deadlines, and addressing payment status."
    )
    business_growth_advice: str = Field(
        ...,
        description="Actionable advice on how to improve or grow the business, based on analyzing the provided financial data (e.g., 'Your Cost of Sales is high...')."
    )


# --- 2. System Instruction and LLM Configuration ---
MODEL_ID = "meta.llama3-70b-instruct-v1:0"
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# --- UPDATED SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are a Nigerian Corporate Tax and Business Advisory AI.
Calculate: (1) CIT & TET liabilities, (2) VAT remittable, (3) compliance advice, (4) growth advice.
Rules:
- CIT: 0% ≤ ₦25m, 20% for ₦25m–₦100m, 30% > ₦100m. TET: 3% of taxable profit.
- VAT: 7.5%. VAT applies if turnover > ₦25m. VAT due = Output VAT − Input VAT. Assume provided input VAT is claimable.
- Return JSON matching the schema exactly. Be concise and numeric.
"""

_bedrock = None

def _client():
    global _bedrock
    if _bedrock is None:
        _bedrock = boto3.client('bedrock-runtime', region_name=AWS_REGION)
    return _bedrock


def load_financial_data(filepath: str):
    """
    Reads data from a CSV or XLSX file and attempts to extract key financial metrics.
    Returns: (DataFrame, TotalRevenue, ProfitTaxPaid, OutputVAT, InputVAT)
    """
    try:
        if filepath.lower().endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.lower().endswith('.xlsx') or filepath.lower().endswith('.xls'):
            df = pd.read_excel(filepath)
        else:
            raise ValueError("Unsupported file format. Please use a .csv or .xlsx file.")
        
        # Enhanced extraction logic
        metric_col_names = ['metric', 'item', 'description', 'particulars', 'details']
        amount_col_names = ['amount', 'value', 'ngn', 'total', 'cost']
        
        metric_col = next((col for col in df.columns if any(name in str(col).lower() for name in metric_col_names)), None)
        amount_col = next((col for col in df.columns if any(name in str(col).lower() for name in amount_col_names)), None)

        if not (metric_col and amount_col):
            raise KeyError("Could not identify the Metric or Amount columns in the file.")
        
        # Helper to find a value, defaulting to 0.0
        def find_value(keywords: list[str]) -> float:
            for keyword in keywords:
                row = df[df[metric_col].astype(str).str.contains(keyword, case=False, na=False)]
                if not row.empty:
                    return float(row[amount_col].iloc[0])
            return 0.0

        # Find Total Revenue (Mandatory)
        total_revenue = find_value(['total revenue', 'revenue', 'sales'])
        if total_revenue == 0.0:
            raise ValueError("Could not locate a row labeled 'Revenue' or 'Sales' in the data.")

        # Find other values (default to 0.0 if not found)
        profit_tax_paid = find_value(['profit tax paid', 'cit paid', 'tax paid'])
        output_vat = find_value(['output vat', 'vat collected', 'vat on sales'])
        input_vat = find_value(['input vat', 'vat paid on inputs', 'vat on purchases'])
        
        return df, total_revenue, profit_tax_paid, output_vat, input_vat
    
    except Exception:
        return None, None, 0.0, 0.0, 0.0


def get_fallback_response(recommendation: str, profit_tax_paid: float = 0.0) -> TaxCalculationResult:
    """Helper function to create structured error responses."""
    return TaxCalculationResult(
        taxable_profit=0.0,
        cit_rate_applied=0.0,
        cit_liability=0.0,
        education_tax_liability=0.0,
        total_profit_tax_due=0.0,
        profit_tax_paid_by_user=profit_tax_paid,
        profit_tax_payment_status_amount=0.0,
        vat_output_collected=0.0,
        vat_input_paid=0.0,
        vat_remittable_due=0.0,
        compliance_status="UNKNOWN (Check Data)",
        compliance_recommendation=recommendation,
        business_growth_advice="N/A. Cannot provide business advice due to error."
    )


def calculate_tax_and_assess(business_size: str, filepath: str) -> TaxCalculationResult:
    """
    Loads financial data from file, sends it to the LLM for calculation, and returns the structured result.
    """
    # Load data from the CSV/XLSX file
    financial_data, total_revenue, profit_tax_paid, output_vat, input_vat = load_financial_data(filepath)

    if financial_data is None:
        # Return a structured error if data loading failed
        return get_fallback_response("Data loading failed. Check file path, existence, and column names.")

    # Convert DataFrame to string for the LLM to process
    financial_data_str = financial_data.to_string(index=False)

    # 1. Initialize Bedrock Boto3 Client
    try:
        client = instructor.from_bedrock(_client(), mode=Mode.BEDROCK_JSON)
    except Exception:
        # Fallback for AWS initialization failure
        return get_fallback_response(
            f"AWS setup or connectivity failed. Check credentials and Bedrock access in region {AWS_REGION}."
        )

    # Combine data and prompt
    user_query = f"""
Please calculate the tax liabilities, audit compliance, and provide business advice for a Nigerian company of '{business_size}' size using the following financial statement data (NGN).\n\n--- DATA ---\n{financial_data_str}\n---\n\nKey Values:\nTotal Revenue: {total_revenue:,.2f}\nProfit Tax Paid: {profit_tax_paid:,.2f}\nOutput VAT: {output_vat:,.2f}\nInput VAT: {input_vat:,.2f}\n"""

    print(f"\n-> Calculating tax & generating advice for {business_size} company (Llama 3 70B)...")
    try:
        # 3. Create the structured completion request
        result_object = client.messages.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": f"{SYSTEM_PROMPT}\n\n{user_query}"}],
            response_model=TaxCalculationResult,
            max_tokens=1100,
            temperature=0.1 
        )
        return result_object

    except Exception as e:
        print(f"An API/Calculation error occurred: {e}")
        # Return a fallback object on API failure
        return get_fallback_response(
            "API request failed. Check model permissions and AWS access for Llama 3 70B.",
            profit_tax_paid=profit_tax_paid
        )


if __name__ == "__main__":
    
    print("--- 🇳🇬 Nigerian Corporate Tax & Business Advisor (File Uploader) ---")
    print("Processes CSV or Excel data using AI to calculate tax liabilities and give growth advice.")
    
    while True:
        print("-" * 60)
        
        # 1. Get File Path
        filepath = input("Enter the path to your CSV or Excel (.xlsx) file, or 'exit': ").strip()
        if filepath.lower() in ['exit', 'quit', 'q']:
            print("Exiting calculator. Goodbye!")
            break
            
        # 2. Get Business Size
        business_size = input("Enter business size for context (MEDIUM or LARGE): ").strip().upper()
        if business_size not in ["MEDIUM", "LARGE"]:
            print("Invalid business size. Please enter 'MEDIUM' or 'LARGE'.")
            continue

        # Calculate and assess tax
        result = calculate_tax_and_assess(business_size, filepath)

        # --- Display Final Output ---
        print("\n" + "=" * 60)
        print(f"| TAX & BUSINESS ASSESSMENT FOR {business_size} COMPANY |")
        print("=" * 60)
        
        # Format currency with commas
        def format_currency(amount):
            return f"₦{amount:,.2f}"

        # If a system error occurred, print the error message cleanly
        if "failed" in result.compliance_recommendation.lower() or "check data" in result.compliance_status.lower():
            print(f"SYSTEM ERROR: {result.compliance_recommendation}")
            print(f"BUSINESS ADVICE: {result.business_growth_advice}")
        else:
            print("--- PROFIT TAX CALCULATION (Annual) ---")
            print(f"  > Taxable Profit:        {format_currency(result.taxable_profit)}")
            print(f"  > CIT Rate Applied:      {result.cit_rate_applied:.1f}%")
            print(f"  > CIT Liability:         {format_currency(result.cit_liability)}")
            print(f"  > TET Liability (3%):    {format_currency(result.education_tax_liability)}")
            print("-" * 60)
            print(f"  > TOTAL PROFIT TAX DUE:  {format_currency(result.total_profit_tax_due)}")
            print(f"  > PROFIT TAX PAID:       {format_currency(result.profit_tax_paid_by_user)}")
            print("-" * 60)
            
            # Display Underpayment or Overpayment
            if result.profit_tax_payment_status_amount < 0:
                print(f"  > PAYMENT STATUS:        {format_currency(result.profit_tax_payment_status_amount)} (Underpaid)")
            elif result.profit_tax_payment_status_amount > 0:
                print(f"  > PAYMENT STATUS:        {format_currency(result.profit_tax_payment_status_amount)} (Overpaid)")
            else:
                 print(f"  > PAYMENT STATUS:        {format_currency(result.profit_tax_payment_status_amount)} (Paid in Full)")
            
            print("=" * 60)

            # --- NEW VAT SECTION ---
            print(f"\n--- VAT CALCULATION (Monthly) ---")
            print(f"  > Output VAT (On Sales): {format_currency(result.vat_output_collected)}")
            print(f"  > Input VAT (On Purchases):{format_currency(result.vat_input_paid)}")
            print("-" * 60)
            print(f"  > VAT REMITTABLE TO FIRS:{format_currency(result.vat_remittable_due)}")
            print("=" * 60)

            # Compliance Assessment
            print(f"\n--- TAX COMPLIANCE ---")
            print(f"PROFIT TAX STATUS: {result.compliance_status}")
            print(f"\nRECOMMENDATION (Tax):\n{result.compliance_recommendation}")
            
            # --- NEW BUSINESS ADVICE SECTION ---
            print("\n" + "=" * 60)
            print(f"\n--- BUSINESS GROWTH ADVICE ---")
            print(f"{result.business_growth_advice}")
            
        print("\n" + "=" * 60)
        
        # Prompt for continuation
        continue_prompt = input("Press Enter to run another calculation, or type 'no' to exit: ").strip().lower()
        if continue_prompt in ['no', 'n', 'quit', 'exit']:
            print("Exiting calculator. Goodbye!")
            break