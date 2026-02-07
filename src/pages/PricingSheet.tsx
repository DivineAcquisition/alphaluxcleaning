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

const formatRecurringPrice = (basePrice: number, discount: number, multiplier: number = 1): string => {
  if (basePrice === 0) return "Custom";
  const discounted = Math.round(basePrice * (1 - discount) * multiplier);
  return `$${discounted}`;
};

const formatMonthlyTotal = (basePrice: number, discount: number, cleansPerMonth: number, multiplier: number = 1): string => {
  if (basePrice === 0) return "—";
  const discounted = Math.round(basePrice * (1 - discount) * multiplier);
  const monthly = discounted * cleansPerMonth;
  return `$${monthly}/mo`;
};

const PricingSheet = () => {
  const handlePrint = () => {
    window.print();
  };

  const states = DEFAULT_PRICING_CONFIG.states;
  const frequencies = DEFAULT_PRICING_CONFIG.frequencies.filter(f => f.id !== 'one_time');
  
  // Filter out the last tier (5000+ sqft) for separate handling
  const standardTiers = HOME_SIZE_RANGES.filter(range => !range.requiresEstimate);
  const customTier = HOME_SIZE_RANGES.find(range => range.requiresEstimate);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
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

          {/* State Pricing Tables - One-Time Services */}
          {states.map((state) => (
            <section key={state.code} className="mb-8 page-break-inside-avoid">
              <h2 className="text-xl font-bold text-primary mb-3 border-b border-accent pb-2">
                {state.name} — One-Time Service Pricing {state.multiplier > 1 && `(+${Math.round((state.multiplier - 1) * 100)}%)`}
              </h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">Home Size</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">Deep Clean</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">Maintenance</TableHead>
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
                        <TableCell className="text-center font-semibold text-muted-foreground" colSpan={3}>
                          Call for Custom Quote — (972) 559-0223
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}

          {/* Recurring Maintenance Pricing Tables */}
          <div className="page-break-before mt-10">
            <h2 className="text-2xl font-bold text-primary mb-4 text-center border-b-2 border-primary pb-3">
              Recurring Maintenance Pricing
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Save up to 15% with recurring service plans. Prices shown are per clean with monthly totals.
            </p>

            {states.map((state) => (
              <section key={`recurring-${state.code}`} className="mb-8 page-break-inside-avoid">
                <h3 className="text-lg font-bold text-primary mb-3 border-b border-accent pb-2">
                  {state.name} — Recurring Rates {state.multiplier > 1 && `(+${Math.round((state.multiplier - 1) * 100)}%)`}
                </h3>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        <TableHead className="text-primary-foreground font-bold">Home Size</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center">
                          <div>Weekly</div>
                          <div className="text-xs font-normal opacity-90">15% off • 4×/mo</div>
                        </TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center">
                          <div>Bi-Weekly</div>
                          <div className="text-xs font-normal opacity-90">10% off • 2×/mo</div>
                        </TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center">
                          <div>Monthly</div>
                          <div className="text-xs font-normal opacity-90">5% off • 1×/mo</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standardTiers.map((tier, index) => (
                        <TableRow key={tier.id} className={index % 2 === 1 ? "bg-muted/30" : ""}>
                          <TableCell className="font-medium">
                            <div>{tier.label}</div>
                            <div className="text-xs text-muted-foreground">{tier.bedroomRange}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-semibold text-primary">
                              {formatRecurringPrice(tier.maintenancePrice, 0.15, state.multiplier)}/clean
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatMonthlyTotal(tier.maintenancePrice, 0.15, 4, state.multiplier)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-semibold text-primary">
                              {formatRecurringPrice(tier.maintenancePrice, 0.10, state.multiplier)}/clean
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatMonthlyTotal(tier.maintenancePrice, 0.10, 2, state.multiplier)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-semibold text-primary">
                              {formatRecurringPrice(tier.maintenancePrice, 0.05, state.multiplier)}/clean
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatMonthlyTotal(tier.maintenancePrice, 0.05, 1, state.multiplier)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {customTier && (
                        <TableRow className="bg-accent/20">
                          <TableCell className="font-medium">
                            <div>{customTier.label}</div>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-muted-foreground" colSpan={3}>
                            Call for Custom Quote — (972) 559-0223
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ))}
          </div>

          {/* Two Column Layout: Discounts + Service Descriptions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 page-break-inside-avoid">
            {/* Recurring Discounts Summary */}
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
                  <TableRow>
                    <TableCell className="font-medium">
                      Weekly <span className="text-xs text-muted-foreground ml-1">(4×/mo)</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">15% off</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Bi-Weekly <span className="text-xs text-muted-foreground ml-1">(2×/mo)</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">10% off</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Monthly <span className="text-xs text-muted-foreground ml-1">(1×/mo)</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">5% off</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">One-Time</TableCell>
                    <TableCell className="text-right font-semibold">$50 flat discount</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>

            {/* Service Descriptions */}
            <section>
              <h2 className="text-lg font-bold text-primary mb-3 border-b border-accent pb-2">Service Descriptions</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-semibold text-primary">🧹 Deep Clean (Tester)</h3>
                  <p className="text-muted-foreground">Initial deep cleaning, 4-hour service, 40-point checklist</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">✨ Standard Maintenance</h3>
                  <p className="text-muted-foreground">Regular upkeep cleaning, 2-hour service, ideal for recurring</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">🏠 Move-In/Out Clean</h3>
                  <p className="text-muted-foreground">Comprehensive top-to-bottom clean for moving</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">🔄 Recurring Service</h3>
                  <p className="text-muted-foreground">Scheduled maintenance at weekly, bi-weekly, or monthly intervals</p>
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
                  <h3 className="font-semibold text-primary">All Services</h3>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(DEPOSIT_PERCENTAGE * 100)}% deposit at booking • {Math.round((1 - DEPOSIT_PERCENTAGE) * 100)}% balance invoiced after service
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-lg">🔄</span>
                <div>
                  <h3 className="font-semibold text-primary">Recurring Services</h3>
                  <p className="text-sm text-muted-foreground">
                    Same deposit structure per visit • Automatic scheduling • Cancel or pause anytime
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
                  <TableHead className="font-bold text-center">Bi-Weekly</TableHead>
                  <TableHead className="font-bold text-center">Deposit (25%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standardTiers.slice(0, 4).map((tier, index) => {
                  const biWeeklyPrice = Math.round(tier.maintenancePrice * 0.90);
                  return (
                    <TableRow key={tier.id} className={index % 2 === 1 ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium">{tier.label}</TableCell>
                      <TableCell className="text-center">${tier.deepPrice}</TableCell>
                      <TableCell className="text-center font-semibold text-primary">
                        ${Math.round(tier.deepPrice * DEPOSIT_PERCENTAGE)}
                      </TableCell>
                      <TableCell className="text-center">${biWeeklyPrice}/clean</TableCell>
                      <TableCell className="text-center font-semibold text-primary">
                        ${Math.round(biWeeklyPrice * DEPOSIT_PERCENTAGE)}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
          
          .page-break-before {
            break-before: page;
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
