import { ReactNode, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Sidebar, { navItems } from "./Sidebar";
import { Input } from "./ui/input";
import { Search, Bell, User, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { API_BASE } from "@/lib/config";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    navigate("/");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <Button variant="outline" className="h-9 w-9 rounded-md" onClick={() => setMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <button className="text-sm font-semibold" onClick={() => navigate('/dashboard')}>LEDGERWISE</button>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 w-9 rounded-md">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="outline" className="h-9 w-9 rounded-md" onClick={() => setMenuOpen((v) => !v)}>
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile sheet menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-popover border-r border-border shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold">Menu</span>
              <Button variant="outline" className="h-8 px-2" onClick={() => setMobileOpen(false)}>Close</Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'} flex items-center gap-3 px-3 py-2 rounded-md`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-0">
        <header className="hidden md:block border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div 
              className="relative flex-1 max-w-2xl cursor-pointer" 
              onClick={() => navigate('/chat')}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input 
                placeholder="Ask Wise-AI any question on business management" 
                className="pl-10 bg-background cursor-pointer hover:border-primary transition-colors"
                readOnly
              />
            </div>
            
            <div className="hidden md:flex items-center gap-3 relative">
              <Button variant="outline" className="relative h-9 w-9 rounded-md bg-transparent border-border text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Button className="h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground" onClick={() => setMenuOpen((v) => !v)}>
                <User className="w-5 h-5" />
              </Button>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-50 bg-popover border border-border rounded-md shadow-md w-40 p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="pt-14 md:pt-0 p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
