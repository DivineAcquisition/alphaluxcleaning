
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Home, Calendar, Clock, DollarSign } from 'lucide-react';

interface BookingData {
  homeSize: string;
  frequency: string;
  addOns: string[];
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  specialInstructions: string;
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  nextDayFee: number;
  promoDiscount: number;
  totalPrice: number;
  paymentType: '25_percent_with_discount';
  customerName?: string;
  customerEmail?: string;
}

interface BookingSummaryCardProps {
  bookingData: Partial<BookingData>;
}

export function BookingSummaryCard({ bookingData }: BookingSummaryCardProps) {
  const {
    homeSize,
    frequency,
    addOns = [],
    serviceDate,
    serviceTime,
    address,
    contactNumber,
    customerName,
    customerEmail,
    basePrice = 0,
    addOnPrices = {},
    frequencyDiscount = 0,
    nextDayFee = 0,
    promoDiscount = 0,
    totalPrice = 0,
    paymentType
  } = bookingData;

  const addOnTotal = addOns.reduce((sum, addOn) => sum + (addOnPrices[addOn] || 0), 0);
  const subtotal = basePrice + addOnTotal + nextDayFee;
  const totalDiscounts = frequencyDiscount + promoDiscount;
  
  const nowDue = paymentType === '25_percent_with_discount' ? totalPrice * 0.25 : 0;
  const laterDue = paymentType === '25_percent_with_discount' ? totalPrice * 0.75 : totalPrice;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Details */}
        {(customerName || customerEmail || contactNumber) && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Customer Information</h4>
            {customerName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{customerName}</span>
              </div>
            )}
            {customerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customerEmail}</span>
              </div>
            )}
            {contactNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contactNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* Service Address */}
        {address && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Service Address</h4>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div>{address.street}</div>
                <div>{address.city}, {address.state} {address.zipCode}</div>
              </div>
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Service Details</h4>
          
          {homeSize && (
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>{homeSize} Home</span>
            </div>
          )}
          
          {frequency && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{frequency} Cleaning</span>
            </div>
          )}
          
          {serviceDate && serviceTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{serviceDate} at {serviceTime}</span>
            </div>
          )}
          
          {addOns.length > 0 && (
            <div className="text-sm">
              <div className="font-medium mb-1">Add-ons:</div>
              <ul className="list-disc list-inside text-muted-foreground pl-4">
                {addOns.map((addOn, index) => (
                  <li key={index}>{addOn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Breakdown
          </h4>
          
          <div className="space-y-1 text-sm">
            {basePrice > 0 && (
              <div className="flex justify-between">
                <span>Base cleaning service</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
            )}
            
            {addOnTotal > 0 && (
              <div className="flex justify-between">
                <span>Add-ons</span>
                <span>${addOnTotal.toFixed(2)}</span>
              </div>
            )}
            
            {nextDayFee > 0 && (
              <div className="flex justify-between">
                <span>Next-day service fee</span>
                <span>${nextDayFee.toFixed(2)}</span>
              </div>
            )}
            
            {subtotal > 0 && (
              <>
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total discounts</span>
                    <span>-${totalDiscounts.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </>
            )}
            
            {paymentType === '25_percent_with_discount' && (
              <>
                <Separator />
                <div className="space-y-1 text-sm bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between font-medium">
                    <span>Due now (20%)</span>
                    <span>${(totalPrice * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Due after service</span>
                    <span>${(totalPrice * 0.8).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
