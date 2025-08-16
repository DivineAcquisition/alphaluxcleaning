import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Package, GraduationCap, X } from "lucide-react";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  subcontractorName: string;
  onProceedToDashboard: () => void;
}

export default function WelcomePopup({ 
  isOpen, 
  onClose, 
  subcontractorName, 
  onProceedToDashboard 
}: WelcomePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full mx-auto">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-8 w-8 text-success" />
            <CardTitle className="text-2xl font-bold text-success">Welcome to the Team!</CardTitle>
          </div>
          <CardDescription>
            Congratulations {subcontractorName}! Your onboarding is complete.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Training Access</h4>
                <p className="text-sm text-blue-800">
                  Check your email for training materials and video access. Complete all modules before your first job.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Package className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Uniform & Supplies</h4>
                <p className="text-sm text-green-800">
                  Your branded shirts and cleaning supplies will be shipped within <strong>2-7 business days</strong>. 
                  You'll receive tracking info via email.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900">Check Your Email</h4>
                <p className="text-sm text-purple-800">
                  Important onboarding information, training links, and account details have been sent to your email.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              I'll Check Later
            </Button>
            <Button className="flex-1" onClick={onProceedToDashboard}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}