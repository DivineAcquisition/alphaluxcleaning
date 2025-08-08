import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, UserX, Star, Phone, Mail, Search } from "lucide-react";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SubcontractorManagement() {
  const { teamMembers: subcontractors, loading } = useTeamManagement();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredSubcontractors = subcontractors.filter(sub =>
    sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout 
        title="Subcontractor Management" 
        description="Manage your subcontractor network"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Subcontractor Management" 
      description="Manage your subcontractor network"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subcontractors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractors.length}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractors.filter(s => s.is_available).length}</div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractors.length > 0 
                  ? (subcontractors.reduce((acc, s) => acc + s.rating, 0) / subcontractors.length).toFixed(1)
                  : "0.0"
                }
              </div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Subcontractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subcontractor List */}
        <Card>
          <CardHeader>
            <CardTitle>Subcontractor Directory</CardTitle>
            <CardDescription>
              View and manage all registered subcontractors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSubcontractors.map((contractor) => (
                <div key={contractor.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{contractor.full_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {contractor.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {contractor.phone}
                      </p>
                      {contractor.city && contractor.state && (
                        <p className="text-xs text-muted-foreground">
                          {contractor.city}, {contractor.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{contractor.rating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contractor.jobsCompleted} jobs completed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contractor.split_tier || 'Standard'} tier
                      </p>
                    </div>
                    <Badge variant={contractor.is_available ? "default" : "secondary"}>
                      {contractor.is_available ? "active" : "inactive"}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/subcontractor-detail/${contractor.id}`)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
              {filteredSubcontractors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No subcontractors found matching your search.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}