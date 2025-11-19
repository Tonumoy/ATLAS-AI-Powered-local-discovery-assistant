import React, { useState } from 'react';
import { X, User, Settings, Shield, LogOut, Globe, Languages, Mic, CreditCard, Waves, Volume2, MapPin, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  currentLang: any;
  onLangChange: (lang: any) => void;
  vadSensitivity: number;
  setVadSensitivity: (val: number) => void;
  speechRate: number;
  setSpeechRate: (val: number) => void;
}

const LANGUAGES = [
  { code: 'en-US', label: 'EN', name: 'English' },
  { code: 'hi-IN', label: 'HI', name: 'Hindi' },
  { code: 'bn-IN', label: 'BN', name: 'Bengali' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onLogout,
  currentLang,
  onLangChange,
  vadSensitivity,
  setVadSensitivity,
  speechRate,
  setSpeechRate
}) => {
  const [activeTab, setActiveTab] = useState('account');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-950/50 border-r border-slate-800 p-4 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 px-2">Settings</h2>
          
          <nav className="space-y-1 flex-1">
            <button 
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <User size={18} /> Account
            </button>
            <button 
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'voice' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Waves size={18} /> Voice & Audio
            </button>
            <button 
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Settings size={18} /> General
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Shield size={18} /> About & Guide
            </button>
          </nav>

          <button 
            onClick={onLogout}
            className="mt-6 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-900 p-6 md:p-8 overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2">
            <X size={20} />
          </button>

          {activeTab === 'account' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 overflow-hidden border-2 border-indigo-500/30">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-2xl">
                      {user.name?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.name}</h3>
                  <p className="text-slate-400 text-sm">{user.email || 'Guest User'}</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                 <h4 className="text-sm font-bold text-white mb-2">Subscription Plan</h4>
                 <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Free Tier</span>
                    <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">Upgrade</button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Mic size={20} className="text-indigo-400" /> Voice Activity Detection (VAD)
                </h3>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-6">
                   <div>
                      <div className="flex justify-between mb-2">
                         <label className="text-sm font-medium text-slate-300">Sensitivity (Response Wait Time)</label>
                         <span className="text-xs text-indigo-400 font-bold">{(vadSensitivity/1000).toFixed(1)}s</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="3000" 
                        step="100" 
                        value={vadSensitivity}
                        onChange={(e) => setVadSensitivity(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between mt-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                         <span>Fast (Interupts)</span>
                         <span>Relaxed (Waits)</span>
                      </div>
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Volume2 size={20} className="text-indigo-400" /> Speech Settings
                </h3>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-6">
                   <div>
                      <div className="flex justify-between mb-2">
                         <label className="text-sm font-medium text-slate-300">Speaking Speed</label>
                         <span className="text-xs text-indigo-400 font-bold">{speechRate}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.8" 
                        max="1.3" 
                        step="0.05" 
                        value={speechRate}
                        onChange={(e) => setSpeechRate(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                   </div>
                   
                   <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                      <span className="text-sm text-slate-300">Use Natural Fillers ("umm", "ah")</span>
                      <div className="w-10 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Globe size={20} className="text-indigo-400" /> Language
                </h3>
                <div className="grid gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => onLangChange(lang)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${currentLang.code === lang.code ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Languages size={18} />
                        <span className="font-medium">{lang.name}</span>
                      </div>
                      {currentLang.code === lang.code && (
                        <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-1">Mastering Atlas</h3>
                <p className="text-slate-400 text-sm">Your ultimate guide to the physical world.</p>
              </div>

              <div className="space-y-4">
                  {/* Intro Card */}
                  <div className="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/20">
                     <div className="flex gap-3 mb-2">
                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                           <Zap size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-white text-sm">What is Atlas?</h4>
                           <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                              Atlas is more than an AI. It's a sophisticated local companion designed to find the best physical places near you. 
                              Unlike standard search engines, Atlas "thinks" about vibe, social proof, and distance to give you the single best recommendation.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-1 gap-3">
                     <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                           <MapPin size={16} className="text-emerald-400" />
                           <span>Local Intelligence</span>
                        </div>
                        <p className="text-xs text-slate-400">
                           Atlas automatically biases search results to a <strong>5km radius</strong> around your live location. It prioritizes highly-rated, verified spots.
                        </p>
                     </div>

                     <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                           <Globe size={16} className="text-blue-400" />
                           <span>Multilingual Fluency</span>
                        </div>
                        <p className="text-xs text-slate-400">
                           Speak naturally in <strong>English, Hindi, or Bengali</strong>. Atlas adapts to the cultural context and language of your query.
                        </p>
                     </div>
                  </div>

                  {/* Voice Mechanics */}
                  <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
                     <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                        <Mic size={16} className="text-rose-400" />
                        Voice Mode Mechanics
                     </h4>
                     <ul className="space-y-3">
                        <li className="flex gap-3">
                           <div className="w-1 h-full min-h-[24px] bg-slate-700 rounded-full"></div>
                           <div>
                              <p className="text-xs font-bold text-slate-200">Smart Interruptions (Barge-In)</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                 Atlas listens while speaking. To interrupt, simply start talking. The AI will detect your voice, stop immediately, and listen to your new command.
                              </p>
                           </div>
                        </li>
                        <li className="flex gap-3">
                           <div className="w-1 h-full min-h-[24px] bg-slate-700 rounded-full"></div>
                           <div>
                              <p className="text-xs font-bold text-slate-200">Silence Detection</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                 In Voice Mode, Atlas waits for a pause in your speech before replying. You can adjust this sensitivity in the "Voice & Audio" settings tab.
                              </p>
                           </div>
                        </li>
                     </ul>
                  </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};