import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Search, MessageCircle, Phone, Mail, Clock, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

export default function SupportPortal() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I reschedule my cleaning service?",
      answer: "You can reschedule your service up to 24 hours before the scheduled time through your customer dashboard or by calling our support team.",
      category: "Booking"
    },
    {
      question: "What cleaning supplies do you use?",
      answer: "We use eco-friendly, professional-grade cleaning products that are safe for families and pets.",
      category: "Service"
    },
    {
      question: "How do I update my payment method?",
      answer: "Go to your account settings and select 'Payment Methods' to add or update your billing information.",
      category: "Billing"
    }
  ];

  const tickets = [
    {
      id: "TICKET-001",
      title: "Service quality concern",
      status: "In Progress",
      priority: "High",
      created: "2 hours ago"
    },
    {
      id: "TICKET-002", 
      title: "Billing inquiry",
      status: "Resolved",
      priority: "Medium",
      created: "1 day ago"
    },
    {
      id: "TICKET-003",
      title: "Scheduling request",
      status: "Open",
      priority: "Low",
      created: "3 days ago"
    }
  ];

  return (
    <AdminLayout 
      title="Customer Support Portal" 
      description="24/7 AI-powered support with live chat and knowledge base"
    >
      {/* Support Options */}
      <AdminGrid columns="auto" gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-clean transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              AI Chatbot
            </CardTitle>
            <CardDescription>Get instant answers 24/7</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Start Chat</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-clean transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-success" />
              Live Support
            </CardTitle>
            <CardDescription>Speak with our team</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Call Now</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-clean transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-accent" />
              Email Support
            </CardTitle>
            <CardDescription>Send us a message</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Send Email</Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-clean transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-warning" />
              Knowledge Base
            </CardTitle>
            <CardDescription>Browse help articles</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Browse Articles</Button>
          </CardContent>
        </Card>
      </AdminGrid>

      {/* Knowledge Base Search */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>Search our comprehensive help center</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{faq.question}</h4>
                    <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                  </div>
                  <Badge variant="outline">{faq.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support Tickets */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Track your support requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-semibold">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground">{ticket.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={ticket.status === "Resolved" ? "default" : ticket.status === "In Progress" ? "secondary" : "outline"}
                      className="flex items-center gap-1"
                    >
                      {ticket.status === "Resolved" && <CheckCircle className="h-3 w-3" />}
                      {ticket.status === "In Progress" && <Clock className="h-3 w-3" />}
                      {ticket.status === "Open" && <AlertCircle className="h-3 w-3" />}
                      {ticket.status}
                    </Badge>
                    <Badge 
                      variant={ticket.priority === "High" ? "destructive" : ticket.priority === "Medium" ? "secondary" : "outline"}
                    >
                      {ticket.priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{ticket.created}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Button className="w-full" variant="outline">
              Create New Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}