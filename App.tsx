import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, Loader2, Mic, MicOff, Volume2, VolumeX, Languages, X, Headphones, MessageSquare, Settings, UserCircle } from 'lucide-react';
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
  
  // --- Chat State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  
  // Voice & Call Mode State
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState(LANGUAGES[0]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Settings State
  const [volume, setVolume] = useState(1.0); // 0.0 to 1.0
  const [vadSensitivity, setVadSensitivity] = useState(1500); // ms to wait before responding
  const [speechRate, setSpeechRate] = useState(1.05); // Speech speed

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // --- Initialization ---

  useEffect(() => {
    // Check Auth
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }

    // Load History
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      } catch (e) { console.error(e); }
    }
    
    // Get Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    } else { setIsLocating(false); }

    // Init Speech Rec
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

  // Update language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang.code;
      // Restart if currently listening to apply new language
      if (isListening) {
         recognitionRef.current.stop();
         // Will auto-restart via onend if in voice mode, 
         // but manual restart ensures cleaner state switch
         setTimeout(() => {
            if (viewMode === 'voice') startListening();
         }, 200);
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
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  // --- Voice Logic ---

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      // Handle Interruption: Stop AI speaking if user starts listening manually
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // likely already started
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
        recognitionRef.current.stop();
    } catch(e) { }
    setIsListening(false);
  };

  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      // Interruption Logic: If AI is speaking and user starts talking, stop AI.
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
           // Auto-restart if we didn't catch anything and aren't busy
           // This keeps the "Live" feel
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
        
        // VAD: Silence Timer
        if (viewMode === 'voice') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          // Wait for 'vadSensitivity' ms of silence before stopping
          silenceTimerRef.current = setTimeout(() => {
             if (recognitionRef.current) recognitionRef.current.stop();
          }, vadSensitivity);
        }
    };

    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      setIsListening(false);
    };

  }, [viewMode, input, vadSensitivity, isLoading, isSpeaking]);

  const speakText = (text: string) => {
    if (volume === 0 || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*_~`#]/g, '') 
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLang.code;
    const voices = window.speechSynthesis.getVoices();
    
    // Enhanced Voice Selection
    // 1. Try exact match (e.g., bn-IN with "Google")
    // 2. Try exact code match (bn-IN)
    // 3. Try general lang match (bn)
    const baseLang = speechLang.code.split('-')[0];
    
    let preferredVoice = voices.find(v => v.lang === speechLang.code && (v.name.includes('Google') || v.name.includes('Natural')));
    if (!preferredVoice) preferredVoice = voices.find(v => v.lang === speechLang.code);
    if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(baseLang));

    if (preferredVoice) utterance.voice = preferredVoice;
    
    // Use configurable Speech Rate
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (viewMode === 'voice') {
        // Small delay before listening again to prevent loop
        setTimeout(() => startListening(), 500);
      }
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
      // Check if existing session is empty or titled 'New Journey'
      // Also check if title is strictly 'New Journey' to fix stuck titles
      const sess = sessions.find(s => s.id === sessionId);
      if (sess && (sess.messages.length === 0 || sess.title === 'New Journey')) {
        shouldGenerateTitle = true;
      }
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

      // Only speak if we are in Voice Mode
      if (viewMode === 'voice') {
        speakText(result.text);
      }

    } catch (error) {
       if (viewMode === 'voice') {
         speakText("I'm having trouble connecting. Please try again.");
       }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (mode: ViewMode) => {
    // Cleanup when switching views
    window.speechSynthesis.cancel();
    stopListening();
    setIsSpeaking(false);
    setViewMode(mode);
    
    if (mode === 'voice') {
      setTimeout(() => startListening(), 500);
    }
  };

  // --- RENDER ---

  if (!user) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  const getVoiceStatusText = () => {
    if (isSpeaking) return "Atlas is speaking...";
    if (isListening) return "Listening...";
    if (isLoading) return "Thinking...";
    return "Tap mic to speak";
  };

  // Helper to get the last message with grounding chunks for Voice Mode overlay
  const lastMessageWithCards = currentSession?.messages
      .slice()
      .reverse()
      .find(m => m.role === 'model' && m.groundingChunks && m.groundingChunks.length > 0);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      
      {/* Global Modals */}
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

      {/* Sidebar - Only visible in Chat Mode. Controlled via state on Mobile */}
      {viewMode === 'chat' && (
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            // Don't need to set viewMode here as sidebar is only in chat
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onNewChat={() => {
             createNewSession();
             setViewMode('chat');
             if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onDeleteSession={deleteSession}
          user={user}
        />
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full relative w-full z-0">
        
        {/* 3D Sphere Background - VISIBLE ONLY ON LANDING & VOICE */}
        {(viewMode === 'landing' || viewMode === 'voice') && (
           <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
              <SphereAnimation isSpeaking={isSpeaking} isListening={isListening} />
           </div>
        )}

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-slate-900/30 backdrop-blur-xl z-20 relative border-b border-slate-800/30">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle - NOW USER PROFILE ICON */}
            {viewMode === 'chat' && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 overflow-hidden flex items-center justify-center">
                   {user.avatar ? (
                     <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <UserCircle size={20} className="text-indigo-400" />
                   )}
                </div>
              </button>
            )}
            
            {/* Header Logo - Visible only in Landing and Voice modes */}
            {viewMode !== 'chat' && (
              <button 
                onClick={() => handleModeSwitch('landing')} 
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
              >
                <AtlasLogo size={28} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg tracking-tight hidden md:block">Atlas</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
             
             {/* Volume Control - ONLY IN VOICE MODE */}
             {viewMode === 'voice' && (
               <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 group hover:bg-slate-800 transition-all">
                  <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="text-slate-400 hover:text-white">
                     {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input 
                     title={`Volume: ${Math.round(volume * 100)}%`}
                     type="range" 
                     min="0" 
                     max="1" 
                     step="0.1" 
                     value={volume}
                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                     className="w-20 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
               </div>
             )}

             {/* Language Selector */}
             <div className="relative">
               <button 
                 onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isLangMenuOpen ? 'bg-slate-800 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'}`}
               >
                 <Languages size={14} />
                 <span className="text-xs font-semibold">{speechLang.label}</span>
               </button>
               
               {isLangMenuOpen && (
                 <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsLangMenuOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSpeechLang(lang);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${speechLang.code === lang.code ? 'text-indigo-400 font-medium' : 'text-slate-300'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                 </>
               )}
             </div>
             
             {/* Settings (Visible in all modes now via header or Voice UI) */}
             {viewMode !== 'voice' && (
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white">
                   <Settings size={20} />
                </button>
             )}

             {/* Mode Switchers in Header */}
             {viewMode === 'chat' && (
               <button
                 onClick={() => handleModeSwitch('voice')}
                 className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm"
               >
                 <Headphones size={16} />
                 <span className="hidden md:inline">Voice Mode</span>
               </button>
             )}
             
             {viewMode === 'voice' && (
               <button 
                 onClick={() => handleModeSwitch('landing')}
                 className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
               >
                  <X size={20} />
               </button>
             )}
          </div>
        </header>

        {/* --- LANDING VIEW --- */}
        {viewMode === 'landing' && (
          <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 animate-in fade-in duration-700">
             <div className="text-center space-y-6 max-w-2xl flex flex-col items-center">
                
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">
                  Ask Atlas Anything.
                </h1>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                  Your personal guide to the physical world. Discover local gems, compare places, and chat naturally.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                   <button 
                      onClick={() => {
                        if (!currentSessionId) createNewSession();
                        handleModeSwitch('chat');
                      }}
                      className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
                   >
                      <MessageSquare size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                      Start Chatting
                   </button>
                   <button 
                      onClick={() => handleModeSwitch('voice')}
                      className="px-8 py-4 bg-slate-800/50 backdrop-blur-md border border-slate-700 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                   >
                      <Headphones size={20} className="group-hover:scale-110 transition-transform" />
                      Voice Mode
                   </button>
                </div>
             </div>
          </main>
        )}

        {/* --- VOICE VIEW --- */}
        {viewMode === 'voice' && (
           <main className="flex-1 flex flex-col relative z-10 animate-in fade-in duration-500 h-full">
              
              {/* Center Content */}
              <div className="flex-1 flex flex-col items-center justify-center z-10 relative pb-40">
                 <div className="text-center space-y-4 relative z-20 px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white transition-all min-h-[3rem] drop-shadow-xl">
                       {getVoiceStatusText()}
                    </h2>
                    <p className="text-slate-300 text-xl font-light min-h-[1.5rem] max-w-xl mx-auto text-center leading-relaxed">
                       {input}
                    </p>
                 </div>

                 {/* Visual Cards Overlay for Voice Mode */}
                 {lastMessageWithCards && !isSpeaking && (
                    <div className="absolute bottom-32 left-0 right-0 flex gap-4 overflow-x-auto px-6 pb-4 z-20 snap-x justify-center pointer-events-auto">
                       {lastMessageWithCards.groundingChunks!.map((chunk, idx) => (
                          <div key={idx} className="min-w-[280px] w-[280px] snap-center">
                             <GroundingCard chunk={chunk} />
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Bottom Mic Control - Pushed to very bottom */}
              <div className="absolute bottom-12 left-0 right-0 flex justify-center z-30 pointer-events-auto">
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 ${isListening ? 'bg-rose-500 text-white shadow-rose-500/40 animate-pulse' : 'bg-slate-800/80 backdrop-blur-md text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'}`}
                >
                    {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
              </div>

              {/* Settings Trigger for Voice Mode */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="absolute bottom-12 right-8 p-3 bg-slate-900/50 backdrop-blur-md rounded-full text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition-all z-30"
              >
                 <Settings size={20} />
              </button>
           </main>
        )}

        {/* --- CHAT VIEW --- */}
        {viewMode === 'chat' && (
           <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden animate-in fade-in duration-300">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                  {currentSession?.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-4 shadow-sm backdrop-blur-xl
                          ${msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-sm' 
                            : 'bg-slate-900/70 border border-slate-700/50 rounded-bl-sm text-slate-200'}
                        `}
                      >
                         <MarkdownRenderer content={msg.text} />
                         
                         {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                           <div className="mt-4 grid gap-3">
                              {msg.groundingChunks.map((chunk, idx) => (
                                <GroundingCard key={idx} chunk={chunk} />
                              ))}
                           </div>
                         )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl rounded-bl-sm px-6 py-4 flex items-center gap-3">
                         <div className="flex gap-1">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                         </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area - ONLY IN CHAT MODE */}
              <footer className="p-4 md:p-6 z-20">
                <div className="max-w-3xl mx-auto relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about places..."
                    className="w-full bg-slate-900/80 backdrop-blur-xl text-white rounded-2xl pl-6 pr-24 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-xl border border-slate-700"
                    rows={1}
                    style={{ minHeight: '60px', maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
                <div className="text-center mt-3 text-[10px] text-slate-600 font-semibold tracking-widest uppercase">
                   Powered by Gemini 2.5 • Google Maps
                </div>
              </footer>
           </main>
        )}

      </div>
    </div>
  );
}

export default App;