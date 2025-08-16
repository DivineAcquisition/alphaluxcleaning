import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function TestSubcontractorButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [testUser, setTestUser] = useState<any>(null);

  const createTestUser = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-subcontractor', {
        body: {
          email: 'test-subcontractor@example.com',
          password: 'TestPassword123!',
          fullName: 'Test Subcontractor User',
          tier: '60_40'
        }
      });

      if (error) throw error;

      setTestUser(data);
      toast.success('Test subcontractor user created successfully!');
    } catch (error: any) {
      console.error('Error creating test user:', error);
      toast.error(error.message || 'Failed to create test user');
    } finally {
      setIsCreating(false);
    }
  };

  const copyCredentials = () => {
    if (testUser?.loginCredentials) {
      const credentials = `Email: ${testUser.loginCredentials.email}\nPassword: ${testUser.loginCredentials.password}`;
      navigator.clipboard.writeText(credentials);
      toast.success('Login credentials copied to clipboard!');
    }
  };

  if (testUser) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Test User Created!
          </CardTitle>
          <CardDescription>
            Use these credentials to sign in as a subcontractor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <p className="text-sm"><strong>Email:</strong> {testUser.loginCredentials.email}</p>
            <p className="text-sm"><strong>Password:</strong> {testUser.loginCredentials.password}</p>
          </div>
          <Button onClick={copyCredentials} variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy Credentials
          </Button>
          <Button onClick={() => window.location.href = '/auth'} className="w-full">
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button 
      onClick={createTestUser} 
      disabled={isCreating}
      className="flex items-center gap-2"
    >
      {isCreating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
          Creating...
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Create Test Subcontractor User
        </>
      )}
    </Button>
  );
}