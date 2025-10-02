import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConversationalQuestionProps {
  question: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function ConversationalQuestion({ 
  question, 
  description,
  icon,
  children 
}: ConversationalQuestionProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      {/* Question */}
      <div className="space-y-4">
        {icon && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary animate-scale-in">
            {icon}
          </div>
        )}
        
        <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight animate-fade-in">
          {question}
        </h2>
        
        {description && (
          <p className="text-lg md:text-xl text-muted-foreground animate-fade-in">
            {description}
          </p>
        )}
      </div>

      {/* Answer Options */}
      <div 
        className={cn(
          "transition-all duration-500",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {children}
      </div>
    </div>
  );
}
