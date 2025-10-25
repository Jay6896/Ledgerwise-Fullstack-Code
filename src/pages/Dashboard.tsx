import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

type TopItem = { name: string; sales: number; units: number };

type DashboardData = {
  total_revenue: number;
  total_expenses: number;
  recent_sales: { id: number; name: string; amount: number }[];
  top_selling: TopItem[];
};

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/business/dashboard`, { credentials: "include" });
        if (!res.ok) return;
        const json = (await res.json()) as DashboardData;
        if (!ignore) setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const stats = [
    {
      title: "Total Sales",
      value: data ? formatNaira(data.total_revenue) : "—",
      change: "",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Expenses",
      value: data ? formatNaira(data.total_expenses) : "—",
      change: "",
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Revenue Growth",
      value: data ? (data.total_revenue ? `${((data.total_revenue - data.total_expenses) / Math.max(1, data.total_revenue) * 100).toFixed(1)}%` : "0.0%") : "—",
      change: "",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Products",
      value: data ? String(data.top_selling?.length || 0) : "—",
      change: "",
      icon: Package,
      color: "text-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-card hover:shadow-hover transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                {!loading && <p className="text-xs text-green-600 mt-1">Updated now</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.recent_sales || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">Sale</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatNaira(s.amount)}</p>
                  </div>
                ))}
                {!loading && (!data?.recent_sales || data.recent_sales.length === 0) && (
                  <p className="text-sm text-muted-foreground">No recent sales</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.top_selling || []).map((product, i) => (
                  <div key={`${product.name}-${i}`} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.units} units sold</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatNaira(product.sales)}</p>
                  </div>
                ))}
                {!loading && (!data?.top_selling || data.top_selling.length === 0) && (
                  <p className="text-sm text-muted-foreground">No sales yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
