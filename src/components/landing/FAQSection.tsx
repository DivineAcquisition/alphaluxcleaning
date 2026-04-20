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
    <div className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-alx-gold/30 bg-alx-gold/5 px-4 py-1.5 mb-4">
              <HelpCircle className="w-4 h-4 text-alx-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-alx-gold">
                FAQs
              </span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground">
              Everything you need to know about our cleaning services
            </p>
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-alx-gold/15 rounded-xl px-6 shadow-soft hover:border-alx-gold/40 transition-all"
              >
                <AccordionTrigger className="text-left text-base lg:text-lg font-semibold hover:text-alx-gold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm lg:text-base text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Bottom CTA */}
          <div className="mt-12 text-center p-8 rounded-2xl bg-alx-hero text-alx-gold-pale relative overflow-hidden shadow-clean">
            <div
              aria-hidden
              className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-gradient-gold opacity-20 blur-3xl"
            />
            <p className="font-serif text-xl lg:text-2xl font-semibold text-alx-gold-light mb-2">
              Still have questions?
            </p>
            <p className="text-sm text-alx-gold-pale/80 mb-4">
              Our team is here to help! Call us at{' '}
              <a
                href="tel:+18577544557"
                className="text-alx-gold-light font-semibold hover:underline"
              >
                (857) 754-4557
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
