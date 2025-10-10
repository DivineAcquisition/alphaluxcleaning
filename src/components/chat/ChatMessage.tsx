import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import { formatTimestamp } from '@/lib/chat-utils';
import { ChatQuestionMessage } from './interactive/ChatQuestionMessage';
import { ChatOptionButtons } from './interactive/ChatOptionButtons';
import { ChatInputField } from './interactive/ChatInputField';
import { ChatConfirmationCard } from './interactive/ChatConfirmationCard';
import { ChatProgressBar } from './interactive/ChatProgressBar';
import { ChatMultiSelect } from './interactive/ChatMultiSelect';

interface StructuredMessage {
  type: 'text' | 'question' | 'options' | 'input' | 'confirmation' | 'progress' | 'multiselect';
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
  multiSelectOptions?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  minSelections?: number;
  maxSelections?: number;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  onInteraction?: (response: string) => void;
}

function parseMessage(content: string): StructuredMessage {
  try {
    // Find INTERACTIVE: anywhere in the content
    const interactiveIndex = content.indexOf('INTERACTIVE:');
    if (interactiveIndex !== -1) {
      // Extract JSON after INTERACTIVE:
      const jsonStart = interactiveIndex + 'INTERACTIVE:'.length;
      const jsonStr = content.slice(jsonStart).trim();
      
      // Find the first complete JSON object
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        if (jsonStr[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonEnd > 0) {
        const extractedJson = jsonStr.slice(0, jsonEnd);
        return JSON.parse(extractedJson);
      }
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
        {(structuredMessage.type === 'question' || structuredMessage.type === 'options' || structuredMessage.type === 'input' || structuredMessage.type === 'multiselect') && structuredMessage.question && (
          <ChatQuestionMessage 
            question={structuredMessage.question} 
            icon={structuredMessage.icon} 
          />
        )}

        {/* Option Buttons - render for both "options" and "question" types with options array */}
        {((structuredMessage.type === 'options' || structuredMessage.type === 'question') && structuredMessage.options && onInteraction) && (
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

        {/* Multi-Select */}
        {structuredMessage.type === 'multiselect' && structuredMessage.multiSelectOptions && onInteraction && (
          <ChatMultiSelect 
            question={structuredMessage.question || 'Select options'} 
            options={structuredMessage.multiSelectOptions} 
            minSelections={structuredMessage.minSelections}
            maxSelections={structuredMessage.maxSelections}
            onSubmit={(selectedIds) => {
              const labels = selectedIds.map(id => 
                structuredMessage.multiSelectOptions?.find(opt => opt.id === id)?.label
              ).filter(Boolean);
              onInteraction(labels.length > 0 ? labels.join(', ') : 'None');
            }} 
          />
        )}

        {/* Confirmation Card */}
        {structuredMessage.type === 'confirmation' && structuredMessage.confirmationData && onInteraction && (
          <ChatConfirmationCard 
            question={structuredMessage.question || 'Does this look correct?'} 
            confirmationData={structuredMessage.confirmationData} 
            onConfirm={() => onInteraction('Yes, looks good!')}
            onEdit={(field) => onInteraction(`I want to change my ${field}`)}
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
