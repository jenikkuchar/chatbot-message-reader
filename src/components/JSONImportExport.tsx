import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, Trash2, Check } from 'lucide-react';
import { Chat } from '../types';
import { parseUploadedJson } from '../utils/chatParser';

interface JSONImportExportProps {
  onImport: (chats: Chat[]) => void;
  onReset: () => void;
  onClose?: () => void;
}

export default function JSONImportExport({ onImport, onReset, onClose }: JSONImportExportProps) {
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!inputText.trim()) {
      setErrorMsg('Zadejte prosím nějaký text/JSON k načtení.');
      return;
    }
    try {
      const parsed = parseUploadedJson(inputText);
      if (parsed.length === 0) {
        throw new Error('Nepodařilo se nalézt žádné validní chaty.');
      }

      // Deduplicate chats based on chat_id
      const seenIds = new Set<string>();
      const uniqueChats: Chat[] = [];
      let duplicateCount = 0;

      parsed.forEach((chat) => {
        if (seenIds.has(chat.chat_id)) {
          duplicateCount++;
        } else {
          seenIds.add(chat.chat_id);
          uniqueChats.push(chat);
        }
      });

      onImport(uniqueChats);
      let msg = `Úspěšně naimportováno ${uniqueChats.length} chatů.`;
      if (duplicateCount > 0) {
        msg += ` (Odfiltrováno ${duplicateCount} duplicitních chatů v vloženém textu).`;
      }
      setSuccessMsg(msg);
      setInputText('');
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    readMultipleFiles(files);
  };

  const readMultipleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const allChats: Chat[] = [];
    const fileLoadErrors: string[] = [];
    const fileNames: string[] = [];

    // Promise-based FileReader
    const readFilePromise = (file: File): Promise<Chat[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const parsed = parseUploadedJson(text);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Soubor "${file.name}": ${(e as Error).message}`));
          }
        };
        reader.onerror = () => {
          reject(new Error(`Nepodařilo se přečíst soubor "${file.name}".`));
        };
        reader.readAsText(file);
      });
    };

    // Load each file sequentially to avoid concurrency text-reading edge cases
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileNames.push(file.name);
      try {
        const parsed = await readFilePromise(file);
        allChats.push(...parsed);
      } catch (err) {
        fileLoadErrors.push((err as Error).message);
      }
    }

    if (allChats.length === 0) {
      if (fileLoadErrors.length > 0) {
        setErrorMsg(`Nepodařilo se načíst žádná data. Chyby:\n${fileLoadErrors.join('\n')}`);
      } else {
        setErrorMsg('V nahraných souborech nebyly nalezeny žádné validní chaty.');
      }
      return;
    }

    // Deduplicate chats based on chat_id
    const seenIds = new Set<string>();
    const uniqueChats: Chat[] = [];
    let duplicateCount = 0;

    allChats.forEach((chat) => {
      if (seenIds.has(chat.chat_id)) {
        duplicateCount++;
      } else {
        seenIds.add(chat.chat_id);
        uniqueChats.push(chat);
      }
    });

    onImport(uniqueChats);

    let successStr = '';
    if (files.length === 1) {
      successStr = `Soubor "${fileNames[0]}" byl úspěšně naimportován. Načteno ${uniqueChats.length} chatů.`;
    } else {
      successStr = `Úspěšně naimportováno ${uniqueChats.length} jedinečných chatů z ${files.length} souborů.`;
    }

    if (duplicateCount > 0) {
      successStr += ` (Zdroje obsahovaly ${duplicateCount} duplicitních ID, která byla ignorována).`;
    }

    if (fileLoadErrors.length > 0) {
      setErrorMsg(`Některé soubory se nepodařilo načíst:\n${fileLoadErrors.join('\n')}`);
    }

    setSuccessMsg(successStr);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      readMultipleFiles(files);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" />
            Načíst vlastní JSON data
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Vložte JSON soubor nebo přímo text odpovídající struktuře s konverzacemi
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 select-none font-sans font-medium"
            >
              Zavřít panel
            </button>
          )}
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs bg-rose-955/45 hover:bg-rose-900/40 border border-rose-900/40 hover:border-rose-700 text-rose-300 rounded-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 select-none"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-455" />
            Vymazat všechny chaty
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column: Drag zone & File upload */}
        <div className="flex flex-col gap-3 justify-center">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[160px] ${
              isDragOver
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/75'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              multiple
              className="hidden"
            />
            <div className="p-3 bg-slate-900/80 rounded-full border border-slate-800 mb-3 text-slate-400">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm font-sans text-slate-300 font-medium">
              Přetáhněte sem .json soubor nebo klikněte pro procházení
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Podporuje pouze soubory typu .json
            </p>
          </div>
        </div>

        {/* Right column: Raw Paste JSON */}
        <div className="flex flex-col gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='Vložte sem raw JSON data... např: [{"chat_id": "123", ...}]'
            className="w-full h-[160px] bg-slate-950 text-slate-300 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors duration-150"
          />
          <button
            onClick={handleTextSubmit}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-sans font-semibold text-xs transition-colors duration-150 active:scale-[0.99] select-none cursor-pointer text-center font-bold"
          >
            Načíst a vložit JSON text
          </button>
        </div>
      </div>

      {/* Message alerts */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-900/50 rounded-lg flex items-start gap-2 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-lg flex items-start gap-2 text-emerald-300 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="font-medium">{successMsg}</div>
        </div>
      )}
    </div>
  );
}
