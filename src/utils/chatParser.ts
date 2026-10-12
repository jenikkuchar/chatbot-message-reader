import { Message, ChatRaw, Chat, ProductData } from '../types';

/**
 * Parses a single product tag like `::product{name="ABC" price="123" ...}`
 */
export function parseProductTag(productStr: string): ProductData | null {
  try {
    // Extract key-value pairs like name="Value" or name=\"Value\"
    // Attribute name, followed by optional equals, and double quotes
    const regex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\\"([^\\"]*)\\"|\\\'([^\\\']*)\\\')/g;
    const data: Record<string, string> = {};
    let match;

    while ((match = regex.exec(productStr)) !== null) {
      const key = match[1];
      const val = match[2] || match[3] || match[4] || match[5] || '';
      data[key] = val;
    }

    if (Object.keys(data).length === 0) {
      // Try fallback regex in case of unquoted values just in case
      const fallbackRegex = /(\w+)="?([^"\s}]+)"?/g;
      let fbMatch;
      while ((fbMatch = fallbackRegex.exec(productStr)) !== null) {
        data[fbMatch[1]] = fbMatch[2];
      }
    }

    if (!data.name) return null;

    return {
      name: data.name,
      rating: data.rating,
      ratingCount: data.ratingCount,
      features: data.features,
      desc: data.desc,
      price: data.price,
      originalPrice: data.originalPrice,
      id: data.id,
      articleType: data.articleType,
      category: data.category,
    };
  } catch (err) {
    console.error('Error parsing product tag:', err);
    return null;
  }
}

export interface ContentBlock {
  type: 'text' | 'carousel';
  content: string; // for text
  products?: ProductData[]; // for carousel
}

/**
 * Splits message content into text and carousel blocks
 */
export function parseMessageContent(text: string): ContentBlock[] {
  if (!text) return [];

  const blocks: ContentBlock[] = [];
  
  // Look for :::carousel ... ::: blocks
  // Use non-greedy match to find multiple carousels if any
  const carouselRegex = /:::carousel([\s\S]*?):::/g;
  let lastIndex = 0;
  let match;

  while ((match = carouselRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    // Add text block before the carousel if any
    if (matchIndex > lastIndex) {
      const precedingText = text.substring(lastIndex, matchIndex).trim();
      if (precedingText) {
        blocks.push({ type: 'text', content: precedingText });
      }
    }

    // Process inside carousel
    const carouselContent = match[1];
    const products: ProductData[] = [];
    
    // Find all ::product{...} tags
    const productRegex = /::product\s*\{([^}]+)\}/g;
    let pMatch;
    while ((pMatch = productRegex.exec(carouselContent)) !== null) {
      const parsed = parseProductTag(pMatch[1]);
      if (parsed) {
        products.push(parsed);
      }
    }

    if (products.length > 0) {
      blocks.push({ type: 'carousel', content: '', products });
    } else {
      // Fallback if no products could be parsed, just treat it as text
      blocks.push({ type: 'text', content: match[0] });
    }

    lastIndex = carouselRegex.lastIndex;
  }

  // Add remaining text if any
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText) {
      blocks.push({ type: 'text', content: remainingText });
    }
  }

  // If no blocks were created (no carousels found), return the single text block
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: text });
  }

  return blocks;
}

/**
 * Helper to parse raw conversation field into standard Message array
 */
export function parseConversation(rawKonv: string | Message[]): Message[] {
  if (Array.isArray(rawKonv)) {
    return rawKonv;
  }
  
  if (typeof rawKonv === 'string') {
    try {
      return JSON.parse(rawKonv) as Message[];
    } catch (e) {
      console.error('Failed to parse konverzace JSON string:', e);
      // Try to clean up double escapes that sometimes happen
      try {
        const cleaned = rawKonv.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return JSON.parse(cleaned) as Message[];
      } catch (innerE) {
        console.error('Failed to parse cleaned konverzace:', innerE);
        return [];
      }
    }
  }
  
  return [];
}

/**
 * Normalizes a ChatRaw object into a fully calculated Chat object
 */
export function normalizeChat(raw: ChatRaw): Chat {
  const messages = parseConversation(raw.konverzace);
  
  let hasPositiveFeedback = false;
  let hasNegativeFeedback = false;
  let firstDate: Date | null = null;
  let lastDate: Date | null = null;
  let humanCount = 0;
  let aiCount = 0;
  let textAccumulator = '';

  messages.forEach((msg) => {
    if (msg.feedback === true) hasPositiveFeedback = true;
    if (msg.feedback === false) hasNegativeFeedback = true;
    
    if (msg.created_at) {
      const d = new Date(msg.created_at);
      if (!isNaN(d.getTime())) {
        if (!firstDate || d < firstDate) firstDate = d;
        if (!lastDate || d > lastDate) lastDate = d;
      }
    }

    if (msg.type === 'human') humanCount++;
    if (msg.type === 'ai') aiCount++;

    if (msg.content) {
      textAccumulator += ' ' + msg.content;
    }
  });

  // Get preview from the first human message
  const firstHuman = messages.find(m => m.type === 'human');
  const textPreview = firstHuman ? firstHuman.content : (messages[0]?.content || '');

  return {
    chat_id: raw.chat_id,
    nejvyssi_verze: raw.nejvyssi_verze,
    messages,
    totalMessages: messages.length,
    hasPositiveFeedback,
    hasNegativeFeedback,
    firstMessageDate: firstDate,
    lastMessageDate: lastDate,
    humanMessagesCount: humanCount,
    aiMessagesCount: aiCount,
    textPreview: textPreview.substring(0, 100) + (textPreview.length > 100 ? '...' : '')
  };
}

/**
 * Attempt to parse any uploaded JSON text into Chat list
 */
export function parseUploadedJson(text: string): Chat[] {
  try {
    const rawData = JSON.parse(text);
    const arrays = Array.isArray(rawData) ? rawData : [rawData];
    
    return arrays
      .filter((item) => item && typeof item === 'object' && ('chat_id' in item || 'conversations' in item))
      .map((item) => {
        // Handle variations of keys
        const chat_id = String(item.chat_id || item.id || Math.floor(Math.random() * 100000));
        const nejvyssi_verze = item.nejvyssi_verze || item.version || 'unknown';
        const konverzace = item.konverzace || item.conversation || item.messages || [];
        
        return normalizeChat({
          chat_id,
          nejvyssi_verze,
          konverzace
        });
      });
  } catch (e) {
    throw new Error('Nevalidní formát JSON souboru: ' + (e as Error).message);
  }
}
