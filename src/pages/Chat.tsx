import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Sparkles, 
  RotateCcw, 
  BookOpen, 
  ChevronDown, 
  FileText, 
  Loader2,
  BrainCircuit,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Volume2,
  GraduationCap,
  Briefcase,
  HelpCircle,
  Terminal,
  Circle,
  Menu,
  Globe,
  Copy
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';
import { 
  getCollections, 
  createChatSession, 
  getChatSessions, 
  streamChatMessage,
  getDocuments,
  deleteChatSession,
  updateChatSessionTitle,
  deleteDocument,
  getDocumentChunks
} from '../services/api';

export const Chat: React.FC = () => {
  const location = useLocation();
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  
  const [chatMode, setChatMode] = useState<string>('learning');
  const [explainLevel, setExplainLevel] = useState<string>('intermediate');
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);

  // Ingestion Pipeline States for Chat Page
  const [ingestStage, setIngestStage] = useState<'idle' | 'uploading' | 'analyzing' | 'confirming' | 'indexing' | 'completed'>('idle');
  const [tempData, setTempData] = useState<any | null>(null);
  const [confirmedCategory, setConfirmedCategory] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Document Analyzer state
  const [inspectingDoc, setInspectingDoc] = useState<any | null>(null);
  const [docQuestions, setDocQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Message Editing and Regeneration state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // Helper to format inline bold (**text**) and code (`code`)
    const formatInline = (str: string) => {
      const parts = [];
      let lastIdx = 0;
      
      // Matches **bold** or `code`
      const regex = /\*\*(.*?)\*\*|`(.*?)`/g;
      let match;
      let keyCounter = 0;
      
      while ((match = regex.exec(str)) !== null) {
        const matchIdx = match.index;
        
        // Preceding text
        if (matchIdx > lastIdx) {
          parts.push(str.substring(lastIdx, matchIdx));
        }
        
        if (match[1]) {
          // Styled bold highlight lines color
          parts.push(
            <strong 
              key={`bold-${matchIdx}-${keyCounter++}`} 
              className="font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded-md"
            >
              {match[1]}
            </strong>
          );
        } else if (match[2]) {
          // Styled code highlight complexities
          parts.push(
            <code 
              key={`code-${matchIdx}-${keyCounter++}`} 
              className="px-1.5 py-0.5 rounded-md bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold"
            >
              {match[2]}
            </code>
          );
        }
        
        lastIdx = regex.lastIndex;
      }
      
      if (lastIdx < str.length) {
        parts.push(str.substring(lastIdx));
      }
      
      return parts.length > 0 ? parts : str;
    };

    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    let currentCodeLines: string[] = [];
    let isInsideCodeBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (isInsideCodeBlock) {
          const codeContent = currentCodeLines.join('\n');
          const blockKey = `codeblock-${i}`;
          blocks.push(
            <div key={blockKey} className="my-3 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-xs bg-slate-950 dark:bg-black text-left">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <span>{codeLanguage || 'code'}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(codeContent)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-left font-mono text-[11px] leading-relaxed text-indigo-200 select-text whitespace-pre">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
          currentCodeLines = [];
          isInsideCodeBlock = false;
          codeLanguage = '';
        } else {
          isInsideCodeBlock = true;
          codeLanguage = trimmed.substring(3).trim();
        }
        continue;
      }

      if (isInsideCodeBlock) {
        currentCodeLines.push(line);
      } else {
        if (trimmed.startsWith('### ')) {
          blocks.push(
            <h3 key={`h3-${i}`} className="text-xs font-black text-slate-900 dark:text-white mt-4 mb-2 uppercase tracking-wide border-l-2 border-indigo-500 pl-2">
              {formatInline(trimmed.substring(4))}
            </h3>
          );
        } else if (trimmed.startsWith('## ')) {
          blocks.push(
            <h2 key={`h2-${i}`} className="text-sm font-black text-slate-900 dark:text-white mt-5 mb-2.5 border-b border-slate-200/40 dark:border-white/5 pb-1">
              {formatInline(trimmed.substring(3))}
            </h2>
          );
        } else if (trimmed.startsWith('# ')) {
          blocks.push(
            <h1 key={`h1-${i}`} className="text-base font-black text-slate-900 dark:text-white mt-6 mb-3">
              {formatInline(trimmed.substring(2))}
            </h1>
          );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          blocks.push(
            <div key={`li-${i}`} className="flex items-start gap-2 pl-4 text-xs text-slate-700 dark:text-slate-250 my-1">
              <span className="text-indigo-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{formatInline(trimmed.substring(2))}</span>
            </div>
          );
        } else {
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            blocks.push(
              <div key={`ol-${i}`} className="flex items-start gap-2 pl-4 text-xs text-slate-700 dark:text-slate-250 my-1">
                <span className="text-indigo-500 font-black text-[10px] flex-shrink-0 mt-0.5">{numMatch[1]}.</span>
                <span>{formatInline(numMatch[2])}</span>
              </div>
            );
          } else if (!trimmed) {
            blocks.push(<div key={`empty-${i}`} className="h-1.5" />);
          } else {
            blocks.push(
              <p key={`p-${i}`} className="leading-relaxed text-xs text-slate-750 dark:text-slate-200">
                {formatInline(line)}
              </p>
            );
          }
        }
      }
    }

    if (isInsideCodeBlock && currentCodeLines.length > 0) {
      const codeContent = currentCodeLines.join('\n');
      blocks.push(
        <div key="codeblock-unclosed" className="my-3 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-xs bg-slate-950 dark:bg-black text-left">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span>{codeLanguage || 'code'} (writing...)</span>
          </div>
          <pre className="p-4 overflow-x-auto text-left font-mono text-[11px] leading-relaxed text-indigo-200 select-text whitespace-pre">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {blocks}
      </div>
    );
  };
  const [collectionDocs, setCollectionDocs] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  
  const [selectedCitationName, setSelectedCitationName] = useState<string | null>(null);
  const [isCitationLoading, setIsCitationLoading] = useState(false);
  const [citationChunks, setCitationChunks] = useState<any[]>([]);
  const [selectedText, setSelectedText] = useState("");
  
  // Selection Context Menu state
  const [floatingMenuPosition, setFloatingMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [floatingSelectedText, setFloatingSelectedText] = useState("");

  // Renaming chat state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const partial = streamingText.trim();
    if (partial && sessionId) {
      try {
        await fetch("http://localhost:8000/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            role: "assistant",
            content: partial + " [Generation stopped by user]",
            citations: citations.join(",")
          })
        });
      } catch (e) {
        console.error("Failed saving partial stream:", e);
      }
    }
    
    setStreamingText('');
    setIsStreaming(false);
    if (sessionId) {
      loadSessionsData(sessionId);
    }
  };

  const handleEditStart = (id: string, currentText: string) => {
    setEditingMessageId(id);
    setEditingText(currentText);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleEditSubmit = async (msgId: string, index: number) => {
    if (!editingText.trim() || !sessionId) return;
    try {
      await fetch(`http://localhost:8000/api/chat/messages/${msgId}?content=${encodeURIComponent(editingText.trim())}`, {
        method: "PUT"
      });
      const subsequent = messages.slice(index + 1);
      for (const sub of subsequent) {
        if (sub.id && !sub.id.startsWith("msg-system-")) {
          await fetch(`http://localhost:8000/api/chat/messages/${sub.id}`, {
            method: "DELETE"
          });
        }
      }
      const finalPrompt = editingText.trim();
      setEditingMessageId(null);
      setEditingText('');
      await loadSessionsData(sessionId);
      autoSubmitPrompt(sessionId, finalPrompt);
    } catch (e) {
      console.error("Failed editing message:", e);
    }
  };

  const handleRegenerate = async (assistantMsgId: string, userMsgIndex: number) => {
    if (!sessionId) return;
    const userMsg = messages[userMsgIndex];
    if (!userMsg || userMsg.role !== 'user') return;
    try {
      if (assistantMsgId && !assistantMsgId.startsWith("msg-system-")) {
        await fetch(`http://localhost:8000/api/chat/messages/${assistantMsgId}`, {
          method: "DELETE"
        });
      }
      await loadSessionsData(sessionId);
      autoSubmitPrompt(sessionId, userMsg.content);
    } catch (e) {
      console.error("Failed regenerating response:", e);
    }
  };

  // Initialize and load chat sessions
  const loadSessionsData = async (activeId?: string, colsList?: any[]) => {
    try {
      const data = await getChatSessions();
      setSessions(data);
      if (data.length > 0) {
        const active = activeId || data[0].id;
        setSessionId(active);
        const activeSession = data.find(s => s.id === active) || data[0];
        // Map backend format to local messages state
        const mapped = activeSession.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations || []
        }));
        setMessages(mapped);

        // Sync active collection to the selected session
        const currentCols = colsList || collections;
        if (activeSession.collection_id && currentCols.length > 0) {
          const matchedCollection = currentCols.find(c => c.id === activeSession.collection_id);
          if (matchedCollection) {
            setSelectedCollection(matchedCollection);
          }
        }
      } else {
        const newSess = await createChatSession("New Thread");
        setSessionId(newSess.id);
        setSessions([newSess]);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed loading chat sessions:", e);
    }
  };

  const loadCollectionDocs = async () => {
    if (!selectedCollection) return;
    try {
      const data = await getDocuments(selectedCollection.id);
      setCollectionDocs(data);
    } catch (e) {
      console.error("Failed loading collection docs:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const cols = await getCollections();
        setCollections(cols);
        const totalFiles = cols.reduce((acc: number, col: any) => acc + (col.documents_count || 0), 0);
        setSelectedCollection({
          id: 'all',
          name: 'All Databases',
          documents_count: totalFiles
        });
        
        const existingSessions = await getChatSessions();
        let activeSessId = '';
        
        if (location.state && location.state.activeSessionId) {
          activeSessId = location.state.activeSessionId;
        } else {
          const newestSess = existingSessions[0];
          if (newestSess && (!newestSess.messages || newestSess.messages.length === 0)) {
            activeSessId = newestSess.id;
          } else {
            const newSess = await createChatSession("New Thread", undefined);
            activeSessId = newSess.id;
          }
        }
        
        setSessionId(activeSessId);
        setMessages([]);
        setStreamingText('');
        setCitations([]);
        
        if (location.state && location.state.initialMode) {
          setChatMode(location.state.initialMode);
        }
        
        await loadSessionsData(activeSessId, cols);
        
        if (location.state && location.state.initialPrompt) {
          if (location.state.activeSessionId) {
            const prompt = location.state.initialPrompt;
            setTimeout(() => {
              autoSubmitPrompt(activeSessId, prompt);
            }, 100);
          } else {
            setInputValue(location.state.initialPrompt);
          }
        }
        
        window.history.replaceState({}, document.title);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);



  // Scroll to bottom on updates
  useEffect(() => {
    const container = document.getElementById("chat-messages-container");
    if (!container) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 120;
    if (isAtBottom || !streamingText) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText]);

  // Listen for selection changes in the document to show floating selection prompt bubble
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setFloatingMenuPosition(null);
        setFloatingSelectedText("");
        return;
      }
      
      const text = selection.toString().trim();
      if (!text || text.length < 2) {
        setFloatingMenuPosition(null);
        setFloatingSelectedText("");
        return;
      }

      // Check if selection is within the chat container or message list
      const anchorNode = selection.anchorNode;
      if (!anchorNode) return;

      const chatContainer = document.getElementById("chat-messages-container");
      if (chatContainer && chatContainer.contains(anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position the menu above the selection relative to the viewport (fixed)
        setFloatingMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 40
        });
        setFloatingSelectedText(text);
      } else {
        setFloatingMenuPosition(null);
        setFloatingSelectedText("");
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleSearchWeb = async (queryText: string) => {
    if (!queryText.trim() || !sessionId || isStreaming) return;
    
    setMessages(prev => [...prev, {
      id: `msg-user-web-${Date.now()}`,
      role: 'user',
      content: `Search the web for: "${queryText}"`
    }]);

    setIsStreaming(true);
    setStreamingText('');
    setCitations([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChatMessage(
        sessionId,
        queryText,
        "web",
        "qwen2.5:3b",
        chatMode,
        explainLevel,
        (chunk) => {
          setStreamingText(prev => prev + chunk);
        },
        (incomingCitations) => {
          setCitations(incomingCitations);
        },
        () => {
          setMessages(prev => [...prev, {
            id: `msg-bot-web-${Date.now()}`,
            role: 'assistant',
            content: streamingText,
            citations: citations
          }]);
          setStreamingText('');
          setIsStreaming(false);
          abortControllerRef.current = null;
          loadSessionsData(sessionId);
        },
        (err) => {
          if (err.name === 'AbortError') {
            console.log("Web search stream aborted by user");
            return;
          }
          console.error("Web search stream error:", err);
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !sessionId || isStreaming) return;

    const userPrompt = inputValue.trim();
    setInputValue('');
    setCitations([]);
    
    // Add user message to state
    setMessages(prev => [...prev, {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: userPrompt
    }]);

    setIsStreaming(true);
    setStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChatMessage(
        sessionId,
        userPrompt,
        selectedCollection ? selectedCollection.id : null,
        "qwen2.5:3b",
        chatMode,
        explainLevel,
        (chunk) => {
          setStreamingText(prev => prev + chunk);
        },
        (incomingCitations) => {
          setCitations(incomingCitations);
        },
        () => {
          // Stream complete
          setMessages(prev => [...prev, {
            id: `msg-bot-${Date.now()}`,
            role: 'assistant',
            content: streamingText,
            citations: citations
          }]);
          setStreamingText('');
          setIsStreaming(false);
          abortControllerRef.current = null;
          // Reload sessions to refresh dynamic titles
          loadSessionsData(sessionId);
        },
        (err) => {
          if (err.name === 'AbortError') {
            console.log("Stream aborted by user");
            return;
          }
          console.error("Chat streaming error:", err);
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Stream aborted by user in catch block");
        return;
      }
      console.error(err);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleVoiceToggle = () => {
    if (voiceActive) {
      setVoiceActive(false);
    } else {
      setVoiceActive(true);
      setInputValue("Explain deep-learning attention mechanisms.");
      setTimeout(() => setVoiceActive(false), 2000);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const autoSubmitPrompt = async (activeSessId: string, promptText: string) => {
    if (!promptText.trim() || isStreaming) return;

    setMessages(prev => [...prev, {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: promptText
    }]);

    setIsStreaming(true);
    setStreamingText('');
    setCitations([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChatMessage(
        activeSessId,
        promptText,
        selectedCollection ? selectedCollection.id : null,
        "qwen2.5:3b",
        chatMode,
        explainLevel,
        (chunk) => {
          setStreamingText(prev => prev + chunk);
        },
        (incomingCitations) => {
          setCitations(incomingCitations);
        },
        () => {
          setMessages(prev => [...prev, {
            id: `msg-bot-${Date.now()}`,
            role: 'assistant',
            content: streamingText,
            citations: citations
          }]);
          setStreamingText('');
          setIsStreaming(false);
          abortControllerRef.current = null;
          loadSessionsData(activeSessId);
        },
        (err) => {
          if (err.name === 'AbortError') return;
          console.error("Chat streaming error:", err);
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setMessages(prev => [...prev, {
      id: `msg-system-upload-${Date.now()}`,
      role: 'system',
      content: `Uploading and scanning "${file.name}"...`
    }]);

    setIngestStage('uploading');

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/upload/pre-analyze", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Pre-analysis text extraction failed.");
      }

      const data = await res.json();
      setTempData(data);
      if (selectedCollection && selectedCollection.id !== 'all') {
        setConfirmedCategory(selectedCollection.name);
      } else {
        setConfirmedCategory(data.suggested_category);
      }

      setIngestStage('confirming');
    } catch (err: any) {
      setIngestStage('idle');
      setMessages(prev => [...prev, {
        id: `msg-system-fail-${Date.now()}`,
        role: 'system',
        content: `Upload failed: ${err.message || err}`
      }]);
    }
  };

  const handleConfirmFinalize = async () => {
    if (!tempData || !confirmedCategory.trim() || !sessionId) return;

    setIngestStage('indexing');

    setMessages(prev => [...prev, {
      id: `msg-system-indexing-${Date.now()}`,
      role: 'system',
      content: `Indexing "${tempData.original_name}" into Subject folder "${confirmedCategory.trim()}"...`
    }]);

    try {
      const formData = new FormData();
      formData.append("temp_file_name", tempData.temp_file_name);
      formData.append("confirmed_category", confirmedCategory.trim());

      const res = await fetch("http://localhost:8000/api/upload/finalize", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Finalizing document registration failed.");
      }

      const finalDoc = await res.json();

      setIngestStage('completed');

      setMessages(prev => [...prev, {
        id: `msg-system-success-${Date.now()}`,
        role: 'system',
        content: `Successfully uploaded and vectorized "${tempData.original_name}"!`
      }]);

      // Reload collections
      const cols = await getCollections();
      setCollections(cols);

      // Find matched collection to auto-select
      const matched = cols.find(c => c.id === finalDoc.collection_id);
      if (matched) {
        setSelectedCollection(matched);
      }

      setTempData(null);
      setTimeout(() => {
        setIngestStage('idle');
      }, 4000);
    } catch (err: any) {
      setIngestStage('idle');
      setMessages(prev => [...prev, {
        id: `msg-system-fail-final-${Date.now()}`,
        role: 'system',
        content: `Finalizing index failed: ${err.message || err}`
      }]);
    }
  };

  const handleCancelFinalize = () => {
    setTempData(null);
    setIngestStage('idle');
    setMessages(prev => [...prev, {
      id: `msg-system-cancel-${Date.now()}`,
      role: 'system',
      content: `Upload cancelled.`
    }]);
  };

  const handleInspectDocument = async (doc: any) => {
    setInspectingDoc(doc);
    setIsLoadingQuestions(true);
    setDocQuestions([]);
    try {
      const formData = new FormData();
      formData.append("document_id", doc.id);
      const res = await fetch("http://localhost:8000/api/upload/generate-questions", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();
      setDocQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
      setDocQuestions([
        `Summarize the key information of ${doc.name}?`,
        `What is the background topic of ${doc.name}?`,
        `What conclusions are stated in ${doc.name}?`,
        `Detail the specific context of ${doc.name}?`,
        `How is the data structured in ${doc.name}?`
      ]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportPDF = () => {
    if (!sessionId) return;
    window.open(`http://localhost:8000/api/chat/sessions/${sessionId}/export-pdf`, '_blank');
  };

  const handleNewChat = async () => {
    try {
      const newSess = await createChatSession("New Thread", selectedCollection?.id);
      setSessionId(newSess.id);
      setMessages([]);
      setStreamingText('');
      setCitations([]);
      loadSessionsData(newSess.id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCollectionDocs();
  }, [selectedCollection]);

  const handleCollectionSelect = async (col: any) => {
    setSelectedCollection(col);
    setShowColMenu(false);
    try {
      const newSess = await createChatSession("New Thread", col.id === 'all' ? undefined : col.id);
      setSessionId(newSess.id);
      setMessages([]);
      setStreamingText('');
      setCitations([]);
      loadSessionsData(newSess.id);
    } catch (e) {
      console.error(e);
    }
  };

  const playVoice = (text: string) => {
    const audioUrl = `http://localhost:8000/api/voice/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      if (sessionId === id) {
        setMessages([]);
        setSessionId(null);
      }
      loadSessionsData();
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    const active = sessions.find(s => s.id === id);
    if (active) {
      const mapped = active.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations || []
      }));
      setMessages(mapped);

      // Sync collection when selecting session from history
      if (active.collection_id) {
        const matchedCollection = collections.find(c => c.id === active.collection_id);
        if (matchedCollection) {
          setSelectedCollection(matchedCollection);
        }
      } else {
        const totalFiles = collections.reduce((acc: number, col: any) => acc + (col.documents_count || 0), 0);
        setSelectedCollection({
          id: 'all',
          name: 'All Databases',
          documents_count: totalFiles
        });
      }
    }
  };

  const startRenameSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const submitRenameSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      await updateChatSessionTitle(id, editingTitle.trim());
      setEditingSessionId(null);
      loadSessionsData(sessionId || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelRenameSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <div className="flex-grow flex gap-6 chat-container-height min-h-0 relative z-10 select-none">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAttachFile} 
        className="hidden" 
        accept=".pdf,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
      />

      {/* ChatGPT-style Left Sidebar (Thread History & Documents list) */}
      <div 
        className={cn(
          "hidden md:flex flex-col bg-white/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-white/5 rounded-3xl p-4 shadow-sm backdrop-blur-md flex-shrink-0 min-h-0 overflow-hidden text-left justify-between transition-all duration-300", 
          isSidebarVisible ? "w-72" : "w-0 p-0 border-none opacity-0"
        )}
      >
        
        {/* Top Section: Sessions list */}
        <div className="flex flex-col min-h-0 flex-grow">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/10 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Chat</span>
          </button>

          {/* Session Threads Header */}
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2.5 px-2 block">
            Chat History
          </span>

          {/* History Scroll Area */}
          <div className="flex-grow overflow-y-auto space-y-1.5 pr-1">
            {sessions.map(s => {
              const isSelected = sessionId === s.id;
              const isEditing = editingSessionId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => !isEditing && handleSelectSession(s.id)}
                  className={cn(
                    "group w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    isSelected 
                      ? "bg-slate-100 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border border-slate-200/50 dark:border-white/5" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                  )}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full mr-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-grow bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-lg px-2 py-1 text-xs outline-none text-slate-800 dark:text-white"
                      />
                      <button onClick={(e) => submitRenameSession(s.id, e)} className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={cancelRenameSession} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-md">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate max-w-[150px]">{s.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startRenameSession(s.id, s.title, e)}
                          className="p-1 rounded-md text-slate-450 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                          title="Rename Thread"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-1 rounded-md text-slate-450 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                          title="Delete Thread"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Active Collection Files */}
        <div className="border-t border-slate-200/40 dark:border-white/5 pt-4 mt-4 flex flex-col min-h-[160px] max-h-[40%] flex-shrink-0">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2.5 px-2 block">
            Vault Files ({collectionDocs.length})
          </span>
          <div className="overflow-y-auto space-y-1.5 pr-1">
            {collectionDocs.map((doc: any) => (
              <div 
                key={doc.id}
                className="group flex items-center justify-between p-2 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-200/20 dark:border-white/5 rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-grow mr-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate" title={doc.name}>
                    {doc.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      handleInspectDocument(doc);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                    title="Analyze topics & suggest questions"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${doc.name}"? This will clear its vector index and database record.`)) {
                        try {
                          await deleteDocument(doc.id);
                          loadCollectionDocs();
                        } catch (err) {
                          console.error("Failed to delete document:", err);
                          alert("Failed to delete document.");
                        }
                      }
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer flex-shrink-0"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {collectionDocs.length === 0 && (
              <span className="text-[9px] text-slate-400 font-semibold px-2">No files in collection yet.</span>
            )}
          </div>
        </div>

      </div>

      {/* Main Chat Screen Area */}
      <div className="flex-grow flex flex-col min-h-0 bg-white dark:bg-slate-900/60 border border-slate-200/40 dark:border-white/5 rounded-3xl backdrop-blur-md overflow-hidden relative shadow-sm">
        
        {/* Top Control Bar (Subject drop, Reset button) */}
        <div className="px-6 py-4 border-b border-slate-200/40 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md relative z-20">
          
          {/* Title and Sparkle icon */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarVisible(prev => !prev)}
              className="p-2 rounded-xl border border-slate-200/40 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 hover:text-indigo-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all flex-shrink-0"
              title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none">
                Learning Chat Assistant
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Offline educational support and topic guidance
              </p>
            </div>
          </div>

          {/* Action Selector and Reset */}
          <div className="flex items-center gap-2">
            {/* Collection/Folder Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColMenu(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-955 border border-slate-200/50 dark:border-white/5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedCollection ? `${selectedCollection.name} (${selectedCollection.documents_count || 0})` : 'All Databases (0)'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showColMenu && (
                <div className="absolute top-10 right-0 w-52 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleCollectionSelect({
                      id: 'all',
                      name: 'All Databases',
                      documents_count: collections.reduce((acc, col) => acc + (col.documents_count || 0), 0)
                    })}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl text-[10px] font-black cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border-b border-slate-100 dark:border-white/5 pb-2.5 text-indigo-650 dark:text-indigo-400 flex items-center justify-between",
                      selectedCollection?.id === 'all' && "bg-blue-500/5 text-blue-650 dark:text-blue-400"
                    )}
                  >
                    <span>All Databases</span>
                    <span className="text-[9px] text-indigo-650 dark:text-indigo-400 font-extrabold bg-indigo-500/10 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded-md">
                      {collections.reduce((acc, col) => acc + (col.documents_count || 0), 0)}
                    </span>
                  </button>
                  <div className="overflow-y-auto max-h-48 flex flex-col gap-0.5">
                    {collections.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCollectionSelect(c)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between",
                          selectedCollection?.id === c.id && "bg-blue-500/5 text-blue-600 dark:text-blue-455"
                        )}
                      >
                        <span className="truncate pr-2">{c.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md flex-shrink-0">
                          {c.documents_count || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Thread */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-white/5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 cursor-pointer"
              title="Reset conversation thread"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-450" />
              <span>Reset</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-white/5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 cursor-pointer"
              title="Export chat session history to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>Export PDF</span>
            </button>
          </div>

        </div>

        {/* Message Feed & Dialog window */}
        <div id="chat-messages-container" className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.length === 0 && !streamingText ? (
            
            // Suggested Questions / Prompt Grid (Empty state)
            <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-12">
              <BrainCircuit className="w-12 h-12 text-indigo-500/80 mb-4 animate-bounce" />
              <h3 className="text-sm font-black text-slate-805 dark:text-white">Start a new offline dialogue</h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-1 max-w-xs">
                Ask questions about documents in your active collection. The vector database retrieves matching context offline.
              </p>
              
              <div className="grid grid-cols-1 gap-3 mt-6 w-full text-left max-w-sm">
                {[
                  { title: "Give overview on the source data", desc: "Summarize the documents inside the active collection" }
                ].map(item => (
                  <button
                    key={item.title}
                    onClick={() => setInputValue(item.title)}
                    className="p-3 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-200/30 dark:border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all text-left cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">{item.title}</span>
                    <span className="text-[9px] text-slate-405 dark:text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            
            // Message List
            <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
              {messages.map((m) => (
                <div 
                  key={m.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    m.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Bot Profile Icon */}
                  {m.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0 border border-indigo-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble container */}
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div className={cn(
                      "p-3.5 px-4.5 rounded-[1.5rem] text-xs leading-relaxed text-slate-800 dark:text-slate-100 relative group/msg",
                      m.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-sm" 
                        : m.role === 'system'
                        ? "bg-slate-100/50 dark:bg-slate-955/50 border border-slate-200/30 dark:border-white/5 text-slate-505 text-[10px] font-bold font-mono"
                        : "bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 rounded-tl-sm"
                    )}>
                      {editingMessageId === m.id ? (
                        <div className="flex flex-col gap-2 min-w-[240px] sm:min-w-[320px]">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-indigo-700 text-white rounded-xl p-2.5 outline-none text-xs leading-relaxed resize-y border border-indigo-500/50"
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={handleEditCancel}
                              className="px-2.5 py-1 rounded-lg bg-indigo-700/50 text-[10px] font-bold text-indigo-200 hover:bg-indigo-700/80 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const index = messages.findIndex(msg => msg.id === m.id);
                                handleEditSubmit(m.id, index);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white text-[10px] font-bold text-indigo-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Save & Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {m.role === 'user' || m.role === 'system' ? m.content : renderMarkdown(m.content)}
                          {m.role === 'user' && (
                            <button
                              type="button"
                              onClick={() => handleEditStart(m.id, m.content)}
                              className="absolute right-2 bottom-2 p-1 bg-indigo-750 dark:bg-slate-900/80 rounded-full border border-indigo-500/20 text-indigo-250 hover:text-white opacity-0 group-hover/msg:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              title="Edit question"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      {m.role === 'assistant' && (
                        <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              const index = messages.findIndex(msg => msg.id === m.id);
                              handleRegenerate(m.id, index - 1);
                            }}
                            className="p-1 bg-white/80 dark:bg-slate-900/80 rounded-full border border-slate-200/30 dark:border-white/5 text-slate-400 hover:text-indigo-500 cursor-pointer shadow-xs flex items-center justify-center"
                            title="Regenerate / Try Again"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(m.content, m.id)}
                            className="p-1 bg-white/80 dark:bg-slate-900/80 rounded-full border border-slate-200/30 dark:border-white/5 text-slate-400 hover:text-indigo-500 cursor-pointer shadow-xs flex items-center justify-center"
                            title="Copy response to clipboard"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => playVoice(m.content)}
                            className="p-1 bg-white/80 dark:bg-slate-900/80 rounded-full border border-slate-200/30 dark:border-white/5 text-slate-400 hover:text-indigo-500 cursor-pointer shadow-xs flex items-center justify-center"
                            title="Speak answer (Kokoro-82M)"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {m.role === 'assistant' && m.content.includes("I cannot find") && (() => {
                      const msgIdx = messages.findIndex(msg => msg.id === m.id);
                      const userMsg = msgIdx > 0 ? messages[msgIdx - 1] : null;
                      if (!userMsg || userMsg.role !== 'user') return null;
                      
                      return (
                        <div className="mt-1 p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col gap-2 max-w-sm text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            No local source documents contain this topic. Would you like to check the internet?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSearchWeb(userMsg.content)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Search the Internet</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Document Citation references */}
                    {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">Sources:</span>
                        <span className="text-[8px] text-indigo-500 font-bold bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/10 dark:border-indigo-500/20 animate-pulse mr-1 scale-95">
                          Click pill to inspect source chunks
                        </span>
                        {m.citations.map((c: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={async () => {
                              setSelectedCitationName(c);
                              setIsCitationLoading(true);
                              setCitationChunks([]);
                              setSelectedText("");
                              try {
                                const data = await getDocumentChunks(undefined, undefined, c);
                                setCitationChunks(data);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsCitationLoading(false);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-white/5 text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:border-blue-500/20 transition-all cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* AI Thinking Bubble (Waiting for LLM first token response) */}
              {isStreaming && !streamingText && (
                <div className="flex gap-3 justify-start items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Glowing AI Avatar */}
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-[0_0_12px_rgba(99,102,241,0.3)] flex items-center justify-center overflow-hidden flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      {/* Spin ring inside */}
                      <div className="absolute inset-0.5 border border-white/10 rounded-full animate-spin duration-[3000ms]">
                        <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 bg-indigo-400 rounded-full shadow-[0_0_4px_rgba(129,140,248,1)]" />
                      </div>
                    </div>
                  </div>

                  {/* Thinking Box Animation */}
                  <div className="p-3.5 px-4.5 rounded-[1.5rem] rounded-tl-sm text-xs bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 max-w-[85%] flex items-center gap-2.5 shadow-xs">
                    {/* Pulsing Dots typing animation */}
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-2 h-2 bg-indigo-500/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-indigo-500/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-indigo-500/80 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
                      Vedha AI is thinking...
                    </span>
                  </div>
                </div>
              )}

              {/* Streaming block helper */}
              {isStreaming && streamingText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0 border border-indigo-500/20">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 px-4.5 rounded-[1.5rem] rounded-tl-sm text-xs leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 max-w-[85%]">
                    {renderMarkdown(streamingText)}
                    <span className="inline-block w-1.5 h-3 bg-indigo-500 ml-1 animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Floating Citation Preview Drawer (Next-Level Inspect Panel) */}
        {selectedCitationName && (
          <div className="fixed inset-0 bg-slate-955/20 dark:bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div 
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] text-left select-none relative"
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-black text-slate-850 dark:text-white truncate max-w-md">{selectedCitationName}</span>
                </div>
                <button 
                  onClick={() => { setSelectedCitationName(null); setCitationChunks([]); setSelectedText(""); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/30 dark:border-white/5"
                >
                  Close
                </button>
              </div>

              {/* Chunks Content Scroll List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text">
                {isCitationLoading ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                    <span>Loading Document Chunks...</span>
                  </div>
                ) : citationChunks.length === 0 ? (
                  <div className="text-center py-12 text-slate-405 font-bold text-xs">
                    No text chunks found for this document in the collection index database.
                  </div>
                ) : (
                  citationChunks.map((chunk, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150/40 dark:border-white/5 p-4 rounded-2xl relative"
                    >
                      <span className="absolute top-3 right-3 text-[8px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        Page {chunk.page || 1}
                      </span>
                      <p className="font-mono text-[10px] leading-relaxed text-slate-650 dark:text-slate-350 pr-12 break-words whitespace-pre-wrap select-text">
                        {chunk.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Action Bar (Ask about selection) */}
              <div className="border-t border-slate-200/40 dark:border-white/5 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[10px] text-slate-400 font-semibold max-w-sm">
                  {selectedText ? (
                    <span className="text-indigo-500 font-bold animate-pulse">Selected text detected ({selectedText.length} chars). Click query to ask!</span>
                  ) : (
                    <span>💡 Tip: Select any text snippet from the chunks above to ask Vedha AI about it.</span>
                  )}
                </div>
                {selectedText && (
                  <button
                    onClick={() => {
                      setInputValue(`About "${selectedText}": `);
                      setSelectedCitationName(null);
                      setCitationChunks([]);
                      setSelectedText("");
                      const inputEl = document.querySelector('input[placeholder*="Ask your local vault"]');
                      if (inputEl) (inputEl as HTMLInputElement).focus();
                    }}
                    className="flex-grow sm:flex-grow-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:opacity-95 active:scale-98 transition-all"
                  >
                    Ask About Selection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Floating Highlight-to-Chat Action Bubble */}
      {floatingMenuPosition && floatingSelectedText && (
        <div 
          className="fixed z-[9999] pointer-events-auto select-none"
          style={{ 
            left: `${floatingMenuPosition.x}px`, 
            top: `${floatingMenuPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={() => {
              setInputValue(`About "${floatingSelectedText}": `);
              setFloatingMenuPosition(null);
              setFloatingSelectedText("");
              // Find and focus the prompt input field
              const inputEl = document.querySelector('input[placeholder*="Ask your local vault"]');
              if (inputEl) (inputEl as HTMLInputElement).focus();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all border border-slate-700 dark:border-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-405 dark:text-indigo-650" />
            <span>Ask Vedha</span>
          </button>
        </div>
      )}

        {/* Entry tray on the bottom */}
        <div className="px-6 py-4 border-t border-slate-200/40 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/10">
          <div className="max-w-3xl mx-auto">
            {/* Chat Mode Selection pills & Explain levels */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2 text-left select-none">
              {/* Modes */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "learning", label: "Learn", icon: GraduationCap, iconColor: "text-emerald-500" },
                  { id: "interview", label: "Interview", icon: Briefcase, iconColor: "text-indigo-550" },
                  { id: "revision", label: "Revise", icon: FileText, iconColor: "text-blue-500" },
                  { id: "quiz", label: "Quiz", icon: HelpCircle, iconColor: "text-amber-500" },
                  { id: "coding", label: "Coding", icon: Terminal, iconColor: "text-cyan-500" }
                ].map(mode => {
                  const Icon = mode.icon;
                  const isActive = chatMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setChatMode(mode.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer",
                        isActive 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-white dark:bg-slate-900 text-slate-655 dark:text-slate-350 border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : mode.iconColor)} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explain Levels */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Depth:</span>
                {[
                  { id: "beginner", label: "Beginner", color: "fill-emerald-500 text-emerald-500" },
                  { id: "intermediate", label: "Intermediate", color: "fill-amber-500 text-amber-500" },
                  { id: "expert", label: "Expert", color: "fill-rose-500 text-rose-500" }
                ].map(level => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setExplainLevel(level.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-bold border transition-all cursor-pointer",
                      explainLevel === level.id
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-white border-slate-300 dark:border-slate-700 shadow-xs"
                        : "bg-white/50 dark:bg-slate-955/20 text-slate-505 dark:text-slate-450 border-slate-200/30 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
                    )}
                  >
                    <Circle className={`w-2 h-2 ${level.color}`} />
                    <span>{level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 w-full">
            {/* File attach button */}
            <button
              type="button"
              onClick={handleAttachClick}
              className="p-2.5 rounded-xl border border-slate-250/40 dark:border-white/5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 cursor-pointer transition-all"
              title="Ingest document to collection"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Prompt Voice recording simulator */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={cn(
                "p-2.5 rounded-xl border cursor-pointer transition-all",
                voiceActive 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse" 
                  : "border-slate-250/40 dark:border-white/5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
              )}
              title="Offline speech transcription"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isStreaming ? "Generating answer..." : "Ask your local vault..."}
              disabled={isStreaming}
              className="flex-grow bg-slate-100 dark:bg-slate-950/80 border border-slate-200/50 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 outline-none"
            />

            {/* Submit/Send or Stop button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-md shadow-rose-500/15 flex items-center justify-center animate-pulse flex-shrink-0"
                title="Stop Generating"
              >
                <div className="w-3.5 h-3.5 bg-white rounded-xs" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md shadow-blue-500/15 flex-shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
          </div>
        </div>

      </div>

      {/* 2-Stage Confirmation Ingestion Modal */}
      <AnimatePresence>
        {ingestStage === 'confirming' && tempData && (
          <div className="fixed inset-0 bg-slate-905/20 dark:bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Topic Auto-Detected
                </span>
                <button onClick={handleCancelFinalize} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 break-all">{tempData.original_name}</h3>
                  <span className="text-[9px] text-slate-450 font-bold block mt-0.5">
                    Analyzed: {tempData.char_count} chars • Type: {tempData.type.toUpperCase()} • Suggested Folder: "{tempData.suggested_category}"
                  </span>
                </div>

                <div className="space-y-1.5 font-semibold">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Confirm or Rename Folder Name</label>
                  <input
                    type="text"
                    value={confirmedCategory}
                    onChange={(e) => setConfirmedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-bold"
                  />
                </div>

                {/* Quick select existing collection */}
                {collections.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wider block">Or select an existing Subject folder</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-200/30 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                      {collections.map(col => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfirmedCategory(col.name)}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-bold transition-all border cursor-pointer",
                            confirmedCategory === col.name
                              ? "bg-indigo-650 text-white border-indigo-650"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-450 border-slate-200/50 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10"
                          )}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 font-semibold">
                <button
                  onClick={handleCancelFinalize}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-650 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmFinalize}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold cursor-pointer hover:opacity-95 transition-opacity"
                >
                  Confirm & Index
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document In-depth Inspector / Topic Analyzer Modal */}
      <AnimatePresence>
        {inspectingDoc && (
          <div className="fixed inset-0 bg-slate-905/20 dark:bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5 font-display">
                  <BrainCircuit className="w-4 h-4 text-indigo-500" /> Document In-depth Analyzer
                </span>
                <button onClick={() => setInspectingDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-805 dark:text-white break-all flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" /> {inspectingDoc.name}
                  </h3>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">
                    Type: {inspectingDoc.type.toUpperCase()} • Size: {inspectingDoc.size} • Uploaded: {inspectingDoc.upload_date}
                  </span>
                </div>

                <div className="space-y-1 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-150/40 dark:border-white/5">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block font-display">Document AI Summary</label>
                  <p className="text-[10px] font-bold text-slate-655 dark:text-slate-300 leading-relaxed">
                    {inspectingDoc.summary || "No summary available for this file. Click Re-analyze to generate summary."}
                  </p>
                             <div className="space-y-1">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block font-display">Key Topics & Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingDoc.tags && (Array.isArray(inspectingDoc.tags) ? inspectingDoc.tags : (typeof inspectingDoc.tags === 'string' ? (inspectingDoc.tags as string).split(",") : [])).length > 0 ? (
                      (Array.isArray(inspectingDoc.tags) ? inspectingDoc.tags : (inspectingDoc.tags as string).split(",")).map((tag: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 text-[9px] font-bold"
                        >
                          {tag.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold">General</span>
                    )}
                  </div>
                </div>
 
                <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block font-display">Suggested Questions to Ask</label>
                  
                  {isLoadingQuestions ? (
                    <div className="py-6 flex items-center justify-center gap-2 select-none">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
                        Generating Questions...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {docQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (sessionId) {
                              setInspectingDoc(null);
                              autoSubmitPrompt(sessionId, q);
                            }
                          }}
                          className="w-full text-left p-2.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 rounded-xl transition-all cursor-pointer block group/item"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-indigo-500 font-black mt-0.5">{idx + 1}.</span>
                            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors leading-tight">
                              {q}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>     </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setInspectingDoc(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
