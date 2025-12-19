
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, Role, Topic, User } from './types';
import { initializeChat, sendMessageToGemini } from './services/gemini';
import { getCurrentUser, logout, updateUserProfile } from './services/auth';
import { dbChats } from './services/database';
import { parseShareableLink } from './services/share';
import { analyzeAndAdapt } from './services/personalization';
import MessageBubble from './components/MessageBubble';
import TopicSelector from './components/TopicSelector';
import AuthScreen from './components/AuthScreen';
import KnowledgeBase from './components/KnowledgeBase';
import ProfileSettings from './components/ProfileSettings';
import ShareModal from './components/ShareModal';
import { ApiLab } from './components/ApiLab';
import { Folder, Share, CircleUser, Image as ImageIcon, Globe, Activity } from './components/Icons';

const QUICK_ACTIONS = [
  { label: "🐞 Debug", prompt: "I have a bug in my code. Can you help me find it?" },
  { label: "🧠 Logic", prompt: "Explain how this specific logic works step-by-step:" },
  { label: "📉 Big O", prompt: "What is the time and space complexity of this solution?" },
  { label: "🧪 Tests", prompt: "Write unit tests for this code using standard libraries:" },
  { label: "⚡ Optimize", prompt: "How can I make this code more efficient or readable?" },
  { label: "📝 Docs", prompt: "Add documentation and comments to this code snippet:" },
  { label: "🔀 Convert", prompt: "Convert this code to another language (specify which):" },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [topic, setTopic] = useState<Topic>(Topic.GENERAL);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showApiLab, setShowApiLab] = useState(false);
  const [isSharedSession, setIsSharedSession] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sharedData = await parseShareableLink();
        if (sharedData && Array.isArray(sharedData)) {
          const currentUser = getCurrentUser();
          if (!currentUser) {
             const guestUser: User = {
               id: 'guest',
               email: 'guest@infostack.ai',
               about: 'Viewing shared session',
               avatar: ''
             };
             setUser(guestUser);
          } else {
             setUser(currentUser);
          }
          setMessages(sharedData);
          setIsSharedSession(true);
          return;
        }
      } catch (e) {
        console.error("Link parsing failed", e);
      }

      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        loadUserHistory(currentUser);
      }
    };
    checkSession();
  }, []);

  const loadUserHistory = async (u: User) => {
    try {
      const history = await dbChats.getHistory(u.id);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        initWelcomeMessage(u);
      }
    } catch (e) {
      initWelcomeMessage(u);
    }
  };

  const initWelcomeMessage = (u: User) => {
    const name = u.displayName || u.email.split('@')[0];
    const text = `Hello ${name}! I'm **InfoStack**, your senior CS mentor. I'm ready to help you with **${topic}**. Paste your code or ask a theoretical question to get started.`;
    setMessages([{ id: 'welcome', role: Role.MODEL, text: text, timestamp: Date.now() }]);
  };

  // Re-initialize chat when topic or user profile changes
  useEffect(() => {
    if (user && !isSharedSession) {
        initializeChat(topic, user.profile, messages);
    }
  }, [topic, user?.profile]);

  useEffect(() => {
    if (user && messages.length > 0 && !isSharedSession && !user.id.startsWith('guest')) {
      const saveTimer = setTimeout(() => {
        dbChats.saveHistory(user.id, messages);
      }, 1500);
      return () => clearTimeout(saveTimer);
    }
  }, [messages, user, isSharedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setMessages([]);
    setShowSettings(false);
    setIsSharedSession(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleResetChat = () => {
    if (user && !user.id.startsWith('guest')) {
      if (window.confirm("Start a new session? Your current history will be archived.")) {
        setMessages([]);
        initWelcomeMessage(user);
        initializeChat(topic, user.profile, []);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await updateUserProfile(updatedUser);
      setUser(updatedUser);
    } catch (e) {
      console.error("Profile update failed", e);
    }
  };

  const handleQuickAction = (actionPrompt: string) => {
    setInputText((prev) => {
        const separator = prev.trim() ? "\n\n" : "";
        return `${actionPrompt}${separator}${prev}`;
    });
    inputRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading) return;

    if (isSharedSession) {
        setIsSharedSession(false);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const userMsgId = Date.now().toString();
    const rawImage = attachedImage ? attachedImage.split(',')[1] : undefined;
    
    const newMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text: inputText,
      timestamp: Date.now(),
      image: attachedImage || undefined
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInputText('');
    setAttachedImage(null);
    setIsLoading(true);
    if(fileInputRef.current) fileInputRef.current.value = '';

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: Role.MODEL,
      text: "Thinking...",
      timestamp: Date.now(),
      isLoading: true
    }]);

    try {
        await sendMessageToGemini(newMessage.text || "Explain this image:", rawImage, (streamedText) => {
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId 
                ? { ...msg, text: streamedText, isLoading: false } 
                : msg
            ));
        });

        if (user && !user.id.startsWith('guest') && newMessages.length % 5 === 0) {
            analyzeAndAdapt(user.id, newMessages.slice(-10)); 
        }

    } catch (err) {
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
            ? { ...msg, text: "The neural link was interrupted. Please try again.", isLoading: false } 
            : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  if (!user) return <AuthScreen onAuthSuccess={(u) => { setUser(u); loadUserHistory(u); }} />;

  const themeClasses = isDarkMode 
    ? { bg: 'bg-darker text-slate-100', header: 'bg-slate-900/80 border-slate-800', footer: 'bg-slate-900 border-slate-800', input: 'bg-slate-800 border-slate-700 text-slate-100', icon: 'text-slate-400 hover:text-white hover:bg-slate-800' }
    : { bg: 'bg-slate-50 text-slate-900', header: 'bg-white/80 border-slate-200', footer: 'bg-white border-slate-200', input: 'bg-slate-100 border-slate-300 text-slate-900', icon: 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' };

  return (
    <div className={`flex flex-col h-screen h-[100dvh] font-sans overflow-hidden transition-all duration-500 ${themeClasses.bg}`}>
      <KnowledgeBase isOpen={showKnowledgeBase} onClose={() => setShowKnowledgeBase(false)} />
      <ApiLab isOpen={showApiLab} onClose={() => setShowApiLab(false)} />
      <ProfileSettings isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} isDarkMode={isDarkMode} />
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} messages={messages} />

      <header className={`flex-none border-b p-3 md:p-4 z-30 shadow-sm backdrop-blur-lg sticky top-0 transition-colors ${themeClasses.header} pt-[env(safe-area-inset-top,12px)]`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                InfoStack
              </h1>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={handleResetChat} className={`p-2 rounded-xl transition-all ${themeClasses.icon}`} title="New Session">
                ✨
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-all ${themeClasses.icon}`}>
                {isDarkMode ? "☀️" : "🌙"}
              </button>
              <button onClick={() => setShowApiLab(true)} className={`p-2 rounded-xl transition-all ${themeClasses.icon}`} title="API Playground">
                <Globe className="w-5 h-5" />
              </button>
              <button onClick={() => setShowShare(true)} className={`p-2 rounded-xl transition-all ${themeClasses.icon}`} title="Share Link">
                <Share className="w-5 h-5" />
              </button>
              <button onClick={() => setShowKnowledgeBase(true)} className={`p-2 rounded-xl transition-all ${themeClasses.icon}`} title="Snippet Library">
                <Folder className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
              <button onClick={() => setShowSettings(true)} className="ml-1 p-0.5 rounded-full ring-2 ring-transparent hover:ring-blue-500 transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                  {user.avatar ? <img src={user.avatar} alt="Me" className="w-full h-full object-cover" /> : <CircleUser className="w-6 h-6 text-slate-500" />}
                </div>
              </button>
            </div>
          </div>
          <TopicSelector currentTopic={topic} onTopicChange={setTopic} isDarkMode={isDarkMode} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
        <div className="max-w-4xl mx-auto">
          {isSharedSession && (
             <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-sm text-blue-400 flex items-center justify-center gap-2 animate-pulse">
                <Globe className="w-4 h-4" /> Shared Study Session • Ready-only mode
             </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isDarkMode={isDarkMode} />
          ))}
          {isLoading && messages[messages.length-1]?.isLoading && (
             <div className="flex justify-start mb-8 animate-pulse">
                <div className={`rounded-2xl px-5 py-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white border border-slate-200'}`}>
                    <div className="flex gap-2 items-center text-slate-400 text-sm">
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>Compiling response...</span>
                    </div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} className="h-8" />
        </div>
      </main>

      <footer className={`flex-none border-t pb-[env(safe-area-inset-bottom,16px)] pt-3 px-4 z-40 transition-colors ${themeClasses.footer}`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
             {QUICK_ACTIONS.map((action, idx) => (
               <button 
                 key={idx} 
                 onClick={() => handleQuickAction(action.prompt)} 
                 className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white' : 'bg-white border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600'} shadow-sm`}
               >
                 {action.label}
               </button>
             ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-3 mb-2">
            <div className="relative">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className={`flex items-center justify-center w-12 h-12 rounded-2xl cursor-pointer border transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                {attachedImage ? <img src={attachedImage} className="w-full h-full object-cover rounded-2xl" /> : <ImageIcon className="w-6 h-6" />}
              </label>
              {attachedImage && (
                <button onClick={removeAttachment} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] border-2 border-slate-900">✕</button>
              )}
            </div>
            
            <div className="flex-1 relative">
              <textarea 
                ref={inputRef} 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); 
                    onSubmit();
                  }
                }} 
                placeholder="Paste code or ask a question..." 
                className={`w-full rounded-2xl py-3 px-5 resize-none min-h-[50px] max-h-[200px] custom-scrollbar text-[15px] font-mono border transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50 focus:outline-none ${themeClasses.input}`} 
                rows={1} 
                style={{ height: 'auto', minHeight: '50px' }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || (!inputText.trim() && !attachedImage)} 
              className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all transform active:scale-90 ${isLoading || (!inputText.trim() && !attachedImage) ? 'bg-slate-700 opacity-50 cursor-not-allowed text-slate-500' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5'}`}
            >
              {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <span className="text-xl font-bold">↑</span>}
            </button>
          </form>
          <div className="text-[10px] text-center text-slate-500 pb-1">
             **InfoStack** 2.5 • AI mentors can make mistakes. Verify critical code.
          </div>
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
