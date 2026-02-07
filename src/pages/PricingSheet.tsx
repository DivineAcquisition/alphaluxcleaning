import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG, DEPOSIT_PERCENTAGE } from "@/lib/new-pricing-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatPrice = (price: number, multiplier: number = 1): string => {
  if (price === 0) return "Custom Quote";
  const adjusted = Math.round(price * multiplier);
  return `$${adjusted.toLocaleString()}`;
};

const PricingSheet = () => {
  const handlePrint = () => {
    window.print();
  };

  const states = DEFAULT_PRICING_CONFIG.states;
  const frequencies = DEFAULT_PRICING_CONFIG.frequencies;
  
  // Filter out the last tier (5000+ sqft) for separate handling
  const standardTiers = HOME_SIZE_RANGES.filter(range => !range.requiresEstimate);
  const customTier = HOME_SIZE_RANGES.find(range => range.requiresEstimate);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Print Button - Hidden when printing */}
        <div className="print:hidden mb-6 flex justify-end">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Pricing Sheet
          </Button>
        </div>

        {/* Printable Content */}
        <div className="bg-white p-12 rounded-lg shadow-sm print:shadow-none print:p-6">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-primary">
            <h1 className="text-4xl font-bold text-primary mb-2">ALPHA LUX CLEAN</h1>
            <p className="text-xl text-muted-foreground">Professional Cleaning Services — Pricing Guide</p>
            <p className="text-sm text-muted-foreground mt-2">📞 (972) 559-0223 | 🌐 alphaluxclean.com | ✉️ support@alphaluxclean.com</p>
          </div>

          {/* State Pricing Tables */}
          {states.map((state) => (
            <section key={state.code} className="mb-8 page-break-inside-avoid">
              <h2 className="text-xl font-bold text-primary mb-3 border-b border-accent pb-2">
                {state.name} Pricing {state.multiplier > 1 && `(+${Math.round((state.multiplier - 1) * 100)}%)`}
              </h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">Home Size</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">Deep Clean</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">Maintenance</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">90-Day Plan</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">Move-In/Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standardTiers.map((tier, index) => (
                      <TableRow key={tier.id} className={index % 2 === 1 ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium">
                          <div>{tier.label}</div>
                          <div className="text-xs text-muted-foreground">{tier.bedroomRange}</div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatPrice(tier.deepPrice, state.multiplier)}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatPrice(tier.maintenancePrice, state.multiplier)}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-primary">
                          {formatPrice(tier.ninetyDayPrice, state.multiplier)}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatPrice(tier.moveInOutPrice, state.multiplier)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {customTier && (
                      <TableRow className="bg-accent/20">
                        <TableCell className="font-medium">
                          <div>{customTier.label}</div>
                          <div className="text-xs text-muted-foreground">{customTier.bedroomRange}</div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-muted-foreground" colSpan={4}>
                          Call for Custom Quote — (972) 559-0223
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}

          {/* Two Column Layout: Discounts + Service Descriptions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 page-break-inside-avoid">
            {/* Recurring Discounts */}
            <section>
              <h2 className="text-lg font-bold text-primary mb-3 border-b border-accent pb-2">Recurring Service Discounts</h2>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Frequency</TableHead>
                    <TableHead className="font-bold text-right">Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frequencies.map((freq) => (
                    <TableRow key={freq.id}>
                      <TableCell className="font-medium">
                        {freq.name}
                        {freq.cleansPerMonth && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({freq.cleansPerMonth}×/mo)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {freq.id === 'one_time' 
                          ? '$50 flat' 
                          : `${Math.round((freq.discount || 0) * 100)}% off`
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            {/* Service Descriptions */}
            <section>
              <h2 className="text-lg font-bold text-primary mb-3 border-b border-accent pb-2">Service Descriptions</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-semibold text-primary">🧹 Tester Deep Clean</h3>
                  <p className="text-muted-foreground">Initial deep cleaning, 4-hour service, 40-point checklist</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">✨ Standard Maintenance</h3>
                  <p className="text-muted-foreground">Regular upkeep cleaning, 2-hour service</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">📅 90-Day Reset Plan</h3>
                  <p className="text-muted-foreground">1 deep clean + 3 maintenance visits, bundled savings</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">🏠 Move-In/Out Clean</h3>
                  <p className="text-muted-foreground">Comprehensive top-to-bottom clean for moving</p>
                </div>
              </div>
            </section>
          </div>

          {/* Payment Structure */}
          <section className="mb-8 page-break-inside-avoid">
            <h2 className="text-lg font-bold text-primary mb-3 border-b border-accent pb-2">Payment Structure</h2>
            
            <div className="bg-muted/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">💳</span>
                <div>
                  <h3 className="font-semibold text-primary">Standard & Deep Clean</h3>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(DEPOSIT_PERCENTAGE * 100)}% deposit at booking • {Math.round((1 - DEPOSIT_PERCENTAGE) * 100)}% balance invoiced after service
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-lg">📆</span>
                <div>
                  <h3 className="font-semibold text-primary">90-Day Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Starter deposit at booking • Balance split into 3 convenient monthly payments
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Reference - Deposit Examples */}
          <section className="mb-8 page-break-inside-avoid">
            <h2 className="text-lg font-bold text-primary mb-3 border-b border-accent pb-2">Quick Reference — Deposit Examples (Texas)</h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Home Size</TableHead>
                  <TableHead className="font-bold text-center">Deep Clean</TableHead>
                  <TableHead className="font-bold text-center">Deposit (25%)</TableHead>
                  <TableHead className="font-bold text-center">90-Day Plan</TableHead>
                  <TableHead className="font-bold text-center">Deposit (25%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standardTiers.slice(0, 4).map((tier, index) => (
                  <TableRow key={tier.id} className={index % 2 === 1 ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium">{tier.label}</TableCell>
                    <TableCell className="text-center">${tier.deepPrice}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      ${Math.round(tier.deepPrice * DEPOSIT_PERCENTAGE)}
                    </TableCell>
                    <TableCell className="text-center">${tier.ninetyDayPrice}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      ${Math.round(tier.ninetyDayPrice * DEPOSIT_PERCENTAGE)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Footer */}
          <div className="text-center pt-6 border-t-2 border-primary">
            <p className="text-sm text-muted-foreground mb-2">For questions or custom quotes, contact us:</p>
            <p className="text-lg font-bold text-primary">📞 (972) 559-0223 | ✉️ support@alphaluxclean.com</p>
            <p className="text-xs text-muted-foreground mt-3">
              Prices effective as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. 
              Subject to change. All services include a professional 2-person cleaning crew.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            margin: 0.4in;
            size: letter;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .page-break-inside-avoid {
            break-inside: avoid;
          }
          
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default PricingSheet;
