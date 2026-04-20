import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validateServiceAreaZipCode, getNearestServiceableZipCodes } from "@/lib/service-area-validation";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";

export const ZipCodeTester = () => {
  const [zipCode, setZipCode] = useState("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [result, setResult] = useState<{
    isValid: boolean;
    message?: string;
    suggestions?: string[];
  } | null>(null);

  const testZipCode = () => {
    const validation = validateServiceAreaZipCode(zipCode, selectedState || undefined);
    const suggestions = !validation.isValid ? getNearestServiceableZipCodes(zipCode) : [];

    setResult({
      isValid: validation.isValid,
      message: validation.message,
      suggestions,
    });
  };

  const testCommonZips = () => {
    const commonZips = [
      { zip: "10001", name: "Manhattan, NY" },
      { zip: "11201", name: "Brooklyn, NY" },
      { zip: "11101", name: "Queens, NY" },
      { zip: "10451", name: "Bronx, NY" },
      { zip: "10301", name: "Staten Island, NY" },
      { zip: "11501", name: "Nassau County (Long Island), NY" },
      { zip: "11701", name: "Suffolk County (Long Island), NY" },
      { zip: "10601", name: "White Plains, NY" },
      { zip: "10701", name: "Yonkers, NY" },
      { zip: "12201", name: "Albany, NY" },
      { zip: "14202", name: "Buffalo, NY" },
      { zip: "14601", name: "Rochester, NY" },
      { zip: "90210", name: "Beverly Hills, CA (should fail)" },
      { zip: "75001", name: "Dallas, TX (should fail)" },
      { zip: "60601", name: "Chicago, IL (should fail)" },
    ];

    console.log("=== ZIP Code Validation Test Results ===");
    commonZips.forEach(({ zip, name }) => {
      const validation = validateServiceAreaZipCode(zip, selectedState || undefined);
      console.log(
        validation.isValid ? "✅ VALID" : "❌ INVALID",
        zip,
        "(",
        name,
        "):",
        validation.isValid ? "VALID" : validation.message,
      );
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
          Test ZIP code validation for service area coverage (New York State)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single ZIP Test */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-sm font-medium mb-1">State (Optional)</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Any State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any State</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ZIP Code</label>
              <Input
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
          <Button onClick={testZipCode} className="w-full">Test ZIP Code</Button>

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
                  <p className="text-sm text-muted-foreground mb-1">Nearest serviceable NY ZIPs:</p>
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
            Tests representative NY ZIP codes and a few out-of-service areas.
            Results will appear in the browser console.
          </p>
        </div>

        {/* Service Area Info */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm">New York Service Area Coverage:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">NYC & Metro:</p>
              <ul className="text-xs space-y-1 mt-1">
                <li>10001-10299 (Manhattan)</li>
                <li>10301-10314 (Staten Island)</li>
                <li>10451-10475 (Bronx)</li>
                <li>10501-10598 (Westchester)</li>
                <li>10601-10710 (White Plains / Yonkers)</li>
                <li>10801-10805 (New Rochelle)</li>
                <li>10901-10998 (Rockland / Orange)</li>
                <li>11001-11697 (Queens / Brooklyn)</li>
                <li>11701-11980 (Long Island)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Upstate NY:</p>
              <ul className="text-xs space-y-1 mt-1">
                <li>12000-12999 (Albany / Hudson Valley)</li>
                <li>13000-13999 (Central / Northern NY)</li>
                <li>14000-14999 (Western NY)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
