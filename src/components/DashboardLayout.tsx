import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Input } from "./ui/input";
import { Search, Bell, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    navigate("/");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1">
        <header className="border-b border-border bg-card px-6 py-4">
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
            
            <div className="flex items-center gap-3 relative">
              <Button className="relative h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-white">
                  3
                </Badge>
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
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
