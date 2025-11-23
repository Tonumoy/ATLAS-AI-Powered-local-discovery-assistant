
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, Mic, MicOff, Volume2, VolumeX, Languages, X, MessageSquare, Menu, UserCircle, ChevronDown, Layout, Headphones } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  
  // Settings State
  const [volume, setVolume] = useState(1.0); 
  const [vadSensitivity, setVadSensitivity] = useState(1500);
  const [speechRate, setSpeechRate] = useState(1.05);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // --- Initialization ---

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) setUser(JSON.parse(storedUser));

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) { console.error(e); }
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => {}
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
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
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  // --- Voice Logic ---

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
    try { recognitionRef.current.stop(); } catch(e) { }
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
      const result = await generateResponse([...history, userMessage], userText, location, speechLang.name);

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
    if (mode === 'voice') setTimeout(() => startListening(), 500);
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const lastMessageWithCards = currentSession?.messages.slice().reverse().find(m => m.role === 'model' && m.groundingChunks && m.groundingChunks.length > 0);

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden font-sans relative">
      
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

      {/* --- SIDEBAR (Chat Mode Only) --- */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-auto transition-transform duration-300 ease-in-out`}>
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
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative w-full bg-[#0f1117] z-0">
        
        {/* BACKGROUND SPHERE (Landing & Voice) */}
        {(viewMode === 'landing' || viewMode === 'voice') && (
           <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
              <SphereAnimation isSpeaking={isSpeaking} isListening={isListening} />
           </div>
        )}

        {/* --- HEADER (Gemini-Style) --- */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800/50 bg-[#0f1117]/90 backdrop-blur-md z-30">
          
          {/* Left: Sidebar Toggle (Mobile Only) */}
          <div className="flex items-center gap-2">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
                <Menu size={20} />
             </button>
             <div className="hidden md:flex items-center gap-2 text-slate-400">
               {/* Optional Branding if Sidebar is hidden or collapsed concept in future */}
             </div>
          </div>

          {/* Center: Mode Switcher Pill (GPT-4 Style) */}
          <div className="flex items-center bg-slate-800/80 rounded-full p-1 border border-slate-700/50 shadow-inner">
             <button 
               onClick={() => handleModeSwitch('chat')}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'chat' || viewMode === 'landing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <MessageSquare size={14} /> Chat
             </button>
             <button 
               onClick={() => handleModeSwitch('voice')}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'voice' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Headphones size={14} /> Voice
             </button>
          </div>

          {/* Right: Language & Profile */}
          <div className="flex items-center gap-3">
             {/* Volume (Voice Mode Only) */}
             {viewMode === 'voice' && (
               <div className="flex items-center gap-2 mr-2">
                  <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="text-slate-400 hover:text-white">
                     {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 hidden sm:block" />
               </div>
             )}

             {/* Language */}
             <button 
                 onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs font-medium text-slate-300 transition-all"
             >
                 <Languages size={14} />
                 <span>{speechLang.label}</span>
             </button>
             
             {isLangMenuOpen && (
               <div className="absolute top-14 right-4 w-40 bg-[#1c1f26] border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden p-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSpeechLang(lang); setIsLangMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-indigo-600 hover:text-white transition-colors ${speechLang.code === lang.code ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300'}`}
                    >
                      {lang.name}
                    </button>
                  ))}
               </div>
             )}
          </div>
        </header>

        {/* --- VIEWS --- */}

        {/* LANDING VIEW */}
        {viewMode === 'landing' && (
          <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
             <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                  Ask Atlas Anything.
                </h1>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <button 
                      onClick={() => { if (!currentSessionId) createNewSession(); handleModeSwitch('chat'); }}
                      className="px-8 py-3.5 bg-white text-slate-950 rounded-full font-bold text-sm hover:bg-indigo-50 shadow-xl shadow-white/5 transition-transform hover:scale-105"
                   >
                      Start Chatting
                   </button>
                </div>
             </div>
          </main>
        )}

        {/* VOICE VIEW */}
        {viewMode === 'voice' && (
           <main className="flex-1 flex flex-col relative z-10">
              <div className="flex-1 flex flex-col items-center justify-center pb-32">
                 <div className="text-center space-y-2 relative z-20 px-6">
                    <h2 className="text-2xl font-bold text-white animate-pulse">{isSpeaking ? "Atlas is speaking..." : isListening ? "Listening..." : "Tap to speak"}</h2>
                    <p className="text-slate-400 text-lg min-h-[1.5rem]">{input}</p>
                 </div>
                 
                 {/* Voice Card Overlay */}
                 {lastMessageWithCards && !isSpeaking && (
                    <div className="absolute bottom-32 left-0 right-0 flex gap-4 overflow-x-auto px-6 pb-4 z-20 snap-x justify-center no-scrollbar">
                       {lastMessageWithCards.groundingChunks!.map((chunk, idx) => (
                          <div key={idx} className="min-w-[260px] w-[260px] snap-center">
                             <GroundingCard chunk={chunk} />
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Voice Controls */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30 gap-6 items-center">
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-110 ${isListening ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-white text-slate-900'}`}
                >
                   {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>
           </main>
        )}

        {/* CHAT VIEW */}
        {viewMode === 'chat' && (
           <main className="flex-1 flex flex-col relative z-10 h-full">
              <div className="flex-1 overflow-y-auto p-4 md:p-0 scroll-smooth">
                <div className="max-w-3xl mx-auto py-6 space-y-6 md:px-4">
                  {currentSession?.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${msg.role === 'user' ? 'bg-[#2f3136] text-white' : 'bg-transparent pl-0'}`}>
                         <MarkdownRenderer content={msg.text} />
                         {msg.groundingChunks && (
                           <div className="mt-4 grid gap-3">
                              {msg.groundingChunks.map((chunk, idx) => <GroundingCard key={idx} chunk={chunk} />)}
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start pl-0">
                       <div className="flex gap-1 items-center text-slate-500 text-sm pl-4">Thinking<span className="animate-pulse">...</span></div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <footer className="p-4 bg-[#0f1117] z-20">
                <div className="max-w-3xl mx-auto relative bg-[#1c1f26] border border-slate-700/50 rounded-2xl shadow-xl focus-within:border-indigo-500/50 transition-colors">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Atlas..."
                    className="w-full bg-transparent text-slate-200 rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none resize-none text-sm"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-2 bg-white text-slate-900 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="text-center mt-2 text-[10px] text-slate-600">
                   Atlas can make mistakes. Check important info.
                </div>
              </footer>
           </main>
        )}
      </div>
    </div>
  );
}

export default App;
