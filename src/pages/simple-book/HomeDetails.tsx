import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleProgressBar } from '@/components/booking/SimpleProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimpleBooking } from '@/contexts/SimpleBookingContext';
import { Home, ArrowRight } from 'lucide-react';

const HOME_SIZES = [
  { value: 'studio_1_bath', label: 'Studio / 1 bath' },
  { value: '1_bed_1_bath', label: '1 bed / 1 bath' },
  { value: '2_bed_2_bath', label: '2 bed / 2 bath' },
  { value: '3_bed_2_bath', label: '3 bed / 2 bath' },
  { value: 'custom', label: 'Custom / larger' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function HomeDetails() {
  const navigate = useNavigate();
  const { bookingData, updateHomeDetails } = useSimpleBooking();
  const [formData, setFormData] = useState(bookingData.homeDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.homeSize) newErrors.homeSize = 'Home size is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateHomeDetails(formData);
      navigate('/simple-book/choose-plan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SimpleProgressBar currentStep={1} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Let's Get Started
          </h1>
          <p className="text-lg text-muted-foreground">
            Tell us about your home and we'll show you our best offers
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className={errors.phone ? 'border-destructive' : ''}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Service Address</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={e => handleChange('addressLine1', e.target.value)}
                    className={errors.addressLine1 ? 'border-destructive' : ''}
                    placeholder="123 Main Street"
                  />
                  {errors.addressLine1 && <p className="text-sm text-destructive mt-1">{errors.addressLine1}</p>}
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={e => handleChange('addressLine2', e.target.value)}
                    placeholder="Apt, Suite, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleChange('city', e.target.value)}
                      className={errors.city ? 'border-destructive' : ''}
                      placeholder="Dallas"
                    />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={value => handleChange('state', value)}>
                      <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={e => handleChange('zipCode', e.target.value)}
                      className={errors.zipCode ? 'border-destructive' : ''}
                      placeholder="75201"
                      maxLength={5}
                    />
                    {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Home Size */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Home Size</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="homeSize">Select your home size *</Label>
                  <Select value={formData.homeSize} onValueChange={value => handleChange('homeSize', value)}>
                    <SelectTrigger className={errors.homeSize ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Choose home size" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOME_SIZES.map(size => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.homeSize && <p className="text-sm text-destructive mt-1">{errors.homeSize}</p>}
                  {formData.homeSize === 'custom' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll confirm final pricing if your home is significantly larger than average.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sqFt">Square Footage (Optional)</Label>
                  <Input
                    id="sqFt"
                    type="number"
                    value={formData.sqFt}
                    onChange={e => handleChange('sqFt', e.target.value)}
                    placeholder="1,500"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleNext}
            className="w-full mt-8"
            size="lg"
          >
            Next: Choose Your Plan
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
