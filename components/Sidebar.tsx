
import React from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, X, Settings, UserCircle, Trash2 } from 'lucide-react';
import { AtlasLogo } from './AtlasLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onDeleteSession: (id: string) => void;
  user: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  currentSessionId, 
  onSelectSession,
  onNewChat,
  onOpenSettings,
  onDeleteSession,
  user
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 
        transform transition-transform duration-300 ease-out z-50 shadow-2xl md:shadow-none
        md:translate-x-0 md:relative flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 flex flex-col h-full">
          
          {/* Logo Area */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <AtlasLogo size={32} />
              <h1 className="text-xl font-bold text-white tracking-tight">Atlas</h1>
            </div>
            <button 
              onClick={onClose} 
              className="md:hidden p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center gap-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/20 mb-6 font-medium"
          >
            <Plus size={20} />
            <span>New Conversation</span>
          </button>

          {/* History List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">History</h3>
            {sessions.length === 0 ? (
               <div className="text-slate-600 text-sm px-2 italic">No previous searches.</div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="group relative flex items-center">
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`
                      w-full text-left pl-3 pr-10 py-3 rounded-lg text-sm flex items-center gap-3 transition-colors
                      ${currentSessionId === session.id 
                        ? 'bg-slate-800 text-white border border-slate-700' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                    `}
                  >
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-2 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* User Profile & Settings Footer */}
          <div className="pt-4 border-t border-slate-800 mt-auto">
            <button 
              onClick={() => {
                onOpenSettings();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-slate-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600 group-hover:border-indigo-500 transition-colors">
                 {user?.avatar ? (
                   <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-400">
                     <UserCircle size={24} />
                   </div>
                 )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Guest'}</p>
                <p className="text-xs text-slate-500 truncate">View Settings</p>
              </div>
              <Settings size={18} className="text-slate-500 group-hover:text-indigo-400" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
