import React, { useState, useEffect } from 'react';
import { login, signup } from '../services/auth';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = isLogin 
        ? await login(email, password)
        : await signup(email, password);
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden transition-colors duration-500">
      {/* Background Decor - Light Mode friendly */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }} />

      <div 
        className={`
          w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 p-8 z-10
          transform transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <div className="text-center mb-8 relative">
           {/* Animated Icon Container */}
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 mb-6 shadow-xl shadow-blue-500/20 transform transition-transform duration-500 hover:scale-105 hover:rotate-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
               <path d="M12 2L2 7l10 5 10-5-10-5z"/>
               <path d="M2 17l10 5 10-5"/>
               <path d="M2 12l10 5 10-5"/>
             </svg>
          </div>
          
          {/* Animated Text Switcher */}
          <div className="overflow-hidden h-20 relative">
             <div className={`transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${isLogin ? 'translate-y-0' : '-translate-y-1/2'} absolute w-full`}>
                <div className="h-20 flex flex-col justify-start pt-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Access your InfoStack knowledge base.</p>
                </div>
                <div className="h-20 flex flex-col justify-start pt-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Join InfoStack</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Start your developer journey today.</p>
                </div>
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-600 text-sm animate-[bounce_0.5s_ease-in-out_1]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-1.5 group">
            <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider ml-1 group-focus-within:text-blue-600 transition-colors">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 shadow-sm"
              placeholder="student@university.edu"
              required
            />
          </div>
          
          <div className="space-y-1.5 group">
            <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider ml-1 group-focus-within:text-purple-600 transition-colors">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-slate-400 shadow-sm"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full font-bold py-4 rounded-xl text-white shadow-lg text-sm tracking-wide uppercase
              transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
              ${isLogin 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-500/30' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-purple-500/30'}
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {isLogin ? "Sign In" : "Create Account"}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
           <button
            onClick={toggleMode}
            className="group relative inline-flex items-center justify-center p-0.5 mb-2 overflow-hidden text-sm font-medium text-slate-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 transition-all"
          >
            <span className="relative px-6 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
               {isLogin ? "New here? Create an account" : "Already a member? Sign in"}
            </span>
          </button>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-6 text-slate-400 text-xs font-mono opacity-80">
        InfoStack AI Platform v1.2
      </div>
    </div>
  );
};

export default AuthScreen;