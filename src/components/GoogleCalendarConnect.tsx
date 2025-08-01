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

      // Use RPC call to check calendar tokens since table might not be in types yet
      const { data, error } = await supabase.rpc('get_user_calendar_token', {
        p_user_id: user.id,
        p_provider: 'google'
      });

      if (error) {
        console.error('Error checking calendar connection:', error);
        return;
      }

      if (data && data.length > 0) {
        setCalendarToken(data[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const initiateOAuthFlow = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-oauth-initiate', {
        body: { redirect_uri: `${window.location.origin}/oauth/callback` }
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
      // Use RPC call to disconnect calendar
      const { error } = await supabase.rpc('disconnect_calendar_token', {
        p_token_id: calendarToken.id
      });

      if (error) {
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