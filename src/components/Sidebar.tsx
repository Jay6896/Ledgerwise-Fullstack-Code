import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  DollarSign, 
  FileText, 
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Sales & Expenses", path: "/catalog", icon: DollarSign },
  { title: "Chat", path: "/chat", icon: MessageSquare },
  { title: "Reports", path: "/reports", icon: FileText },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary tracking-wide">LEDGERWISE</h1>
      </div>
      
      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-primary text-primary-foreground font-medium shadow-sm"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
