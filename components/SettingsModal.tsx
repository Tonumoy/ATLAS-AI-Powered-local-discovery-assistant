import React, { useState } from 'react';
import { X, User, Settings, Shield, LogOut, Globe, Languages, Mic, CreditCard, Waves, Volume2, MapPin, Zap } from 'lucide-react';
import { AtlasLogo } from './AtlasLogo';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[80vh]">

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[#090a0d] border-r border-white/5 p-4 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 px-2">Settings</h2>

          <nav className="space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
            >
              <User size={16} /> Account
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'voice' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
            >
              <Waves size={16} /> Voice & Audio
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
            >
              <Settings size={16} /> General
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
            >
              <Shield size={16} /> About & Guide
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#18181b] p-6 md:p-8 overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 transition-colors">
            <X size={20} />
          </button>

          {activeTab === 'account' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border border-white/10 shadow-inner">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.name?.[0] || 'A'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <p className="text-zinc-400 text-sm">{user.email || 'Guest User'}</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-2">Subscription Plan</h4>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Free Tier</span>
                  <button className="text-xs bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors font-medium">Upgrade</button>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium border border-rose-500/20"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Mic size={18} className="text-indigo-400" /> Voice Activity Detection
                </h3>
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-300">Response Speed</label>
                      <span className="text-xs text-indigo-400 font-bold">{(vadSensitivity / 1000).toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={vadSensitivity}
                      onChange={(e) => setVadSensitivity(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">How long to wait after you stop speaking before sending</p>
                  </div>
                </div>
              </div>

              {/* Speech Rate Slider */}
              <div>
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Volume2 size={18} className="text-indigo-400" /> Speech Output
                </h3>
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-300">Speaking Speed</label>
                      <span className="text-xs text-indigo-400 font-bold">{speechRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                      <span>Slow</span>
                      <span>Normal</span>
                      <span>Fast</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-indigo-400" /> Language
                </h3>
                <div className="grid gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => onLangChange(lang)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${currentLang.code === lang.code ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Languages size={16} />
                        <span className="font-medium text-sm">{lang.name}</span>
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
                <div className="inline-flex items-center justify-center mb-3">
                  <AtlasLogo size={32} className="text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Atlas 2.0</h3>
                <p className="text-zinc-400 text-sm">AI-Powered Local Discovery Assistant</p>
              </div>

              <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                <p className="text-sm text-indigo-200 leading-relaxed">
                  Atlas uses Gemini 2.5 Flash with Google Maps integration to find the best places near you through natural conversation and voice interaction.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                  <div className="text-lg font-bold text-white">5km</div>
                  <div className="text-[10px] text-zinc-500 font-medium">Search Radius</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                  <div className="text-lg font-bold text-white">3</div>
                  <div className="text-[10px] text-zinc-500 font-medium">Languages</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                  <div className="text-lg font-bold text-white flex items-center justify-center gap-1"><Zap size={14} className="text-indigo-400" />Gemini</div>
                  <div className="text-[10px] text-zinc-500 font-medium">AI Engine</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                  <div className="text-lg font-bold text-white flex items-center justify-center gap-1"><MapPin size={14} className="text-emerald-400" />Maps</div>
                  <div className="text-[10px] text-zinc-500 font-medium">Location Data</div>
                </div>
              </div>

              <p className="text-center text-[11px] text-zinc-600">
                © 2026 Atlas AI • v2.0.0
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
