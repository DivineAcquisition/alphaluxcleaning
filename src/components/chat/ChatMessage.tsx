import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import { formatTimestamp } from '@/lib/chat-utils';
import { ChatQuestionMessage } from './interactive/ChatQuestionMessage';
import { ChatOptionButtons } from './interactive/ChatOptionButtons';
import { ChatInputField } from './interactive/ChatInputField';
import { ChatConfirmationCard } from './interactive/ChatConfirmationCard';
import { ChatProgressBar } from './interactive/ChatProgressBar';

interface StructuredMessage {
  type: 'text' | 'question' | 'options' | 'input' | 'confirmation' | 'progress';
  content?: string;
  question?: string;
  icon?: string;
  options?: Array<{
    id: string;
    label: string;
    description?: string;
    badge?: string;
  }>;
  inputType?: 'text' | 'email' | 'phone' | 'date' | 'time' | 'textarea';
  placeholder?: string;
  confirmationData?: Record<string, any>;
  progress?: { current: number; total: number };
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  onInteraction?: (response: string) => void;
}

function parseMessage(content: string): StructuredMessage {
  try {
    if (content.startsWith('INTERACTIVE:')) {
      const jsonStr = content.replace('INTERACTIVE:', '');
      return JSON.parse(jsonStr);
    }
    return { type: 'text', content };
  } catch {
    return { type: 'text', content };
  }
}

export function ChatMessage({ role, content, timestamp, onInteraction }: ChatMessageProps) {
  const isUser = role === 'user';
  const structuredMessage = !isUser ? parseMessage(content) : { type: 'text' as const, content };

  // Handle user messages (always plain text)
  if (isUser) {
    return (
      <div className="flex gap-3 animate-fade-in flex-row-reverse">
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white bg-primary">
          <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col max-w-[75%] items-end">
          <div className="rounded-2xl px-4 py-2 break-words bg-primary text-primary-foreground rounded-tr-sm">
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Handle assistant messages (can be interactive)
  return (
    <div className="flex gap-3 animate-fade-in flex-row">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white bg-accent">
        <Bot className="h-4 w-4" />
      </div>

      <div className="flex flex-col flex-1 max-w-[85%] items-start">
        {/* Progress Bar */}
        {structuredMessage.type === 'progress' && structuredMessage.progress && (
          <div className="w-full mb-4">
            <ChatProgressBar 
              current={structuredMessage.progress.current} 
              total={structuredMessage.progress.total} 
            />
          </div>
        )}

        {/* Question Message */}
        {(structuredMessage.type === 'question' || structuredMessage.type === 'options' || structuredMessage.type === 'input') && structuredMessage.question && (
          <ChatQuestionMessage 
            question={structuredMessage.question} 
            icon={structuredMessage.icon} 
          />
        )}

        {/* Option Buttons */}
        {structuredMessage.type === 'options' && structuredMessage.options && onInteraction && (
          <ChatOptionButtons 
            options={structuredMessage.options} 
            onSelect={(id, label) => onInteraction(label)} 
          />
        )}

        {/* Input Field */}
        {structuredMessage.type === 'input' && onInteraction && (
          <ChatInputField 
            question={structuredMessage.question || ''} 
            inputType={structuredMessage.inputType || 'text'} 
            placeholder={structuredMessage.placeholder} 
            onSubmit={(value) => onInteraction(value)} 
          />
        )}

        {/* Confirmation Card */}
        {structuredMessage.type === 'confirmation' && structuredMessage.confirmationData && onInteraction && (
          <ChatConfirmationCard 
            question={structuredMessage.question || 'Does this look correct?'} 
            confirmationData={structuredMessage.confirmationData} 
            onConfirm={() => onInteraction('Yes, looks good!')} 
          />
        )}

        {/* Plain Text */}
        {structuredMessage.type === 'text' && structuredMessage.content && (
          <>
            <div className="rounded-2xl px-4 py-2 break-words bg-muted text-foreground rounded-tl-sm">
              <p className="text-sm whitespace-pre-wrap">{structuredMessage.content}</p>
            </div>
            <span className="text-xs text-muted-foreground mt-1 px-1">
              {formatTimestamp(timestamp)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
