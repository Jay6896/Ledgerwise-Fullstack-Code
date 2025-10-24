import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from "lucide-react";

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI-Powered Reports</h1>
            <p className="text-muted-foreground mt-1">Smart insights and financial analysis for your business</p>
          </div>
          <Select defaultValue="month">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
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
                    <span className="text-4xl font-bold text-primary">B+</span>
                  </div>
                  <div className="text-sm text-muted-foreground">82/100</div>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">AI Summary:</span> Your profitability is excellent, but your cash flow is tight. 
                    Focus on collecting unpaid invoices to improve your score.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Four Vital Signs */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profitability Card */}
              <Card className="shadow-card hover:shadow-hover transition-shadow border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Profitability</CardTitle>
                  <div className="text-2xl font-bold text-green-600">90/100</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Net Profit Margin</span>
                      <span className="text-2xl font-bold text-green-600">35%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Revenue</span>
                        <span className="font-medium">₦2,450,000</span>
                      </div>
                      <Progress value={100} className="h-3 bg-green-100" />
                      <div className="flex justify-between text-xs">
                        <span>Expenses</span>
                        <span className="font-medium">₦1,592,500</span>
                      </div>
                      <Progress value={65} className="h-3 bg-orange-100" />
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-900">
                      <strong>AI Insight:</strong> You keep ₦35 for every ₦100 in sales, which is above the industry average. Great job!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Liquidity Card */}
              <Card className="shadow-card hover:shadow-hover transition-shadow border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Liquidity</CardTitle>
                  <div className="text-2xl font-bold text-orange-600">45/100</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Net Cash Flow</span>
                      <span className="text-2xl font-bold text-orange-600 flex items-center gap-1">
                        <TrendingDown className="w-5 h-5" />
                        -₦80,000
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span>Cash In</span>
                        <span className="font-medium text-green-700">+₦920,000</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span>Cash Out</span>
                        <span className="font-medium text-red-700">-₦1,000,000</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-900">
                      <strong>AI Insight:</strong> You spent ₦80,000 more than you brought in. You have ₦250,000 in unpaid invoices. 
                      <Button variant="link" className="h-auto p-0 text-xs text-orange-700 font-semibold">Click here to follow up</Button>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Card */}
              <Card className="shadow-card hover:shadow-hover transition-shadow border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Growth</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">88/100</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Sales Growth</span>
                      <span className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                        <TrendingUp className="w-5 h-5" />
                        +18%
                      </span>
                    </div>
                    <div className="h-24 flex items-end gap-2">
                      {[65, 70, 75, 82, 88, 100].map((height, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" 
                             style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900">
                      <strong>AI Insight:</strong> Your sales grew by 18% this quarter! Your 'Custom Aso Ebi' service is your fastest-growing product.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Efficiency Card */}
              <Card className="shadow-card hover:shadow-hover transition-shadow border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Efficiency</CardTitle>
                  <div className="text-2xl font-bold text-purple-600">75/100</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-muted-foreground">Top Expense Categories</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Inventory', percent: 40, color: 'bg-purple-500' },
                        { name: 'Staff', percent: 25, color: 'bg-purple-400' },
                        { name: 'Rent', percent: 15, color: 'bg-purple-300' },
                        { name: 'Data/Internet', percent: 10, color: 'bg-purple-200' },
                        { name: 'Other', percent: 10, color: 'bg-purple-100' },
                      ].map((expense) => (
                        <div key={expense.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{expense.name}</span>
                            <span className="font-medium">{expense.percent}%</span>
                          </div>
                          <div className={`h-2 ${expense.color} rounded-full`} style={{ width: `${expense.percent}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-900">
                      <strong>AI Insight:</strong> Your spending is well-managed. Top cost is inventory, which is healthy. 
                      Your 'Data/Internet' bill is 10% of expenses; you might find a cheaper plan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strategic Projections */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Future Revenue Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-3 mb-4">
                  {[
                    { value: 1800000, projected: false },
                    { value: 2100000, projected: false },
                    { value: 2450000, projected: false },
                    { value: 2650000, projected: true },
                    { value: 2900000, projected: true },
                    { value: 3100000, projected: true },
                    { value: 3400000, projected: true },
                    { value: 3650000, projected: true },
                    { value: 3900000, projected: true },
                  ].map((month, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className={`w-full rounded-t transition-all ${
                          month.projected 
                            ? 'bg-gradient-to-t from-green-400 to-green-200 border-2 border-dashed border-green-500' 
                            : 'bg-gradient-to-t from-primary to-primary/60'
                        }`}
                        style={{ height: `${(month.value / 4000000) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{month.projected ? 'P' : 'A'}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 justify-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded" />
                    <span>Actual Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 border-2 border-dashed border-green-500 rounded" />
                    <span>AI Projection</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Business Valuation */}
              <Card className="shadow-card bg-gradient-to-br from-primary/10 to-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-lg">Estimated Business Valuation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">₦8,500,000</div>
                  <p className="text-sm text-muted-foreground">
                    Based on 3.5x annual net profit and industry standards for Nigerian SMEs
                  </p>
                </CardContent>
              </Card>

              {/* Negotiation Advice */}
              <Card className="shadow-card bg-gradient-to-br from-green-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">AI Negotiation Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">
                    <strong>Product:</strong> Custom Aso Ebi
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your average price is <strong>₦145,000</strong>. Your data shows you successfully charged 
                    <strong className="text-green-600"> ₦160,000</strong> on weekends. 
                    Try starting your negotiations higher for weekend events.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tax & Compliance */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Tax & Compliance Status</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  The taxes that apply to your business right now, based on your data
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Company Income Tax (CIT)</span>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">EXEMPT</span>
                    </div>
                    <p className="text-sm text-green-900">
                      Your revenue is below the ₦100M SME threshold, so you are not required to pay CIT.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Value Added Tax (VAT)</span>
                      <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded">APPROACHING</span>
                    </div>
                    <p className="text-sm text-orange-900">
                      Your sales are at ₦22.5M, which is close to the ₦25M registration threshold. 
                      <Button variant="link" className="h-auto p-0 text-sm text-orange-700 font-semibold ml-1">
                        Click here to learn how to prepare
                      </Button>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Development Levy</span>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">EXEMPT</span>
                    </div>
                    <p className="text-sm text-green-900">
                      This does not apply because your business is exempt from CIT.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <Clock className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">CAC Annual Returns</span>
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">DUE IN 30 DAYS</span>
                    </div>
                    <p className="text-sm text-red-900">
                      Your annual filing is due soon. 
                      <Button variant="link" className="h-auto p-0 text-sm text-red-700 font-semibold ml-1">
                        Click here to see what you need
                      </Button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statements" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Financial Statements</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Traditional reports for you and your accountant
                  </p>
                </div>
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Download as PDF/CSV
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
                        <span className="font-semibold">₦2,450,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">Cost of Goods Sold</span>
                        <span className="font-semibold text-red-600">-₦980,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2 border-primary">
                        <span className="font-bold text-lg">Gross Profit</span>
                        <span className="font-bold text-lg text-green-600">₦1,470,000</span>
                      </div>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between text-sm">
                          <span>Staff Salaries</span>
                          <span className="text-red-600">-₦398,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Rent</span>
                          <span className="text-red-600">-₦239,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Utilities</span>
                          <span className="text-red-600">-₦159,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Marketing</span>
                          <span className="text-red-600">-₦98,000</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">Total Operating Expenses</span>
                        <span className="font-semibold text-red-600">-₦894,000</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-xl">Net Profit</span>
                        <span className="font-bold text-xl text-green-600">₦576,000</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cf" className="space-y-4">
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b-2">
                        <span className="font-bold">Cash from Operations</span>
                        <span className="font-bold text-green-600">₦496,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2">
                        <span className="font-bold">Cash from Investing</span>
                        <span className="font-bold text-red-600">-₦150,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2">
                        <span className="font-bold">Cash from Financing</span>
                        <span className="font-bold text-red-600">-₦426,000</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-xl">Net Cash Flow</span>
                        <span className="font-bold text-xl text-red-600">-₦80,000</span>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Beginning Cash Balance:</strong> ₦450,000<br />
                          <strong>Ending Cash Balance:</strong> ₦370,000
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tax" className="space-y-4">
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">VAT Collected from Customers</span>
                        <span className="font-semibold">₦183,750</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-semibold">VAT Paid to Suppliers</span>
                        <span className="font-semibold text-red-600">-₦119,400</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b-2 border-primary">
                        <span className="font-bold">Net VAT Payable</span>
                        <span className="font-bold">₦64,350</span>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="font-semibold">Estimated CIT/Levy</span>
                        <span className="font-semibold text-green-600">₦0 (Exempt)</span>
                      </div>
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-900">
                          <strong>Status:</strong> Ready for filing. Your VAT return is prepared and you're exempt from CIT.
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