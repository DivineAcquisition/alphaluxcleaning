import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  Eye,
  UserPlus,
  MessageCircle
} from 'lucide-react';
import { DashboardSubcontractor } from '@/hooks/useDashboardData';

interface SubcontractorsWorkboardProps {
  subcontractors: DashboardSubcontractor[];
  onAssignJob: (jobId: string) => void;
}

export function SubcontractorsWorkboard({ subcontractors, onAssignJob }: SubcontractorsWorkboardProps) {
  const [activeTab, setActiveTab] = useState('all');

  // Filter subcontractors by tab
  const allSubs = subcontractors;
  const availableToday = subcontractors.filter(sub => sub.status === 'available');
  const inFieldNow = subcontractors.filter(sub => sub.status === 'on_job');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'on_job':
        return <Badge className="bg-blue-100 text-blue-800">On Job</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Unavailable</Badge>;
      case 'time_off':
        return <Badge className="bg-orange-100 text-orange-800">Time Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 4.0) return 'text-blue-600 bg-blue-100';
    if (score >= 3.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const SubcontractorCard = ({ sub }: { sub: DashboardSubcontractor }) => {
    const initials = sub.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{sub.full_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(sub.status)}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getReliabilityColor(sub.reliability_score)}`}>
                    <Star className="w-3 h-3" />
                    {sub.reliability_score.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              {sub.phone}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {sub.areas_count} area{sub.areas_count !== 1 ? 's' : ''}
            </div>

            {sub.next_job_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Next: {sub.next_job_time}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Capacity left:</span>
              <span className={`font-medium ${sub.capacity_left > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {sub.capacity_left} job{sub.capacity_left !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              Profile
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onAssignJob('')}
              disabled={sub.capacity_left === 0}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">
        {type === 'all' && 'No subcontractors'}
        {type === 'available' && 'No one available today'}
        {type === 'field' && 'No one in the field'}
      </h3>
      <p className="text-muted-foreground mb-4">
        {type === 'all' && 'Add subcontractors to start managing your team'}
        {type === 'available' && 'All subcontractors are either busy or unavailable'}
        {type === 'field' && 'No active jobs in progress right now'}
      </p>
      {type === 'all' && (
        <Button variant="outline">
          Add Subcontractor
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Subcontractors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({allSubs.length})</TabsTrigger>
            <TabsTrigger value="available">Available ({availableToday.length})</TabsTrigger>
            <TabsTrigger value="field">In Field ({inFieldNow.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {allSubs.length === 0 ? (
              <EmptyState type="all" />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allSubs.map(sub => (
                  <SubcontractorCard key={sub.id} sub={sub} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="available" className="mt-4">
            {availableToday.length === 0 ? (
              <EmptyState type="available" />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableToday.map(sub => (
                  <SubcontractorCard key={sub.id} sub={sub} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="field" className="mt-4">
            {inFieldNow.length === 0 ? (
              <EmptyState type="field" />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {inFieldNow.map(sub => (
                  <SubcontractorCard key={sub.id} sub={sub} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}