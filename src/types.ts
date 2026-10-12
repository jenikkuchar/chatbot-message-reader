/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  type: 'human' | 'ai';
  verze: string;
  content: string;
  feedback: null | boolean;
  created_at: string;
  message_id: number;
}

export interface ChatRaw {
  chat_id: string;
  nejvyssi_verze: string;
  konverzace: string | Message[];
}

export interface Chat {
  chat_id: string;
  nejvyssi_verze: string;
  messages: Message[];
  // Derived fields for sorting & filtering
  totalMessages: number;
  hasPositiveFeedback: boolean;
  hasNegativeFeedback: boolean;
  firstMessageDate: Date | null;
  lastMessageDate: Date | null;
  humanMessagesCount: number;
  aiMessagesCount: number;
  textPreview: string;
}

export interface ProductData {
  name: string;
  rating?: string;
  ratingCount?: string;
  features?: string;
  desc?: string;
  price?: string;
  originalPrice?: string;
  id?: string;
  articleType?: string;
  category?: string;
}

export type SortField = 'chat_id' | 'message_count' | 'latest_date' | 'earliest_date';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  version: string;
  feedbackType: 'all' | 'positive' | 'negative' | 'none';
  minMessages: number;
}
