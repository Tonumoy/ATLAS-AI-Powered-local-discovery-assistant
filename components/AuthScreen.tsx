import React, { useState } from 'react';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { AtlasLogo } from './AtlasLogo';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      onLogin({
        id: 'user-123',
        name: email.split('@')[0] || 'Atlas Explorer',
        email: email,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#090a0d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 text-white mb-4 shadow-inner border border-white/10">
            <AtlasLogo size={40} className="text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome to Atlas
          </h1>
          <p className="text-zinc-400 text-sm">
            Your personal AI guide for the physical world.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold rounded-xl py-3.5 mt-6 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => onLogin({ id: 'guest', name: 'Guest Explorer', email: '', avatar: '' })}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-sm font-medium transition-colors mb-4"
          >
            Continue as Guest
          </button>

          <p className="text-center text-sm text-zinc-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 text-zinc-600 text-xs">
        © 2025 Atlas AI. All rights reserved.
      </div>
    </div>
  );
};
