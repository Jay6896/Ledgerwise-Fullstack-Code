import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthBackground from "@/components/AuthBackground";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !email || !password || !confirmPassword || !businessName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, businessName, firstName, industry }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Account created successfully!");
        navigate("/dashboard");
      } else {
        toast.error(data.error || "An error occurred during signup.");
      }
    } catch (error) {
      toast.error("Failed to connect to the server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthBackground />
      
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 md:p-8 relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create your Ledgerwise Account!</h1>
          <p className="text-muted-foreground text-sm">
            Sign up to start tracking your business sales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {/* First and Last name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name:</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last name:</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email address:</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Business Name moved below Email */}
          <div className="space-y-1">
            <Label htmlFor="businessName">Business Name:</Label>
            <Input
              id="businessName"
              type="text"
              placeholder="My Business"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Business Industry dropdown */}
          <div className="space-y-1">
            <Label>Business Industry (optional):</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Wholesale & Retail Trade">Wholesale & Retail Trade</SelectItem>
                <SelectItem value="Information & Technology">Information & Technology</SelectItem>
                <SelectItem value="Food & Accommodation">Food & Accommodation</SelectItem>
                <SelectItem value="Fashion & Beauty">Fashion & Beauty</SelectItem>
                <SelectItem value="Agriculture & Agro-Processing">Agriculture & Agro-Processing</SelectItem>
                <SelectItem value="Professional Services">Professional Services</SelectItem>
                <SelectItem value="Healthcare & Wellness">Healthcare & Wellness</SelectItem>
                <SelectItem value="Transportation & Logistics">Transportation & Logistics</SelectItem>
                <SelectItem value="Real Estate & Construction">Real Estate & Construction</SelectItem>
                <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Passwords stay at bottom */}
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-background"
            />
          </div>

          <Button type="submit" className="w-full h-10 rounded-2xl px-8">
            Create Account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
