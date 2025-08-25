import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, MapPin, Home, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerIntakeProps {
  customerData: {
    customerName?: string;
    customerEmail?: string;
    contactNumber?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    bedrooms?: string;
    bathrooms?: string;
    dwellingType?: string;
    flooringType?: string;
    specialInstructions?: string;
  };
  onDataChange: (field: string, value: any) => void;
  visible?: boolean;
  errors?: Record<string, string>;
}

export function ModernCustomerIntake({ 
  customerData, 
  onDataChange, 
  visible = true,
  errors = {}
}: CustomerIntakeProps) {
  if (!visible) return null;

  const handleAddressChange = (field: string, value: string) => {
    onDataChange('address', {
      ...customerData.address,
      [field]: value
    });
  };

  const hasError = (field: string) => Boolean(errors[field]);
  const getError = (field: string) => errors[field];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Contact Information */}
      <Card className="border-2 border-muted/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
          <p className="text-muted-foreground">We'll use this to coordinate your service</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Enter your full name"
                value={customerData.customerName || ''}
                onChange={(e) => onDataChange('customerName', e.target.value)}
                className={cn(hasError('customerName') && "border-destructive focus-visible:ring-destructive")}
              />
              {hasError('customerName') && (
                <p className="text-sm text-destructive">{getError('customerName')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="your.email@example.com"
                value={customerData.customerEmail || ''}
                onChange={(e) => onDataChange('customerEmail', e.target.value)}
                className={cn(hasError('customerEmail') && "border-destructive focus-visible:ring-destructive")}
              />
              {hasError('customerEmail') && (
                <p className="text-sm text-destructive">{getError('customerEmail')}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="contactNumber"
              type="tel"
              placeholder="(555) 123-4567"
              value={customerData.contactNumber || ''}
              onChange={(e) => onDataChange('contactNumber', e.target.value)}
              className={cn(hasError('contactNumber') && "border-destructive focus-visible:ring-destructive")}
            />
            {hasError('contactNumber') && (
              <p className="text-sm text-destructive">{getError('contactNumber')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Address */}
      <Card className="border-2 border-muted/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Service Address
          </CardTitle>
          <p className="text-muted-foreground">Where should we provide the cleaning service?</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Street Address *
            </Label>
            <Input
              id="street"
              type="text"
              placeholder="123 Main Street, Apt 4B"
              value={customerData.address?.street || ''}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className={cn(hasError('address.street') && "border-destructive focus-visible:ring-destructive")}
            />
            {hasError('address.street') && (
              <p className="text-sm text-destructive">{getError('address.street')}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="San Francisco"
                value={customerData.address?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className={cn(hasError('address.city') && "border-destructive focus-visible:ring-destructive")}
              />
              {hasError('address.city') && (
                <p className="text-sm text-destructive">{getError('address.city')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={customerData.address?.state || 'CA'}
                onValueChange={(value) => handleAddressChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">California</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                type="text"
                placeholder="94105"
                value={customerData.address?.zipCode || ''}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className={cn(hasError('address.zipCode') && "border-destructive focus-visible:ring-destructive")}
              />
              {hasError('address.zipCode') && (
                <p className="text-sm text-destructive">{getError('address.zipCode')}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card className="border-2 border-muted/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Home className="h-5 w-5 text-primary" />
            Property Details
          </CardTitle>
          <p className="text-muted-foreground">Help us prepare for your cleaning service</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Number of Bedrooms *</Label>
              <Select
                value={customerData.bedrooms || ''}
                onValueChange={(value) => onDataChange('bedrooms', value)}
              >
                <SelectTrigger className={cn(hasError('bedrooms') && "border-destructive focus-visible:ring-destructive")}>
                  <SelectValue placeholder="Select bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Studio</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4 Bedrooms</SelectItem>
                  <SelectItem value="5">5+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
              {hasError('bedrooms') && (
                <p className="text-sm text-destructive">{getError('bedrooms')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Number of Bathrooms *</Label>
              <Select
                value={customerData.bathrooms || ''}
                onValueChange={(value) => onDataChange('bathrooms', value)}
              >
                <SelectTrigger className={cn(hasError('bathrooms') && "border-destructive focus-visible:ring-destructive")}>
                  <SelectValue placeholder="Select bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bathroom</SelectItem>
                  <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                  <SelectItem value="2">2 Bathrooms</SelectItem>
                  <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                  <SelectItem value="3">3 Bathrooms</SelectItem>
                  <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
                  <SelectItem value="4">4+ Bathrooms</SelectItem>
                </SelectContent>
              </Select>
              {hasError('bathrooms') && (
                <p className="text-sm text-destructive">{getError('bathrooms')}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dwellingType">Property Type *</Label>
              <Select
                value={customerData.dwellingType || ''}
                onValueChange={(value) => onDataChange('dwellingType', value)}
              >
                <SelectTrigger className={cn(hasError('dwellingType') && "border-destructive focus-visible:ring-destructive")}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="single-family">Single Family Home</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {hasError('dwellingType') && (
                <p className="text-sm text-destructive">{getError('dwellingType')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flooringType">Primary Flooring</Label>
              <Select
                value={customerData.flooringType || ''}
                onValueChange={(value) => onDataChange('flooringType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flooring type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardwood">Hardwood</SelectItem>
                  <SelectItem value="laminate">Laminate</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="carpet">Carpet</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialInstructions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Special Instructions
            </Label>
            <Textarea
              id="specialInstructions"
              placeholder="Any special instructions, access codes, pet information, or areas that need extra attention..."
              value={customerData.specialInstructions || ''}
              onChange={(e) => onDataChange('specialInstructions', e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Let us know about pets, security codes, or specific cleaning preferences
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}