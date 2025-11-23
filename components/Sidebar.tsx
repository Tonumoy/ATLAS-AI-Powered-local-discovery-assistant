
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, X, Settings, UserCircle, LogOut, HelpCircle, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
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
  onLogout: () => void;
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
  onLogout,
  user
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-full w-[280px] bg-[#0f1117] border-r border-slate-800/50 
        transform transition-transform duration-300 ease-out z-50 shadow-2xl md:shadow-none
        md:translate-x-0 md:relative flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header: Brand & Close */}
        <div className="flex items-center justify-between p-4 md:hidden">
           <div className="flex items-center gap-2 text-indigo-400">
              <AtlasLogo size={24} />
              <span className="font-bold text-white tracking-tight">Atlas</span>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg">
             <X size={18} />
           </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="px-3 py-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800 text-white rounded-xl transition-all border border-slate-700/50 hover:border-slate-600 group"
          >
            <div className="flex items-center gap-3">
               <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-500 transition-colors">
                  <Plus size={16} className="text-white" />
               </div>
               <span className="text-sm font-medium">New Chat</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
               <MessageSquare size={14} className="text-slate-500" />
            </div>
          </button>
        </div>

        {/* Scrollable History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
          {sessions.length === 0 ? (
             <div className="text-center mt-10">
                <p className="text-xs text-slate-600 font-medium">No chat history</p>
             </div>
          ) : (
            <div className="space-y-1">
               <h3 className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recent</h3>
               {sessions.map((session) => (
                <div key={session.id} className="group relative">
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`
                      w-full text-left pl-3 pr-9 py-2.5 rounded-lg text-[13px] flex items-center gap-3 transition-all
                      ${currentSessionId === session.id 
                        ? 'bg-slate-800 text-white font-medium' 
                        : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'}
                    `}
                  >
                    <span className="truncate">{session.title}</span>
                  </button>
                  
                  {/* Hover Delete Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: User Profile (Claude/GPT Style) */}
        <div className="p-3 border-t border-slate-800/50 relative" ref={profileMenuRef}>
          
          {/* Popover Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1c1f26] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 zoom-in-95 duration-200 z-50">
               <div className="p-1">
                  <button 
                    onClick={() => { onOpenSettings(); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                     <Settings size={16} /> Settings
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                     <HelpCircle size={16} /> Help & FAQ
                  </button>
                  <div className="h-px bg-slate-700/50 my-1 mx-2" />
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                     <LogOut size={16} /> Log out
                  </button>
               </div>
            </div>
          )}

          {/* User Trigger */}
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all ${isProfileMenuOpen ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden border border-indigo-500/30">
               {user?.avatar ? (
                 <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <UserCircle size={20} className="text-indigo-400" />
               )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">Free Plan</p>
            </div>
            <MoreHorizontal size={16} className="text-slate-500" />
          </button>
        </div>
      </aside>
    </>
  );
};
