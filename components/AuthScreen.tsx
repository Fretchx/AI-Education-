
import React, { useState, useEffect } from 'react';
import { login, signup } from '../services/auth';
import { User } from '../types';
import { Google, Github, Gitlab, Fingerprint } from './Icons';

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
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }} />

      <div 
        className={`
          w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 p-8 z-10
          transform transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <div className="text-center mb-6 relative">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 mb-6 shadow-xl shadow-blue-500/20 transform transition-transform duration-500 hover:scale-105 hover:rotate-3">
             <Fingerprint className="w-10 h-10 text-white" />
          </div>
          <div className="h-16 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{isLogin ? "Welcome Back" : "Join InfoStack"}</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-600 text-sm animate-[bounce_0.5s_ease-in-out_1]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="flex items-center justify-center py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Google className="w-5 h-5 text-slate-700" />
          </button>
          <button className="flex items-center justify-center py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Github className="w-5 h-5 text-slate-700" />
          </button>
           <button className="flex items-center justify-center py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Gitlab className="w-5 h-5 text-orange-600" />
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              placeholder="student@university.edu"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
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
              transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
              ${isLogin 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-500/30' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-purple-500/30'}
            `}
          >
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
           <button
            onClick={toggleMode}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isLogin ? "New here? Create an account" : "Already a member? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
