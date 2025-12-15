import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(password);
    if (success) {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-heading text-foreground mb-8">Admin</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="font-mono"
            autoFocus
          />
          
          {error && (
            <p className="text-caption text-destructive">{error}</p>
          )}
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "..." : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
