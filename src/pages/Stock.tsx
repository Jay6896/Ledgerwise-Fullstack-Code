import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";

const Stock = () => {
  const stockItems = [
    { id: "P001", name: "Product A", quantity: 150, minStock: 50, status: "In Stock" },
    { id: "P002", name: "Product B", quantity: 30, minStock: 50, status: "Low Stock" },
    { id: "P003", name: "Product C", quantity: 0, minStock: 20, status: "Out of Stock" },
    { id: "P004", name: "Product D", quantity: 200, minStock: 100, status: "In Stock" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Stock</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage your inventory levels</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Stock
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">380</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">1</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">1</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min. Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="font-semibold">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.minStock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.status === "Out of Stock" && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        {item.status === "Low Stock" && (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === "In Stock" 
                            ? "bg-green-100 text-green-700" 
                            : item.status === "Low Stock"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Update Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Stock;
