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
      ? <mark id={`highlight-${part.toLowerCase()}`} key={idx} className="bg-amber-400 text-slate-950 font-semibold px-0.5 rounded shadow-sm border border-amber-300/40">{part}</mark>
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
          <strong key={pIdx} className="font-bold text-slate-100">
            {search ? highlightText(boldText, search) : boldText}
          </strong>
        );
      }
      return search ? highlightText(part, search) : part;
    });

    if (isBullet) {
      return (
        <li key={lIdx} className="ml-4 list-disc text-slate-300 text-xs sm:text-sm my-1 font-sans">
          {contentSpan}
        </li>
      );
    }

    return (
      <p key={lIdx} className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed my-1.5 min-h-[0.5rem]">
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
        <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center shrink-0 self-start shadow-md text-blue-400">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}
 
      {/* Main message bubble block */}
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1.5`}>
        {/* Sender Name & Meta */}
        <div className={`flex items-center gap-2 text-[10px] font-mono text-slate-500 ${!isAi ? 'flex-row-reverse' : ''}`}>
          <span className="font-bold text-slate-400">
            {isAi ? 'DATART Specialista (AI)' : 'Uživatel'}
          </span>
          <span>•</span>
          <span>{formatDateTime(message.created_at)}</span>
          <span>•</span>
          <span className="bg-slate-900 px-1 py-0.2 rounded border border-slate-800 text-[9px]">
            {message.verze}
          </span>
        </div>

        {/* Message Bubble Canvas */}
        <div
          className={`p-4 border relative shadow-sm transition-all duration-300 ${
            isHighlighted 
              ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-400/90 shadow-[0_0_20px_rgba(59,130,246,0.35)] translate-x-1 scale-[1.01]' 
              : ''
          } ${
            isAi
              ? 'bg-blue-500/5 border-blue-500/25 rounded-tr-xl rounded-bl-xl rounded-br-xl text-slate-200'
              : 'bg-slate-900 border border-slate-800 rounded-tl-xl rounded-bl-xl rounded-br-xl text-slate-300'
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
          <div className={`flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/65 text-[10px] font-mono text-slate-500`}>
            <div className="flex items-center gap-3">
              <span>ID: {message.message_id}</span>
              <button
                onClick={handleCopy}
                type="button"
                className="flex items-center gap-1.5 hover:text-slate-350 active:text-slate-150 transition-colors cursor-pointer select-none font-bold"
                title="Zkopírovat zprávu do schránky"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-450 shrink-0" />
                    <span className="text-emerald-450">Zkopírováno!</span>
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
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-900/40 text-emerald-400 text-[10px] font-semibold">
                    <ThumbsUp className="w-3 h-3 fill-current bg-opacity-10 text-emerald-500" />
                    <span>Pozitivní hodnocení</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-955/80 border border-rose-900/40 text-rose-400 text-[10px] font-semibold">
                    <ThumbsDown className="w-3 h-3 fill-current bg-opacity-10 text-rose-500" />
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
        <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 self-start shadow-md text-slate-400">
          <User className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  );
}
