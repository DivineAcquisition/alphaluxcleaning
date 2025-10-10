import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface ChatQuestionMessageProps {
  question: string;
  icon?: string;
}

export function ChatQuestionMessage({ question, icon }: ChatQuestionMessageProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Get icon component
  const IconComponent = icon ? (Icons[icon as keyof typeof Icons] as any) : null;

  return (
    <div className="space-y-6 py-4">
      {IconComponent && (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary animate-scale-in">
          <IconComponent className="h-7 w-7" />
        </div>
      )}
      
      <h2 
        className={cn(
          "text-2xl md:text-3xl font-bold text-foreground leading-tight transition-all duration-500",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {question}
      </h2>
    </div>
  );
}
