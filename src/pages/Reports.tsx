import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, Calendar } from "lucide-react";

const Reports = () => {
  const reports = [
    {
      title: "Monthly Sales Report",
      description: "Detailed breakdown of sales for October 2025",
      date: "October 2025",
      icon: TrendingUp,
    },
    {
      title: "Expense Summary",
      description: "Complete expense tracking and categorization",
      date: "October 2025",
      icon: FileText,
    },
    {
      title: "Profit & Loss",
      description: "P&L statement for the current period",
      date: "Q3 2025",
      icon: Calendar,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">Download and view your business reports</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Generate Report
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => (
            <Card key={index} className="shadow-card hover:shadow-hover transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <report.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{report.date}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Report History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Sales Report - September 2025", date: "01 Oct 2025", size: "2.4 MB" },
                { name: "Expense Report - September 2025", date: "01 Oct 2025", size: "1.8 MB" },
                { name: "Annual Report 2024", date: "15 Sep 2025", size: "5.2 MB" },
              ].map((file, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.date} • {file.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
