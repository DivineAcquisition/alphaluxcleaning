import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubcontractorManagement, SubcontractorProfile } from '@/hooks/useSubcontractorManagement';
import { Search, MapPin, Star, Clock, Users, Briefcase } from 'lucide-react';

export default function TeamManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  
  const {
    subcontractors,
    loading,
    updateSubcontractorStatus
  } = useSubcontractorManagement();

  // Filter subcontractors
  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.phone.includes(searchTerm);
    
    const matchesActiveFilter = activeFilter === 'all' || 
                               (activeFilter === 'active' && sub.active) ||
                               (activeFilter === 'inactive' && !sub.active);
    
    return matchesSearch && matchesActiveFilter;
  });

  const formatRating = (rating: number) => rating?.toFixed(1) || '0.0';
  const formatReliability = (score: number) => `${score?.toFixed(0) || '100'}%`;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your cleaning team and track performance
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{subcontractors.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {subcontractors.filter(s => s.active).length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {formatRating(subcontractors.reduce((sum, s) => sum + (s.rating || 0), 0) / subcontractors.length)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="sf">San Francisco</SelectItem>
                <SelectItem value="oakland">Oakland</SelectItem>
                <SelectItem value="berkeley">Berkeley</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubcontractors.map((subcontractor) => (
          <Card 
            key={subcontractor.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => navigate(`/app/team/${subcontractor.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {subcontractor.full_name}
                </CardTitle>
                <Switch
                  checked={subcontractor.active}
                  onCheckedChange={(checked) => updateSubcontractorStatus(subcontractor.id, checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={subcontractor.active ? "default" : "secondary"}>
                  {subcontractor.active ? "Active" : "Inactive"}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-current text-amber-500" />
                  <span>{formatRating(subcontractor.rating || 0)}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reliability</span>
                </div>
                <div className="font-medium">
                  {formatReliability(subcontractor.reliability_score || 100)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Avg Duration</span>
                </div>
                <div className="font-medium">
                  {subcontractor.avg_duration_minutes || 120} min
                </div>
                
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Jobs Done</span>
                </div>
                <div className="font-medium">
                  {subcontractor.completed_jobs_count || 0}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Contact</p>
                <p className="text-sm font-medium">{subcontractor.email}</p>
                <p className="text-sm text-muted-foreground">{subcontractor.phone}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/team/${subcontractor.id}?tab=profile`);
                  }}
                >
                  View Profile
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/team/${subcontractor.id}?tab=assign`);
                  }}
                >
                  Assign Job
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSubcontractors.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first team member'}
            </p>
            <Button onClick={() => navigate('/subcontractor-application')}>
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}