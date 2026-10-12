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
      className={`mx-2 my-1 px-3 py-3 rounded-row cursor-pointer transition-colors duration-150 flex gap-3 relative text-left items-start ${
        isSelected
          ? 'bg-surface-3 hairline'
          : 'hover:bg-fill'
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
          <div className="checkbox" data-checked={isChecked}>
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
            <span className={`text-[13px] font-mono font-medium ${isSelected ? 'text-fg' : 'text-fg/85'}`}>
              #{chat.chat_id}
            </span>
            <span className="ver">
              {chat.nejvyssi_verze || 'Neznámá'}
            </span>
          </div>
          <span className="text-xs text-fg-subtle num shrink-0">
            {formatDate(chat.lastMessageDate)}
          </span>
        </div>

        <p className="text-[13px] text-fg-muted line-clamp-1 pr-4">
          {chat.textPreview || <span className="text-fg-subtle">Bez textu</span>}
        </p>

        {/* Badges footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {positiveCount > 0 && (
              <span className="badge b-ok">
                <ThumbsUp className="w-3 h-3" />
                Pozitivní ({positiveCount})
              </span>
            )}
            {negativeCount > 0 && (
              <span className="badge b-err">
                <ThumbsDown className="w-3 h-3" />
                Stížnost ({negativeCount})
              </span>
            )}
            <span className="badge b-neutral num">
              <MessageSquare className="w-3 h-3" />
              {chat.totalMessages.toLocaleString('cs-CZ')} zpráv
            </span>
          </div>

          <ChevronRight className={`w-4 h-4 transition-transform duration-100 ${isSelected ? 'text-accent translate-x-0.5' : 'text-fg-subtle'}`} />
        </div>
      </div>
    </div>
  );
}
