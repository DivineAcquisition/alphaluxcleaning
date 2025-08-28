import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, ArrowRight, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailPortalAccessProps {
  onSearchSubmit: (searchType: 'email' | 'order_id', value: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function EmailPortalAccess({ onSearchSubmit, loading = false, error }: EmailPortalAccessProps) {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'order_id'>('email');
  const [isValidInput, setIsValidInput] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateOrderId = (id: string) => {
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidInput(validateEmail(newEmail));
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOrderId = e.target.value;
    setOrderId(newOrderId);
    setIsValidInput(validateOrderId(newOrderId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidInput && !loading) {
      const value = searchType === 'email' ? email : orderId;
      onSearchSubmit(searchType, value);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchType(value as 'email' | 'order_id');
    setIsValidInput(false);
    setEmail('');
    setOrderId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Track Your Order</CardTitle>
          <CardDescription>
            Enter your email address or Order ID to view your cleaning services and account information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={searchType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="order_id" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Order ID
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <TabsContent value="email" className="space-y-2 mt-0">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                {email && !isValidInput && searchType === 'email' && (
                  <p className="text-sm text-destructive">Please enter a valid email address</p>
                )}
              </TabsContent>

              <TabsContent value="order_id" className="space-y-2 mt-0">
                <Label htmlFor="orderId">Order ID</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="e.g., 12345678-1234-1234-1234-123456789abc"
                    value={orderId}
                    onChange={handleOrderIdChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                {orderId && !isValidInput && searchType === 'order_id' && (
                  <p className="text-sm text-destructive">Please enter a valid Order ID</p>
                )}
              </TabsContent>

              <Button 
                type="submit" 
                disabled={!isValidInput || loading} 
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Checking...' : 'View Orders'}
              </Button>
            </form>
          </Tabs>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Secure Access</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ No password required</p>
              <p>✓ Instant access to your services</p>
              <p>✓ Secure and private</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Can't find your services? Contact us at{' '}
                <a href="mailto:support@bayareacleaningpros.com" className="text-primary hover:underline">
                  support@bayareacleaningpros.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}