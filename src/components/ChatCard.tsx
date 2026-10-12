import React from 'react';
import { Chat } from '../types';
import { MessageSquare, Clock, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';

interface ChatCardProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
  isChecked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
  key?: React.Key;
}

export default function ChatCard({ chat, isSelected, onClick, isChecked = false, onToggleCheck }: ChatCardProps) {
  // Format dates nicely
  const formatDate = (date: Date | null) => {
    if (!date) return 'Neznámé';
    return date.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const positiveCount = chat.messages.filter((m) => m.feedback === true).length;
  const negativeCount = chat.messages.filter((m) => m.feedback === false).length;

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all duration-150 flex gap-3 relative border-l-2 text-left items-start ${
        isSelected
          ? 'bg-slate-800/60 border-blue-500'
          : 'border-transparent hover:bg-slate-800/30'
      }`}
    >
      {/* Checkbox column */}
      {onToggleCheck && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(e);
          }}
          className="pt-1 select-none shrink-0 cursor-pointer"
        >
          <div
            className={`w-4 h-4 border rounded flex items-center justify-center transition-all duration-150 ${
              isChecked
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                : 'border-slate-600 hover:border-slate-400 bg-slate-905'
            }`}
          >
            {isChecked && (
              <svg className="w-2.5 h-2.5 text-white fill-current stroke-[2.5]" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Main card content column */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-mono font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
              #{chat.chat_id}
            </span>
            <span className="text-[9px] font-mono font-semibold bg-slate-900 border border-slate-800 text-blue-400 px-1 py-0.2 rounded">
              {chat.nejvyssi_verze || 'Neznámá'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            {formatDate(chat.lastMessageDate)}
          </span>
        </div>

        <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed font-sans pr-4">
          {chat.textPreview || <span className="text-slate-600 italic">Bez textu</span>}
        </p>

        {/* Badges footer */}
        <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            {positiveCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                <ThumbsUp className="w-2.5 h-2.5 fill-current" />
                POZITIVNÍ ({positiveCount})
              </span>
            )}
            {negativeCount > 0 && (
              <span className="flex items-center gap-1 text-rose-450 bg-rose-950/40 border border-rose-900/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                <ThumbsDown className="w-2.5 h-2.5 fill-current" />
                STÍŽNOST ({negativeCount})
              </span>
            )}
            <span className="bg-slate-900/40 border border-slate-800/80 text-slate-500 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1">
              <MessageSquare className="w-2.5 h-2.5" />
              {chat.totalMessages} zpráv
            </span>
          </div>

          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-100 ${isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600'}`} />
        </div>
      </div>
    </div>
  );
}
