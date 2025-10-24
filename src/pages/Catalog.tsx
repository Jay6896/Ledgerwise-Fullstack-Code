import { useState } from "react";
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
import { Filter, MoreVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Catalog = () => {
  const [items] = useState([
    {
      id: "00001",
      businessItem: "My shop",
      priceType: "Fixed",
      price: "₦200,000",
      dateCreated: "28 May 2019",
    },
    {
      id: "00002",
      businessItem: "Service Package",
      priceType: "Negotiated",
      price: "₦150,000 - ₦300,000",
      dateCreated: "15 June 2019",
    },
    {
      id: "00003",
      businessItem: "Product Bundle",
      priceType: "Fixed",
      price: "₦450,000",
      dateCreated: "03 July 2019",
    },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">My Business Items</h1>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Item
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap items-center bg-card p-4 rounded-lg shadow-card">
          <Button variant="outline" size="sm" className="gap-2">
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

          <Button variant="ghost" size="sm" className="text-destructive">
            Reset Filter
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Business Item</TableHead>
                <TableHead className="font-semibold">Price Type</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Date created</TableHead>
                <TableHead className="font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.businessItem}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.priceType === "Fixed" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.priceType}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.price}</TableCell>
                  <TableCell className="text-muted-foreground">{item.dateCreated}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => toast.error("Delete functionality")}
                        >
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
          <p>Showing 1-09 of 78</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Catalog;
