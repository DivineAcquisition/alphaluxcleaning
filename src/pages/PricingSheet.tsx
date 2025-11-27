import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const PricingSheet = () => {
  const handlePrint = () => {
    window.print();
  };

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
        <div className="bg-white p-12 rounded-lg shadow-sm print:shadow-none">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-primary">
            <h1 className="text-4xl font-bold text-primary mb-2">Alpha Lux Clean</h1>
            <p className="text-xl text-muted-foreground">Professional Cleaning Services - Pricing Guide</p>
            <p className="text-sm text-muted-foreground mt-2">972-559-0223 | alphaluxclean.com</p>
          </div>

          {/* Base Pricing Table */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b border-accent pb-2">Base Pricing by Home Size</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="border border-border p-3 text-left">Home Size</th>
                    <th className="border border-border p-3 text-right">Standard Clean</th>
                    <th className="border border-border p-3 text-right">Deep Clean</th>
                    <th className="border border-border p-3 text-right">90-Day Plan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3 font-medium">Studio/1BR (≤1,499 sqft)</td>
                    <td className="border border-border p-3 text-right">$159</td>
                    <td className="border border-border p-3 text-right">$199</td>
                    <td className="border border-border p-3 text-right">$636</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border p-3 font-medium">2BR (1,500-2,499 sqft)</td>
                    <td className="border border-border p-3 text-right">$199</td>
                    <td className="border border-border p-3 text-right">$249</td>
                    <td className="border border-border p-3 text-right">$796</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3 font-medium">3BR (2,500-3,499 sqft)</td>
                    <td className="border border-border p-3 text-right">$249</td>
                    <td className="border border-border p-3 text-right">$299</td>
                    <td className="border border-border p-3 text-right">$996</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border border-border p-3 font-medium">4BR (3,500-4,499 sqft)</td>
                    <td className="border border-border p-3 text-right">$299</td>
                    <td className="border border-border p-3 text-right">$349</td>
                    <td className="border border-border p-3 text-right">$1,196</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3 font-medium">5BR+ (4,500+ sqft)</td>
                    <td className="border border-border p-3 text-right">$349+</td>
                    <td className="border border-border p-3 text-right">$399+</td>
                    <td className="border border-border p-3 text-right">$1,396+</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Service Offerings */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b border-accent pb-2">Service Offerings</h2>
            
            <div className="space-y-6">
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-lg font-bold text-primary mb-2">Standard Clean (One-Time)</h3>
                <p className="text-sm text-muted-foreground mb-2">Perfect for regular maintenance</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>25% deposit at booking, 75% after service</li>
                  <li>Professional 2-person crew</li>
                  <li>Duration: 2 hours</li>
                  <li>$50 flat discount for one-time bookings</li>
                </ul>
              </div>

              <div className="border border-accent rounded-lg p-4 bg-accent/5">
                <h3 className="text-lg font-bold text-primary mb-2">Tester Deep Clean</h3>
                <p className="text-sm text-muted-foreground mb-2">Premium deep cleaning (≤1,499 sqft homes only)</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>25% deposit at booking, 75% after service</li>
                  <li>Professional 2-person crew</li>
                  <li>Duration: 4 hours</li>
                  <li>40-point deep clean checklist</li>
                  <li>Promo: DEEPCLEAN60 ($60 off)</li>
                </ul>
              </div>

              <div className="border border-primary rounded-lg p-4 bg-primary/5">
                <h3 className="text-lg font-bold text-primary mb-2">90-Day Reset & Maintain Plan</h3>
                <p className="text-sm text-muted-foreground mb-2">1 Deep Clean + 3 Standard Maintenance Visits</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Deposit: 25% of monthly payment (~6.25% of total)</li>
                  <li>Then 3 monthly payments of 25% of total each</li>
                  <li>Example: $800 plan = $50 deposit + $200/mo × 3</li>
                  <li>Professional 2-person crew</li>
                  <li>Duration: 4 hours (first visit)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Discounts */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b border-accent pb-2">Discount Structure</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">Frequency Discounts</h3>
                <table className="w-full text-sm border border-border">
                  <tbody>
                    <tr className="bg-muted/30">
                      <td className="border border-border p-2">One-Time</td>
                      <td className="border border-border p-2 text-right font-semibold">$50 flat</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-2">Weekly</td>
                      <td className="border border-border p-2 text-right font-semibold">15% off</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border border-border p-2">Bi-Weekly</td>
                      <td className="border border-border p-2 text-right font-semibold">10% off</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-2">Monthly</td>
                      <td className="border border-border p-2 text-right font-semibold">5% off</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">Promotional Codes</h3>
                <table className="w-full text-sm border border-border">
                  <tbody>
                    <tr className="bg-muted/30">
                      <td className="border border-border p-2 font-mono">DEEPCLEAN60</td>
                      <td className="border border-border p-2 text-right font-semibold">$60 off</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-2 font-mono">FIRST25</td>
                      <td className="border border-border p-2 text-right font-semibold">25% off</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border border-border p-2 font-mono">SAVE10</td>
                      <td className="border border-border p-2 text-right font-semibold">10% off</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-2">Referral</td>
                      <td className="border border-border p-2 text-right font-semibold">15% off</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Payment Structure */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b border-accent pb-2">Payment Structure</h2>
            
            <div className="bg-muted/20 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Standard & Deep Clean</h3>
                <p className="text-sm">25% deposit at booking • 75% balance due after service completion</p>
              </div>
              
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold text-primary mb-2">90-Day Plan Payment Schedule</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>Today:</strong> Starter deposit (25% of monthly payment)</li>
                  <li><strong>After First Service:</strong> Remaining balance + Month 1 payment</li>
                  <li><strong>Month 2:</strong> 25% of total plan price</li>
                  <li><strong>Month 3:</strong> 25% of total plan price</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Deposit Examples */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b border-accent pb-2">Deposit Examples</h2>
            
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-3 text-left">Service</th>
                  <th className="border border-border p-3 text-left">Home Size</th>
                  <th className="border border-border p-3 text-right">Total Price</th>
                  <th className="border border-border p-3 text-right">Deposit (25%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2">Standard Clean</td>
                  <td className="border border-border p-2">2BR</td>
                  <td className="border border-border p-2 text-right">$199</td>
                  <td className="border border-border p-2 text-right font-semibold">$50</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border p-2">Deep Clean</td>
                  <td className="border border-border p-2">Studio/1BR</td>
                  <td className="border border-border p-2 text-right">$199</td>
                  <td className="border border-border p-2 text-right font-semibold">$50</td>
                </tr>
                <tr>
                  <td className="border border-border p-2">90-Day Plan</td>
                  <td className="border border-border p-2">2BR</td>
                  <td className="border border-border p-2 text-right">$796</td>
                  <td className="border border-border p-2 text-right font-semibold">$50</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border p-2">90-Day Plan</td>
                  <td className="border border-border p-2">4BR</td>
                  <td className="border border-border p-2 text-right">$1,196</td>
                  <td className="border border-border p-2 text-right font-semibold">$75</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">For questions or custom quotes, contact us:</p>
            <p className="text-base font-semibold text-primary">📞 972-559-0223 | 📧 support@alphaluxclean.com</p>
            <p className="text-xs text-muted-foreground mt-2">Prices effective as of {new Date().toLocaleDateString()}. Subject to change.</p>
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
            margin: 0.5in;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PricingSheet;
