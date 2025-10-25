import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, MoreVertical, Plus, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = "http://localhost:5000";

type CatalogItem = {
  id: number;
  item: string;
  category: "sale" | "expense";
  amount: string; // unit price formatted
  quantity: number;
  date: string;
  totalAmount: string; // total formatted
};

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(""); // unit price
  const [quantity, setQuantity] = useState("1");
  const [total, setTotal] = useState(""); // optional total amount
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<"sale" | "expense">("sale");
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    try {
      const [salesRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE}/business/sales`, { credentials: "include" }),
        fetch(`${API_BASE}/business/expenses`, { credentials: "include" }),
      ]);

      if (salesRes.status === 401 || expensesRes.status === 401) {
        toast.error("Please log in to view your items.");
        return;
      }

      const sales = (await salesRes.json()) as Array<{
        id: number;
        name: string;
        amount: number; // total
        unit_price?: number | null; // unit
        quantity?: number | null;
        date?: string;
      }>;
      const expenses = (await expensesRes.json()) as Array<{
        id: number;
        description?: string;
        amount: number; // total
        unit_price?: number | null; // unit
        quantity?: number | null;
        date?: string;
      }>;

      const mapped: CatalogItem[] = [
        ...sales.map((s) => ({
          id: s.id,
          item: s.name,
          category: "sale" as const,
          amount: `₦${Number(
            s.unit_price ?? (s.quantity ? s.amount / s.quantity : s.amount)
          ).toLocaleString()}`,
          quantity: s.quantity ?? 1,
          date: s.date ? new Date(s.date).toLocaleDateString() : "",
          totalAmount: `₦${Number(s.amount).toLocaleString()}`,
        })),
        ...expenses.map((e) => ({
          id: e.id,
          item: e.description || "Expense",
          category: "expense" as const,
          amount: `₦${Number(
            e.unit_price ?? (e.quantity ? e.amount / e.quantity : e.amount)
          ).toLocaleString()}`,
          quantity: e.quantity ?? 1,
          date: e.date ? new Date(e.date).toLocaleDateString() : "",
          totalAmount: `₦${Number(e.amount).toLocaleString()}`,
        })),
      ].sort((a, b) => b.id - a.id);

      setItems(mapped);
    } catch (err) {
      // ignore for now
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !category) {
      toast.error("Please fill in required fields");
      return;
    }
    if (!amount && !total) {
      toast.error("Enter amount (unit price) or total amount");
      return;
    }
    const qtyNum = Number(quantity || 1);
    const unitNum = amount ? Number(amount) : undefined;
    const totalNum = total ? Number(total) : undefined;

    setLoading(true);
    try {
      const url =
        category === "sale"
          ? `${API_BASE}/business/sales`
          : `${API_BASE}/business/expenses`;

      const common = {
        date,
        quantity: qtyNum,
        ...(unitNum !== undefined ? { unit_price: unitNum } : {}),
        ...(totalNum !== undefined ? { totalamount: totalNum } : {}),
      };

      const payload =
        category === "sale"
          ? { name, ...common }
          : { description: name, ...common };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to add item");
        return;
      }

      toast.success("Item added");
      setOpen(false);
      setName("");
      setAmount("");
      setQuantity("1");
      setTotal("");
      setDate("");
      setCategory("sale");
      fetchData();
    } catch (e) {
      toast.error("Could not reach server");
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/business/import`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }
      toast.success(
        `Imported: ${data.sales_added} sales, ${data.expenses_added} expenses`
      );
      fetchData();
    } catch {
      toast.error("Upload failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            My Sales & Expenses
          </h1>
          {/* Keep Dialog mounted here; open is controlled via state. Removed inline trigger. */}
          <Dialog open={open} onOpenChange={setOpen}>
            {/* Trigger removed; we now open via button in filter toolbar below */}
            <DialogContent className="bg-popover sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Product A or Rent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (per unit)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total Amount (optional)</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="auto if blank"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory(v as "sale" | "expense")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="h-10 px-6"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 flex-wrap items-center bg-card p-4 rounded-lg shadow-card">
          <Button className="gap-2 h-9 rounded-md px-3">
            <Filter className="w-4 h-4" />
            Filter By
          </Button>

          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="negotiated">Negotiated</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Item Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button className="h-9 rounded-md px-3 hover:bg-red-500 hover:text-accent-foreground">
            Reset Filter
          </Button>

          {/* Upload CSV/XLSX */}
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              // reset to allow re-uploading same file name
              e.currentTarget.value = "";
            }}
          />
          <Button
            className="gap-2 h-9 rounded-md px-3"
            onClick={() => document.getElementById('import-file')?.click()}
            title="Import CSV/XLSX with columns: name, category(sale/expense), amount, date, quantity, totalamount"
          >
            <Upload className="w-4 h-4" />
            Import CSV/XLSX
          </Button>

          {/* Add New Item button at the end */}
          <Button className="ml-auto shrink-0 gap-2 h-9 rounded-md px-3" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Add New Item
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Total Amount</TableHead>
                <TableHead className="font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.category}-${item.id}`} className="hover:bg-muted/30" title={item.item}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.category === "sale"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.category === "sale" ? "Sale" : "Expense"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.amount}</TableCell>
                  <TableCell className="font-medium">{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.date}
                  </TableCell>
                  <TableCell className="font-medium">{item.totalAmount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="h-9 rounded-md px-3 hover:bg-accent hover:text-accent-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => toast.info("Edit functionality")}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("View details")}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Delete functionality")}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <p>Showing {items.length} item(s)</p>
          <div className="flex gap-2">
            <Button className="h-9 rounded-md px-3">Previous</Button>
            <Button className="h-9 rounded-md px-3">Next</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Catalog;
