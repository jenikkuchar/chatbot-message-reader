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

  const avgMessages = totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : '0';
  const totalFeedbackCount = positiveCount + negativeCount;
  const positiveRatioPercent = totalFeedbackCount > 0 
    ? Math.round((positiveCount / totalFeedbackCount) * 100) 
    : 0;

  const isFiltered = totalChatsCountAll !== undefined && totalChats !== totalChatsCountAll;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Chats */}
      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-slate-500 text-[9px] font-mono tracking-widest uppercase font-bold">
              {isFiltered ? 'Nalezeno chatů' : 'Celkem chatů'}
            </span>
            <div className="text-xl font-bold text-white mt-1 font-sans">
              {isFiltered ? (
                <>
                  <span className="text-blue-400 font-bold">{totalChats}</span>
                  <span className="text-xs text-slate-500 font-normal font-mono"> / {totalChatsCountAll} </span>
                  <span className="text-xs text-blue-500 font-mono font-normal">({totalChatsCountAll ? Math.round((totalChats / totalChatsCountAll) * 100) : 0}%)</span>
                </>
              ) : (
                totalChats
              )}
            </div>
          </div>
          <div className="text-slate-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-2">
          <span>Průměr {avgMessages} replik / chat</span>
        </div>
      </div>

      {/* Positive Feedback Ratio */}
      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-slate-500 text-[9px] font-mono tracking-widest uppercase font-bold">Spokojenost AI</span>
            <div className="text-xl font-bold text-white mt-1 font-sans">
              {totalFeedbackCount > 0 ? `${positiveRatioPercent}%` : 'N/A'}
            </div>
          </div>
          <div className="text-emerald-500">
            <ThumbsUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-2 flex items-center gap-1.5">
          <span>👍 {positiveCount}</span>
          <span className="text-slate-800">|</span>
          <span>👎 {negativeCount}</span>
        </div>
      </div>

      {/* Total processed messages */}
      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-slate-500 text-[9px] font-mono tracking-widest uppercase font-bold">Počet Zpráv</span>
            <div className="text-xl font-bold text-white mt-1 font-sans">{totalMessages}</div>
          </div>
          <div className="text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-2">
          <span>{chats.reduce((acc, c) => acc + c.humanMessagesCount, 0)} uživatel • {chats.reduce((acc, c) => acc + c.aiMessagesCount, 0)} AI</span>
        </div>
      </div>

      {/* System Versions */}
      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-slate-500 text-[9px] font-mono tracking-widest uppercase font-bold">Aktivní Verze</span>
            <div className="text-xs font-mono font-bold text-slate-300 mt-1.5 truncate">
              {Array.from(versionsSet).join(', ') || 'Žádná'}
            </div>
          </div>
          <div className="text-slate-500">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-2">
          <span>{versionsSet.size} jedinečných verzí</span>
        </div>
      </div>
    </div>
  );
}
