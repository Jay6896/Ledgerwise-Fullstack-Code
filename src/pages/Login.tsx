import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AuthBackground from "@/components/AuthBackground";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Simple demo login - in production, use proper authentication
    toast.success("Login successful!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthBackground />
      
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Login to Account</h1>
          <p className="text-muted-foreground text-sm">
            Please enter your email and password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address:</Label>
            <Input
              id="email"
              type="email"
              placeholder="esteban_schiller@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <button 
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => toast.info("Password reset not implemented in demo")}
              >
                Forget Password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember Password
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-primary hover:underline font-medium"
            >
              Create Account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
