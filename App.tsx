import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, Mic, MicOff, Volume2, VolumeX, Languages, X, MessageSquare, Menu, ChevronDown, Layout, Headphones, Sparkles, MapPin, ArrowUp } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { GroundingCard } from './components/GroundingCard';
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { SphereAnimation } from './components/SphereAnimation';
import { AtlasLogo } from './components/AtlasLogo';
import { ChatSession, Message, Coordinates } from './types';
import { generateResponse, generateTitle } from './services/geminiService';

const STORAGE_KEY = 'geoguide_sessions';
const USER_KEY = 'geoguide_user';

interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;

const LANGUAGES = [
  { code: 'en-US', label: 'EN', name: 'English' },
  { code: 'hi-IN', label: 'HI', name: 'Hindi' },
  { code: 'bn-IN', label: 'BN', name: 'Bengali' },
];

type ViewMode = 'landing' | 'chat' | 'voice';

function App() {
  // --- Auth & User State ---
  const [user, setUser] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- View State ---
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Chat State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);

  // Voice & Call Mode State
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState(LANGUAGES[0]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  // Settings State
  const [volume, setVolume] = useState(1.0);
  const [vadSensitivity, setVadSensitivity] = useState(1500);
  const [speechRate, setSpeechRate] = useState(1.05);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) setUser(JSON.parse(storedUser));

    const storedSessions = localStorage.getItem(STORAGE_KEY);
    if (storedSessions) {
      try {
        const parsedSessions = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          setCurrentSessionId(parsedSessions[0].id);
        }
      } catch (e) { console.error("Failed to load sessions:", e); }
    }

    if (window.innerWidth < 768) setIsSidebarOpen(false);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => { console.log("Geolocation permission denied or error."); }
      );
    }

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLang.code;
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang.code;
      if (isListening) {
        recognitionRef.current.stop();
        setTimeout(() => { if (viewMode === 'voice') startListening(); }, 200);
      }
    }
  }, [speechLang]);

  useEffect(() => {
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessions, currentSessionId, isLoading, viewMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setIsModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setIsSettingsOpen(false);
    setSessions([]);
    setCurrentSessionId(null);
    setViewMode('landing');
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Journey',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  const deleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setViewMode('landing');
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) { setIsListening(true); }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) { }
    setIsListening(false);
  };

  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      if (viewMode === 'voice') setInput('');
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (viewMode === 'voice') {
        if (input.trim().length > 0) {
          handleSend();
        } else if (!isLoading && !isSpeaking) {
          setTimeout(() => startListening(), 1000);
        }
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      if (viewMode === 'voice') {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) recognitionRef.current.stop();
        }, vadSensitivity);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
    };

  }, [viewMode, input, vadSensitivity, isLoading, isSpeaking]);

  const speakText = (text: string) => {
    if (volume === 0 || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_~`#]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/https?:\/\/\S+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLang.code;
    const voices = window.speechSynthesis.getVoices();
    const baseLang = speechLang.code.split('-')[0];

    let preferredVoice = voices.find(v => v.lang === speechLang.code && (v.name.includes('Google') || v.name.includes('Natural')));
    if (!preferredVoice) preferredVoice = voices.find(v => v.lang === speechLang.code);
    if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(baseLang));

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (viewMode === 'voice') setTimeout(() => startListening(), 500);
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (isListening) stopListening();

    let sessionId = currentSessionId;
    let shouldGenerateTitle = false;

    if (!sessionId) {
      sessionId = createNewSession();
      shouldGenerateTitle = true;
    } else {
      const sess = sessions.find(s => s.id === sessionId);
      if (sess && (sess.messages.length === 0 || sess.title === 'New Journey')) shouldGenerateTitle = true;
    }

    const userText = input;
    setInput('');
    setIsLoading(true);
    if (viewMode === 'landing') setViewMode('chat');

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) return { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() };
      return s;
    }));

    try {
      if (shouldGenerateTitle) {
        generateTitle(userText).then(title => {
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
        });
      }

      const history = sessions.find(s => s.id === sessionId)?.messages || [];
      const userProfileContext = user?.preferences ? `User Preferences: ${JSON.stringify(user.preferences)}` : "";

      const result = await generateResponse([...history, userMessage], userText, location, speechLang.name, userProfileContext);

      const aiMessage: Message = {
        id: uuidv4(),
        role: 'model',
        text: result.text,
        groundingChunks: result.groundingChunks,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) return { ...s, messages: [...s.messages, aiMessage], updatedAt: Date.now() };
        return s;
      }));

      if (viewMode === 'voice') speakText(result.text);

    } catch (error) {
      if (viewMode === 'voice') speakText("I'm having trouble connecting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (mode: ViewMode) => {
    window.speechSynthesis.cancel();
    stopListening();
    setIsSpeaking(false);
    setViewMode(mode);
    setIsModeMenuOpen(false);
    if (mode === 'voice') setTimeout(() => startListening(), 500);
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const lastMessageWithCards = currentSession?.messages.slice().reverse().find(m => m.role === 'model' && m.groundingChunks && m.groundingChunks.length > 0);

  return (
    <div className="flex h-[100dvh] bg-[#0f1117] text-slate-200 overflow-hidden font-sans relative selection:bg-indigo-500/30">

      {/* --- GLOBAL SETTINGS MODAL --- */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onLogout={handleLogout}
        currentLang={speechLang}
        onLangChange={setSpeechLang}
        vadSensitivity={vadSensitivity}
        setVadSensitivity={setVadSensitivity}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
      />

      {/* --- SIDEBAR --- */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => { setCurrentSessionId(id); setViewMode('chat'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        onNewChat={() => { createNewSession(); setViewMode('chat'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDeleteSession={deleteSession}
        onLogout={handleLogout}
        user={user}
      />

      {/* --- MAIN CONTENT AREA --- */}
      {/* Changed: Removed relative/transition margins. Now using simple flex. */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0f1117] relative">

        {/* BACKGROUND SPHERE (Landing & Voice) */}
        {(viewMode === 'landing' || viewMode === 'voice') && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
            <SphereAnimation isSpeaking={isSpeaking} isListening={isListening} />
          </div>
        )}

        {/* --- HEADER --- */}
        {/* Changed: Removed fixed positioning. Now a flex item. */}
        <header className="flex-none h-14 flex items-center justify-between px-4 md:px-6 z-30 bg-gradient-to-b from-[#0f1117] to-transparent">

          {/* Left: Sidebar Toggle & Mode Selector */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Menu size={20} />
            </button>

            {/* Brand Logo */}
            <div className="text-indigo-500 flex items-center">
              <AtlasLogo size={24} />
            </div>

            {/* Mode Selector (Gemini Style) */}
            <div className="relative" ref={modeMenuRef}>
              <button
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                className="flex items-center gap-2 text-lg font-medium text-slate-200 hover:text-white transition-colors opacity-90 hover:opacity-100"
              >
                <span className="tracking-tight">Atlas 1.0</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isModeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModeMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 z-50">
                  <button
                    onClick={() => handleModeSwitch('chat')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${viewMode === 'chat' || viewMode === 'landing' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <MessageSquare size={16} /> Chat
                  </button>
                  <button
                    onClick={() => handleModeSwitch('voice')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${viewMode === 'voice' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <Headphones size={16} /> Voice Mode
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Language & Volume */}
          <div className="flex items-center gap-4">
            {/* Volume (Voice Mode Only) */}
            {viewMode === 'voice' && (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="text-slate-400 hover:text-white transition-colors">
                  {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hidden sm:block" />
              </div>
            )}

            {/* Location Status Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              title={location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Location not available - enable GPS for nearby recommendations"}
            >
              <MapPin size={14} className={location ? "text-emerald-400" : "text-amber-400"} />
              <span className={`text-xs ${location ? "text-emerald-400" : "text-amber-400"}`}>
                {location ? "5km" : "No GPS"}
              </span>
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Change Language"
              >
                <Languages size={20} />
              </button>

              {isLangMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden p-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSpeechLang(lang); setIsLangMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors ${speechLang.code === lang.code ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300'}`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- VIEWS --- */}

        {/* LANDING VIEW */}
        {viewMode === 'landing' && (
          <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 overflow-y-auto">
            <div className="w-full max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight">
                  Good evening, {user?.name?.split(' ')[0] || 'Traveler'}
                </h1>
                <p className="text-lg text-slate-400">Where shall we explore today?</p>
              </div>

              {/* Search Input Landing */}
              <div className="relative max-w-xl mx-auto w-full group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl flex items-center p-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent border-none text-white placeholder-slate-500 px-4 py-3 focus:outline-none text-base"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 bg-white text-black rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 justify-center pt-4">
                {['Best coffee nearby', 'Weekend trip ideas', 'Hidden gems in Tokyo'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm text-slate-400 hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* VOICE VIEW */}
        {viewMode === 'voice' && (
          <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center pb-32">
              <div className="text-center space-y-4 relative z-20 px-6">
                <div className={`text-3xl font-medium transition-colors duration-500 ${isSpeaking ? "text-indigo-400" : isListening ? "text-rose-400" : "text-white"}`}>
                  {isSpeaking ? "Atlas is speaking..." : isListening ? "Listening..." : "Tap to speak"}
                </div>
                <p className="text-slate-400 text-xl min-h-[1.5rem] max-w-2xl mx-auto leading-relaxed">{input}</p>
              </div>

              {/* Voice Card Overlay */}
              {lastMessageWithCards && !isSpeaking && (
                <div className="absolute bottom-32 left-0 right-0 flex gap-4 overflow-x-auto px-6 pb-4 z-20 snap-x justify-center no-scrollbar">
                  {lastMessageWithCards.groundingChunks!.map((chunk, idx) => (
                    <div key={idx} className="min-w-[280px] w-[280px] snap-center transform hover:scale-105 transition-transform duration-300">
                      <GroundingCard chunk={chunk} userLocation={location} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Controls */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center z-30 gap-6 items-center">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-105 ${isListening ? 'bg-rose-500 text-white shadow-rose-500/40' : 'bg-white text-black hover:bg-indigo-50'}`}
              >
                {isListening ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
            </div>
          </main>
        )}

        {/* CHAT VIEW */}
        {viewMode === 'chat' && (
          <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <div className="max-w-3xl mx-auto py-6 px-4 space-y-8 pb-32">
                {currentSession?.messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-1">
                        <AtlasLogo size={16} className="text-white" />
                      </div>
                    )}

                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#2f3136] text-white rounded-2xl px-5 py-3.5' : 'text-slate-200'}`}>
                      <MarkdownRenderer content={msg.text} userLocation={location} />
                      {msg.groundingChunks && (
                        <div className="mt-4 grid gap-3">
                          {msg.groundingChunks.map((chunk, idx) => <GroundingCard key={idx} chunk={chunk} userLocation={location} />)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-1 animate-pulse">
                      <AtlasLogo size={16} className="text-white" />
                    </div>
                    <div className="flex items-center text-slate-500 text-sm">Thinking...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Floating Input Area */}
            <div className="absolute bottom-0 left-0 right-3 p-4 bg-gradient-to-t from-[#0f1117] via-[#0f1117] to-transparent z-20">
              <div className="max-w-3xl mx-auto relative bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl focus-within:border-indigo-500/50 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Atlas..."
                  className="w-full bg-transparent text-slate-200 rounded-3xl pl-5 pr-14 py-4 focus:outline-none resize-none text-base max-h-32 scrollbar-hide"
                  rows={1}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2.5 bg-white text-black rounded-full hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
              <div className="text-center mt-3 text-[11px] text-slate-600 font-medium">
                Atlas can make mistakes. Please verify important information.
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
