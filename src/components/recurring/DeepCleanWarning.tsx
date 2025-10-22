import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeepCleanWarningProps {
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  onContinueAnyway: () => void;
}

export function DeepCleanWarning({ urgency, reason, onContinueAnyway }: DeepCleanWarningProps) {
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDisclaimers, setShowDisclaimers] = useState(false);

  const handleContinueClick = () => {
    if (!showDisclaimers) {
      setShowDisclaimers(true);
    } else if (acknowledged) {
      onContinueAnyway();
    }
  };

  const urgencyConfig = {
    low: { icon: Sparkles, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    medium: { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    high: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  };

  const config = urgencyConfig[urgency];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <Card className={`p-6 border-2 ${config.borderColor} ${config.bgColor}`}>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full bg-background ${config.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                We Recommend Starting with a Deep Clean
              </h3>
              <p className="text-muted-foreground">{reason}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-background rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Why Deep Clean First?
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Removes built-up dirt and grime for a fresh start</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Creates a clean baseline for easier maintenance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Ensures better results from recurring service</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Prevents surprise costs from extra time needed</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Book Deep Clean First
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="flex-1"
              onClick={handleContinueClick}
            >
              I'll Take Standard Anyway →
            </Button>
          </div>
        </div>
      </Card>

      {showDisclaimers && (
        <Card className="p-6 border-2 border-orange-200 bg-orange-50/50 animate-fade-in">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Important: Please Understand
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <span className="text-lg">🏠</span>
                <div>
                  <p className="font-medium">Recurring = Standard Cleaning (Maintenance Only)</p>
                  <p className="text-muted-foreground">This is light maintenance, not a thorough deep clean</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium">Deep Buildup May Not Be Fully Addressed</p>
                  <p className="text-muted-foreground">Areas with heavy grime may require additional attention</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <span className="text-lg">💰</span>
                <div>
                  <p className="font-medium">Some Areas May Need Extra Time (Additional Cost)</p>
                  <p className="text-muted-foreground">If cleaning takes longer than estimated, you may be charged for additional time</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <span className="text-lg">✨</span>
                <div>
                  <p className="font-medium">Best Results Come from Starting with a Deep Clean</p>
                  <p className="text-muted-foreground">This ensures the best foundation for ongoing maintenance</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 p-4 bg-background rounded-lg">
              <Checkbox 
                id="acknowledge" 
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <Label 
                htmlFor="acknowledge" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                I understand that recurring service is for maintenance cleaning only, and that my home may need deeper attention in certain areas. I accept that additional time and costs may apply if the cleaning exceeds the standard timeframe.
              </Label>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              disabled={!acknowledged}
              onClick={onContinueAnyway}
            >
              Continue to Recurring Signup
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
