import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

type AdvicePoint = { title: string; detail: string };
type StrategicAdvice = { summary: string; recommendations: AdvicePoint[] };

type KPI = { name: string; value: number; unit: string };
type Analysis = { health_score: number; kpis: KPI[]; insights: string[]; valuation?: string; actions?: string[] };

type TaxSummary = {
  vat_threshold_nearing: boolean;
  vat_collected: number;
  vat_paid: number;
  net_vat: number;
  cit_exempt: boolean;
  cac_due_days: number;
};

const formatNaira = (n: number | undefined) => `₦${Number(n || 0).toLocaleString()}`;

const Reports = () => {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<StrategicAdvice | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [tax, setTax] = useState<TaxSummary | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [pitQuick, setPitQuick] = useState<any | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [insightsRes, analyzeRes, taxRes, salesRes, expensesRes, pitRes] = await Promise.all([
        fetch(`${API_BASE}/ai/insights`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period }) }),
        fetch(`${API_BASE}/ai/analyze`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period }) }),
        fetch(`${API_BASE}/ai/tax`, { credentials: "include" }),
        fetch(`${API_BASE}/business/sales`, { credentials: "include" }),
        fetch(`${API_BASE}/business/expenses`, { credentials: "include" }),
        fetch(`${API_BASE}/ai/pit`, { credentials: "include" }),
      ]);

      if (insightsRes.ok) setAdvice(await insightsRes.json());
      else setAdvice(null);

      if (analyzeRes.ok) setAnalysis(await analyzeRes.json());
      else setAnalysis(null);

      if (taxRes.ok) setTax(await taxRes.json());
      else setTax(null);

      if (salesRes.ok) setSalesData(await salesRes.json());
      else setSalesData([]);

      if (expensesRes.ok) setExpensesData(await expensesRes.json());
      else setExpensesData([]);

      if (pitRes.ok) setPitQuick(await pitRes.json()); else setPitQuick(null);
    } catch (e) {
      console.error('Failed fetching reports data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Derive financial numbers from salesData and expensesData
  const revenue = salesData.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const totalExpenses = expensesData.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  // If you track categories, attempt to derive COGS; otherwise 0
  const cogs = expensesData.reduce((s, it) => s + ((it.category && it.category.toLowerCase() === 'cogs') ? (Number(it.amount) || 0) : 0), 0);
  const operatingExpenses = Math.max(0, totalExpenses - cogs);
  const grossProfit = revenue - cogs;
  const netProfit = revenue - totalExpenses;

  // New business health score with heavier penalty for losses
  const baseScore = analysis?.health_score ?? 82;
  let score = baseScore;
  if (revenue <= 0) {
    score = netProfit < 0 ? 25 : Math.min(score, 50);
  } else {
    const margin = netProfit / revenue;
    if (margin < 0) {
      score = Math.max(15, Math.round(baseScore + margin * 150 - 25));
    } else if (margin < 0.05) {
      score = Math.min(65, baseScore - 12);
    } else if (margin < 0.10) {
      score = Math.min(72, baseScore - 8);
    } else if (margin >= 0.25) {
      score = Math.min(100, baseScore + 8);
    } else if (margin >= 0.15) {
      score = Math.min(95, baseScore + 4);
    }
  }
  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? "A" : score >= 85 ? "A-" : score >= 80 ? "B+" : score >= 75 ? "B" : score >= 70 ? "B-" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

  // --- Weekly aggregation helpers ---
  const parseDate = (s?: string) => (s ? new Date(s) : null);
  const getISOYearWeek = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  type WeeklyRow = { key: string; revenue: number; expenses: number; profit: number };
  const weeklyMap: Record<string, { revenue: number; expenses: number }> = {};
  for (const s of salesData) {
    const d = parseDate(s.date);
    if (!d) continue;
    const k = getISOYearWeek(d);
    weeklyMap[k] = weeklyMap[k] || { revenue: 0, expenses: 0 };
    weeklyMap[k].revenue += Number(s.amount) || 0;
  }
  for (const e of expensesData) {
    const d = parseDate(e.date);
    if (!d) continue;
    const k = getISOYearWeek(d);
    weeklyMap[k] = weeklyMap[k] || { revenue: 0, expenses: 0 };
    weeklyMap[k].expenses += Number(e.amount) || 0;
  }
  const weekly: WeeklyRow[] = Object.entries(weeklyMap)
    .map(([key, v]) => ({ key, revenue: v.revenue, expenses: v.expenses, profit: v.revenue - v.expenses }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
  const lastWeeks = weekly.slice(-8);
  const last12 = weekly.slice(-12);
  const avgProfit12 = last12.length ? last12.reduce((s, w) => s + w.profit, 0) / last12.length : 0;
  const std12 = last12.length ? Math.sqrt(last12.reduce((s, w) => s + Math.pow(w.profit - avgProfit12, 2), 0) / last12.length) : 0;
  const bestWeek = last12.reduce((m, w) => (w.profit > m ? w.profit : m), 0);
  const last = lastWeeks[lastWeeks.length - 1]?.profit ?? 0;
  const prev = lastWeeks[lastWeeks.length - 2]?.profit ?? 0;

  // Realistic valuation from SDE (annualized weekly profit x multiple)
  const annualSDE = Math.max(0, avgProfit12 * (52 / Math.max(1, last12.length)));
  const multipleLow = 1.5;
  const multipleHigh = 2.5;
  const valuationLow = annualSDE * multipleLow;
  const valuationHigh = annualSDE * multipleHigh;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI-Powered Reports</h1>
            <p className="text-muted-foreground mt-1">Smart insights and financial analysis for your business</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-9 px-3" onClick={fetchAll} disabled={loading}>{loading ? "Refreshing..." : "Refresh AI"}</Button>
          </div>
        </div>

        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
            <TabsTrigger value="statements">Financial Statements</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            {/* Business Health Score */}
            <Card className="shadow-hover border-2">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg text-muted-foreground">Overall Business Health Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center mb-4 mx-auto">
                    <span className="text-4xl font-bold text-primary">{grade}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{score}/100</div>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">AI Summary:</span> {advice?.summary || "Your profitability is excellent, but your cash flow is tight. Focus on collecting unpaid invoices to improve your score."}
                  </p>
                  {advice?.recommendations?.length ? (
                    <ul className="mt-2 text-left list-disc list-inside text-sm text-muted-foreground">
                      {advice.recommendations.slice(0, 3).map((r, i) => (
                        <li key={i}><span className="font-medium text-foreground">{r.title}:</span> {r.detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Vital Signs derived from business data */}
            <div className="grid gap-6 md:grid-cols-1">
              {/* Profitability Card */}
              <Card className="shadow-card hover:shadow-hover transition-shadow border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Profitability</CardTitle>
                  <div className="text-2xl font-bold text-green-600">{Math.min(100, Math.max(0, score + 8))}/100</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Net Profit Margin</span>
                      <span className="text-2xl font-bold text-green-600">{((netProfit / (revenue || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Revenue</span>
                        <span className="font-medium">{formatNaira(revenue)}</span>
                      </div>
                      <Progress value={Math.min(100, revenue > 0 ? 100 : 0)} className="h-3 bg-green-100" />
                      <div className="flex justify-between text-xs">
                        <span>Expenses</span>
                        <span className="font-medium">{formatNaira(totalExpenses)}</span>
                      </div>
                      <Progress value={revenue > 0 ? Math.min(100, (totalExpenses / revenue) * 100) : 0} className="h-3 bg-orange-100" />
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-900">
                      <strong>AI Insight:</strong> {analysis?.insights?.[0] || "You keep ₦35 for every ₦100 in sales, which is above the industry average. Great job!"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Business Valuation */}
              <Card className="shadow-card bg-gradient-to-br from-primary/10 to-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-lg">Estimated Business Valuation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Method: SDE-based (annualized avg weekly profit x 1.5–2.5x)</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Annualized SDE</div>
                        <div className="text-xl font-semibold">{formatNaira(annualSDE)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Valuation Range</div>
                        <div className="text-xl font-semibold">{formatNaira(valuationLow)} – {formatNaira(valuationHigh)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stability (12w σ): {formatNaira(std12)} · Best week: {formatNaira(bestWeek)}
                    </div>
                    <div className="text-sm">
                      {analysis?.valuation ? (
                        <span className="text-muted-foreground">AI note: {analysis.valuation}</span>
                      ) : (
                        <span className="text-muted-foreground">Provide more weeks of data to tighten the range.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actionable Advice from AI Analyst */}
              <Card className="shadow-card bg-gradient-to-br from-green-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">AI Actionable Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">
                    {analysis?.actions && analysis.actions.length ? (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {analysis.actions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">Actionable recommendations from the AI analyst will populate here.</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tax & Compliance (PIT-focused) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Personal Income Tax (PIT) – Sole Proprietor</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Estimated using 2026 PIT bands; treats profit as chargeable income (overestimate).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick PIT from current totals */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <p>Annual Revenue: <strong>{formatNaira(pitQuick?.annual_revenue)}</strong></p>
                    <p>Annual Expenses: <strong>{formatNaira(pitQuick?.annual_expenses)}</strong></p>
                    <p>Annual Profit (Taxable Income): <strong>{formatNaira(pitQuick?.annual_profit)}</strong></p>
                    <p>Estimated PIT: <strong>{formatNaira(pitQuick?.estimated_pit)}</strong></p>
                    <p>Tax Rate (Marginal): <strong>{pitQuick?.marginal_rate ? `${Number(pitQuick.marginal_rate).toFixed(1)}%` : '—'}</strong></p>
                    <p>Effective Tax Rate: <strong>{pitQuick?.effective_rate ? `${Number(pitQuick.effective_rate).toFixed(1)}%` : '—'}</strong></p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Note: ignores allowable deductions; actual PIT likely lower.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Statements tab: compute from business data */}
          <TabsContent value="statements" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Financial Statements</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Profit & Loss and PIT summary from your data
                  </p>
                </div>
                <Button className="gap-2" onClick={fetchAll}>
                  <Download className="w-4 h-4" />
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pl" className="space-y-4">
                  <TabsList className="grid w-full max-w-xl grid-cols-2">
                    <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="pit">PIT Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pl" className="space-y-4">
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">Revenue</span>
                        <span className="font-semibold">{formatNaira(revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">Cost of Goods Sold (COGS)</span>
                        <span className="font-semibold text-red-600">-{formatNaira(cogs)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2 border-primary">
                        <span className="font-bold text-lg">Gross Profit</span>
                        <span className="font-bold text-lg text-green-600">{formatNaira(grossProfit)}</span>
                      </div>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between text-sm">
                          <span>Operating Expenses</span>
                          <span className="text-red-600">-{formatNaira(operatingExpenses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Other Expenses</span>
                          <span className="text-red-600">-{formatNaira(totalExpenses - operatingExpenses - cogs)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">Total Operating Expenses</span>
                        <span className="font-semibold text-red-600">-{formatNaira(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-xl">Net Profit</span>
                        <span className="font-bold text-xl text-green-600">{formatNaira(netProfit)}</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pit" className="space-y-4">
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">Estimated Annual PIT</span>
                        <span className="font-semibold">{formatNaira(pitQuick?.estimated_pit)}</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <p>Taxable Income (Profit): <strong>{formatNaira(pitQuick?.annual_profit)}</strong></p>
                        <p>Tax Rate (Marginal): <strong>{pitQuick?.marginal_rate ? `${Number(pitQuick.marginal_rate).toFixed(1)}%` : '—'}</strong></p>
                        <p>Effective Tax Rate: <strong>{pitQuick?.effective_rate ? `${Number(pitQuick.effective_rate).toFixed(1)}%` : '—'}</strong></p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Based on 2026 PIT bands and your current profit (treats profit as chargeable income; ignores deductions).
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Weekly Performance section: last 8 weeks stats */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Last 8 weeks profit.</p>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded border">
                <div className="text-xs text-muted-foreground">Last Week Profit</div>
                <div className="text-lg font-semibold">{formatNaira(last)}</div>
              </div>
              <div className="p-3 rounded border">
                <div className="text-xs text-muted-foreground">Avg Profit (12w)</div>
                <div className="text-lg font-semibold">{formatNaira(avgProfit12)}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Week</th>
                    <th className="py-2 pr-4">Revenue</th>
                    <th className="py-2 pr-4">Expenses</th>
                    <th className="py-2 pr-4">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {lastWeeks.map((w) => (
                    <tr key={w.key} className="border-t">
                      <td className="py-2 pr-4">{w.key}</td>
                      <td className="py-2 pr-4">{formatNaira(w.revenue)}</td>
                      <td className="py-2 pr-4">{formatNaira(w.expenses)}</td>
                      <td className="py-2 pr-4">{formatNaira(w.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;