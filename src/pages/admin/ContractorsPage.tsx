import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  Calendar,
  DollarSign,
  Eye,
  Edit
} from 'lucide-react';
import { useTeamManagement } from '@/hooks/useTeamManagement';

export default function ContractorsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { teamMembers, loading, searchTerm, setSearchTerm } = useTeamManagement();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 4: return 'Premium';
      case 3: return 'Elite';
      case 2: return 'Professional';
      case 1: return 'Standard';
      default: return 'Standard';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contractors</h1>
          <p className="text-muted-foreground">Manage contractor profiles and settings</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Contractor
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contractors by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Contractors ({teamMembers?.length || 0})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {teamMembers?.map((contractor) => (
              <Card key={contractor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Contractor Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{contractor.full_name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor('active')} text-white`}
                            >
                              {contractor.is_available ? 'Available' : 'Busy'}
                            </Badge>
                            <Badge variant="secondary">
                              Tier {contractor.tier_level || 1} - {getTierLabel(contractor.tier_level || 1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {contractor.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Location
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              {contractor.rating?.toFixed(1) || '0.0'} ({contractor.review_count || 0} reviews)
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {contractor.jobsCompleted} jobs completed
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Active contractors view coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Pending applications view coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="suspended">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Suspended contractors view coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}