import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ServiceRequest {
  id: string;
  request_type: string;
  status: string;
  request_data: any;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface ServiceRequestsDisplayProps {
  orderId: string;
}

export const ServiceRequestsDisplay = ({ orderId }: ServiceRequestsDisplayProps) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceRequests();
  }, [orderId]);

  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_service_requests' as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatRequestType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRequestDetails = (request: ServiceRequest) => {
    const { request_data } = request;
    
    switch (request.request_type) {
      case 'reschedule':
        return `New date: ${request_data.new_date} at ${request_data.new_time}`;
      case 'address_change':
        return `New address: ${request_data.new_address?.street}, ${request_data.new_address?.city}`;
      case 'contact_update':
        const updates = [];
        if (request_data.new_contact?.email) updates.push(`Email: ${request_data.new_contact.email}`);
        if (request_data.new_contact?.phone) updates.push(`Phone: ${request_data.new_contact.phone}`);
        if (request_data.new_contact?.name) updates.push(`Name: ${request_data.new_contact.name}`);
        return updates.join(', ');
      default:
        return 'Service request submitted';
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Service Requests
        </CardTitle>
        <CardDescription className="text-blue-50">
          Your submitted requests and their status
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className="font-medium">{formatRequestType(request.request_type)}</span>
                </div>
                <Badge className={`${getStatusColor(request.status)} text-xs`}>
                  {request.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {getRequestDetails(request)}
              </div>
              
              {request.customer_notes && (
                <div className="text-sm">
                  <span className="font-medium">Your notes:</span> {request.customer_notes}
                </div>
              )}
              
              {request.admin_notes && (
                <div className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                  <span className="font-medium text-blue-800">Staff response:</span>
                  <div className="text-blue-700">{request.admin_notes}</div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};