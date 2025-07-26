import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Shield } from "lucide-react";

const AdminSetup = () => {
  const { user, userRole, loading } = useAuth();
  const [adminId, setAdminId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Only admin users can access this page
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/admin-auth" replace />;
  }

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify admin ID (you can customize this verification logic)
      const validAdminIds = ["BACP2025", "ADMIN001", "SETUP123"]; // Add your valid IDs here
      
      if (!validAdminIds.includes(adminId.toUpperCase())) {
        toast.error("Invalid admin ID. Contact system administrator.");
        setIsLoading(false);
        return;
      }

      // Proceed with admin setup using the fixed send-admin-invites function
      const { data, error } = await supabase.functions.invoke('send-admin-invites');
      
      if (error) {
        console.error('Admin setup error:', error);
        toast.error(`Failed to send admin setup: ${error.message}`);
      } else {
        console.log('Admin setup completed:', data);
        toast.success("Admin setup emails sent successfully!");
        setAdminId("");
      }
    } catch (error) {
      console.error('Unexpected admin setup error:', error);
      toast.error("An unexpected error occurred during admin setup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <CardDescription>
            Secure admin user configuration portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminId">Admin Verification ID</Label>
              <Input
                id="adminId"
                type="text"
                placeholder="Enter admin verification ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                className="text-center tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                Contact your system administrator for the verification ID
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !adminId.trim()}
            >
              {isLoading ? "Setting up admin users..." : "Setup Admin Users"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">What this does:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Sends setup emails to admin users</li>
              <li>• Creates secure admin accounts</li>
              <li>• Assigns proper admin roles</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;