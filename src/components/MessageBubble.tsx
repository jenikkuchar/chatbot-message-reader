import React, { useState } from 'react';
import { Message } from '../types';
import { parseMessageContent } from '../utils/chatParser';
import ProductCarousel from './ProductCarousel';
import { ThumbsUp, ThumbsDown, User, Bot, Clock, Tag, Copy, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  themeColor?: string;
  isHighlighted?: boolean;
  searchTerm?: string;
  key?: React.Key;
}

// Simple Helper to highlight/render basic markdown formatting inline
function highlightText(text: string, search: string) {
  if (!search || !text) return [text];
  
  const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex specials
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, idx) => 
    part.toLowerCase() === search.toLowerCase()
      ? <mark id={`highlight-${part.toLowerCase()}`} key={idx} className="bg-warning text-bg font-semibold px-0.5 rounded-[3px]">{part}</mark>
      : part
  );
}

function renderFormattedText(text: string, search?: string) {
  if (!text) return '';

  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    // Check for list items starting with * or -
    const isBullet = line.trim().startsWith('*') || line.trim().startsWith('-');
    let displayLine = line;
    if (isBullet) {
      displayLine = line.replace(/^[\s*-]+/, '').trim();
    }

    // Process bold text **example**
    const parts = displayLine.split(/(\*\*.*?\*\*)/g);
    const contentSpan = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={pIdx} className="font-semibold text-fg">
            {search ? highlightText(boldText, search) : boldText}
          </strong>
        );
      }
      return search ? highlightText(part, search) : part;
    });

    if (isBullet) {
      return (
        <li key={lIdx} className="ml-4 list-disc marker:text-fg-subtle text-[13px] sm:text-sm my-1">
          {contentSpan}
        </li>
      );
    }

    return (
      <p key={lIdx} className="text-[13px] sm:text-sm leading-relaxed my-1.5 min-h-[0.5rem]">
        {contentSpan}
      </p>
    );
  });
}

export default function MessageBubble({ message, themeColor = 'slate', isHighlighted = false, searchTerm = '' }: MessageBubbleProps) {
  const isAi = message.type === 'ai';
  const blocks = parseMessageContent(message.content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Format creation date and time
  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div 
      id={`msg-${message.message_id}`}
      className={`flex w-full gap-3 my-4 ${isAi ? 'justify-start' : 'justify-end'} transition-all duration-300`}
    >
      {/* AI Avatar on left */}
      {isAi && (
        <div className="w-8 h-8 rounded-row bg-accent-soft flex items-center justify-center shrink-0 self-start text-accent">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}
 
      {/* Main message bubble block */}
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1.5`}>
        {/* Sender Name & Meta */}
        <div className={`flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-fg-subtle num ${!isAi ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium text-fg-muted">
            {isAi ? 'DATART Specialista (AI)' : 'Uživatel'}
          </span>
          <span>•</span>
          <span>{formatDateTime(message.created_at)}</span>
          <span>•</span>
          <span className="ver">
            {message.verze}
          </span>
        </div>

        {/* Message Bubble Canvas */}
        <div
          className={`px-4 py-3 relative transition-all duration-300 rounded-card ${
            isHighlighted 
              ? 'ring-2 ring-accent' 
              : ''
          } ${
            isAi
              ? 'bg-surface-1 hairline rounded-tl-[4px] text-fg'
              : 'bg-surface-2 hairline rounded-tr-[4px] text-fg'
          }`}
        >
          {/* Blocks Mapper (Standard text OR Carousels!) */}
          <div className="space-y-3">
            {blocks.map((block, idx) => {
              if (block.type === 'carousel') {
                return <ProductCarousel key={idx} products={block.products || []} />;
              }
              return <div key={idx}>{renderFormattedText(block.content, searchTerm)}</div>;
            })}
          </div>

          {/* Feedback & Message ID Controls Box */}
          <div className={`flex items-center justify-between flex-wrap gap-2 mt-3 pt-2.5 border-t border-line text-xs text-fg-subtle`}>
            <div className="flex items-center gap-3">
              <span className="font-mono num">ID: {message.message_id}</span>
              <button
                onClick={handleCopy}
                type="button"
                className="flex items-center gap-1.5 hover:text-accent transition-colors cursor-pointer select-none font-medium"
                title="Zkopírovat zprávu do schránky"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-success shrink-0" />
                    <span className="text-success">Zkopírováno!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 shrink-0" />
                    <span>Zkopírovat</span>
                  </>
                )}
              </button>
            </div>
            {message.feedback !== null && (
              <div className="flex items-center gap-1.5 select-none">
                {message.feedback === true ? (
                  <div className="badge b-ok">
                    <ThumbsUp className="w-3 h-3" />
                    <span>Pozitivní hodnocení</span>
                  </div>
                ) : (
                  <div className="badge b-err">
                    <ThumbsDown className="w-3 h-3" />
                    <span>Nespokojenost / Stížnost</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Avatar on right */}
      {!isAi && (
        <div className="w-8 h-8 rounded-row bg-surface-3 hairline flex items-center justify-center shrink-0 self-start text-fg-muted">
          <User className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  );
}
