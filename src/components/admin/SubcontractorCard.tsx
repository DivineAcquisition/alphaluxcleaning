import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Mail, 
  Phone, 
  Star, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Settings, 
  Shield,
  ShieldOff,
  Ban,
  Key,
  MessageSquare
} from 'lucide-react';
import { EnhancedSubcontractor } from '@/hooks/useSubcontractorManagement';
import { useNavigate } from 'react-router-dom';

interface SubcontractorCardProps {
  contractor: EnhancedSubcontractor;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onUpdateAvailability: (id: string, available: boolean) => void;
  onSuspend: (id: string) => void;
  onUnsuspend: (id: string) => void;
  onBan: (id: string) => void;
  onPasswordReset: (id: string) => void;
  onSendEmail: (id: string) => void;
}

export function SubcontractorCard({
  contractor,
  isSelected,
  onSelect,
  onUpdateAvailability,
  onSuspend,
  onUnsuspend,
  onBan,
  onPasswordReset,
  onSendEmail
}: SubcontractorCardProps) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    if (contractor.account_status === 'banned') {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (contractor.account_status === 'suspended') {
      return <Badge variant="secondary">Suspended</Badge>;
    }
    return (
      <Badge variant={contractor.is_available ? "default" : "secondary"}>
        {contractor.is_available ? "Available" : "Unavailable"}
      </Badge>
    );
  };

  const getAccountStatusColor = () => {
    switch (contractor.account_status) {
      case 'banned': return 'text-red-500';
      case 'suspended': return 'text-orange-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(contractor.id, checked as boolean)}
        />
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{contractor.full_name}</h3>
            <div className={`w-2 h-2 rounded-full ${getAccountStatusColor()}`} 
                 title={`Account Status: ${contractor.account_status}`} />
          </div>
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
            Tier {contractor.tier_level} ({contractor.split_tier || 'Standard'})
          </p>
        </div>
        
        {getStatusBadge()}
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/subcontractor-detail/${contractor.id}`)}
          >
            View Details
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Availability Actions */}
              <DropdownMenuItem
                onClick={() => onUpdateAvailability(contractor.id, !contractor.is_available)}
              >
                {contractor.is_available ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Mark Unavailable
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark Available
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Communication Actions */}
              <DropdownMenuItem onClick={() => onSendEmail(contractor.id)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Account Management Actions */}
              {contractor.account_status === 'active' && (
                <DropdownMenuItem onClick={() => onSuspend(contractor.id)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Suspend Account
                </DropdownMenuItem>
              )}
              
              {contractor.account_status === 'suspended' && (
                <DropdownMenuItem onClick={() => onUnsuspend(contractor.id)}>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Unsuspend Account
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => onPasswordReset(contractor.id)}>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Danger Zone */}
              {contractor.account_status !== 'banned' && (
                <DropdownMenuItem 
                  onClick={() => onBan(contractor.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban Account
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem
                onClick={() => navigate(`/subcontractor-detail/${contractor.id}`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}