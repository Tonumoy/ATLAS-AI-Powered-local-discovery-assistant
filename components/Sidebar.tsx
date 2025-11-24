import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, X, Settings, LogOut, HelpCircle, Trash2, MoreHorizontal, Sparkles } from 'lucide-react';
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
      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] bg-[#090a0d] border-r border-white/5 
        transform transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-50 
        md:static flex flex-col h-full max-h-screen min-h-0 overflow-hidden
        ${isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none'}
      `}>

        {/* Header: Brand (Mobile Only) */}
        <div className="flex items-center justify-between p-4 md:hidden flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <AtlasLogo size={24} />
            <span className="font-medium tracking-tight">Atlas</span>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="px-3 py-3 md:pt-5 min-w-[280px] flex-shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="group flex items-center justify-between w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/5 hover:border-white/10 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1 rounded-md group-hover:bg-white/20 transition-colors">
                <Plus size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium">New chat</span>
            </div>
            <MessageSquare size={16} className="text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          </button>
        </div>

        {/* Scrollable History */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent min-w-[280px]">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4 opacity-50">
              <Sparkles size={24} className="text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500 font-medium">Start a new journey</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2">
                <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Recent</h3>
              </div>
              {sessions.map((session) => (
                <div key={session.id} className="group relative px-1">
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`
                      w-full text-left pl-3 pr-8 py-2 rounded-lg text-[13px] flex items-center gap-3 transition-all
                      ${currentSessionId === session.id
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
                    `}
                  >
                    <span className="truncate">{session.title}</span>
                  </button>

                  {/* Hover Delete Action */}
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer: User Profile */}
        <div className="p-3 border-t border-white/5 relative min-w-[280px] flex-shrink-0" ref={profileMenuRef}>

          {/* Popover Menu */}
          <div className={`
            absolute bottom-full left-2 right-2 mb-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-bottom z-50
            ${isProfileMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
          `}>
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-2 text-xs text-zinc-500 font-medium border-b border-white/5 mb-1">
                {user?.email}
              </div>
              <button
                onClick={() => { onOpenSettings(); setIsProfileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
              >
                <Settings size={15} /> Settings
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
              >
                <HelpCircle size={15} /> Help & Support
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </div>

          {/* User Trigger */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl transition-all group ${isProfileMenuOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "A"
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">Free Plan</p>
            </div>
            <MoreHorizontal size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
};
