import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, 
  UserX, 
  MessageSquare, 
  Ban, 
  Download, 
  Mail,
  Shield,
  ShieldOff,
  Key
} from 'lucide-react';

interface BulkActionsPanelProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAvailabilityUpdate: (available: boolean) => void;
  onBulkSuspend: (reason: string, endDate?: Date) => void;
  onBulkUnsuspend: () => void;
  onBulkBan: (reason: string) => void;
  onBulkEmail: (subject: string, message: string) => void;
  onBulkExport: () => void;
  onBulkPasswordReset: () => void;
}

export function BulkActionsPanel({
  selectedCount,
  onClearSelection,
  onBulkAvailabilityUpdate,
  onBulkSuspend,
  onBulkUnsuspend,
  onBulkBan,
  onBulkEmail,
  onBulkExport,
  onBulkPasswordReset
}: BulkActionsPanelProps) {
  const [emailDialog, setEmailDialog] = useState(false);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendEndDate, setSuspendEndDate] = useState('');
  const [banReason, setBanReason] = useState('');

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailMessage.trim()) return;
    onBulkEmail(emailSubject, emailMessage);
    setEmailDialog(false);
    setEmailSubject('');
    setEmailMessage('');
  };

  const handleSuspend = () => {
    if (!suspendReason.trim()) return;
    const endDate = suspendEndDate ? new Date(suspendEndDate) : undefined;
    onBulkSuspend(suspendReason, endDate);
    setSuspendDialog(false);
    setSuspendReason('');
    setSuspendEndDate('');
  };

  const handleBan = () => {
    if (!banReason.trim()) return;
    onBulkBan(banReason);
    setBanDialog(false);
    setBanReason('');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedCount} selected</Badge>
            <span className="text-sm text-muted-foreground">subcontractors</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Availability Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAvailabilityUpdate(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Mark Available
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAvailabilityUpdate(false)}
            >
              <UserX className="h-4 w-4 mr-2" />
              Mark Unavailable
            </Button>

            {/* Account Actions */}
            <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suspend Accounts</DialogTitle>
                  <DialogDescription>
                    Suspend {selectedCount} selected subcontractor accounts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="suspend-reason">Reason for Suspension</Label>
                    <Textarea
                      id="suspend-reason"
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Enter reason for suspension..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date (Optional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={suspendEndDate}
                      onChange={(e) => setSuspendEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSuspendDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSuspend} disabled={!suspendReason.trim()}>
                    Suspend Accounts
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkUnsuspend}
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Unsuspend
            </Button>

            <Dialog open={banDialog} onOpenChange={setBanDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Ban className="h-4 w-4 mr-2" />
                  Ban
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ban Accounts</DialogTitle>
                  <DialogDescription>
                    Permanently ban {selectedCount} selected subcontractor accounts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ban-reason">Reason for Ban</Label>
                    <Textarea
                      id="ban-reason"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Enter reason for permanent ban..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBanDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBan} 
                    disabled={!banReason.trim()}
                    variant="destructive"
                  >
                    Ban Accounts
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Communication Actions */}
            <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Bulk Email</DialogTitle>
                  <DialogDescription>
                    Send email to {selectedCount} selected subcontractors
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Email message..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEmailDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendEmail}
                    disabled={!emailSubject.trim() || !emailMessage.trim()}
                  >
                    Send Email
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkPasswordReset}
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Passwords
            </Button>

            {/* Data Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}