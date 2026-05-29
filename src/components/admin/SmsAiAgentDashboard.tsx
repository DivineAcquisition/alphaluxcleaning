import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bot,
  MessageSquare,
  RefreshCw,
  Send,
  CheckCircle,
  Users,
  Target,
  Sparkles,
  Phone,
  UserCheck,
} from "lucide-react";

interface ConversationRow {
  id: string;
  ghl_contact_id: string;
  phone: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  conversion_status: string;
  agent_enabled: boolean;
  message_count: number;
  booking_id: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  updated_at: string;
}

interface FunnelStats {
  total: number;
  new: number;
  engaged: number;
  qualified: number;
  booked: number;
  opted_out: number;
  lost: number;
}

interface TranscriptMessage {
  role: string;
  content: string;
  at?: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  engaged: "bg-blue-100 text-blue-700",
  qualified: "bg-amber-100 text-amber-700",
  booked: "bg-emerald-100 text-emerald-700",
  opted_out: "bg-red-100 text-red-700",
  lost: "bg-gray-100 text-gray-500",
};

export const SmsAiAgentDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [stats, setStats] = useState<FunnelStats>({
    total: 0, new: 0, engaged: 0, qualified: 0, booked: 0, opted_out: 0, lost: 0,
  });

  // Outreach form
  const [outreachPhone, setOutreachPhone] = useState("");
  const [outreachName, setOutreachName] = useState("");
  const [outreachEmail, setOutreachEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Transcript dialog
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("ghl-sms-ai-agent", {
        body: { action: "list_conversations", limit: 100 },
      });
      if (error) throw error;
      setConversations(data?.conversations || []);
      if (data?.stats) setStats(data.stats);
    } catch (err) {
      console.error("Failed to load AI SMS conversations:", err);
      toast.error("Could not load AI SMS conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const startOutreach = async () => {
    if (!outreachPhone && !outreachEmail) {
      toast.error("Enter a phone number or email to start outreach");
      return;
    }
    try {
      setSending(true);
      const [firstName, ...rest] = outreachName.trim().split(" ");
      const { data, error } = await supabase.functions.invoke("ghl-sms-ai-agent", {
        body: {
          action: "outreach",
          phone: outreachPhone || undefined,
          email: outreachEmail || undefined,
          firstName: firstName || undefined,
          lastName: rest.join(" ") || undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Outreach SMS sent — the AI agent will take it from here");
        setOutreachPhone("");
        setOutreachName("");
        setOutreachEmail("");
        fetchConversations();
      } else {
        toast.error(data?.error || "Failed to send outreach");
      }
    } catch (err) {
      console.error("Outreach failed:", err);
      toast.error("Failed to start outreach");
    } finally {
      setSending(false);
    }
  };

  const openTranscript = async (contactId: string) => {
    setActiveContact(contactId);
    setTranscript([]);
    setTranscriptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ghl-sms-ai-agent", {
        body: { action: "get_conversation", contactId },
      });
      if (error) throw error;
      setTranscript(data?.conversation?.messages || []);
    } catch (err) {
      console.error("Failed to load transcript:", err);
      toast.error("Could not load transcript");
    } finally {
      setTranscriptLoading(false);
    }
  };

  const toggleAgent = async (contactId: string, enabled: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.ghl_contact_id === contactId ? { ...c, agent_enabled: enabled } : c)),
    );
    try {
      const { error } = await supabase.functions.invoke("ghl-sms-ai-agent", {
        body: { action: "set_enabled", contactId, enabled },
      });
      if (error) throw error;
      toast.success(enabled ? "AI agent resumed" : "AI agent paused (human takeover)");
    } catch (err) {
      console.error("Failed to toggle agent:", err);
      toast.error("Could not update agent state");
      fetchConversations();
    }
  };

  const conversionRate = stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0;
  const displayName = (c: ConversationRow) =>
    [c.first_name, c.last_name].filter(Boolean).join(" ") || c.phone || c.email || "Unknown lead";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI SMS Conversion Agent
          </h2>
          <p className="text-muted-foreground">
            Conversational AI that texts leads through GoHighLevel and books them automatically.
          </p>
        </div>
        <Button onClick={fetchConversations} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Conversations" value={stats.total} icon={<MessageSquare className="h-7 w-7 text-blue-600" />} />
        <StatCard label="Engaged" value={stats.engaged} icon={<Users className="h-7 w-7 text-indigo-600" />} />
        <StatCard label="Qualified" value={stats.qualified} icon={<Target className="h-7 w-7 text-amber-600" />} />
        <StatCard label="Booked" value={stats.booked} icon={<CheckCircle className="h-7 w-7 text-emerald-600" />} />
        <StatCard label="Conversion" value={`${conversionRate}%`} icon={<Sparkles className="h-7 w-7 text-pink-600" />} />
        <StatCard label="Opted Out" value={stats.opted_out} icon={<Phone className="h-7 w-7 text-red-600" />} />
      </div>

      {/* Outreach launcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Start AI Outreach
          </CardTitle>
          <CardDescription>
            Drop in a lead's contact info and the AI agent will open the SMS conversation and work to book them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="outreach-phone">Phone</Label>
              <Input id="outreach-phone" placeholder="+15125551234" value={outreachPhone} onChange={(e) => setOutreachPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outreach-name">Name (optional)</Label>
              <Input id="outreach-name" placeholder="Jane Doe" value={outreachName} onChange={(e) => setOutreachName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outreach-email">Email (optional)</Label>
              <Input id="outreach-email" placeholder="jane@email.com" value={outreachEmail} onChange={(e) => setOutreachEmail(e.target.value)} />
            </div>
            <Button onClick={startOutreach} disabled={sending}>
              <Send className={`h-4 w-4 mr-2 ${sending ? "animate-pulse" : ""}`} />
              {sending ? "Sending..." : "Text Lead"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversations table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Conversations</CardTitle>
          <CardDescription>Every lead the AI agent is texting. Click a row to read the transcript.</CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No AI SMS conversations yet. Start one above or wait for an inbound text from GHL.
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 gap-4">
                  <button
                    type="button"
                    onClick={() => openTranscript(c.ghl_contact_id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate">{displayName(c)}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {c.phone || c.email || c.ghl_contact_id} · {c.message_count} msgs
                      {c.booking_id ? " · booked ✅" : ""}
                    </div>
                  </button>
                  <Badge className={STATUS_STYLES[c.conversion_status] || STATUS_STYLES.new}>
                    {c.conversion_status}
                  </Badge>
                  <div className="flex items-center gap-2 shrink-0">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <Switch
                      checked={c.agent_enabled}
                      onCheckedChange={(checked) => toggleAgent(c.ghl_contact_id, checked)}
                      aria-label="Toggle AI agent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript dialog */}
      <Dialog open={!!activeContact} onOpenChange={(open) => !open && setActiveContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conversation transcript</DialogTitle>
            <DialogDescription>SMS thread between the AI agent and the lead.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[420px] pr-3">
            {transcriptLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : transcript.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No messages yet.</div>
            ) : (
              <div className="space-y-3">
                {transcript.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "assistant" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "assistant"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                      {m.at && (
                        <div className={`text-[10px] mt-1 ${m.role === "assistant" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default SmsAiAgentDashboard;
