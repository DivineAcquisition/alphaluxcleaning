import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ManualEntryData {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  service_type: string;
  bedrooms: string;
  bathrooms: string;
}

interface RecurringManualEntryFormProps {
  onSubmit: (data: ManualEntryData) => void;
}

export function RecurringManualEntryForm({ onSubmit }: RecurringManualEntryFormProps) {
  const [formData, setFormData] = useState<ManualEntryData>({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    service_type: 'standard',
    bedrooms: '2',
    bathrooms: '2',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof ManualEntryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Your Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="address_line1">Street Address *</Label>
          <Input
            id="address_line1"
            value={formData.address_line1}
            onChange={(e) => handleChange('address_line1', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="address_line2">Apt/Suite (Optional)</Label>
          <Input
            id="address_line2"
            value={formData.address_line2}
            onChange={(e) => handleChange('address_line2', e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              required
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="postal_code">ZIP Code *</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="service_type">Service Type *</Label>
            <Select value={formData.service_type} onValueChange={(value) => handleChange('service_type', value)}>
              <SelectTrigger id="service_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Cleaning</SelectItem>
                <SelectItem value="deep">Deep Cleaning</SelectItem>
                <SelectItem value="move-in-out">Move In/Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bedrooms">Bedrooms *</Label>
            <Select value={formData.bedrooms} onValueChange={(value) => handleChange('bedrooms', value)}>
              <SelectTrigger id="bedrooms">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bathrooms">Bathrooms *</Label>
            <Select value={formData.bathrooms} onValueChange={(value) => handleChange('bathrooms', value)}>
              <SelectTrigger id="bathrooms">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Continue to Frequency Selection
        </Button>
      </form>
    </Card>
  );
}
