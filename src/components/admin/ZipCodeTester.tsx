import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { validateServiceAreaZipCode, getNearestServiceableZipCodes } from "@/lib/service-area-validation";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";

export const ZipCodeTester = () => {
  const [zipCode, setZipCode] = useState("");
  const [result, setResult] = useState<{
    isValid: boolean;
    message?: string;
    suggestions?: string[];
  } | null>(null);

  const testZipCode = () => {
    const validation = validateServiceAreaZipCode(zipCode);
    const suggestions = !validation.isValid ? getNearestServiceableZipCodes(zipCode) : [];
    
    setResult({
      isValid: validation.isValid,
      message: validation.message,
      suggestions
    });
  };

  const testCommonZips = () => {
    const commonZips = [
      { zip: "77521", name: "Baytown, TX" },
      { zip: "75001", name: "Dallas, TX" },
      { zip: "77001", name: "Houston, TX" },
      { zip: "78701", name: "Austin, TX" },
      { zip: "76001", name: "Fort Worth, TX" },
      { zip: "90009", name: "Los Angeles, CA" },
      { zip: "94102", name: "San Francisco, CA" },
      { zip: "92101", name: "San Diego, CA" },
      { zip: "10001", name: "New York, NY (should fail)" },
      { zip: "60601", name: "Chicago, IL (should fail)" }
    ];

    console.log("=== ZIP Code Validation Test Results ===");
    commonZips.forEach(({ zip, name }) => {
      const validation = validateServiceAreaZipCode(zip);
      console.log(`${validation.isValid ? '✅' : '❌'} ${zip} (${name}): ${validation.isValid ? 'VALID' : validation.message}`);
    });
    console.log("===========================================");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          ZIP Code Validator & Tester
        </CardTitle>
        <CardDescription>
          Test ZIP code validation for service area coverage (Texas & California)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single ZIP Test */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter ZIP code (e.g., 77521)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={10}
            />
            <Button onClick={testZipCode}>Test</Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${result.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.isValid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Valid Service Area</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900">Outside Service Area</span>
                  </>
                )}
              </div>
              {result.message && (
                <p className={`text-sm ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
              )}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Nearest serviceable areas:</p>
                  <div className="flex gap-1">
                    {result.suggestions.map(zip => (
                      <Badge key={zip} variant="secondary">{zip}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Batch Test */}
        <div className="pt-4 border-t">
          <Button onClick={testCommonZips} variant="outline" className="w-full">
            Run Batch Test (Check Console)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Tests common ZIP codes from Texas, California, and out-of-service areas. Results will appear in the browser console.
          </p>
        </div>

        {/* Service Area Info */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm">Covered Areas:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Texas Ranges:</p>
              <ul className="text-xs space-y-1 mt-1">
                <li>73000-73999 (Central/North TX)</li>
                <li>75000-75999 (Dallas)</li>
                <li>76000-76999 (Fort Worth)</li>
                <li>77000-77999 (Houston)</li>
                <li>78000-78999 (Austin/San Antonio)</li>
                <li>79000-79999 (West Texas)</li>
                <li>88500-88599 (El Paso)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">California Ranges:</p>
              <ul className="text-xs space-y-1 mt-1">
                <li>90000-96199 (Entire state)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
