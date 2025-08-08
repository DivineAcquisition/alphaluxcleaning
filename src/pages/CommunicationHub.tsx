import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Phone,
  Mail,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Message {
  id: string;
  subject?: string;
  message: string;
  message_type: string;
  status: string;
  priority: string;
  created_at: string;
  read_at?: string;
  sender_id: string;
  recipient_id?: string;
  company_id?: string;
  attachments?: any;
}

interface MessageThread {
  id: string;
  participants: string[];
  subject: string;
  last_message: string;
  last_activity: string;
  unread_count: number;
  messages: Message[];
}

interface CommunicationStats {
  totalMessages: number;
  unreadMessages: number;
  activeThreads: number;
  responseRate: number;
}

export default function CommunicationHub() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messagePriority, setMessagePriority] = useState("normal");

  useEffect(() => {
    fetchCommunicationData();
  }, []);

  const fetchCommunicationData = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
      calculateStats(messagesData || []);
    } catch (error) {
      console.error('Error fetching communication data:', error);
      toast.error('Failed to load communication data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (messagesData: Message[]) => {
    const totalMessages = messagesData.length;
    const unreadMessages = messagesData.filter(m => m.status === 'unread').length;
    const activeThreads = new Set(messagesData.map(m => m.subject || 'general')).size;
    const readMessages = messagesData.filter(m => m.status === 'read').length;
    const responseRate = totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0;

    setStats({
      totalMessages,
      unreadMessages,
      activeThreads,
      responseRate
    });
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || selectedRecipients.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error("Not authenticated");
        return;
      }

      // Send message to each selected recipient
      const messagePromises = selectedRecipients.map(recipientId =>
        supabase.from('messages').insert({
          sender_id: currentUser.data.user!.id,
          recipient_id: recipientId,
          subject: messageSubject || 'Admin Message',
          message: messageContent,
          message_type: 'admin_broadcast',
          priority: messagePriority,
          status: 'unread'
        })
      );

      await Promise.all(messagePromises);

      // Reset form
      setMessageSubject("");
      setMessageContent("");
      setSelectedRecipients([]);
      setMessagePriority("normal");
      setShowNewMessageDialog(false);
      
      fetchCommunicationData();
      toast.success(`Message sent to ${selectedRecipients.length} recipients`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "all" || message.message_type === filterType;
    const matchesStatus = filterStatus === "all" || message.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unread': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Communication Hub" description="Loading communication data...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Communication Hub" 
      description="Manage communications between customers and subcontractors"
    >
      <div className="space-y-6">
        {/* Communication Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">All messages sent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.unreadMessages}
                </div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Threads</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeThreads}
                </div>
                <p className="text-xs text-muted-foreground">Ongoing conversations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.responseRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Messages read</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Communication Center</CardTitle>
                <CardDescription>Manage all communications and send messages</CardDescription>
              </div>
              <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send New Message</DialogTitle>
                    <DialogDescription>
                      Compose and send a message to selected recipients
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipients">Recipients</Label>
                      <div className="text-sm text-muted-foreground mb-2">
                        Select message recipients (for demo purposes, showing placeholder options)
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {['all_subcontractors', 'all_customers', 'management_team'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={option}
                              checked={selectedRecipients.includes(option)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRecipients(prev => [...prev, option]);
                                } else {
                                  setSelectedRecipients(prev => prev.filter(id => id !== option));
                                }
                              }}
                            />
                            <Label htmlFor={option} className="text-sm capitalize">
                              {option.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Message subject..."
                          value={messageSubject}
                          onChange={(e) => setMessageSubject(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={messagePriority} onValueChange={setMessagePriority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Type your message here..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search messages..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="admin_broadcast">Admin Broadcast</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              {filteredMessages.length} messages found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(message.status)}
                      <div>
                        <h3 className="font-medium">{message.subject || 'No Subject'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {message.message_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                      <Badge variant={message.status === 'read' ? 'default' : 'secondary'}>
                        {message.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm">{message.message}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      <p>Sent: {new Date(message.created_at).toLocaleString()}</p>
                      {message.read_at && (
                        <p>Read: {new Date(message.read_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No messages found</p>
                  <p className="text-sm">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}