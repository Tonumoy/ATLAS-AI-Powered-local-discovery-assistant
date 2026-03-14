import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, Mic, MicOff, Volume2, VolumeX, Languages, X, MessageSquare, Menu, ChevronDown, Layout, Headphones, Sparkles, MapPin, ArrowUp, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
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

// Time-aware greeting
const getGreeting = (name: string): string => {
  const hour = new Date().getHours();
  const displayName = name?.split(' ')[0] || 'Traveler';
  if (hour < 12) return `Good morning, ${displayName}`;
  if (hour < 17) return `Good afternoon, ${displayName}`;
  return `Good evening, ${displayName}`;
};

// Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">🌍</div>
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">Atlas encountered an unexpected error.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium">
              Reload Atlas
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error' | 'unsupported'>('idle');
  const [showLocationHelp, setShowLocationHelp] = useState(false);

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

  // Voice mode refs to avoid stale closures
  const inputRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);
  const wantToListenRef = useRef<boolean>(false); // Tracks user intent to listen
  const viewModeRef = useRef<ViewMode>('landing');
  const isSpeakingRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);

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

    // Request geolocation with retry logic
    const requestLocation = () => {
      if ("geolocation" in navigator) {
        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setLocationStatus('granted');
            console.log('GPS: Location obtained');
          },
          (error) => {
            console.log("Geolocation error:", error.message);
            if (error.code === 1) {
              setLocationStatus('denied');
            } else if (error.code === 2) {
              setLocationStatus('unavailable');
            } else {
              setLocationStatus('error');
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        setLocationStatus('unsupported');
      }
    };

    requestLocation();

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;  // Keep listening until user stops
      recognition.interimResults = true;
      recognition.lang = speechLang.code;
      recognitionRef.current = recognition;
      console.log('Speech recognition initialized');
    } else {
      console.log('Speech recognition not supported');
    }
  }, []);

  useEffect(() => {
    // Always persist sessions, even when empty (fixes: can't delete all sessions)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang.code;
      // If currently listening, restart with new language
      if (isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
        // Restart will happen automatically via onend handler
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
    if (!window.confirm("Are you sure you want to delete this journey?")) return;

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setViewMode('landing');
    }
  };

  // Keep refs in sync with state
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // ============ VOICE MODE - COMPLETE REWRITE ============

  // Start listening - user taps mic
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.log('No speech recognition');
      alert('Speech recognition not supported in this browser');
      return;
    }
    if (isListeningRef.current) return;

    // Cancel speech if playing
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Start fresh
    wantToListenRef.current = true;
    setInput('');
    inputRef.current = '';

    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
      console.log('Started listening');
    } catch (e: any) {
      console.log('Start error:', e.message);
      if (e.name === 'InvalidStateError') {
        // Already running
        isListeningRef.current = true;
        setIsListening(true);
      }
    }
  }, []);

  // Stop listening and send - user taps mic again
  const stopListeningAndSend = useCallback(() => {
    if (!recognitionRef.current) return;

    wantToListenRef.current = false;

    try {
      recognitionRef.current.stop();
    } catch (e) { }

    isListeningRef.current = false;
    setIsListening(false);

    // Get the input and send it
    const textToSend = inputRef.current.trim();
    console.log('Stopping, text to send:', textToSend);

    if (textToSend.length > 0) {
      // Use a slight delay then trigger send
      setTimeout(() => {
        // Manually trigger the send
        const event = new CustomEvent('voice-send-message', { detail: { text: textToSend } });
        document.dispatchEvent(event);
      }, 50);
    }
  }, []);

  // Stop without sending (for mode switch)
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    wantToListenRef.current = false;
    try {
      recognitionRef.current.stop();
    } catch (e) { }
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  // Recognition event handlers
  useEffect(() => {
    if (!recognitionRef.current) return;
    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      console.log('Recognition started');
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Recognition ended, wantToListen:', wantToListenRef.current);
      const wasListening = isListeningRef.current;
      isListeningRef.current = false;
      setIsListening(false);

      // Auto-restart if user still wants to listen (browser timeout protection)
      if (wantToListenRef.current && viewModeRef.current === 'voice' && !isSpeakingRef.current && !isLoadingRef.current) {
        setTimeout(() => {
          if (wantToListenRef.current && !isListeningRef.current) {
            try {
              recognition.start();
              isListeningRef.current = true;
              setIsListening(true);
              console.log('Auto-restarted');
            } catch (e) {
              console.log('Auto-restart failed');
            }
          }
        }, 200);
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setInput(fullTranscript);
      inputRef.current = fullTranscript;
    };

    recognition.onerror = (event: any) => {
      console.log('Recognition error:', event.error);

      if (event.error === 'no-speech') {
        // Normal - browser will restart via onend
        return;
      }

      if (event.error === 'aborted' || event.error === 'not-allowed') {
        wantToListenRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    return () => { };
  }, []);

  // Keep handleSendRef in sync with latest handleSend
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  // Handle voice send message event
  useEffect(() => {
    const handleVoiceSendMessage = (e: CustomEvent) => {
      const text = e.detail?.text;
      console.log('Voice send message received:', text);

      if (text && text.trim().length > 0 && !isLoadingRef.current) {
        setInput(text);
        inputRef.current = text;

        setTimeout(() => {
          handleSendRef.current?.();
        }, 50);
      }
    };

    document.addEventListener('voice-send-message', handleVoiceSendMessage as EventListener);
    return () => document.removeEventListener('voice-send-message', handleVoiceSendMessage as EventListener);
  }, []);

  // ============ END VOICE MODE ============

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
      // WhatsApp style: Don't auto-start listening, user must tap mic
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Ref to always have the latest handleSend (fixes stale closure in voice event)
  const handleSendRef = useRef<(() => void) | null>(null);

  const handleSend = async () => {
    // Check both state and ref (ref is more up-to-date for voice mode)
    const textToSend = input.trim() || inputRef.current.trim();
    if (!textToSend || isLoading) return;
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

    const userText = textToSend;
    setInput('');
    inputRef.current = ''; // Clear the ref too
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
    // WhatsApp style: Don't auto-start, user taps mic to begin
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

      {/* --- LOCATION HELP MODAL --- */}
      {showLocationHelp && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <MapPin className="text-indigo-400" size={24} />
                Enable Location
              </h2>
              <button onClick={() => setShowLocationHelp(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-300 mb-4">
              Atlas needs your location to find nearby places. Since permission was blocked, you'll need to enable it in your browser settings:
            </p>

            <div className="space-y-3 text-sm">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-medium text-white mb-2">📱 On Mobile (Chrome/Safari):</h3>
                <ol className="text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Tap the <span className="text-white">🔒 lock icon</span> in address bar</li>
                  <li>Tap <span className="text-white">"Site settings"</span> or <span className="text-white">"Permissions"</span></li>
                  <li>Set <span className="text-white">Location</span> to <span className="text-emerald-400">"Allow"</span></li>
                  <li>Refresh the page</li>
                </ol>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-medium text-white mb-2">💻 On Desktop:</h3>
                <ol className="text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Click the <span className="text-white">🔒 lock icon</span> in address bar</li>
                  <li>Find <span className="text-white">"Location"</span> setting</li>
                  <li>Change to <span className="text-emerald-400">"Allow"</span></li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setShowLocationHelp(false);
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => setShowLocationHelp(false)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span className="tracking-tight">Atlas 2.0</span>
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

            {/* Location Status Indicator - Clickable to retry */}
            <button
              onClick={() => {
                if (locationStatus === 'denied') {
                  // Show help modal for blocked permissions
                  setShowLocationHelp(true);
                } else if (!location) {
                  // Request location again
                  if ("geolocation" in navigator) {
                    setLocationStatus('requesting');
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                        setLocationStatus('granted');
                      },
                      (error) => {
                        if (error.code === 1) {
                          setLocationStatus('denied');
                          setShowLocationHelp(true); // Show help when user denies
                        }
                        else if (error.code === 2) setLocationStatus('unavailable');
                        else setLocationStatus('error');
                      },
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                    );
                  }
                }
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${!location ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}`}
              title={
                location
                  ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : locationStatus === 'denied'
                    ? "Location blocked - tap for help enabling it"
                    : locationStatus === 'requesting'
                      ? "Requesting location..."
                      : "Tap to enable GPS"
              }
            >
              <MapPin size={14} className={
                location ? "text-emerald-400" :
                  locationStatus === 'requesting' ? "text-blue-400 animate-pulse" :
                    locationStatus === 'denied' ? "text-red-400" :
                      "text-amber-400"
              } />
              <span className={`text-xs ${location ? "text-emerald-400" :
                locationStatus === 'requesting' ? "text-blue-400" :
                  locationStatus === 'denied' ? "text-red-400" :
                    "text-amber-400"
                }`}>
                {location ? "5km" :
                  locationStatus === 'requesting' ? "..." :
                    locationStatus === 'denied' ? "Blocked" :
                      "No GPS"}
              </span>
            </button>

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
                  {getGreeting(user?.name)}
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

              {/* Powered by badge */}
              <div className="flex items-center justify-center gap-2 pt-4 opacity-40">
                <Zap size={12} className="text-indigo-400" />
                <span className="text-[11px] text-zinc-500">Powered by Gemini 2.5 · Google Maps</span>
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
                onClick={() => {
                  if (isListening) {
                    // User taps again to stop and send (WhatsApp style)
                    stopListeningAndSend();
                  } else {
                    // User taps to start listening
                    startListening();
                  }
                }}
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
                      {/* Feedback widget for AI responses */}
                      {msg.role === 'model' && !msg.isError && (
                        <FeedbackWidget messageId={msg.id} />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-1 animate-pulse">
                      <AtlasLogo size={16} className="text-white" />
                    </div>
                    <div className="flex-1 max-w-md space-y-3 py-2">
                      <div className="h-3 rounded-full animate-shimmer w-3/4" />
                      <div className="h-3 rounded-full animate-shimmer w-1/2" />
                      <div className="h-3 rounded-full animate-shimmer w-5/6" />
                    </div>
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

// Feedback Widget Component
const FEEDBACK_KEY = 'atlas_feedback';

function FeedbackWidget({ messageId }: { messageId: string }) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
      return stored[messageId] || null;
    } catch { return null; }
  });

  const handleFeedback = (type: 'up' | 'down') => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    try {
      const stored = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
      if (newFeedback) {
        stored[messageId] = newFeedback;
      } else {
        delete stored[messageId];
      }
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(stored));
    } catch { }
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ opacity: feedback ? 1 : undefined }}>
      <button
        onClick={() => handleFeedback('up')}
        className={`p-1.5 rounded-lg transition-all ${
          feedback === 'up'
            ? 'text-emerald-400 bg-emerald-500/10 animate-feedback-pop'
            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
        }`}
        title="Helpful"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={`p-1.5 rounded-lg transition-all ${
          feedback === 'down'
            ? 'text-rose-400 bg-rose-500/10 animate-feedback-pop'
            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
        }`}
        title="Not helpful"
      >
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}

// Wrap App with ErrorBoundary
function WrappedApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default WrappedApp;
