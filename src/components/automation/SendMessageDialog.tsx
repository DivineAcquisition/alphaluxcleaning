import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, X } from "lucide-react";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SendMessageDialog({ open, onOpenChange, onSuccess }: SendMessageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Array<{ email: string; name: string }>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customRecipient, setCustomRecipient] = useState('');
  const [formData, setFormData] = useState({
    type: 'email' as 'email' | 'sms',
    subject: '',
    content: '',
    send_immediately: true,
    scheduled_for: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_email, customer_name')
        .not('customer_email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Remove duplicates and format
      const uniqueCustomers = data.reduce((acc: Array<{ email: string; name: string }>, curr) => {
        if (!acc.find(c => c.email === curr.customer_email)) {
          acc.push({
            email: curr.customer_email,
            name: curr.customer_name || curr.customer_email
          });
        }
        return acc;
      }, []);

      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addCustomRecipient = () => {
    if (customRecipient && !selectedRecipients.includes(customRecipient)) {
      setSelectedRecipients(prev => [...prev, customRecipient]);
      setCustomRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setSelectedRecipients(prev => prev.filter(r => r !== email));
  };

  const selectAllCustomers = () => {
    const allEmails = customers.map(c => c.email);
    setSelectedRecipients(allEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || selectedRecipients.length === 0) {
      toast({
        title: "Error",
        description: "Please enter message content and select at least one recipient",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'email' && !formData.subject) {
      toast({
        title: "Error",
        description: "Please enter a subject for email messages",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-custom-message', {
        body: {
          ...formData,
          recipients: selectedRecipients
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: formData.send_immediately 
          ? `Message sent to ${data.summary?.sent || selectedRecipients.length} recipients`
          : `Message queued for ${selectedRecipients.length} recipients`
      });

      // Reset form
      setFormData({
        type: 'email',
        subject: '',
        content: '',
        send_immediately: true,
        scheduled_for: ''
      });
      setSelectedRecipients([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.type === 'email' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            Send Custom {formData.type === 'email' ? 'Email' : 'SMS'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Message Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'email' | 'sms') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'email' && (
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="content">Message Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your message content..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label>Recipients ({selectedRecipients.length} selected)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  placeholder="Enter email or phone number"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRecipient())}
                />
                <Button type="button" onClick={addCustomRecipient} variant="outline">
                  Add
                </Button>
                <Button type="button" onClick={selectAllCustomers} variant="outline">
                  All Customers
                </Button>
              </div>

              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded">
                  {selectedRecipients.map((recipient) => (
                    <Badge key={recipient} variant="secondary" className="flex items-center gap-1">
                      {recipient}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeRecipient(recipient)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="max-h-32 overflow-y-auto border rounded p-2">
                <div className="text-xs text-muted-foreground mb-2">Recent Customers:</div>
                {customers.map((customer) => (
                  <div 
                    key={customer.email}
                    className="flex items-center justify-between p-1 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      if (!selectedRecipients.includes(customer.email)) {
                        setSelectedRecipients(prev => [...prev, customer.email]);
                      }
                    }}
                  >
                    <span className="text-sm">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">{customer.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="send-immediately"
              checked={formData.send_immediately}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_immediately: checked }))}
            />
            <Label htmlFor="send-immediately">Send immediately</Label>
          </div>

          {!formData.send_immediately && (
            <div>
              <Label htmlFor="scheduled-for">Schedule for</Label>
              <Input
                id="scheduled-for"
                type="datetime-local"
                value={formData.scheduled_for}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : (formData.send_immediately ? 'Send Now' : 'Schedule')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}