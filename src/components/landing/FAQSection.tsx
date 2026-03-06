import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How is pricing calculated?',
    answer: 'Our pricing is based on your home size (square footage), service type, and location. Standard cleaning starts at $171, Deep cleaning at $236, and Move-In/Out at $340. We offer 10% off Standard and $25 off Deep cleaning for new customers.'
  },
  {
    question: "What's the difference between regular and deep cleaning?",
    answer: 'Standard cleaning covers routine maintenance like dusting, vacuuming, mopping, and bathroom/kitchen cleaning. Deep cleaning includes everything in standard cleaning PLUS baseboards, inside appliances, light fixtures, window sills, and detailed scrubbing of all surfaces.'
  },
  {
    question: 'Do I need to be home during the cleaning?',
    answer: "No, you don't need to be home! Many of our clients provide access instructions and we'll lock up when finished. You'll get the same professional team every visit, so you can trust them with your home."
  },
  {
    question: 'What if I\'m not satisfied with the cleaning?',
    answer: "We offer a 100% satisfaction guarantee. If you're not happy with any aspect of the cleaning, contact us within 24 hours and we'll come back to make it right at no additional charge."
  },
  {
    question: 'Is there a deposit required?',
    answer: 'Yes, we require a 25% deposit to secure your booking. The remaining 75% is due after the cleaning is completed. This ensures we can reserve your preferred time slot and cleaners.'
  },
  {
    question: 'What areas do you serve?',
    answer: 'We serve major cities across Texas (Dallas, Houston, Austin, San Antonio), California (Los Angeles, San Diego, San Francisco), and New York. Enter your ZIP code during booking to confirm we service your area.'
  },
  {
    question: 'Can I book recurring cleaning services?',
    answer: 'Absolutely! We offer weekly, bi-weekly, and monthly recurring cleanings for Standard cleaning service. Recurring customers save up to 15% and get priority scheduling with the same dedicated team.'
  },
  {
    question: "What's your cancellation policy?",
    answer: 'You can cancel or reschedule up to 48 hours before your appointment for a full refund of your deposit. Cancellations within 48 hours are subject to a 50% cancellation fee.'
  }
];

export function FAQSection() {
  return (
    <div className="py-12 lg:py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-base lg:text-lg text-muted-foreground">
              Everything you need to know about our cleaning services
            </p>
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/50 rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-base lg:text-lg font-semibold hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm lg:text-base text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Bottom CTA */}
          <div className="mt-8 lg:mt-12 text-center p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-base lg:text-lg text-foreground mb-2">
              Still have questions?
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Our team is here to help! Call us at{' '}
              <a href="tel:+19725590223" className="text-primary font-semibold hover:underline">
                (972) 559-0223
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
