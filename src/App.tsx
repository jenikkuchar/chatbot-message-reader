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
    <div className="h-screen max-h-screen bg-[#0d131e] text-slate-200 font-sans flex flex-col overflow-hidden select-none antialiased">
      
      {/* Top Navigation / Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-end justify-center gap-[3px] p-1.5 select-none shrink-0 shadow-lg shadow-blue-500/10">
            <div className="w-[3px] h-2 bg-white rounded-full"></div>
            <div className="w-[3px] h-3.5 bg-white rounded-full"></div>
            <div className="w-[3px] h-5 bg-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-white uppercase flex items-center gap-1.5">
              <span className="font-bold">DATART Inspector</span>
              <span className="text-slate-400 font-normal">| AI Statistiky</span>
              <span className="text-[9px] font-mono bg-blue-950/60 text-blue-400 border border-blue-900/30 px-1.5 py-0.2 rounded normal-case tracking-normal ml-1">v1.1</span>
            </h1>
            <p className="text-[10px] text-slate-450 font-mono -mt-0.5">DATART insights & logs parser</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {chats.length > 0 && !isLoading && (
            <>
              <button
                onClick={() => setIsImporterOpen(!isImporterOpen)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-100 transition-colors uppercase tracking-wider cursor-pointer active:scale-95"
              >
                {isImporterOpen ? 'Zavřít panel' : 'Importovat JSON'}
              </button>

              <div className="hidden md:block h-4 w-[1px] bg-slate-800"></div>
              <span className="hidden md:inline text-xs text-slate-400 font-mono">
                {isAnyFilterActive ? (
                  <>Nalezeno: <span className="text-blue-400 font-bold">{filteredChats.length}</span> z {chats.length} chatů <span className="text-blue-400">({chats.length ? Math.round((filteredChats.length / chats.length) * 100) : 0}%)</span></>
                ) : (
                  <>Celkem: {chats.length} chatů</>
                )}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      {isLoading ? (
        /* Loader block */
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d131e] text-center select-none">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Animated spinning outline */}
            <div className="absolute inset-0 border-4 border-slate-800/80 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-blue-500 border-r-blue-500/20 rounded-full animate-spin"></div>
            
            {/* Percentage Indicator */}
            <span className="text-base font-mono font-bold text-slate-100">{loadingProgress}%</span>
          </div>
          
          <div className="space-y-2 max-w-md">
            <h3 className="text-white font-semibold text-sm font-mono tracking-wider uppercase">Provádím analýzu dat...</h3>
            <p className="text-xs text-slate-400 font-mono italic animate-pulse h-4">{loadingText}</p>
          </div>

          {/* Progressive visual bar */}
          <div className="w-60 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-6 border border-slate-800">
            <div 
              className="h-full bg-blue-600 transition-all duration-150" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      ) : chats.length === 0 ? (
        /* Startup Landing Page */
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto bg-[#0d131e]">
          <div className="max-w-4xl w-full space-y-8 my-auto select-none">
            {/* Headline & Branding */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5" />
                Snímač připraven k náboru dat
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                DATART Chat Insights & Parser
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Pokročilý auditní analytický nástroj pro inspekci, vyhledávání a hodnocení konverzací s asistentem. Chaty se načtou po zavedení JSON souboru z počítače.
              </p>
            </div>

            {/* Direct JSON Import/Upload Panel */}
            <div className="max-w-3xl mx-auto w-full">
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
                <div className="space-y-1 mb-4">
                  <h3 className="text-sm font-semibold text-slate-200">Načíst data z počítače</h3>
                  <p className="text-xs text-slate-500">Zvolte nebo přetáhněte exportovaný .json soubor s konverzačními záznamy, případně vložte raw JSON text níže.</p>
                </div>
                
                <JSONImportExport onImport={handleImportChats} onReset={handleResetToDefault} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Original Dashboard Workspace with loaded data */
        <>
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* LEFT COLUMN: Sidebar Chat Explorer List (320px) */}
            <aside className="w-full md:w-85 border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0 overflow-hidden">
              
              {/* Collapsible Importer triggered right here inline for perfect flow */}
              <AnimatePresence>
                {isImporterOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-b border-slate-800 bg-slate-950 p-4"
                  >
                    <JSONImportExport 
                      onImport={handleImportChats} 
                      onReset={handleResetToDefault} 
                      onClose={() => setIsImporterOpen(false)} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

               <div className="p-4 border-b border-slate-800 bg-slate-900/40">
                 {/* Collapsible Header */}
                 <div className="flex items-center justify-between">
                   <button
                     onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                     className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 tracking-wider uppercase hover:text-white transition-colors cursor-pointer select-none"
                   >
                     <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                     <span>Filtry a Řazení</span>
                     {isAnyFilterActive && (
                       <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-semibold px-1.5 py-0.5 rounded-full lowercase normal-case">
                         aktivní
                       </span>
                     )}
                   </button>
                   <button
                     onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                     className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-8 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-150"
                      />
                      <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                      {(msgSearchInput || appliedMsgSearch) && (
                        <button 
                          type="button"
                          onClick={() => {
                            setMsgSearchInput('');
                            setAppliedMsgSearch('');
                          }}
                          className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-bold rounded-lg text-white transition-all cursor-pointer select-none flex items-center justify-center shrink-0 border border-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.25)]"
                    >
                      Hledat
                    </button>
                  </form>
                  {appliedMsgSearch && (
                    <div className="text-[10px] text-blue-400 font-mono flex items-center gap-1 bg-blue-950/30 border border-blue-900/40 rounded px-2 py-1 select-text">
                      <span className="shrink-0 font-bold uppercase text-[8px] text-blue-500 select-none">Filtr zpráv:</span>
                      <span className="truncate">"{appliedMsgSearch}"</span>
                    </div>
                  )}
                </div>

                {/* Active filters row with close button button */}
                {isAnyFilterActive && (
                  <div className="flex items-center justify-between text-xs pt-1.5 animate-in fade-in duration-150">
                    <span className="text-slate-400 font-medium text-[11px]">Aktivní filtry:</span>
                    <button
                      onClick={handleClearFilters}
                      className="text-[11.5px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer select-none font-sans font-bold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                      Zrušit filtry
                    </button>
                  </div>
                )}

                {/* Filter grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Verze asistentu</span>
                    <div className="relative">
                      <select
                        value={versionFilter}
                        onChange={(e) => setVersionFilter(e.target.value)}
                        className="w-full text-slate-300 bg-slate-800 text-[11px] pl-2 pr-6 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 font-mono cursor-pointer appearance-none"
                      >
                        <option value="all">Všechny verze</option>
                        {versions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-slate-550 font-bold uppercase tracking-wider">Zpětná vazba</span>
                    <div className="relative">
                      <select
                        value={feedbackFilter}
                        onChange={(e) => setFeedbackFilter(e.target.value as any)}
                        className="w-full text-slate-300 bg-slate-800 text-[11px] pl-2 pr-6 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 font-mono cursor-pointer appearance-none"
                      >
                        <option value="all">Všechny feedbacky</option>
                        <option value="positive">Jen pozitivní 👍</option>
                        <option value="negative">Jen negativní 👎</option>
                        <option value="none">Bez feedbacku</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Sledované období custom selectable dropdown */}
                <div className="relative">
                  <div className="relative">
                    <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-0.5">Sledované období</span>
                    
                    <button
                      onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                      type="button"
                      className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 px-3 py-1.5 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-750 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {periodFilter === 'all' ? (
                          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : periodFilter === 'today' ? (
                          <History className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        ) : periodFilter === 'yesterday' ? (
                          <History className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : periodFilter === '2days' ? (
                          <History className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : periodFilter === 'custom' ? (
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        <span className="truncate">{getPeriodLabel()}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
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
                      <div className="absolute left-0 right-0 top-[52px] z-50 bg-[#141d2e] border border-slate-700 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.8)] overflow-y-auto max-h-64 py-1 flex flex-col divide-y divide-slate-800/40">
                        
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setPeriodFilter('all');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Vše</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('today');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'today' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <History className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>Dnes</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('yesterday');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'yesterday' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <History className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>Včera</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('2days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '2days' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <History className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>Poslední 2 dny</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('7days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '7days' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Posledních 7 dní</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('14days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '14days' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Posledních 14 dní</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('30days');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === '30days' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Posledních 30 dní</span>
                          </button>

                          <button
                            onClick={() => {
                              setPeriodFilter('custom');
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                              periodFilter === 'custom' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Vlastní rozsah</span>
                          </button>
                        </div>

                        {availableMonths.length > 0 && (
                          <div className="py-1">
                            <div className="px-3 py-1 text-[8px] font-mono uppercase tracking-wider font-bold text-slate-500">
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
                                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                                    isSelected ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                                  }`}
                                >
                                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
                  <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg space-y-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-150 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-505 uppercase tracking-wider font-mono">Vlastní rozsah</span>
                      <button 
                        onClick={() => {
                          setPeriodFilter('all');
                          setCustomFromDate('');
                          setCustomToDate('');
                        }}
                        className="text-[10px] text-rose-450 hover:text-rose-350 cursor-pointer font-semibold"
                      >
                        Zrušit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-500 font-mono">Od:</span>
                        <input
                          type="date"
                          value={customFromDate}
                          onChange={(e) => setCustomFromDate(e.target.value)}
                          className="bg-slate-805 border border-slate-705 rounded px-1.5 py-1 text-slate-205 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-500 font-mono">Do:</span>
                        <input
                          type="date"
                          value={customToDate}
                          onChange={(e) => setCustomToDate(e.target.value)}
                          className="bg-slate-850 border border-slate-700 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sorter tabs */}
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider pb-3 border-b border-slate-800/40">
                  <span>Seřadit dle:</span>
                  <div className="flex gap-2.5 font-mono">
                    <button
                      onClick={() => handleSortChange('latest_date')}
                      className={`cursor-pointer ${sortField === 'latest_date' ? 'text-blue-400 font-semibold' : 'hover:text-slate-300'}`}
                    >
                      Data {sortField === 'latest_date' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => handleSortChange('message_count')}
                      className={`cursor-pointer ${sortField === 'message_count' ? 'text-blue-400 font-semibold' : 'hover:text-slate-300'}`}
                    >
                      Zpráv {sortField === 'message_count' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                    <button
                      onClick={() => handleSortChange('chat_id')}
                      className={`cursor-pointer ${sortField === 'chat_id' ? 'text-blue-400 font-semibold' : 'hover:text-slate-300'}`}
                    >
                      ID {sortField === 'chat_id' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </button>
                  </div>
                </div>

                {/* Selection Controls Row */}
                <div className="flex items-center justify-between gap-2 pt-2 text-[10px] uppercase font-bold tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleToggleSelectAllFiltered}
                      className="p-1 select-none cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
                      title={isAllFilteredChecked ? 'Odznačit vše' : 'Označit vše v tomto filtru'}
                    >
                      <div
                        className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all duration-150 ${
                          isAllFilteredChecked
                            ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-905'
                        }`}
                      >
                        {isAllFilteredChecked && (
                          <svg className="w-2.5 h-2.5 text-white fill-current stroke-[3]" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <span className="text-slate-450 font-mono font-semibold">
                      {checkedChatIds.length > 0 ? `Výběr: ${checkedChatIds.length}` : 'Vybrat vše'}
                    </span>
                  </div>

                  {checkedChatIds.length > 0 && (
                    <div className="flex items-center gap-1.5 normal-case font-mono bg-slate-950/45 p-1 rounded-lg border border-slate-800/40">
                      <button
                        onClick={handleCopySelectedIds}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-slate-950 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          copiedSelectIds 
                            ? 'bg-emerald-500 hover:bg-emerald-450 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] text-slate-950' 
                            : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)] text-white'
                        }`}
                        title="Zkopírovat ID označených chatů do schránky"
                      >
                        {copiedSelectIds ? (
                          <>
                            <Check className="w-2.5 h-2.5 shrink-0" />
                            <span>Zkopírováno!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5 shrink-0" />
                            <span>Zkopírovat ID ({checkedChatIds.length})</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={exportSelectedToJSONFile}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] text-slate-950 text-[10px] font-bold rounded transition-all cursor-pointer"
                        title="Exportovat označené chyby"
                      >
                        <FileDown className="w-2.5 h-2.5 shrink-0" />
                        <span>Exportovat</span>
                      </button>
                      <button
                        onClick={() => setCheckedChatIds([])}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] rounded transition-colors cursor-pointer"
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
              <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 rounded transition-all opacity-0 group-hover/wrapper:opacity-100 cursor-pointer"
                          title="Smazat chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                    <p className="font-medium">Nenalezeny žádné chaty</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setVersionFilter('all');
                        setFeedbackFilter('all');
                      }}
                      className="mt-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-slate-300 cursor-pointer"
                    >
                      Resetovat filtry
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky bottom pagination panel */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-slate-400 font-mono">
                  <span>
                    {filteredChats.length > 0 ? (
                      <>
                        Zobrazeno <span className="text-white font-semibold">{startIndex + 1}–{endIndex}</span>{' '}
                        z <span className="text-blue-400 font-semibold">{filteredChats.length}</span>
                        {filteredChats.length !== chats.length ? (
                          <span className="text-slate-500 text-[10px]"> (z celkem {chats.length}, {chats.length ? Math.round((filteredChats.length / chats.length) * 100) : 0}%)</span>
                        ) : (
                          <span className="text-slate-500 text-[10px]"> (celkem)</span>
                        )}
                      </>
                    ) : (
                      <>
                        Nenalezeno nic <span className="text-slate-500 text-[10px]">(z celkem {chats.length}, 0%)</span>
                      </>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px]">Na stranu:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded text-slate-300 px-1 py-0.5 font-mono text-[10px] focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded disabled:opacity-30 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-colors flex items-center gap-1 select-none cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Předchozí</span>
                    </button>

                    <div className="font-mono text-slate-400">
                      <span className="text-white font-semibold">{currentPage}</span> / <span className="text-slate-450">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded disabled:opacity-30 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-colors flex items-center gap-1 select-none cursor-pointer"
                    >
                      <span>Další</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT COLUMN: Chat Detailed Messages Flow */}
            <section className="flex-1 bg-[#0d131e] flex flex-col overflow-hidden relative">
              {selectedChat ? (
                <div className="flex flex-col h-full overflow-hidden">
                  
                  {/* Detail Header in style of Clean Minimalism sample */}
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#0d131e] shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold uppercase italic font-mono">
                        {selectedChat.chat_id.slice(-2) || 'CH'}
                      </div>
                      <div>
                        <h2 className="text-white font-semibold leading-tight text-sm sm:text-base flex items-center gap-2">
                          Konverzace #{selectedChat.chat_id}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Verze: <span className="font-mono text-slate-400">{selectedChat.nejvyssi_verze}</span> • Celkem {selectedChat.totalMessages} zpráv
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Interactive inline search within active conversation */}
                      <div className="relative flex items-center bg-slate-900 border border-slate-800 focus-within:border-blue-500/80 rounded-lg px-2.5 py-1.5 transition-all text-xs">
                        <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="Hledat v chatu..."
                          value={chatSearchQuery}
                          onChange={handleChatSearchChange}
                          onKeyDown={handleChatSearchKeyDown}
                          className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-550 w-24 sm:w-36 md:w-44 font-sans focus:ring-0 p-0"
                          title="Vyhledávat v této konverzaci. Navigace: Šipky Nahoru/Dolů nebo Enter"
                        />
                        {chatSearchQuery && (
                          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800 shrink-0 select-none">
                            <span className="text-[10px] text-slate-450 font-mono font-medium min-w-[28px] text-center">
                              {chatSearchResults.length > 0 ? `${activeSearchIndex + 1}/${chatSearchResults.length}` : '0/0'}
                            </span>
                            <button
                              onClick={handlePrevSearchOccur}
                              disabled={chatSearchResults.length === 0}
                              className="p-0.5 hover:bg-slate-800 disabled:opacity-20 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                              title="Předchozí výskyt (Šipka Nahoru)"
                            >
                              <ArrowUp className="w-3" style={{ height: '12px' }} />
                            </button>
                            <button
                              onClick={handleNextSearchOccur}
                              disabled={chatSearchResults.length === 0}
                              className="p-0.5 hover:bg-slate-800 disabled:opacity-20 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                              title="Další výskyt (Šipka Dolů / Enter)"
                            >
                              <ArrowDown className="w-3" style={{ height: '12px' }} />
                            </button>
                            <button
                              onClick={handleClearChatSearch}
                              className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Zrušit hledání"
                            >
                              <X className="w-3" style={{ height: '12px' }} />
                            </button>
                          </div>
                        )}
                      </div>

                      {selectedChat.hasPositiveFeedback && (
                        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-900/40 text-emerald-400 text-[10px] font-mono font-semibold">
                          👍 Oceněn
                        </span>
                      )}
                      {selectedChat.hasNegativeFeedback && (
                        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-955/80 border border-rose-900/40 text-rose-400 text-[10px] font-mono font-semibold">
                          👎 Stížnost
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteChat(selectedChat.chat_id)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer active:scale-90"
                        title="Odstranit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic stats line just below header */}
                  <div className="px-6 py-2 bg-slate-900/40 border-b border-slate-800/60 hidden sm:flex items-center justify-between text-[11px] font-mono text-slate-550">
                    <div className="flex gap-4">
                      <span>První kontakt: {selectedChat.firstMessageDate?.toLocaleString('cs-CZ')}</span>
                      <span>Poslední aktivita: {selectedChat.lastMessageDate?.toLocaleString('cs-CZ')}</span>
                    </div>
                    <span>Uživatel: {selectedChat.humanMessagesCount} | AI: {selectedChat.aiMessagesCount}</span>
                  </div>

                  {/* Audit Navigation Scroll Bar */}
                  {(selectedChatPositiveMessages.length > 0 || selectedChatNegativeMessages.length > 0) && (
                    <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Rychlé přeskoky na zpětnou vazbu:</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedChatPositiveMessages.length > 0 && (
                          <button
                            onClick={handleScrollToPositive}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900/60 border border-emerald-950 text-emerald-400 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer active:scale-95"
                            title="Posunout na další pozitivní hodnocení"
                          >
                            <ThumbsUp className="w-3 h-3 fill-current text-emerald-550" />
                            <span>Přejít na pozitivní ({selectedChatPositiveMessages.length})</span>
                            <span className="bg-emerald-900/85 px-1.5 py-0.2 rounded text-[9px] text-emerald-300">
                              {(currentPositiveIdx % selectedChatPositiveMessages.length) + 1}/{selectedChatPositiveMessages.length}
                            </span>
                          </button>
                        )}

                        {selectedChatNegativeMessages.length > 0 && (
                          <button
                            onClick={handleScrollToNegative}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-955/85 hover:bg-rose-900/65 border border-rose-950 text-rose-405 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer active:scale-95"
                            title="Posunout na další negativní hodnocení / stížnost"
                          >
                            <ThumbsDown className="w-3 h-3 fill-current text-rose-550" />
                            <span>Přejít na negativní ({selectedChatNegativeMessages.length})</span>
                            <span className="bg-rose-900/85 px-1.5 py-0.2 rounded text-[9px] text-rose-300">
                              {(currentNegativeIdx % selectedChatNegativeMessages.length) + 1}/{selectedChatNegativeMessages.length}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conversation messages scroll window */}
                  <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-950/20">
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
                  <div className="p-6 border-t border-slate-800 bg-slate-900/30 shrink-0">
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500/80"></span>
                        <span className="text-slate-400 text-xs font-sans">Prohlížíte auditní záznam konverzace. Zpětná vazba je načtena přímo ze statických logů.</span>
                      </div>
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                </div>
              ) : (
                /* Beautiful Empty Block */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-4">
                  <Compass className="w-12 h-12 text-blue-500/50 animate-spin-slow" />
                  <div>
                    <h3 className="text-white font-semibold text-base">Zvolte konverzaci</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Pro zobrazení interaktivního toku zpráv s doporučenými Datart produkty, auditními údaji a statistikami vyberte chat z levého sloupce.
                    </p>
                  </div>
                </div>
              )}
            </section>

          </main>

          {/* Stats Section row */}
          <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-800 shrink-0">
            <StatsSection chats={filteredChats} totalChatsCountAll={chats.length} />
          </div>
        </>
      )}

      {/* Bottom Status Bar matching exactly the sample */}
      <footer className="h-8 bg-blue-950/20 border-t border-slate-800 flex items-center justify-between px-6 text-[10px] text-slate-500 uppercase tracking-widest shrink-0 font-mono">
        <div className="flex gap-4">
          <span>Status: <span className="text-green-400 uppercase font-semibold">Synchronizováno</span></span>
          <span>Aktivní filtr: <span className="text-slate-300 font-bold">
            {chats.length === 0 ? 'Žádná data' : (searchQuery ? 'Vyhledávání' : (versionFilter !== 'all' || feedbackFilter !== 'all' ? 'Aktivní' : 'Vypnut'))}
          </span></span>
        </div>
        <div>
          © 2026 DATART Inspector — Made with Precision
        </div>
      </footer>
    </div>
  );
}
