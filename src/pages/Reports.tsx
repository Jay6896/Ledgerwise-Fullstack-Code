import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
  const [aiTaxResult, setAiTaxResult] = useState<any | null>(null);
  const [taxUploading, setTaxUploading] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [insightsRes, analyzeRes, taxRes, salesRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE}/ai/insights`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period }) }),
        fetch(`${API_BASE}/ai/analyze`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period }) }),
        fetch(`${API_BASE}/ai/tax`, { credentials: "include" }),
        fetch(`${API_BASE}/business/sales`, { credentials: "include" }),
        fetch(`${API_BASE}/business/expenses`, { credentials: "include" }),
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

  const score = analysis?.health_score ?? 82;
  const grade = score >= 90 ? "A" : score >= 85 ? "A-" : score >= 80 ? "B+" : score >= 75 ? "B" : score >= 70 ? "B-" : "C";

  // Derive financial numbers from salesData and expensesData
  const revenue = salesData.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const totalExpenses = expensesData.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  // If you track categories, attempt to derive COGS; otherwise 0
  const cogs = expensesData.reduce((s, it) => s + ((it.category && it.category.toLowerCase() === 'cogs') ? (Number(it.amount) || 0) : 0), 0);
  const operatingExpenses = Math.max(0, totalExpenses - cogs);
  const grossProfit = revenue - cogs;
  const netProfit = revenue - totalExpenses;

  // Cashflow: simplistic mapping
  const cashIn = revenue;
  const cashOut = totalExpenses;
  const netCashFlow = cashIn - cashOut;

  const handleTaxUpload = async (file: File | null, businessSize: 'MEDIUM' | 'LARGE') => {
    if (!file) return;
    try {
      setTaxUploading(true);
      setAiTaxResult(null);
      const form = new FormData();
      form.append('file', file);
      form.append('business_size', businessSize);
      const res = await fetch(`${API_BASE}/ai/tax/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (res.ok) setAiTaxResult(data);
      else setAiTaxResult({ error: data?.error || 'Failed to calculate tax' });
    } catch (e) {
      setAiTaxResult({ error: 'Network error uploading file' });
    } finally {
      setTaxUploading(false);
    }
  };

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
            <div className="grid gap-6 md:grid-cols-2">
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

              {/* Liquidity Card */}
              <Card className="shadow-card hover:shadow-hover transition-shadow border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Liquidity</CardTitle>
                  <div className="text-2xl font-bold text-orange-600">{Math.round((cashIn > 0 ? (netCashFlow / cashIn) * 100 : 0) || 0)}/100</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Net Cash Flow</span>
                      <span className="text-2xl font-bold text-orange-600 flex items-center gap-1">
                        <TrendingDown className="w-5 h-5" />
                        {formatNaira(netCashFlow)}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span>Cash In</span>
                        <span className="font-medium text-green-700">+{formatNaira(cashIn)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span>Cash Out</span>
                        <span className="font-medium text-red-700">-{formatNaira(cashOut)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-900">
                      <strong>AI Insight:</strong> {analysis?.insights?.[1] || "You spent ₦80,000 more than you brought in. You have ₦250,000 in unpaid invoices."}
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
                  <div className="text-2xl font-bold text-primary mb-2">{analysis?.valuation || '₦—'}</div>
                  <p className="text-sm text-muted-foreground">
                    {analysis?.valuation ? 'Estimated by AI analyst.' : 'Valuation will appear here after AI analysis.'}
                  </p>
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

            {/* Tax & Compliance */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Tax & Compliance Status</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Summary from business totals (quick view) or upload a statement for detailed AI tax analysis
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick summary from DB totals */}
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Company Income Tax (CIT)</span>
                      <span className={`text-xs ${tax?.cit_exempt ? 'bg-green-600' : 'bg-orange-600'} text-white px-2 py-0.5 rounded`}>
                        {tax?.cit_exempt ? 'EXEMPT' : 'APPLICABLE'}
                      </span>
                    </div>
                    <p className="text-sm text-green-900">
                      {tax?.cit_exempt ? 'Your revenue is below the ₦100M SME threshold, so you are not required to pay CIT.' : 'Your revenue exceeds the SME threshold; ensure CIT compliance.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Value Added Tax (VAT)</span>
                      <span className={`text-xs ${tax?.vat_threshold_nearing ? 'bg-orange-600' : 'bg-green-600'} text-white px-2 py-0.5 rounded`}>
                        {tax?.vat_threshold_nearing ? 'APPROACHING' : 'BELOW THRESHOLD'}
                      </span>
                    </div>
                    <p className="text-sm text-orange-900">
                      VAT Collected from Customers: <strong>{formatNaira(tax?.vat_collected)}</strong><br />
                      VAT Paid to Suppliers: <strong className="text-red-700">-{formatNaira(tax?.vat_paid)}</strong><br />
                      Net VAT Payable: <strong>{formatNaira(tax?.net_vat)}</strong>
                    </p>
                  </div>
                </div>

                {/* Detailed AI Tax Calculator (file upload) */}
                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-semibold mb-2">Detailed Tax Calculator (Upload CSV/XLSX)</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <select id="bizsize" className="border rounded px-2 py-1 text-sm">
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LARGE">LARGE</option>
                    </select>
                    <input id="taxfile" type="file" accept=".csv,.xlsx,.xls" className="text-sm" />
                    <Button
                      className="h-8 px-3"
                      disabled={taxUploading}
                      onClick={() => {
                        const fInput = document.getElementById('taxfile') as HTMLInputElement | null;
                        const sInput = document.getElementById('bizsize') as HTMLSelectElement | null;
                        const f = fInput?.files?.[0] || null;
                        const size = (sInput?.value as 'MEDIUM' | 'LARGE') || 'MEDIUM';
                        handleTaxUpload(f, size);
                      }}
                    >
                      {taxUploading ? 'Uploading...' : 'Analyze File'}
                    </Button>
                  </div>
                  {aiTaxResult && (
                    <div className="mt-3 text-sm">
                      {aiTaxResult.error ? (
                        <p className="text-red-600">{aiTaxResult.error}</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <p>Taxable Profit: <strong>{formatNaira(aiTaxResult.taxable_profit)}</strong></p>
                            <p>CIT Rate: <strong>{aiTaxResult.cit_rate_applied?.toFixed ? `${aiTaxResult.cit_rate_applied.toFixed(1)}%` : `${aiTaxResult.cit_rate_applied}%`}</strong></p>
                            <p>CIT Liability: <strong>{formatNaira(aiTaxResult.cit_liability)}</strong></p>
                            <p>TET (3%): <strong>{formatNaira(aiTaxResult.education_tax_liability)}</strong></p>
                            <p>Total Profit Tax Due: <strong>{formatNaira(aiTaxResult.total_profit_tax_due)}</strong></p>
                          </div>
                          <div>
                            <p>VAT Output (Sales): <strong>{formatNaira(aiTaxResult.vat_output_collected)}</strong></p>
                            <p>VAT Input (Purchases): <strong>{formatNaira(aiTaxResult.vat_input_paid)}</strong></p>
                            <p>VAT Remittable: <strong>{formatNaira(aiTaxResult.vat_remittable_due)}</strong></p>
                            <p>Status: <strong>{aiTaxResult.compliance_status}</strong></p>
                          </div>
                          <div className="sm:col-span-2 mt-2">
                            <p className="font-semibold">Tax Recommendation</p>
                            <p className="text-muted-foreground">{aiTaxResult.compliance_recommendation}</p>
                            <p className="font-semibold mt-2">Business Advice</p>
                            <p className="text-muted-foreground">{aiTaxResult.business_growth_advice}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <Clock className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">CAC Annual Returns</span>
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">{tax?.cac_due_days ?? 30} DAYS</span>
                    </div>
                    <p className="text-sm text-red-900">
                      Your annual filing is due soon. 
                      <Button type="button" className="h-auto p-0 text-sm text-red-700 font-semibold ml-1 underline hover:underline bg-transparent shadow-none">
                        Click here to see what you need
                      </Button>
                    </p>
                  </div>
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
                    Traditional reports for you and your accountant
                  </p>
                </div>
                <Button className="gap-2" onClick={fetchAll}>
                  <Download className="w-4 h-4" />
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pl" className="space-y-4">
                  <TabsList className="grid w-full max-w-xl grid-cols-3">
                    <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="cf">Cash Flow Statement</TabsTrigger>
                    <TabsTrigger value="tax">Tax Summary</TabsTrigger>
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

                  <TabsContent value="cf" className="space-y-4">
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b-2">
                        <span className="font-bold">Cash In (Receipts)</span>
                        <span className="font-bold text-green-600">{formatNaira(cashIn)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2">
                        <span className="font-bold">Cash Out (Payments)</span>
                        <span className="font-bold text-red-600">-{formatNaira(cashOut)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-xl">Net Cash Flow</span>
                        <span className="font-bold text-xl text-red-600">{formatNaira(netCashFlow)}</span>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Beginning Cash Balance:</strong> {formatNaira(0)}<br />
                          <strong>Ending Cash Balance:</strong> {formatNaira(netCashFlow)}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tax" className="space-y-4">
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">VAT Collected from Customers</span>
                        <span className="font-semibold">{formatNaira(tax?.vat_collected)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">VAT Paid to Suppliers</span>
                        <span className="font-semibold text-red-600">-{formatNaira(tax?.vat_paid)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2 border-primary">
                        <span className="font-bold">Net VAT Payable</span>
                        <span className="font-bold">{formatNaira(tax?.net_vat)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="font-semibold">Estimated CIT/Levy</span>
                        <span className="font-semibold text-green-600">{tax?.cit_exempt ? '₦0 (Exempt)' : 'Review AI Tax Analysis'}</span>
                      </div>
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-900">
                          <strong>Status:</strong> Tax summary based on your business data and AI analysis.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;