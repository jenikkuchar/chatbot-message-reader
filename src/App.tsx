/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { DEFAULT_CHATS_JSON } from './defaultData';
import { Chat, ChatRaw, SortField, SortOrder } from './types';
import { normalizeChat } from './utils/chatParser';
import StatsSection from './components/StatsSection';
import JSONImportExport from './components/JSONImportExport';
import ChatCard from './components/ChatCard';
import MessageBubble from './components/MessageBubble';
import { 
  Search, 
  SlidersHorizontal, 
  MessageSquare, 
  Compass, 
  TrendingUp, 
  Calendar, 
  Terminal, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2, 
  CheckCircle, 
  Plus, 
  HelpCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Globe,
  History,
  X,
  FileDown,
  Copy,
  Check,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CZECH_MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export default function App() {
  // State for all loaded raw chats
  const [rawChats, setRawChats] = useState<ChatRaw[]>([]);

  // Calculate parsed chat models
  const chats = useMemo(() => {
    return rawChats.map(normalizeChat);
  }, [rawChats]);

  // Selected chat ID
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Selected chat IDs for export module
  const [checkedChatIds, setCheckedChatIds] = useState<string[]>([]);
  const [copiedSelectIds, setCopiedSelectIds] = useState(false);

  // States for sequential feedback scrolling & highlighting
  const [currentPositiveIdx, setCurrentPositiveIdx] = useState(0);
  const [currentNegativeIdx, setCurrentNegativeIdx] = useState(0);
  const [activeHighlightedMessageId, setActiveHighlightedMessageId] = useState<number | null>(null);

  // States for search within active chat
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  // Reset indices & highlight when active chat changes
  useEffect(() => {
    setCurrentPositiveIdx(0);
    setCurrentNegativeIdx(0);
    setActiveHighlightedMessageId(null);
    setChatSearchQuery('');
    setActiveSearchIndex(0);
  }, [selectedChatId]);

  // Filters and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [msgSearchInput, setMsgSearchInput] = useState('');
  const [appliedMsgSearch, setAppliedMsgSearch] = useState('');
  const [versionFilter, setVersionFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'positive' | 'negative' | 'none'>('all');
  const [minMessagesFilter, setMinMessagesFilter] = useState<number>(1);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('latest_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedMsgSearch, versionFilter, feedbackFilter, minMessagesFilter, periodFilter, customFromDate, customToDate, pageSize]);

  // Toggle checkout check status on chats
  const handleToggleCheckedChat = (chatId: string) => {
    setCheckedChatIds((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  // Toggle sort order helper
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc'); // default to descending for new field
    }
  };

  // Extract unique versions present across all loaded chats
  const versions = useMemo(() => {
    const set = new Set<string>();
    chats.forEach((c) => {
      if (c.nejvyssi_verze) set.add(c.nejvyssi_verze);
    });
    return Array.from(set).sort();
  }, [chats]);

  // Handle importing custom list
  const handleImportChats = (newChats: Chat[]) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingText('Provádění syntaktické analýzy JSON souboru...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 12;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        const rawList: ChatRaw[] = newChats.map((c) => ({
          chat_id: c.chat_id,
          nejvyssi_verze: c.nejvyssi_verze,
          konverzace: c.messages,
        }));
        
        // Merge or overwrite? Let's append new ones and filter out duplicates by chat_id
        setRawChats((prev) => {
          const merged = [...rawList];
          prev.forEach((old) => {
            if (!merged.some((m) => m.chat_id === old.chat_id)) {
              merged.push(old);
            }
          });
          return merged;
        });

        // No longer auto-selecting chat on import so that the details area remains empty by default

        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }

      setLoadingProgress(progress);
      if (progress < 30) {
        setLoadingText('Validace struktury a čtení zpráv...');
      } else if (progress < 60) {
        setLoadingText('Parsování asistentových replik a doporučených produktů...');
      } else if (progress < 90) {
        setLoadingText('Generování datových metrik a indexování...');
      } else {
        setLoadingText('Finální validace datových struktur...');
      }
    }, 120);
  };

  const handleLoadDefaultDemo = () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingText('MIGRUJI UKÁZKOVÁ TESTOVACÍ DATA (124 konverzací)...');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setRawChats(DEFAULT_CHATS_JSON);
        // No longer auto-selecting chat on demo load
        
        setTimeout(() => {
          setIsLoading(false);
        }, 200);
      }
      setLoadingProgress(progress);
    }, 80);
  };

  const handleResetToDefault = () => {
    setRawChats([]);
    setSelectedChatId(null);
    setCheckedChatIds([]);
    setSearchQuery('');
    setMsgSearchInput('');
    setAppliedMsgSearch('');
    setVersionFilter('all');
    setFeedbackFilter('all');
    setMinMessagesFilter(1);
    setPeriodFilter('all');
    setCustomFromDate('');
    setCustomToDate('');
    setIsPeriodDropdownOpen(false);
    setSortField('latest_date');
    setSortOrder('desc');
  };

  const handleDeleteChat = (idToDelete: string) => {
    const filtered = rawChats.filter((c) => c.chat_id !== idToDelete);
    setRawChats(filtered);
    setCheckedChatIds((prev) => prev.filter((id) => id !== idToDelete));
    if (selectedChatId === idToDelete) {
      setSelectedChatId(null);
    }
  };

  // Find currently selected chat object
  const selectedChat = useMemo(() => {
    return chats.find((c) => c.chat_id === selectedChatId) || null;
  }, [chats, selectedChatId]);

  // Extract positive and negative feedback messages for scrolling
  const selectedChatPositiveMessages = useMemo(() => {
    if (!selectedChat) return [];
    return selectedChat.messages.filter((m) => m.feedback === true);
  }, [selectedChat]);

  const selectedChatNegativeMessages = useMemo(() => {
    if (!selectedChat) return [];
    return selectedChat.messages.filter((m) => m.feedback === false);
  }, [selectedChat]);

  const handleScrollToPositive = () => {
    if (selectedChatPositiveMessages.length === 0) return;
    const targetIdx = currentPositiveIdx % selectedChatPositiveMessages.length;
    const targetMsg = selectedChatPositiveMessages[targetIdx];
    if (targetMsg) {
      setActiveHighlightedMessageId(targetMsg.message_id);
      setTimeout(() => {
        const element = document.getElementById(`msg-${targetMsg.message_id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      setCurrentPositiveIdx((prev) => prev + 1);
    }
  };

  const handleScrollToNegative = () => {
    if (selectedChatNegativeMessages.length === 0) return;
    const targetIdx = currentNegativeIdx % selectedChatNegativeMessages.length;
    const targetMsg = selectedChatNegativeMessages[targetIdx];
    if (targetMsg) {
      setActiveHighlightedMessageId(targetMsg.message_id);
      setTimeout(() => {
        const element = document.getElementById(`msg-${targetMsg.message_id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      setCurrentNegativeIdx((prev) => prev + 1);
    }
  };

  // Search logic within the selected active conversation
  const handleChatSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatSearchQuery(e.target.value);
    setActiveSearchIndex(0);
  };

  const chatSearchResults = useMemo(() => {
    if (!selectedChat || !chatSearchQuery.trim()) return [];
    const query = chatSearchQuery.toLowerCase();
    return selectedChat.messages
      .filter((msg) => msg.content.toLowerCase().includes(query))
      .map((msg) => msg.message_id);
  }, [selectedChat, chatSearchQuery]);

  const handleNextSearchOccur = () => {
    if (chatSearchResults.length === 0) return;
    const nextIdx = (activeSearchIndex + 1) % chatSearchResults.length;
    setActiveSearchIndex(nextIdx);
  };

  const handlePrevSearchOccur = () => {
    if (chatSearchResults.length === 0) return;
    const prevIdx = (activeSearchIndex - 1 + chatSearchResults.length) % chatSearchResults.length;
    setActiveSearchIndex(prevIdx);
  };

  const handleClearChatSearch = () => {
    setChatSearchQuery('');
    setActiveSearchIndex(0);
    setActiveHighlightedMessageId(null);
  };

  const handleChatSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevSearchOccur();
      } else {
        handleNextSearchOccur();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNextSearchOccur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevSearchOccur();
    }
  };

  // Auto-scroll to selected matching search result
  useEffect(() => {
    if (chatSearchResults.length > 0) {
      const msgId = chatSearchResults[activeSearchIndex];
      setActiveHighlightedMessageId(msgId);
      setTimeout(() => {
        const element = document.getElementById(`msg-${msgId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }, [chatSearchResults, activeSearchIndex]);

  // Compute filtered & sorted list
  const filteredChats = useMemo(() => {
    let list = [...chats];

    // 1. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const matchesId = c.chat_id.toLowerCase().includes(query);
        const matchesContent = c.messages.some((m) =>
          m.content?.toLowerCase().includes(query)
        );
        return matchesId || matchesContent;
      });
    }

    // 1b. Dedicated message search filter (applied with button confirmation)
    if (appliedMsgSearch.trim()) {
      const query = appliedMsgSearch.toLowerCase().trim();
      list = list.filter((c) =>
        c.messages.some((m) => m.content?.toLowerCase().includes(query))
      );
    }

    // 2. Version Filter
    if (versionFilter !== 'all') {
      list = list.filter((c) => c.nejvyssi_verze === versionFilter);
    }

    // 3. Feedback Filter
    if (feedbackFilter !== 'all') {
      if (feedbackFilter === 'positive') {
        list = list.filter((c) => c.hasPositiveFeedback);
      } else if (feedbackFilter === 'negative') {
        list = list.filter((c) => c.hasNegativeFeedback);
      } else if (feedbackFilter === 'none') {
        list = list.filter((c) => !c.hasPositiveFeedback && !c.hasNegativeFeedback);
      }
    }

    // 4. Message count Filter
    if (minMessagesFilter > 1) {
      list = list.filter((c) => c.totalMessages >= minMessagesFilter);
    }

    // 5. Period / Date Filter
    if (periodFilter !== 'all') {
      const now = new Date();
      list = list.filter((c) => {
        return c.messages.some((m) => {
          if (!m.created_at) return false;
          const mDate = new Date(m.created_at);
          if (isNaN(mDate.getTime())) return false;
          
          if (periodFilter === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            return mDate >= todayStart && mDate <= todayEnd;
          }
          
          if (periodFilter === 'yesterday') {
            const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
            const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
            return mDate >= yesterdayStart && mDate <= yesterdayEnd;
          }
          
          if (periodFilter === '2days') {
            const startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
            return mDate >= startLimit;
          }
          
          if (periodFilter === '7days') {
            const startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
            return mDate >= startLimit;
          }
          
          if (periodFilter === '14days') {
            const startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
            return mDate >= startLimit;
          }
          
          if (periodFilter === '30days') {
            const startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
            return mDate >= startLimit;
          }
          
          if (periodFilter === 'custom') {
            if (customFromDate) {
              const startLimit = new Date(customFromDate + 'T00:00:00');
              if (!isNaN(startLimit.getTime()) && mDate < startLimit) {
                return false;
              }
            }
            if (customToDate) {
              const endLimit = new Date(customToDate + 'T23:59:59.999');
              if (!isNaN(endLimit.getTime()) && mDate > endLimit) {
                return false;
              }
            }
            return true;
          }
          
          if (periodFilter.startsWith('month_')) {
            const parts = periodFilter.substring(6).split('-'); // "2026-04" => ["2026", "04"]
            const year = parseInt(parts[0], 10);
            const monthIdx = parseInt(parts[1], 10) - 1; // 0-indexed
            return mDate.getFullYear() === year && mDate.getMonth() === monthIdx;
          }
          
          return true;
        });
      });
    }

    // 6. Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'chat_id') {
        comparison = a.chat_id.localeCompare(b.chat_id, undefined, { numeric: true });
      } else if (sortField === 'message_count') {
        comparison = a.totalMessages - b.totalMessages;
      } else if (sortField === 'latest_date') {
        const timeA = a.lastMessageDate ? a.lastMessageDate.getTime() : 0;
        const timeB = b.lastMessageDate ? b.lastMessageDate.getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortField === 'earliest_date') {
        const timeA = a.firstMessageDate ? a.firstMessageDate.getTime() : 0;
        const timeB = b.firstMessageDate ? b.firstMessageDate.getTime() : 0;
        comparison = timeA - timeB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [chats, searchQuery, appliedMsgSearch, versionFilter, feedbackFilter, minMessagesFilter, periodFilter, customFromDate, customToDate, sortField, sortOrder]);

  // Extract unique Year-Month combinations present in chats
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { year: number; monthIndex: number; label: string }>();
    chats.forEach((c) => {
      c.messages.forEach((m) => {
        if (m.created_at) {
          const d = new Date(m.created_at);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const mIdx = d.getMonth(); // 0-11
            const key = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
            if (!monthMap.has(key)) {
              monthMap.set(key, {
                year: y,
                monthIndex: mIdx,
                label: `${CZECH_MONTHS[mIdx]} ${y}`,
              });
            }
          }
        }
      });
    });
    // Sort chronological desc (latest month first)
    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({
        key, // "2026-04"
        ...value
      }));
  }, [chats]);

  const getPeriodLabel = () => {
    if (periodFilter === 'all') return 'Vše';
    if (periodFilter === 'today') return 'Dnes';
    if (periodFilter === 'yesterday') return 'Včera';
    if (periodFilter === '2days') return 'Poslední 2 dny';
    if (periodFilter === '7days') return 'Posledních 7 dní';
    if (periodFilter === '14days') return 'Posledních 14 dní';
    if (periodFilter === '30days') return 'Posledních 30 dní';
    if (periodFilter === 'custom') {
      if (customFromDate || customToDate) {
        const fromStr = customFromDate ? new Date(customFromDate).toLocaleDateString('cs-CZ') : '...';
        const toStr = customToDate ? new Date(customToDate).toLocaleDateString('cs-CZ') : '...';
        return `${fromStr} – ${toStr}`;
      }
      return 'Vlastní rozsah';
    }
    if (periodFilter.startsWith('month_')) {
      const targetMonthKey = periodFilter.substring(6); // "2026-04"
      const found = availableMonths.find(m => m.key === targetMonthKey);
      return found ? found.label : 'Konkrétní měsíc';
    }
    return 'Vše';
  };

  // Compute indices for pagination rendering
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredChats.length);

  // Compute paginated subset of filtered & sorted chats
  const paginatedChats = useMemo(() => {
    return filteredChats.slice(startIndex, startIndex + pageSize);
  }, [filteredChats, startIndex, pageSize]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredChats.length / pageSize));
  }, [filteredChats.length, pageSize]);

  // Auto-select first filtered chat ONLY if a chat was already selected but is no longer in the filtered list
  useEffect(() => {
    if (selectedChatId !== null && filteredChats.length > 0 && !filteredChats.some((c) => c.chat_id === selectedChatId)) {
      setSelectedChatId(filteredChats[0].chat_id);
    }
  }, [filteredChats, selectedChatId]);

  // Exporter of current state
  const exportAllToJSONFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawChats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `datart_chats_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Check if all currently filtered elements are selected
  const isAllFilteredChecked = useMemo(() => {
    if (filteredChats.length === 0) return false;
    return filteredChats.every((c) => checkedChatIds.includes(c.chat_id));
  }, [filteredChats, checkedChatIds]);

  // Toggle selection of all currently filtered items
  const handleToggleSelectAllFiltered = () => {
    const filteredIds = filteredChats.map((c) => c.chat_id);
    if (isAllFilteredChecked) {
      // Uncheck those in filtered list
      setCheckedChatIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Check all filtered list items
      setCheckedChatIds((prev) => {
        const next = [...prev];
        filteredIds.forEach((id) => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  };

  // Export selected chats to a JSON file
  const exportSelectedToJSONFile = () => {
    if (checkedChatIds.length === 0) return;
    const selectedRawChats = rawChats.filter((rc) => checkedChatIds.includes(rc.chat_id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedRawChats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `datart_chats_vyber_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy selected chat IDs to clipboard
  const handleCopySelectedIds = async () => {
    if (checkedChatIds.length === 0) return;
    try {
      await navigator.clipboard.writeText(checkedChatIds.join('\n'));
      setCopiedSelectIds(true);
      setTimeout(() => setCopiedSelectIds(false), 2000);
    } catch (err) {
      console.error('Failed to copy selected IDs:', err);
    }
  };

  const isAnyFilterActive = useMemo(() => {
    return (
      searchQuery !== '' ||
      appliedMsgSearch !== '' ||
      versionFilter !== 'all' ||
      feedbackFilter !== 'all' ||
      minMessagesFilter > 1 ||
      periodFilter !== 'all' ||
      customFromDate !== '' ||
      customToDate !== ''
    );
  }, [searchQuery, appliedMsgSearch, versionFilter, feedbackFilter, minMessagesFilter, periodFilter, customFromDate, customToDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setMsgSearchInput('');
    setAppliedMsgSearch('');
    setVersionFilter('all');
    setFeedbackFilter('all');
    setMinMessagesFilter(1);
    setPeriodFilter('all');
    setCustomFromDate('');
    setCustomToDate('');
    setIsPeriodDropdownOpen(false);
  };

  return (
    <div className="min-h-dvh md:h-dvh md:max-h-dvh text-fg font-sans flex flex-col md:overflow-hidden select-none antialiased">
      
      {/* Top Navigation / Header */}
      <header className="h-14 sticky top-0 z-30 border-b border-line flex items-center justify-between gap-3 px-4 sm:px-5 glass shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="https://www.jan-kuchar.cz"
            aria-label="jan-kuchar.cz"
            className="brand-mark size-[26px] rounded-[7px] grid place-items-center text-[11px] font-extrabold tracking-tight !text-white shrink-0"
          >
            JK
          </a>
          <span className="text-fg-subtle text-lg font-light" aria-hidden="true">/</span>
          <img src="/favicon.svg" alt="" className="size-[26px] shrink-0" />
          <h1 className="text-[15px] font-light tracking-tight whitespace-nowrap">
            Chat <span className="font-semibold">Inspector</span>
          </h1>
          <span className="ver hidden sm:inline">v1.1</span>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          {chats.length > 0 && !isLoading && (
            <>
              <span className="hidden md:inline text-xs text-fg-subtle num whitespace-nowrap">
                {isAnyFilterActive ? (
                  <>Nalezeno: <span className="text-fg font-medium">{filteredChats.length.toLocaleString('cs-CZ')}</span> z {chats.length.toLocaleString('cs-CZ')} chatů <span className="text-accent">({chats.length ? Math.round((filteredChats.length / chats.length) * 100) : 0} %)</span></>
                ) : (
                  <>Celkem: {chats.length.toLocaleString('cs-CZ')} chatů</>
                )}
              </span>

              <button
                onClick={() => setIsImporterOpen(!isImporterOpen)}
                className="btn btn-secondary btn-sm"
              >
                {isImporterOpen ? 'Zavřít panel' : 'Importovat JSON'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      {isLoading ? (
        /* Loader block */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Animated spinning outline */}
            <div className="absolute inset-0 border-[3px] border-surface-3 rounded-full"></div>
            <div className="absolute inset-0 border-[3px] border-transparent border-t-accent rounded-full animate-spin"></div>
            
            {/* Percentage Indicator */}
            <span className="text-lg font-semibold num">{loadingProgress} %</span>
          </div>
          
          <div className="space-y-1 max-w-md">
            <h3 className="text-xl font-semibold tracking-tight">Provádím analýzu dat...</h3>
            <p className="text-[13px] text-fg-muted h-5">{loadingText}</p>
          </div>

          {/* Progressive visual bar */}
          <div className="w-60 h-1 bg-surface-3 rounded-full overflow-hidden mt-6">
            <div 
              className="h-full bg-accent transition-all duration-150" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      ) : chats.length === 0 ? (
        /* Startup Landing Page */
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-7 sm:py-10">
          <div className="max-w-[1200px] mx-auto w-full space-y-5 select-none">
            {/* Headline & Branding */}
            <div className="space-y-2">
              <span className="badge badge-dot b-ok">
                Snímač připraven k náboru dat
              </span>
              <h2 className="text-2xl sm:text-[32px] leading-tight font-semibold tracking-tight">
                DATART Chat Insights & Parser
              </h2>
              <p className="text-[13px] sm:text-sm text-fg-muted max-w-2xl">
                Pokročilý auditní analytický nástroj pro inspekci, vyhledávání a hodnocení konverzací s asistentem. Chaty se načtou po zavedení JSON souboru z počítače.
              </p>
            </div>

            {/* Direct JSON Import/Upload Panel */}
            <div className="w-full">
              <div className="panel p-4 sm:p-5">
                <div className="space-y-0.5 mb-4">
                  <h3 className="section-label">Načíst data z počítače</h3>
                  <p className="text-xs text-fg-subtle">Zvolte nebo přetáhněte exportovaný .json soubor s konverzačními záznamy, případně vložte raw JSON text níže.</p>
                </div>
                
                <JSONImportExport onImport={handleImportChats} onReset={handleResetToDefault} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Original Dashboard Workspace with loaded data */
        <>
          <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden md:min-h-0 relative">
            
            {/* LEFT COLUMN: Sidebar Chat Explorer List (320px) */}
            <aside className="w-full md:w-85 border-b md:border-b-0 md:border-r border-line bg-surface-1/60 flex flex-col shrink-0 md:overflow-hidden">
              
              {/* Collapsible Importer triggered right here inline for perfect flow */}
              <AnimatePresence>
                {isImporterOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-b border-line bg-bg p-4"
                  >
                    <JSONImportExport 
                      onImport={handleImportChats} 
                      onReset={handleResetToDefault} 
                      onClose={() => setIsImporterOpen(false)} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

               <div className="p-4 border-b border-line">
                 {/* Collapsible Header */}
                 <div className="flex items-center justify-between">
                   <button
                     onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                     className="flex items-center gap-2 text-[13px] font-semibold text-fg hover:text-accent transition-colors cursor-pointer select-none"
                   >
                     <SlidersHorizontal className="w-4 h-4 text-accent" />
                     <span>Filtry a řazení</span>
                     {isAnyFilterActive && (
                       <span className="badge badge-dot b-accent !h-5 !text-[11px]">
                         aktivní
                       </span>
                     )}
                   </button>
                   <button
                     onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                     className="btn btn-icon !w-7 !h-7"
                     title={isFiltersExpanded ? "Sbalit filtry" : "Rozbalit filtry"}
                   >
                     {isFiltersExpanded ? (
                       <ChevronUp className="w-4 h-4" />
                     ) : (
                       <ChevronDown className="w-4 h-4" />
                     )}
                   </button>
                 </div>

                 <AnimatePresence initial={false}>
                   {isFiltersExpanded && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       transition={{ duration: 0.18 }}
                       className="space-y-3.5 pt-3.5"
                        style={{ overflow: isFiltersExpanded ? 'visible' : 'hidden' }}
                     >
                       {/* Search inputs */}
                       <div className="space-y-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Hledat podle ID chatu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-9 pr-8"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-fg-subtle pointer-events-none" />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-fg-subtle hover:text-fg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dedicated Message Search */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAppliedMsgSearch(msgSearchInput);
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Hledat ve zprávách..."
                        value={msgSearchInput}
                        onChange={(e) => setMsgSearchInput(e.target.value)}
                        className="input pl-9 pr-8"
                      />
                      <MessageSquare className="w-4 h-4 absolute left-3 top-2.5 text-fg-subtle pointer-events-none" />
                      {(msgSearchInput || appliedMsgSearch) && (
                        <button 
                          type="button"
                          onClick={() => {
                            setMsgSearchInput('');
                            setAppliedMsgSearch('');
                          }}
                          className="absolute right-2.5 top-2.5 text-fg-subtle hover:text-fg transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-secondary shrink-0"
                    >
                      Hledat
                    </button>
                  </form>
                  {appliedMsgSearch && (
                    <div className="text-xs text-accent flex items-center gap-1.5 bg-accent-soft rounded-row px-2.5 py-1.5 select-text">
                      <span className="shrink-0 font-medium text-fg-muted select-none">Filtr zpráv:</span>
                      <span className="truncate font-mono">"{appliedMsgSearch}"</span>
                    </div>
                  )}
                </div>

                {/* Active filters row with close button button */}
                {isAnyFilterActive && (
                  <div className="flex items-center justify-between text-xs pt-1.5 animate-in fade-in duration-150">
                    <span className="text-fg-muted text-xs">Aktivní filtry:</span>
                    <button
                      onClick={handleClearFilters}
                      className="btn btn-danger btn-sm !h-6 !px-2 !text-xs"
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                      Zrušit filtry
                    </button>
                  </div>
                )}

                {/* Filter grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="label">Verze asistentu</span>
                    <div className="relative">
                      <select
                        value={versionFilter}
                        onChange={(e) => setVersionFilter(e.target.value)}
                        className="input !h-8 pl-2.5 pr-7 text-[13px] cursor-pointer appearance-none"
                      >
                        <option value="all">Všechny verze</option>
                        {versions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-fg-subtle absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="label">Zpětná vazba</span>
                    <div className="relative">
                      <select
                        value={feedbackFilter}
                        onChange={(e) => setFeedbackFilter(e.target.value as any)}
                        className="input !h-8 pl-2.5 pr-7 text-[13px] cursor-pointer appearance-none"
                      >
                        <option value="all">Všechny feedbacky</option>
                        <option value="positive">Jen pozitivní</option>
                        <option value="negative">Jen negativní</option>
                        <option value="none">Bez feedbacku</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-fg-subtle absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Sledované období custom selectable dropdown */}
                <div className="relative">
                  <div className="relative">
                    <span className="block label mb-1">Sledované období</span>
                    
                    <button
                      onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                      type="button"
                      className="input !h-8 flex items-center justify-between px-2.5 text-[13px] hover:bg-surface-3 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {periodFilter === 'all' ? (
                          <Globe className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                        ) : periodFilter === 'today' ? (
                          <History className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                        ) : periodFilter === 'yesterday' ? (
                          <History className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                        ) : periodFilter === '2days' ? (
                          <History className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                        ) : periodFilter === 'custom' ? (
                          <SlidersHorizontal className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                        )}
                        <span className="truncate">{getPeriodLabel()}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-fg-subtle transition-transform duration-150 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Options Box */}
                  {isPeriodDropdownOpen && (
                    <>
                      {/* Backdrop to close list when clicked outside */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsPeriodDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-[58px] z-50 glass rounded-card shadow-[0_0_0_.5px_rgba(255,255,255,.14)_inset,0_40px_100px_-20px_rgba(0,0,0,.8)] overflow-y-auto max-h-64 p-1 flex flex-col divide-y divide-line">
                        
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setPeriodFilter('all');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'all' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Vše</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('today');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'today' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <History className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Dnes</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('yesterday');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'yesterday' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <History className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Včera</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('2days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '2days' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <History className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Poslední 2 dny</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('7days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '7days' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Posledních 7 dní</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('14days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '14days' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Posledních 14 dní</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('30days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '30days' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Posledních 30 dní</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('custom');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'custom' ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>Vlastní rozsah</span>
                          </button>
                        </div>

                        {availableMonths.length > 0 && (
                          <div className="py-1">
                            <div className="px-2.5 pt-1.5 pb-1 section-label">
                              Konkrétní měsíc
                            </div>
                            {availableMonths.map((m) => {
                              const isSelected = periodFilter === `month_${m.key}`;
                              return (
                                <button
                                  key={m.key}
                                  onClick={() => {
                                    setPeriodFilter(`month_${m.key}`);
                                    setIsPeriodDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-row text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                                    isSelected ? 'bg-accent-soft text-fg font-medium' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                                  }`}
                                >
                                  <Calendar className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                                  <span>{m.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Custom range active inputs */}
                {periodFilter === 'custom' && (
                  <div className="p-3 bg-surface-2 hairline rounded-card space-y-2 mt-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="section-label">Vlastní rozsah</span>
                      <button 
                        onClick={() => {
                          setPeriodFilter('all');
                          setCustomFromDate('');
                          setCustomToDate('');
                        }}
                        className="text-xs text-danger hover:opacity-80 cursor-pointer font-medium"
                      >
                        Zrušit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="label">Od:</span>
                        <input
                          type="date"
                          value={customFromDate}
                          onChange={(e) => setCustomFromDate(e.target.value)}
                          className="input !h-8 px-2 text-[13px] num"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="label">Do:</span>
                        <input
                          type="date"
                          value={customToDate}
                          onChange={(e) => setCustomToDate(e.target.value)}
                          className="input !h-8 px-2 text-[13px] num"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sorter tabs */}
                <div className="flex items-center justify-between gap-2 text-xs text-fg-subtle pb-3 border-b border-line">
                  <span>Seřadit dle:</span>
                  <div className="inline-flex p-[3px] gap-0.5 rounded-button bg-white/[.06] hairline">
                    <button
                      onClick={() => handleSortChange('latest_date')}
                      className={`cursor-pointer px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors ${sortField === 'latest_date' ? 'bg-surface-3 text-fg shadow-[0_1px_2px_rgba(0,0,0,.4),0_0_0_.5px_rgba(255,255,255,.14)_inset]' : 'text-fg-muted hover:text-fg'}`}
                    >
                      Data {sortField === 'latest_date' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => handleSortChange('message_count')}
                      className={`cursor-pointer px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors ${sortField === 'message_count' ? 'bg-surface-3 text-fg shadow-[0_1px_2px_rgba(0,0,0,.4),0_0_0_.5px_rgba(255,255,255,.14)_inset]' : 'text-fg-muted hover:text-fg'}`}
                    >
                      Zpráv {sortField === 'message_count' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => handleSortChange('chat_id')}
                      className={`cursor-pointer px-2.5 py-1 rounded-[7px] text-xs font-medium transition-colors ${sortField === 'chat_id' ? 'bg-surface-3 text-fg shadow-[0_1px_2px_rgba(0,0,0,.4),0_0_0_.5px_rgba(255,255,255,.14)_inset]' : 'text-fg-muted hover:text-fg'}`}
                    >
                      ID {sortField === 'chat_id' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                  </div>
                </div>

                {/* Selection Controls Row */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleToggleSelectAllFiltered}
                      className="p-1 select-none cursor-pointer"
                      title={isAllFilteredChecked ? 'Odznačit vše' : 'Označit vše v tomto filtru'}
                    >
                      <div className="checkbox" data-checked={isAllFilteredChecked}>
                        {isAllFilteredChecked && (
                          <svg className="w-2.5 h-2.5 text-white fill-current stroke-[3]" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <span className="text-fg-muted num">
                      {checkedChatIds.length > 0 ? `Výběr: ${checkedChatIds.length}` : 'Vybrat vše'}
                    </span>
                  </div>

                  {checkedChatIds.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopySelectedIds}
                        className={`btn btn-sm !h-7 ${copiedSelectIds ? 'b-ok' : 'btn-secondary'}`}
                        title="Zkopírovat ID označených chatů do schránky"
                      >
                        {copiedSelectIds ? (
                          <>
                            <Check className="shrink-0" />
                            <span>Zkopírováno!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="shrink-0" />
                            <span>Zkopírovat ID ({checkedChatIds.length})</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={exportSelectedToJSONFile}
                        className="btn btn-secondary btn-sm !h-7"
                        title="Exportovat označené chyby"
                      >
                        <FileDown className="shrink-0" />
                        <span>Exportovat</span>
                      </button>
                      <button
                        onClick={() => setCheckedChatIds([])}
                        className="btn btn-ghost btn-sm !h-7 !text-fg-muted"
                      >
                        Zrušit
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

              {/* Chat list viewport */}
              <div className="flex-1 overflow-y-auto py-1 max-h-[60dvh] md:max-h-none">
                {filteredChats.length > 0 ? (
                  paginatedChats.map((c) => {
                    const isSelected = c.chat_id === selectedChatId;
                    return (
                      <div key={c.chat_id} className="relative group/wrapper">
                        <ChatCard
                          chat={c}
                          isSelected={isSelected}
                          isChecked={checkedChatIds.includes(c.chat_id)}
                          onToggleCheck={() => handleToggleCheckedChat(c.chat_id)}
                          onClick={() => setSelectedChatId(c.chat_id)}
                        />
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(c.chat_id);
                          }}
                          className="absolute right-5 top-1/2 -translate-y-1/2 p-2 bg-surface-2 hairline text-fg-muted hover:text-danger rounded-row transition-all opacity-0 group-hover/wrapper:opacity-100 focus-visible:opacity-100 cursor-pointer"
                          title="Smazat chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-fg-muted text-[13px] flex flex-col items-center justify-center gap-2">
                    <p className="font-medium">Nenalezeny žádné chaty</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setVersionFilter('all');
                        setFeedbackFilter('all');
                      }}
                      className="btn btn-secondary btn-sm mt-1"
                    >
                      Resetovat filtry
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky bottom pagination panel */}
              <div className="px-4 py-3 border-t border-line text-xs flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2 text-fg-muted num">
                  <span>
                    {filteredChats.length > 0 ? (
                      <>
                        Zobrazeno <span className="text-fg font-medium">{(startIndex + 1).toLocaleString('cs-CZ')}–{endIndex.toLocaleString('cs-CZ')}</span>{' '}
                        z <span className="text-fg font-medium">{filteredChats.length.toLocaleString('cs-CZ')}</span>
                        {filteredChats.length !== chats.length ? (
                          <span className="text-fg-subtle"> (z celkem {chats.length.toLocaleString('cs-CZ')}, {chats.length ? Math.round((filteredChats.length / chats.length) * 100) : 0} %)</span>
                        ) : (
                          <span className="text-fg-subtle"> (celkem)</span>
                        )}
                      </>
                    ) : (
                      <>
                        Nenalezeno nic <span className="text-fg-subtle">(z celkem {chats.length.toLocaleString('cs-CZ')}, 0 %)</span>
                      </>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-fg-subtle whitespace-nowrap">Na stranu:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="input !h-7 !w-auto px-1.5 text-xs num cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Předchozí</span>
                    </button>

                    <div className="text-fg-muted num">
                      <span className="text-fg font-medium">{currentPage}</span> / <span>{totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>Další</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT COLUMN: Chat Detailed Messages Flow */}
            <section className="flex-1 flex flex-col overflow-hidden relative h-[85dvh] md:h-auto">
              {selectedChat ? (
                <div className="flex flex-col h-full overflow-hidden">
                  
                  {/* Detail Header in style of Clean Minimalism sample */}
                  <div className="px-4 sm:px-6 py-4 border-b border-line flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[13px] font-semibold font-mono shrink-0">
                        {selectedChat.chat_id.slice(-2) || 'CH'}
                      </div>
                      <div>
                        <h2 className="font-semibold tracking-tight leading-tight text-base sm:text-xl flex items-center gap-2">
                          Konverzace #{selectedChat.chat_id}
                        </h2>
                        <p className="text-[13px] text-fg-muted num mt-0.5">
                          Verze: <span className="font-mono text-fg">{selectedChat.nejvyssi_verze}</span> • Celkem {selectedChat.totalMessages.toLocaleString('cs-CZ')} zpráv
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Interactive inline search within active conversation */}
                      <div className="relative flex items-center h-9 rounded-full bg-glass hairline focus-within:shadow-[0_0_0_1px_#0a84ff_inset,0_0_0_3px_rgba(10,132,255,.45)] px-3.5 transition-shadow text-[13px]">
                        <Search className="w-4 h-4 text-fg-subtle mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="Hledat v chatu..."
                          value={chatSearchQuery}
                          onChange={handleChatSearchChange}
                          onKeyDown={handleChatSearchKeyDown}
                          className="bg-transparent border-none outline-none text-[13px] text-fg placeholder:text-fg-subtle caret-accent w-28 sm:w-36 md:w-44 focus:shadow-none p-0"
                          title="Vyhledávat v této konverzaci. Navigace: Šipky Nahoru/Dolů nebo Enter"
                        />
                        {chatSearchQuery && (
                          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-line shrink-0 select-none">
                            <span className="text-xs text-fg-muted num min-w-[32px] text-center">
                              {chatSearchResults.length > 0 ? `${activeSearchIndex + 1}/${chatSearchResults.length}` : '0/0'}
                            </span>
                            <button
                              onClick={handlePrevSearchOccur}
                              disabled={chatSearchResults.length === 0}
                              className="p-1 hover:bg-white/[.07] disabled:opacity-30 text-fg-muted hover:text-fg rounded-[6px] transition-colors cursor-pointer"
                              title="Předchozí výskyt (Šipka Nahoru)"
                            >
                              <ArrowUp className="w-3" style={{ height: '12px' }} />
                            </button>
                            <button
                              onClick={handleNextSearchOccur}
                              disabled={chatSearchResults.length === 0}
                              className="p-1 hover:bg-white/[.07] disabled:opacity-30 text-fg-muted hover:text-fg rounded-[6px] transition-colors cursor-pointer"
                              title="Další výskyt (Šipka Dolů / Enter)"
                            >
                              <ArrowDown className="w-3" style={{ height: '12px' }} />
                            </button>
                            <button
                              onClick={handleClearChatSearch}
                              className="p-1 hover:bg-white/[.07] text-fg-muted hover:text-danger rounded-[6px] transition-colors cursor-pointer"
                              title="Zrušit hledání"
                            >
                              <X className="w-3" style={{ height: '12px' }} />
                            </button>
                          </div>
                        )}
                      </div>

                      {selectedChat.hasPositiveFeedback && (
                        <span className="hidden lg:inline-flex badge b-ok">
                          <ThumbsUp className="w-3 h-3" />
                          Oceněn
                        </span>
                      )}
                      {selectedChat.hasNegativeFeedback && (
                        <span className="hidden lg:inline-flex badge b-err">
                          <ThumbsDown className="w-3 h-3" />
                          Stížnost
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteChat(selectedChat.chat_id)}
                        className="btn btn-secondary !w-9 !px-0 !text-fg-muted hover:!text-danger"
                        title="Odstranit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic stats line just below header */}
                  <div className="px-6 py-2 border-b border-line hidden sm:flex items-center justify-between gap-4 text-xs text-fg-subtle num">
                    <div className="flex gap-4">
                      <span>První kontakt: {selectedChat.firstMessageDate?.toLocaleString('cs-CZ')}</span>
                      <span>Poslední aktivita: {selectedChat.lastMessageDate?.toLocaleString('cs-CZ')}</span>
                    </div>
                    <span>Uživatel: {selectedChat.humanMessagesCount} | AI: {selectedChat.aiMessagesCount}</span>
                  </div>

                  {/* Audit Navigation Scroll Bar */}
                  {(selectedChatPositiveMessages.length > 0 || selectedChatNegativeMessages.length > 0) && (
                    <div className="px-4 sm:px-6 py-2.5 border-b border-line flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-fg-muted">Rychlé přeskoky na zpětnou vazbu:</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedChatPositiveMessages.length > 0 && (
                          <button
                            onClick={handleScrollToPositive}
                            className="btn btn-sm b-ok hover:brightness-125"
                            title="Posunout na další pozitivní hodnocení"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Přejít na pozitivní ({selectedChatPositiveMessages.length})</span>
                            <span className="num text-xs opacity-80">
                              {(currentPositiveIdx % selectedChatPositiveMessages.length) + 1}/{selectedChatPositiveMessages.length}
                            </span>
                          </button>
                        )}

                        {selectedChatNegativeMessages.length > 0 && (
                          <button
                            onClick={handleScrollToNegative}
                            className="btn btn-sm b-err hover:brightness-125"
                            title="Posunout na další negativní hodnocení / stížnost"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Přejít na negativní ({selectedChatNegativeMessages.length})</span>
                            <span className="num text-xs opacity-80">
                              {(currentNegativeIdx % selectedChatNegativeMessages.length) + 1}/{selectedChatNegativeMessages.length}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conversation messages scroll window */}
                  <div className="flex-1 px-4 py-5 sm:p-8 space-y-6 overflow-y-auto">
                    {selectedChat.messages.map((message) => (
                      <MessageBubble 
                        key={message.message_id} 
                        message={message} 
                        isHighlighted={message.message_id === activeHighlightedMessageId}
                        searchTerm={chatSearchQuery}
                      />
                    ))}
                  </div>

                  {/* Audit Footer Info */}
                  <div className="px-4 sm:px-6 py-3 border-t border-line shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0"></span>
                        <span className="text-fg-subtle text-xs">Prohlížíte auditní záznam konverzace. Zpětná vazba je načtena přímo ze statických logů.</span>
                      </div>
                      <HelpCircle className="w-4 h-4 text-fg-subtle shrink-0" />
                    </div>
                  </div>

                </div>
              ) : (
                /* Beautiful Empty Block */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                  <span className="w-[52px] h-[52px] rounded-full bg-accent-soft text-accent grid place-items-center"><Compass className="w-6 h-6" strokeWidth={1.8} /></span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">Zvolte konverzaci</h3>
                    <p className="text-sm text-fg-muted mt-1 max-w-sm">
                      Pro zobrazení interaktivního toku zpráv s doporučenými Datart produkty, auditními údaji a statistikami vyberte chat z levého sloupce.
                    </p>
                  </div>
                </div>
              )}
            </section>

          </main>

          {/* Stats Section row */}
          <div className="px-4 sm:px-6 py-3 border-t border-line shrink-0">
            <StatsSection chats={filteredChats} totalChatsCountAll={chats.length} />
          </div>
        </>
      )}

      {/* Bottom Status Bar matching exactly the sample */}
      <footer className="min-h-8 py-1.5 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 sm:px-6 text-xs text-fg-subtle shrink-0">
        <div className="flex gap-4">
          <span>Status: <span className="text-success">Synchronizováno</span></span>
          <span>Aktivní filtr: <span className="text-fg-muted">
            {chats.length === 0 ? 'Žádná data' : (searchQuery ? 'Vyhledávání' : (versionFilter !== 'all' || feedbackFilter !== 'all' ? 'Aktivní' : 'Vypnut'))}
          </span></span>
        </div>
        <div>
          AI Statistiky · © 2026 Jan Kuchař
        </div>
      </footer>
    </div>
  );
}
