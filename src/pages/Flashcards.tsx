import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Sparkles, 
  Trash2, 
  RotateCw, 
  CheckCircle2, 
  ArrowLeft, 
  BookOpen, 
  Search,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';
import { 
  getCollections, 
  getFlashcards, 
  generateFlashcards, 
  reviewFlashcard, 
  deleteFlashcard,
  type FlashcardResponse 
} from '../services/api';
import LottieLoader from '../components/LottieLoader';

export const Flashcards: React.FC = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any | null>(null);
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  
  // App UI Modes: 'list' (decks list) | 'review' (SRS study room) | 'manage' (view/delete deck cards)
  const [mode, setMode] = useState<'list' | 'review' | 'manage'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Study Room Active Deck Review states
  const [dueCards, setDueCards] = useState<FlashcardResponse[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  
  // Card Search filters (Manage mode)
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Initial Load: Retrieve Collections & Decks telemetry
  const loadDecks = async () => {
    setIsLoading(true);
    try {
      const cols = await getCollections();
      setCollections(cols);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load study decks. Please verify backend state.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  // 2. Fetch Flashcards inside a selected deck
  const loadDeckCards = async (collectionId: string) => {
    try {
      const allCards = await getFlashcards(collectionId, false);
      setCards(allCards);
      
      // Calculate due cards (next_review_date <= today)
      const todayStr = new Date().toISOString().split('T')[0];
      const due = allCards.filter(c => c.next_review_date <= todayStr);
      setDueCards(due);
      setCurrentCardIdx(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed retrieving flashcard deck index.");
    }
  };

  const handleSelectDeck = async (deck: any, initialMode: 'review' | 'manage' = 'review') => {
    setSelectedDeck(deck);
    setMode(initialMode);
    await loadDeckCards(deck.id);
  };

  // 3. Trigger AI flashcard extraction via Ollama
  const handleGenerateCards = async () => {
    if (!selectedDeck) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      await generateFlashcards(selectedDeck.id);
      await loadDeckCards(selectedDeck.id);
      await loadDecks(); // Refresh doc count badges
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed generating flashcards from document summaries.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Handle SRS review ratings (SM-2 updates)
  const handleReviewRating = async (rating: 'hard' | 'good' | 'easy') => {
    if (dueCards.length === 0) return;
    const activeCard = dueCards[currentCardIdx];
    
    try {
      await reviewFlashcard(activeCard.id, rating);
      setReviewCount(prev => prev + 1);
      
      // Transition to next card or end
      if (currentCardIdx < dueCards.length - 1) {
        setIsFlipped(false);
        // Add a micro delay before changing indexes to let the card flip back
        setTimeout(() => {
          setCurrentCardIdx(prev => prev + 1);
        }, 150);
      } else {
        // Mastered all due cards
        setDueCards([]);
        await loadDeckCards(selectedDeck.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed recording spaced repetition review.");
    }
  };

  // 5. Delete Flashcard
  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm("Are you sure you want to delete this flashcard?")) return;
    try {
      await deleteFlashcard(cardId);
      await loadDeckCards(selectedDeck.id);
      await loadDecks();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed deleting card.");
    }
  };

  const handleExitDeck = () => {
    setSelectedDeck(null);
    setMode('list');
    setErrorMsg(null);
    setReviewCount(0);
  };

  // Filter cards based on search input inside management view
  const filteredCards = cards.filter(c => 
    c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col min-h-0 relative select-none">
      {/* 3D and Backface utility css directly injected */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Main Container Header */}
      <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-4 mb-6">
        <div className="flex flex-col text-left">
          <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span>AI Study Flashcards</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Local Spaced-Repetition System (Anki-style)
          </p>
        </div>

        {selectedDeck && (
          <button
            onClick={handleExitDeck}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 text-[10px] font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Decks</span>
          </button>
        )}
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-start gap-2.5 text-xs text-left animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
          <LottieLoader message="Loading study decks telemetry..." size={250} />
        </div>
      )}

      {/* AI Generating Loading Overlay */}
      {isGenerating && (
        <div className="flex-grow flex items-center justify-center min-h-[50vh] bg-slate-50/10 dark:bg-black/5 backdrop-blur-xs rounded-3xl p-6">
          <LottieLoader message="Ollama is reading summaries and extracting key conceptual flashcards..." size={350} />
        </div>
      )}

      {!isLoading && !isGenerating && (
        <AnimatePresence mode="wait">
          {/* MODE: Decks List Grid */}
          {mode === 'list' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
            >
              {collections.map(c => {
                const totalFiles = c.documents_count || 0;
                
                return (
                  <div
                    key={c.id}
                    className="group relative flex flex-col justify-between p-5 bg-white/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-white/5 rounded-3xl shadow-xs backdrop-blur-md hover:border-indigo-500/30 dark:hover:border-indigo-500/20 hover:shadow-xl transition-all duration-300 min-h-[12.5rem]"
                  >
                    <div>
                      {/* Folder Title */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          <Layers className="w-4 h-4" />
                        </span>
                        {totalFiles === 0 && (
                          <span className="text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/50 dark:border-white/5 text-slate-400">
                            Empty
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {c.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                        {totalFiles} Source file{totalFiles !== 1 ? 's' : ''} uploaded
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/30 dark:border-white/5">
                      <button
                        onClick={() => handleSelectDeck(c, 'review')}
                        disabled={totalFiles === 0}
                        className="flex-grow flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-indigo-500/10"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Study Deck</span>
                      </button>
                      <button
                        onClick={() => handleSelectDeck(c, 'manage')}
                        disabled={totalFiles === 0}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-500 hover:text-indigo-500 transition-all cursor-pointer"
                        title="Manage flashcard items"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* MODE: SRS Study Room */}
          {mode === 'review' && selectedDeck && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-grow flex flex-col items-center justify-center max-w-xl mx-auto w-full select-none"
            >
              {dueCards.length > 0 ? (
                <div className="w-full flex flex-col gap-6">
                  {/* Study Telemetry Header */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="uppercase tracking-widest text-[9px]">
                      Reviewing: <strong className="text-slate-600 dark:text-slate-300 font-black">{selectedDeck.name}</strong>
                    </span>
                    <span>
                      Card <strong className="text-indigo-500 font-extrabold">{currentCardIdx + 1}</strong> of <strong className="text-slate-600 dark:text-slate-300">{dueCards.length}</strong>
                    </span>
                  </div>

                  {/* 3D Flipping Card Component */}
                  <div 
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="relative w-full h-[18rem] cursor-pointer perspective-1000 group"
                  >
                    <div className={cn(
                      "w-full h-full duration-500 preserve-3d transition-transform relative",
                      isFlipped ? "rotate-y-180" : ""
                    )}>
                      {/* CARD FRONT (Question) */}
                      <div className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between backface-hidden rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-950">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full w-max">
                          Front (Question)
                        </span>
                        
                        <div className="text-center px-4">
                          <p className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-relaxed select-text">
                            {dueCards[currentCardIdx].question}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                          <RotateCw className="w-3 h-3 group-hover:rotate-45 transition-transform" />
                          <span>Click card to reveal answer</span>
                        </div>
                      </div>

                      {/* CARD BACK (Answer) */}
                      <div className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between backface-hidden rotate-y-180 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-2xl bg-slate-950 dark:bg-black">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full w-max">
                          Back (Answer)
                        </span>

                        <div className="text-center px-4 overflow-y-auto max-h-40 my-auto pr-1">
                          <p className="text-xs md:text-sm font-bold text-slate-300 dark:text-slate-200 leading-relaxed select-text">
                            {dueCards[currentCardIdx].answer}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          <RotateCw className="w-3 h-3" />
                          <span>Click to see question again</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SRS Rating Control Panel */}
                  <div className="h-16 flex items-center justify-center relative">
                    <AnimatePresence mode="wait">
                      {!isFlipped ? (
                        <motion.button
                          key="reveal-btn"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setIsFlipped(true)}
                          className="px-6 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
                        >
                          Show Answer
                        </motion.button>
                      ) : (
                        <motion.div
                          key="ratings-panel"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="grid grid-cols-3 gap-3 w-full"
                        >
                          <button
                            onClick={() => handleReviewRating('hard')}
                            className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-rose-500 font-black cursor-pointer shadow-sm shadow-rose-500/5 group"
                          >
                            <span className="text-[10px] uppercase tracking-wider">Hard</span>
                            <span className="text-[8px] font-bold text-slate-400 group-hover:text-rose-100 mt-0.5">Interval: 1d</span>
                          </button>
                          
                          <button
                            onClick={() => handleReviewRating('good')}
                            className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all text-indigo-500 dark:text-indigo-400 dark:hover:text-white font-black cursor-pointer shadow-sm shadow-indigo-500/5 group"
                          >
                            <span className="text-[10px] uppercase tracking-wider">Good</span>
                            <span className="text-[8px] font-bold text-slate-400 group-hover:text-indigo-100 mt-0.5">
                              Interval: {dueCards[currentCardIdx].repetitions >= 2 ? `${Math.round(dueCards[currentCardIdx].interval_days * dueCards[currentCardIdx].ease_factor)}d` : '4d'}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => handleReviewRating('easy')}
                            className="flex flex-col items-center justify-center py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-emerald-500 font-black cursor-pointer shadow-sm shadow-emerald-500/5 group"
                          >
                            <span className="text-[10px] uppercase tracking-wider">Easy</span>
                            <span className="text-[8px] font-bold text-slate-400 group-hover:text-emerald-100 mt-0.5">
                              Interval: {dueCards[currentCardIdx].repetitions >= 2 ? `${Math.round(dueCards[currentCardIdx].interval_days * dueCards[currentCardIdx].ease_factor * 1.3)}d` : '6d'}
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                /* Mastered Celebration Screen */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center p-6 bg-white/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-white/5 rounded-3xl shadow-xl backdrop-blur-md max-w-sm"
                >
                  <span className="p-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </span>
                  
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    All Caught Up!
                  </h3>
                  <p className="text-xs font-bold text-slate-450 dark:text-slate-400 leading-relaxed mt-2.5">
                    {reviewCount > 0 
                      ? `Fantastic! You studied ${reviewCount} flashcard${reviewCount !== 1 ? 's' : ''} and completed the daily review session for this deck.`
                      : "There are no cards due for review in this deck today. Outstanding job!"
                    }
                  </p>
                  
                  <div className="flex flex-col gap-2 w-full mt-6">
                    <button
                      onClick={handleGenerateCards}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract More via AI</span>
                    </button>
                    <button
                      onClick={() => setMode('manage')}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-655 dark:text-slate-350 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Manage Cards ({cards.length})
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* MODE: Manage Deck Cards */}
          {mode === 'manage' && selectedDeck && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-grow flex flex-col min-h-0 text-left"
            >
              {/* Manage Header Panel */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-250/20 dark:border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Layers className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                      {selectedDeck.name}
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      Deck Deck Studio: {cards.length} cards total ({dueCards.length} due)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 md:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search flashcards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500/30"
                    />
                  </div>

                  <button
                    onClick={handleGenerateCards}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                    title="Generate 5 new cards via Ollama"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Cards</span>
                  </button>
                </div>
              </div>

              {/* Cards List Display Grid */}
              <div className="flex-grow overflow-y-auto space-y-4 max-h-[60vh] pr-1.5">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card, idx) => (
                    <div
                      key={card.id}
                      className="group p-4 bg-white/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-white/5 rounded-2xl hover:border-slate-300 dark:hover:border-white/10 transition-all flex justify-between gap-4 relative"
                    >
                      <div className="flex flex-col gap-2 flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">
                            Q#{idx + 1}
                          </span>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-slate-400" />
                            <span>Interval: {card.interval_days}d | Reps: {card.repetitions}</span>
                          </span>
                        </div>

                        <p className="text-xs font-black text-slate-750 dark:text-white select-text">
                          {card.question}
                        </p>
                        
                        <p className="text-[11px] font-bold text-slate-450 dark:text-slate-400 border-l border-indigo-500/20 pl-2.5 select-text">
                          {card.answer}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:bg-slate-950 transition-all self-start flex-shrink-0 cursor-pointer"
                        title="Delete flashcard item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center bg-slate-50/20 dark:bg-slate-950/20 border border-dashed border-slate-200/50 dark:border-white/5 rounded-3xl">
                    <span className="p-3 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 mb-3 text-slate-350">
                      <Layers className="w-6 h-6" />
                    </span>
                    <p className="text-xs font-black uppercase tracking-wider">No Flashcards In Deck</p>
                    <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-1 max-w-xs">
                      {searchQuery 
                        ? "No flashcards match your search criteria inside this deck."
                        : "Use the Generate button above to parse your uploaded documents and build study cards via Ollama."
                      }
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Flashcards;
