
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1f26] border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[#0f1117] border-r border-slate-800 p-4 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 px-2">Settings</h2>
          
          <nav className="space-y-1 flex-1">
            <button 
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <User size={16} /> Account
            </button>
            <button 
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Waves size={16} /> Voice & Audio
            </button>
            <button 
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Settings size={16} /> General
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Shield size={16} /> About & Guide
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#1c1f26] p-6 md:p-8 overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2">
            <X size={20} />
          </button>

          {activeTab === 'account' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 overflow-hidden border border-indigo-500/30">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-xl">
                      {user.name?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
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
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Mic size={18} className="text-indigo-400" /> Voice Activity Detection
                </h3>
                <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700 space-y-6">
                   <div>
                      <div className="flex justify-between mb-2">
                         <label className="text-sm font-medium text-slate-300">Response Speed</label>
                         <span className="text-xs text-indigo-400 font-bold">{(vadSensitivity/1000).toFixed(1)}s</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="3000" 
                        step="100" 
                        value={vadSensitivity}
                        onChange={(e) => setVadSensitivity(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
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
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${currentLang.code === lang.code ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800 text-slate-300'}`}
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
                <h3 className="text-xl font-bold text-white mb-1">About Atlas</h3>
                <p className="text-slate-400 text-sm">Your local guide engine.</p>
              </div>
              
              <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                 <p className="text-sm text-indigo-200 leading-relaxed">
                    Atlas is an advanced AI assistant optimized for local discovery. It uses geolocation context to find the best places near you.
                 </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
