import React from 'react';
import { ConversationalQuestion } from './ConversationalQuestion';
import { AnswerOption } from './AnswerOption';
import { PriceTeaserBanner } from '@/components/pricing/PriceTeaserBanner';
import { Sparkles } from 'lucide-react';

interface WarmUpStepProps {
  value: string;
  onSelect: (value: string) => void;
}

export function WarmUpStep({ value, onSelect }: WarmUpStepProps) {
  const options = [
    {
      value: 'within_month',
      label: 'Within the last month',
      description: 'Recently cleaned, just need maintenance',
    },
    {
      value: '1_2_months',
      label: '1-2 months ago',
      description: 'Starting to notice some buildup',
    },
    {
      value: '2_6_months',
      label: '2-6 months ago',
      description: 'Definitely needs attention',
    },
    {
      value: '6_plus_months',
      label: '6+ months ago',
      description: 'It\'s been a while',
    },
    {
      value: 'never',
      label: 'Never / Not sure',
      description: 'First professional cleaning',
    },
  ];

  return (
    <>
      <PriceTeaserBanner />
      
      <ConversationalQuestion
        question="We just need a few details to give you an instant quote 👇"
        description="When was your home last professionally cleaned?"
        icon={<Sparkles className="w-8 h-8" />}
      >
        <div className="space-y-3">
          {options.map((option) => (
            <AnswerOption
              key={option.value}
              label={option.label}
              description={option.description}
              isSelected={value === option.value}
              onClick={() => onSelect(option.value)}
              autoAdvance={true}
            />
          ))}
        </div>
      </ConversationalQuestion>
    </>
  );
}
