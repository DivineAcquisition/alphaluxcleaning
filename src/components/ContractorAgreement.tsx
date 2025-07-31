import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

interface ContractorAgreementProps {
  contractorName?: string;
  onAgreementChange: (agreed: boolean) => void;
  agreed: boolean;
}

export default function ContractorAgreement({ 
  contractorName = "[Contractor Name]",
  onAgreementChange,
  agreed
}: ContractorAgreementProps) {
  return (
    <div className="space-y-6">
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
          <ScrollArea className="h-[400px] p-6">
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
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">3. COMPENSATION</h3>
                <div className="space-y-3">
                  <p>Contractor will be compensated based on a revenue-sharing model with subscription tiers.</p>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">4. INDEPENDENT CONTRACTOR STATUS</h3>
                <p>Contractor acknowledges they are an independent contractor, not an employee.</p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Agreement Checkbox */}
      <Card className="shadow-lg border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="agreement" 
              checked={agreed}
              onCheckedChange={(checked) => onAgreementChange(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="agreement" className="text-sm leading-relaxed cursor-pointer">
              I have read, understood, and agree to be bound by the terms and conditions 
              of this 1099 Independent Contractor Agreement.
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}