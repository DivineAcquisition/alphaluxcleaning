import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SecureAdminCreation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  // Form states
  const [secretCode, setSecretCode] = useState('');
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Secret codes for admin creation (in a real app, this would be in environment variables)
  const ADMIN_SECRET_CODES = [
    'BACP_ADMIN_2024_DIVINE',
    'SUPER_SECURE_ADMIN_KEY_2024',
    'DIVINE_ACQUISITION_ADMIN_2024'
  ];

  const validateSecretCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!secretCode) {
      setError('Please enter the secret code');
      return;
    }

    if (!ADMIN_SECRET_CODES.includes(secretCode)) {
      setError('Invalid secret code. Access denied.');
      return;
    }

    setStep(2);
    toast.success('Secret code verified. You can now create an admin account.');
  };

  const createAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!adminData.email || !adminData.password || !adminData.confirmPassword || !adminData.fullName) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (adminData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the create-test-admin function or similar
      const { data, error: functionError } = await supabase.functions.invoke('create-test-admin', {
        body: {
          email: adminData.email,
          password: adminData.password,
          fullName: adminData.fullName,
          secretCode: secretCode
        }
      });

      if (functionError) {
        setError(functionError.message);
      } else {
        toast.success('Admin account created successfully!');
        navigate('/auth');
      }
    } catch (error: any) {
      setError('Failed to create admin account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900/10 to-orange-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Secure Admin Portal
          </h1>
          <p className="text-muted-foreground">
            Authorized personnel only
          </p>
        </div>

        <Card className="shadow-2xl border-red-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-red-700">
              {step === 1 ? 'Security Verification' : 'Create Admin Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 
                ? 'Enter the secret authorization code to proceed'
                : 'Create a new administrator account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 ? (
              <form onSubmit={validateSecretCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secret-code" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Secret Authorization Code
                  </Label>
                  <Input
                    id="secret-code"
                    type="password"
                    placeholder="Enter secret code..."
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    className="font-mono"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Access
                </Button>
              </form>
            ) : (
              <form onSubmit={createAdminAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="Enter admin full name"
                    value={adminData.fullName}
                    onChange={(e) => setAdminData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={adminData.email}
                    onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter secure password"
                    value={adminData.password}
                    onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-admin-password">Confirm Password</Label>
                  <Input
                    id="confirm-admin-password"
                    type="password"
                    placeholder="Confirm password"
                    value={adminData.confirmPassword}
                    onChange={(e) => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Create Admin Account
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Back to Normal Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}