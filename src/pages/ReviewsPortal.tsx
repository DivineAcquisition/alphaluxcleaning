import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Quote, Calendar, User } from "lucide-react";

interface Review {
  id: string;
  customer_name: string;
  overall_rating: number;
  feedback_text: string;
  created_at: string;
  cleanliness_rating?: number;
  timeliness_rating?: number;
  professionalism_rating?: number;
}

export default function ReviewsPortal() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .not('overall_rating', 'is', null)
        .not('feedback_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Customer Reviews</h1>
            <p className="text-xl opacity-90">
              See what our customers say about Bay Area Cleaning Pros
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">Loading reviews...</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <Card key={review.id} className="border-border/40 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{review.customer_name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {review.overall_rating}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.overall_rating)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Quote className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <p className="text-muted-foreground leading-relaxed">
                        "{review.feedback_text}"
                      </p>
                    </div>
                    
                    {/* Detailed Ratings */}
                    {(review.cleanliness_rating || review.timeliness_rating || review.professionalism_rating) && (
                      <div className="space-y-2 pt-4 border-t border-border/40">
                        {review.cleanliness_rating && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cleanliness</span>
                            <div className="flex items-center gap-1">
                              {renderStars(review.cleanliness_rating)}
                            </div>
                          </div>
                        )}
                        {review.timeliness_rating && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Timeliness</span>
                            <div className="flex items-center gap-1">
                              {renderStars(review.timeliness_rating)}
                            </div>
                          </div>
                        )}
                        {review.professionalism_rating && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Professionalism</span>
                            <div className="flex items-center gap-1">
                              {renderStars(review.professionalism_rating)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {reviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground mb-4">No reviews yet</div>
            <p className="text-muted-foreground">
              Customer reviews will appear here once feedback is submitted.
            </p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Our Service?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of satisfied customers across the Bay Area
          </p>
          <Button size="lg" asChild>
            <a href="https://app.alphaluxclean.com/booking">Book Your Cleaning</a>
          </Button>
        </div>
      </div>
    </div>
  );
}