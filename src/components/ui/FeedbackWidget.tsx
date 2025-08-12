import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Star, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeedbackWidgetProps {
  page?: string;
  feature?: string;
  className?: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ 
  page, 
  feature, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('usability');
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide some feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const currentUrl = page || window.location.href;
      
      const { error } = await supabase
        .from('user_satisfaction')
        .insert({
          user_id: user?.id || null,
          page_url: currentUrl,
          satisfaction_score: rating,
          feedback_text: feedback,
          category
        });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      setIsOpen(false);
      setFeedback('');
      setRating(5);
      setCategory('usability');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`fixed bottom-4 right-4 z-50 shadow-lg ${className}`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              How would you rate your experience?
            </Label>
            <RadioGroup
              value={rating.toString()}
              onValueChange={(value) => setRating(parseInt(value))}
              className="flex justify-between"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value={value.toString()} id={`rating-${value}`} />
                  <Label htmlFor={`rating-${value}`} className="flex">
                    {[...Array(value)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              What area is this feedback about?
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usability">Usability</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="functionality">Functionality</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feedback Text */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Tell us more about your experience
            </Label>
            <Textarea
              placeholder="What went well? What could be improved?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Feature/Page Context */}
          {(feature || page) && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <strong>Context:</strong> {feature || page}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};