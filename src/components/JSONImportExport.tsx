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
    <div className="@container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-line">
        <div>
          <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent" />
            Načíst vlastní JSON data
          </h2>
          <p className="text-[13px] text-fg-muted mt-0.5">
            Vložte JSON soubor nebo přímo text odpovídající struktuře s konverzacemi
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Zavřít panel
            </button>
          )}
          <button
            onClick={onReset}
            className="btn btn-danger btn-sm"
          >
            <Trash2 />
            Vymazat všechny chaty
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-4">
        {/* Left column: Drag zone & File upload */}
        <div className="flex flex-col gap-3 justify-center">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-panel border border-dashed px-5 py-8 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer transition-colors duration-150 min-h-[200px] ${
              isDragOver
                ? 'border-accent bg-accent-soft'
                : 'border-line-3 bg-white/[.02] hover:border-accent hover:bg-accent-soft'
            }`}
            style={{ borderWidth: 1 }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              multiple
              className="hidden"
            />
            <span className="w-[52px] h-[52px] rounded-full bg-accent-soft text-accent grid place-items-center">
              <Upload className="w-6 h-6" strokeWidth={1.8} />
            </span>
            <p className="text-xl font-semibold tracking-tight text-balance mt-1.5">
              Přetáhněte sem .json soubor nebo klikněte pro procházení
            </p>
            <button type="button" className="btn btn-primary mt-1.5">
              <Upload />
              Vybrat soubory
            </button>
            <p className="text-xs text-fg-subtle mt-0.5">
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
            className="input h-auto min-h-[200px] flex-1 py-2.5 font-mono text-[12.5px] resize-none"
          />
          <button
            onClick={handleTextSubmit}
            className="btn btn-secondary w-full"
          >
            Načíst a vložit JSON text
          </button>
        </div>
      </div>

      {/* Message alerts */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-danger-soft rounded-row flex items-start gap-2 text-danger text-[13px] whitespace-pre-line">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3 bg-success-soft rounded-row flex items-start gap-2 text-success text-[13px]">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="font-medium">{successMsg}</div>
        </div>
      )}
    </div>
  );
}
