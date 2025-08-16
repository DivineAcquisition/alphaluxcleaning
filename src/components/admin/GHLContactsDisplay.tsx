import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  TrendingUp,
  Eye,
  Filter,
  Activity
} from 'lucide-react';

interface GHLContact {
  id: string;
  contact_id: string;
  order_id?: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  pipeline_id?: string;
  stage_id?: string;
  lead_score: number;
  ghl_data: any;
  last_synced_at: string;
  created_at: string;
  orders?: {
    id: string;
    status: string;
    amount: number;
    service_details: any;
    scheduled_date: string;
  };
}

export const GHLContactsDisplay = () => {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<GHLContact | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      loadContacts(false);
    }, 120000);
    
    return () => clearInterval(interval);
  }, [searchTerm, filter]);

  const loadContacts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: {
          action: 'get_live_contacts',
          limit: 50,
          search: searchTerm,
          filter: filter
        }
      });

      if (error) throw error;

      if (data.success) {
        setContacts(data.result.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Error Loading Contacts",
        description: "Failed to load GHL contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncFromGHL = async () => {
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: {
          action: 'sync_contacts',
          limit: 100,
          offset: 0
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sync Complete",
          description: `Synced ${data.result.synced} contacts from GoHighLevel`,
        });
        loadContacts();
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync contacts from GoHighLevel.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const getLeadScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-100 text-red-800 border-red-200">Hot</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warm</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Cold</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const ContactDetailDialog = ({ contact }: { contact: GHLContact }) => (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {contact.customer_name}
        </DialogTitle>
        <DialogDescription>
          GHL Contact Details & Order History
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{contact.customer_email}</span>
            </div>
            {contact.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contact.customer_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>Lead Score: {contact.lead_score}</span>
              {getLeadScoreBadge(contact.lead_score)}
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>Last Synced: {new Date(contact.last_synced_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Info */}
        {contact.orders && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(contact.orders.status)}
              </div>
              <div className="flex items-center justify-between">
                <span>Amount:</span>
                <span className="font-semibold">${(contact.orders.amount / 100).toFixed(2)}</span>
              </div>
              {contact.orders.scheduled_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Scheduled: {new Date(contact.orders.scheduled_date).toLocaleDateString()}</span>
                </div>
              )}
              {contact.orders.service_details?.service_type && (
                <div className="flex items-center justify-between">
                  <span>Service:</span>
                  <Badge variant="outline">{contact.orders.service_details.service_type}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* GHL Data */}
        {contact.ghl_data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GoHighLevel Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                {JSON.stringify(contact.ghl_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GoHighLevel Contacts</h2>
          <p className="text-muted-foreground">Live customer data from your GHL integration</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadContacts()}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={syncFromGHL}
            disabled={syncing}
            size="sm"
          >
            <Activity className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from GHL'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="hot">Hot Leads (80+)</SelectItem>
            <SelectItem value="warm">Warm Leads (60-79)</SelectItem>
            <SelectItem value="cold">Cold Leads (0-59)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.lead_score >= 80).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-yellow-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Warm Leads</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.lead_score >= 60 && c.lead_score < 80).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">With Orders</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.orders).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contacts</CardTitle>
          <CardDescription>
            Customer contacts synced from GoHighLevel with order data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading contacts...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contacts found. Try syncing from GoHighLevel.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{contact.customer_name}</h3>
                        {getLeadScoreBadge(contact.lead_score)}
                        {contact.orders && getStatusBadge(contact.orders.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.customer_email}
                        </div>
                        {contact.customer_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.customer_phone}
                          </div>
                        )}
                        {contact.orders?.amount && (
                          <div className="font-medium text-primary">
                            ${(contact.orders.amount / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <ContactDetailDialog contact={contact} />
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};