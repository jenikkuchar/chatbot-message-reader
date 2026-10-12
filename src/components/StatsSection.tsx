import React from 'react';
import { Chat } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, Layers, HelpCircle, Activity } from 'lucide-react';

interface StatsSectionProps {
  chats: Chat[];
  totalChatsCountAll?: number;
}

export default function StatsSection({ chats, totalChatsCountAll }: StatsSectionProps) {
  const totalChats = chats.length;
  
  // Calculations
  let totalMessages = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let undefinedFeedbackCount = 0;
  const versionsSet = new Set<string>();

  chats.forEach(c => {
    totalMessages += c.totalMessages;
    if (c.nejvyssi_verze) {
      versionsSet.add(c.nejvyssi_verze);
    }
    
    // Count exact message feedback in entire conversations
    c.messages.forEach(m => {
      if (m.feedback === true) positiveCount++;
      else if (m.feedback === false) negativeCount++;
      else undefinedFeedbackCount++;
    });
  });

  const avgMessages = totalChats > 0 ? (totalMessages / totalChats).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0';
  const totalFeedbackCount = positiveCount + negativeCount;
  const positiveRatioPercent = totalFeedbackCount > 0 
    ? Math.round((positiveCount / totalFeedbackCount) * 100) 
    : 0;

  const isFiltered = totalChatsCountAll !== undefined && totalChats !== totalChatsCountAll;
  const fmt = (n: number) => n.toLocaleString('cs-CZ');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Chats */}
      <div className="card px-4 py-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-xs text-fg-muted">
              {isFiltered ? 'Nalezeno chatů' : 'Celkem chatů'}
            </span>
            <div className="text-[26px] leading-tight font-semibold tracking-tight num mt-0.5">
              {isFiltered ? (
                <>
                  <span>{fmt(totalChats)}</span>
                  <span className="text-sm text-fg-subtle font-normal"> / {fmt(totalChatsCountAll ?? 0)} </span>
                  <span className="text-sm text-accent font-normal">({totalChatsCountAll ? Math.round((totalChats / totalChatsCountAll) * 100) : 0} %)</span>
                </>
              ) : (
                fmt(totalChats)
              )}
            </div>
          </div>
          <MessageSquare className="w-4 h-4 text-accent shrink-0" />
        </div>
        <div className="text-xs text-fg-subtle num mt-1">
          <span>Průměr {avgMessages} replik / chat</span>
        </div>
      </div>

      {/* Positive Feedback Ratio */}
      <div className="card px-4 py-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-xs text-fg-muted">Spokojenost AI</span>
            <div className="text-[26px] leading-tight font-semibold tracking-tight num mt-0.5">
              {totalFeedbackCount > 0 ? `${positiveRatioPercent} %` : 'N/A'}
            </div>
          </div>
          <ThumbsUp className="w-4 h-4 text-success shrink-0" />
        </div>
        <div className="text-xs text-fg-subtle num mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-success"><ThumbsUp className="w-3 h-3" />{fmt(positiveCount)}</span>
          <span className="text-line-3">|</span>
          <span className="inline-flex items-center gap-1 text-danger"><ThumbsDown className="w-3 h-3" />{fmt(negativeCount)}</span>
        </div>
      </div>

      {/* Total processed messages */}
      <div className="card px-4 py-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-xs text-fg-muted">Počet zpráv</span>
            <div className="text-[26px] leading-tight font-semibold tracking-tight num mt-0.5">{fmt(totalMessages)}</div>
          </div>
          <Layers className="w-4 h-4 text-accent shrink-0" />
        </div>
        <div className="text-xs text-fg-subtle num mt-1">
          <span>{fmt(chats.reduce((acc, c) => acc + c.humanMessagesCount, 0))} uživatel • {fmt(chats.reduce((acc, c) => acc + c.aiMessagesCount, 0))} AI</span>
        </div>
      </div>

      {/* System Versions */}
      <div className="card px-4 py-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-xs text-fg-muted">Aktivní verze</span>
            <div className="text-[13px] font-mono text-fg mt-2 truncate">
              {Array.from(versionsSet).join(', ') || 'Žádná'}
            </div>
          </div>
          <Activity className="w-4 h-4 text-fg-subtle shrink-0" />
        </div>
        <div className="text-xs text-fg-subtle num mt-1.5">
          <span>{fmt(versionsSet.size)} jedinečných verzí</span>
        </div>
      </div>
    </div>
  );
}
