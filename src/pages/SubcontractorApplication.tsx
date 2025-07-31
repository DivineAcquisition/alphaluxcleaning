import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ContractorAgreementProps {
  contractorName?: string;
}

export default function SubcontractorApplication({ contractorName = "[Contractor Name]" }: ContractorAgreementProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error("Please read and agree to the 1099 Independent Contractor Agreement");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              1099 Independent Contractor Agreement
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please carefully review the following independent contractor agreement. 
            This document outlines the terms and conditions of our working relationship.
          </p>
          <Badge variant="outline" className="bg-primary/10">
            Bay Area Cleaning Professionals
          </Badge>
        </div>

        {/* Agreement Content */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Independent Contractor Agreement
            </CardTitle>
            <CardDescription>
              Effective Date: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] p-6">
              <div className="space-y-6 text-sm leading-relaxed">
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">1. PARTIES</h3>
                  <p>
                    This Independent Contractor Agreement ("Agreement") is entered into between 
                    Bay Area Cleaning Professionals ("Company") and {contractorName} ("Contractor").
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">2. SERVICES</h3>
                  <p className="mb-3">
                    Contractor agrees to provide residential and commercial cleaning services as an independent contractor. 
                    Services include but are not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>General house cleaning and maintenance</li>
                    <li>Deep cleaning services</li>
                    <li>Move-in/move-out cleaning</li>
                    <li>Post-construction cleanup</li>
                    <li>Commercial office cleaning</li>
                    <li>Specialty cleaning services as requested</li>
                  </ul>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">3. TERM</h3>
                  <p>
                    This Agreement shall commence on the date of execution and shall continue until 
                    terminated by either party with thirty (30) days written notice.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">4. COMPENSATION</h3>
                  <div className="space-y-3">
                    <p>
                      Contractor will be compensated based on a revenue-sharing model:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Tier 1:</strong> 60% of service revenue (New contractors, first 30 days)</li>
                      <li><strong>Tier 2:</strong> 65% of service revenue (After 30 days, good performance)</li>
                      <li><strong>Tier 3:</strong> 70% of service revenue (After 90 days, excellent performance)</li>
                    </ul>
                    <p>
                      Payment will be made within 7 business days after service completion and customer payment receipt.
                    </p>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">5. INDEPENDENT CONTRACTOR STATUS</h3>
                  <div className="space-y-3">
                    <p>
                      Contractor acknowledges and agrees that:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>They are an independent contractor, not an employee</li>
                      <li>They are responsible for their own taxes, including self-employment tax</li>
                      <li>No benefits, insurance, or worker's compensation is provided by Company</li>
                      <li>They have the right to control the manner and means of performing services</li>
                      <li>They may work for other clients and companies</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">6. PERFORMANCE STANDARDS</h3>
                  <div className="space-y-3">
                    <p>Contractor agrees to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Maintain professional appearance and conduct</li>
                      <li>Arrive punctually for scheduled appointments</li>
                      <li>Provide high-quality cleaning services</li>
                      <li>Use approved cleaning supplies and equipment</li>
                      <li>Respect customer property and privacy</li>
                      <li>Maintain customer confidentiality</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">7. EQUIPMENT AND SUPPLIES</h3>
                  <p>
                    Company will provide basic cleaning supplies and equipment. Contractor is responsible 
                    for maintaining equipment in good condition and may be required to replace damaged items.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">8. CONFIDENTIALITY</h3>
                  <p>
                    Contractor agrees to maintain strict confidentiality regarding customer information, 
                    business operations, pricing, and any proprietary information obtained during the 
                    course of this agreement.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">9. NON-SOLICITATION</h3>
                  <p>
                    For a period of two (2) years following termination, Contractor agrees not to 
                    directly solicit or provide services to customers obtained through Company without 
                    prior written consent.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">10. LIABILITY AND INSURANCE</h3>
                  <div className="space-y-3">
                    <p>
                      Contractor acknowledges responsibility for:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Obtaining general liability insurance (minimum $1,000,000)</li>
                      <li>Any damage caused by negligent performance</li>
                      <li>Compliance with all applicable laws and regulations</li>
                      <li>Proper licensing and permits as required</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">11. TERMINATION</h3>
                  <p>
                    Either party may terminate this agreement with thirty (30) days written notice. 
                    Company may terminate immediately for breach of agreement, poor performance, 
                    or violation of company policies.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">12. GOVERNING LAW</h3>
                  <p>
                    This Agreement shall be governed by the laws of the State of California. 
                    Any disputes shall be resolved through binding arbitration in San Francisco County.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary">13. ENTIRE AGREEMENT</h3>
                  <p>
                    This Agreement constitutes the entire agreement between the parties and supersedes 
                    all prior negotiations, representations, or agreements. Modifications must be in 
                    writing and signed by both parties.
                  </p>
                </section>

                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">ACKNOWLEDGMENT</h4>
                  <p className="text-sm">
                    By signing below, both parties acknowledge they have read, understood, and agree 
                    to be bound by the terms of this Independent Contractor Agreement.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <p className="font-medium">Contractor:</p>
                      <div className="mt-4 border-b border-foreground/20 pb-1">
                        <p className="text-sm text-muted-foreground">Signature</p>
                      </div>
                      <p className="mt-2 text-sm">{contractorName}</p>
                      <div className="mt-4 border-b border-foreground/20 pb-1 w-32">
                        <p className="text-sm text-muted-foreground">Date</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium">Bay Area Cleaning Professionals:</p>
                      <div className="mt-4 border-b border-foreground/20 pb-1">
                        <p className="text-sm text-muted-foreground">Signature</p>
                      </div>
                      <p className="mt-2 text-sm">Authorized Representative</p>
                      <div className="mt-4 border-b border-foreground/20 pb-1 w-32">
                        <p className="text-sm text-muted-foreground">Date</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Agreement Checkbox and Submit */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="agreement" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="agreement" className="text-sm leading-relaxed cursor-pointer">
                  I have read, understood, and agree to be bound by the terms and conditions 
                  of this 1099 Independent Contractor Agreement. I acknowledge that I am 
                  entering into this agreement as an independent contractor and understand 
                  my responsibilities regarding taxes, insurance, and performance standards.
                </label>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={!agreed || isSubmitting}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}