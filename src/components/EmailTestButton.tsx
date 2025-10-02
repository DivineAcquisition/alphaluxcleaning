import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export const EmailTestButton = () => {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { testEmail }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Test Email Sent!",
          description: `Email sent successfully to ${testEmail}`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      toast({
        title: "Email Test Failed",
        description: error.message || 'Failed to send test email',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center p-4 bg-muted rounded-lg">
      <Input
        type="email"
        placeholder="test@example.com"
        value={testEmail}
        onChange={(e) => setTestEmail(e.target.value)}
        className="flex-1"
      />
      <Button 
        onClick={handleTestEmail} 
        disabled={loading}
        variant="outline"
      >
        {loading ? (
          <>
            <Mail className="mr-2 h-4 w-4 animate-pulse" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Test Email
          </>
        )}
      </Button>
    </div>
  );
};