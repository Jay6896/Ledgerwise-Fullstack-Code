import os
from pydantic import BaseModel, Field
import pandas as pd
from typing import List, Tuple, Optional

class PITBracketBreakdown(BaseModel):
    band: str
    taxable_amount: float
    rate: float
    tax: float

class PITYearEstimate(BaseModel):
    annual_revenue: float
    annual_expenses: float
    annual_profit: float
    estimated_pit: float
    breakdown: List[PITBracketBreakdown]
    marginal_rate: Optional[float] = Field(default=None, description="Top marginal PIT rate (%) applied based on taxable income band.")
    effective_rate: Optional[float] = Field(default=None, description="Effective PIT rate (%) = estimated_pit / annual_profit * 100.")
    notes: str = Field(default=(
        "Rough estimate using 2026 PIT bands; treats profit as chargeable income and ignores deductions."
    ))

# 2026 PIT bands per prompt
# 0 - 800,000 -> 0%
# 800,001 - 3,000,000 -> 15% on amount over 800,000 (in this band)
# 3,000,001 - 12,000,000 -> 18% on amount over 3,000,000 (in this band)
# 12,000,001 - 25,000,000 -> 21%
# 25,000,001 - 50,000,000 -> 23%
# Above 50,000,000 -> 25%

BANDS: List[Tuple[float, float, float, str]] = [
    (0.0, 800_000.0, 0.00, "0 - 800,000 @ 0%"),
    (800_000.0, 3_000_000.0, 0.15, "800,001 - 3,000,000 @ 15%"),
    (3_000_000.0, 12_000_000.0, 0.18, "3,000,001 - 12,000,000 @ 18%"),
    (12_000_000.0, 25_000_000.0, 0.21, "12,000,001 - 25,000,000 @ 21%"),
    (25_000_000.0, 50_000_000.0, 0.23, "25,000,001 - 50,000,000 @ 23%"),
    (50_000_000.0, float("inf"), 0.25, "Above 50,000,000 @ 25%"),
]

def _estimate_from_profit(profit: float) -> tuple[float, List[PITBracketBreakdown], float]:
    if profit <= 0:
        return 0.0, [], 0.0
    total_tax = 0.0
    breakdown: List[PITBracketBreakdown] = []
    marginal_pct = 0.0
    for lower, upper, rate, label in BANDS:
        if profit <= lower:
            break
        amount_in_band = max(0.0, min(profit, upper) - lower)
        if amount_in_band <= 0:
            continue
        tax = amount_in_band * rate
        total_tax += tax
        breakdown.append(PITBracketBreakdown(band=label, taxable_amount=amount_in_band, rate=rate * 100.0, tax=tax))
        # If profit lies within this band, set marginal and stop accumulating further bands
        if profit <= upper:
            marginal_pct = rate * 100.0
            break
        else:
            marginal_pct = rate * 100.0  # will be overwritten by the final band reached
    return total_tax, breakdown, marginal_pct


def estimate_pit(annual_revenue: float, annual_expenses: float) -> PITYearEstimate:
    try:
        revenue = float(annual_revenue or 0.0)
        expenses = float(annual_expenses or 0.0)
        profit = revenue - expenses
        if profit <= 0:
            return PITYearEstimate(
                annual_revenue=revenue,
                annual_expenses=expenses,
                annual_profit=profit,
                estimated_pit=0.0,
                breakdown=[],
                marginal_rate=0.0,
                effective_rate=0.0,
            )
        total_tax, breakdown, marginal_pct = _estimate_from_profit(profit)
        effective_pct = (total_tax / profit * 100.0) if profit > 0 else 0.0
        return PITYearEstimate(
            annual_revenue=revenue,
            annual_expenses=expenses,
            annual_profit=profit,
            estimated_pit=total_tax,
            breakdown=breakdown,
            marginal_rate=marginal_pct,
            effective_rate=effective_pct,
        )
    except Exception:
        return PITYearEstimate(
            annual_revenue=annual_revenue or 0.0,
            annual_expenses=annual_expenses or 0.0,
            annual_profit=(annual_revenue or 0.0) - (annual_expenses or 0.0),
            estimated_pit=0.0,
            breakdown=[],
            marginal_rate=None,
            effective_rate=None,
            notes="Error estimating PIT; check inputs.",
        )


def pit_from_file(filepath: str) -> PITYearEstimate:
    try:
        if filepath.lower().endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(filepath)
        else:
            return PITYearEstimate(annual_revenue=0, annual_expenses=0, annual_profit=0, estimated_pit=0, breakdown=[], marginal_rate=None, effective_rate=None, notes="Unsupported file format")
        metric_col_names = ['metric', 'item', 'description', 'particulars', 'details', 'name']
        amount_col_names = ['amount', 'value', 'ngn', 'total', 'cost']
        metric_col = next((col for col in df.columns if any(name in str(col).lower() for name in metric_col_names)), None)
        amount_col = next((col for col in df.columns if any(name in str(col).lower() for name in amount_col_names)), None)
        if not (metric_col and amount_col):
            return PITYearEstimate(annual_revenue=0, annual_expenses=0, annual_profit=0, estimated_pit=0, breakdown=[], marginal_rate=None, effective_rate=None, notes="Missing Metric/Amount columns")
        def find_value(keys: List[str]) -> float:
            for k in keys:
                row = df[df[metric_col].astype(str).str.contains(k, case=False, na=False)]
                if not row.empty:
                    try:
                        return float(row[amount_col].iloc[0])
                    except Exception:
                        pass
            return 0.0
        revenue = find_value(['total revenue', 'revenue', 'sales'])
        expenses = find_value(['total expenses', 'expenses', 'operating expenses', 'costs'])
        return estimate_pit(revenue, expenses)
    except Exception:
        return PITYearEstimate(annual_revenue=0, annual_expenses=0, annual_profit=0, estimated_pit=0, breakdown=[], marginal_rate=None, effective_rate=None, notes="Failed to parse file")
