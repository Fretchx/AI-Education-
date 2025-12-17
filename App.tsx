
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
import { Folder, Share, CircleUser, Image as ImageIcon, Globe } from './components/Icons';

const QUICK_ACTIONS = [
  { label: "🐞 Debug Code", prompt: "Find the error in this code and explain it:" },
  { label: "🧠 Explain Logic", prompt: "Explain the logic and flow of this code step-by-step:" },
  { label: "📉 Big O Analysis", prompt: "Analyze the Time and Space complexity (Big O) of this solution:" },
  { label: "🧪 Gen Unit Tests", prompt: "Write comprehensive unit tests for this code covering edge cases:" },
  { label: "⚡ Optimize Code", prompt: "Optimize this solution for better performance and efficiency:" },
  { label: "📝 Write Docs", prompt: "Add JSDoc/docstrings and inline comments to explain this code:" },
  { label: "✨ Clean Code", prompt: "Refactor this code to follow best practices and clean code principles:" },
  { label: "🔀 Convert Lang", prompt: "Convert this code to Python (or specify target language):" },
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

  // Initial Session Check
  useEffect(() => {
    const checkSession = async () => {
      // 1. Check for shared link (Override)
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
        console.error("Error parsing link", e);
      }

      // 2. Check for logged in user and load their history
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
      console.error("Failed to load history", e);
      initWelcomeMessage(u);
    }
  };

  const initWelcomeMessage = (u: User) => {
    let text = "Welcome to InfoStack! I'm your CS Companion.";
    if (u.profile?.preferredLanguage) {
      text += ` I see you like ${u.profile.preferredLanguage}. Paste your code below!`;
    } else {
      text += " Paste your code below, and I'll act as your guide.";
    }
    setMessages([{ id: 'welcome', role: Role.MODEL, text: text, timestamp: Date.now() }]);
  };

  // Re-initialize Chat when topic/user changes
  useEffect(() => {
    if (user && !isSharedSession) {
        // Pass current messages as history so Gemini context is preserved on reload
        initializeChat(topic, user.profile, messages);
    }
  }, [topic, user]); // Note: We don't depend on 'messages' here to avoid loop, we pass them initially

  // Auto-Save History
  useEffect(() => {
    if (user && messages.length > 0 && !isSharedSession && !user.id.startsWith('guest')) {
      const saveTimer = setTimeout(() => {
        dbChats.saveHistory(user.id, messages);
      }, 1000); // Debounce save
      return () => clearTimeout(saveTimer);
    }
  }, [messages, user, isSharedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setMessages([]);
    setShowSettings(false);
    setIsSharedSession(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await updateUserProfile(updatedUser);
      setUser(updatedUser);
    } catch (e) {
      console.error("Failed to update user", e);
    }
  };

  const handleQuickAction = (actionPrompt: string) => {
    setInputText((prev) => {
        if (prev.trim().length > 0) return `${actionPrompt}\n\n${prev}`;
        return actionPrompt + " ";
    });
    inputRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result.startsWith('data:image')) setAttachedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRawBase64 = (dataUrl: string) => dataUrl.split(',')[1];
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading) return;

    if (isSharedSession) {
        setIsSharedSession(false);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const userMsgId = Date.now().toString();
    const rawImage = attachedImage ? getRawBase64(attachedImage) : undefined;
    
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
      text: "Analyzing...",
      timestamp: Date.now(),
      isLoading: true
    }]);

    try {
        await sendMessageToGemini(newMessage.text || "Analyze this image", rawImage, (streamedText) => {
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId 
                ? { ...msg, text: streamedText, isLoading: false } 
                : msg
            ));
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });

        // Trigger personalization analysis less frequently to save tokens/performance
        if (user && !user.id.startsWith('guest') && newMessages.length % 4 === 0) {
            analyzeAndAdapt(user.id, newMessages.slice(-8)); 
        }

    } catch (err) {
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
            ? { ...msg, text: "Connection error.", isLoading: false } 
            : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  if (!user) return <AuthScreen onAuthSuccess={(u) => { setUser(u); loadUserHistory(u); }} />;

  const bgClass = isDarkMode ? 'bg-darker text-slate-100' : 'bg-slate-50 text-slate-900';
  const headerClass = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const footerClass = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const inputClass = isDarkMode 
    ? 'bg-slate-800 text-slate-100 placeholder-slate-500 border-slate-700' 
    : 'bg-slate-100 text-slate-900 placeholder-slate-400 border-slate-300';
  const quickActionClass = isDarkMode
    ? 'bg-slate-800 border-slate-700 hover:border-primary hover:text-primary'
    : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary shadow-sm';
  const iconButtonClass = isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';

  return (
    <div className={`flex flex-col h-screen h-[100dvh] font-sans overflow-hidden transition-colors duration-300 ${bgClass}`}>
      <KnowledgeBase isOpen={showKnowledgeBase} onClose={() => setShowKnowledgeBase(false)} />
      <ApiLab isOpen={showApiLab} onClose={() => setShowApiLab(false)} />
      <ProfileSettings isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} isDarkMode={isDarkMode} />
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} messages={messages} />

      <header className={`flex-none border-b p-3 md:p-4 z-10 shadow-md transition-colors duration-300 ${headerClass}`}>
        <div className="max-w-3xl mx-auto flex flex-col gap-2 md:gap-3">
          <div className="flex justify-between items-center">
            
            {/* Interactive Logo with Meaning Tooltip */}
            <div className="relative group cursor-help">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2 select-none">
                InfoStack
              </h1>
              <div className="absolute left-0 top-full mt-3 w-64 p-4 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-50">
                 {/* Decorative Arrow */}
                 <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#0f172a] border-t border-l border-slate-700 rotate-45"></div>
                 
                 <div className="space-y-3">
                   <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Info <span className="font-normal text-slate-500">/ˈɪnfəʊ/</span></p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Comprehensive AI-driven knowledge base.
                        </p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Stack <span className="font-normal text-slate-500">/stæk/</span></p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Abstract Data Type (LIFO). 
                          <span className="block mt-1 italic text-purple-400/80">"Push questions, pop answers."</span>
                        </p>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={toggleTheme} className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`}>
                {isDarkMode ? "☀️" : "🌙"}
              </button>
              <button onClick={() => setShowApiLab(true)} className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`} title="API Lab">
                <Globe className="w-5 h-5" />
              </button>
              <button onClick={() => setShowShare(true)} className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`} title="Share Session">
                <Share className="w-5 h-5" />
              </button>
              <button onClick={() => setShowKnowledgeBase(true)} className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`} title="Library">
                <Folder className="w-5 h-5" />
              </button>
              <div className={`h-6 w-px hidden md:block ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
              <button onClick={() => setShowSettings(true)} className="relative group focus:outline-none ml-1">
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-200 border-slate-300'}`}>
                  {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <CircleUser className="w-6 h-6 text-slate-400" />}
                </div>
              </button>
            </div>
          </div>
          <TopicSelector currentTopic={topic} onTopicChange={setTopic} isDarkMode={isDarkMode} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto flex flex-col">
          {isSharedSession && (
             <div className="mb-6 p-3 bg-blue-900/30 border border-blue-800 rounded-lg text-sm text-blue-200 flex items-center gap-2">
                 Viewing shared session
             </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isDarkMode={isDarkMode} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className={`flex-none border-t pb-3 pt-2 px-3 md:px-4 md:pb-4 z-20 transition-colors duration-300 ${footerClass}`}>
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
             {QUICK_ACTIONS.map((action, idx) => (
               <button key={idx} onClick={() => handleQuickAction(action.prompt)} className={`whitespace-nowrap px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all ${quickActionClass}`}>
                 {action.label}
               </button>
             ))}
          </div>
          {attachedImage && (
            <div className={`flex items-center gap-2 p-2 rounded-lg w-fit ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
              <img src={attachedImage} alt="Preview" className="h-8 w-8 object-cover rounded" />
              <button onClick={removeAttachment}>✕</button>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <div className="relative">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                <ImageIcon className="w-5 h-5" />
              </label>
            </div>
            <div className="flex-1 relative">
              <textarea ref={inputRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); onSubmit();}}} placeholder="Type a message..." className={`w-full rounded-2xl py-3 px-4 resize-none min-h-[44px] max-h-[120px] custom-scrollbar text-sm md:text-base font-mono border ${inputClass}`} rows={1} style={{ height: 'auto', minHeight: '44px' }} />
            </div>
            <button type="submit" disabled={isLoading} className={`flex items-center justify-center w-10 h-10 rounded-full ${isLoading ? 'bg-slate-800' : 'bg-primary text-white'}`}>
              {isLoading ? "..." : "↑"}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
