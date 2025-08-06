import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
interface Step {
  id: number;
  title: string;
  description: string;
}
interface ProgressIndicatorProps {
  currentStep: number;
  steps: Step[];
}
export function ProgressIndicator({
  currentStep,
  steps
}: ProgressIndicatorProps) {
  const progress = currentStep / steps.length * 100;
  return;
}