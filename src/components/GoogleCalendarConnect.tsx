import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface CalendarToken {
  id: string;
  provider: string;
  calendar_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function GoogleCalendarConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarToken, setCalendarToken] = useState<CalendarToken | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any active calendar tokens by calling our edge function
      const { data, error } = await supabase.functions.invoke('get-live-availability', {
        body: { 
          date: new Date().toISOString().split('T')[0], 
          check_connection_only: true 
        }
      });

      if (!error && data?.has_connection) {
        setIsConnected(true);
        setCalendarToken({ 
          id: 'temp', 
          provider: 'google', 
          calendar_id: null, 
          is_active: true, 
          created_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const initiateOAuthFlow = async () => {
    setIsLoading(true);
    try {
      // Store the current URL so we can return here after OAuth
      sessionStorage.setItem('calendar_oauth_return_url', window.location.pathname);
      
      const { data, error } = await supabase.functions.invoke('google-oauth-initiate', {
        body: { redirect_uri: `${window.location.origin}/calendar/oauth/callback` }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to initiate Google Calendar connection",
          variant: "destructive"
        });
        return;
      }

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!calendarToken) return;

    setIsLoading(true);
    try {
      // Call the OAuth callback function with disconnect action
      const { data, error } = await supabase.functions.invoke('google-oauth-callback', {
        body: { action: 'disconnect' }
      });

      if (error || !data?.success) {
        toast({
          title: "Error",
          description: "Failed to disconnect calendar",
          variant: "destructive"
        });
        return;
      }

      setIsConnected(false);
      setCalendarToken(null);
      toast({
        title: "Success",
        description: "Google Calendar disconnected successfully"
      });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect calendar",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to show your real availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Your calendar is connected and syncing automatically.
            </p>
            <Button
              variant="outline"
              onClick={disconnectCalendar}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <Badge variant="outline" className="border-orange-200 text-orange-700">
                Not Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to show live availability to your clients.
            </p>
            <Button
              onClick={initiateOAuthFlow}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}