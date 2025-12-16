import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, Role, Topic, User } from './types';
import { initializeChat, sendMessageToGemini } from './services/gemini';
import { getCurrentUser, logout, updateUserProfile } from './services/auth';
import { parseShareableLink } from './services/share';
import { analyzeAndAdapt } from './services/personalization';
import MessageBubble from './components/MessageBubble';
import TopicSelector from './components/TopicSelector';
import AuthScreen from './components/AuthScreen';
import KnowledgeBase from './components/KnowledgeBase';
import ProfileSettings from './components/ProfileSettings';
import ShareModal from './components/ShareModal';

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
  const [isSharedSession, setIsSharedSession] = useState(false);
  
  // Theme State: Default to Dark
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check auth and shared links on load
  useEffect(() => {
    const checkSession = async () => {
      // 1. Check for Shared Link
      try {
        const sharedData = await parseShareableLink();
        if (sharedData && Array.isArray(sharedData)) {
          // Create a temporary guest user if not logged in, or use current user
          const currentUser = getCurrentUser();
          if (!currentUser) {
             // Guest mode for viewing shared content
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
          // NOTE: We keep the URL parameters so the link works on refresh
          return;
        }
      } catch (e) {
        console.error("Error parsing link", e);
      }

      // 2. Normal Auth Check
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        initWelcomeMessage(currentUser);
      }
    };

    checkSession();
  }, []);

  const initWelcomeMessage = (u: User) => {
    // If returning user, customize welcome
    let text = "Welcome to InfoStack! I'm your CS Companion.";
    if (u.profile?.preferredLanguage) {
      text += ` I see you like ${u.profile.preferredLanguage}. Paste your code below!`;
    } else {
      text += " Paste your code below, and I'll act as your guide.";
    }

    setMessages([
      {
        id: 'welcome',
        role: Role.MODEL,
        text: text,
        timestamp: Date.now()
      }
    ]);
  };

  useEffect(() => {
    if (user) {
      // Initialize Chat with Personalization
      if (!isSharedSession) {
          initializeChat(topic, user.profile);
      }
    }
  }, [topic, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setMessages([]);
    setShowSettings(false);
    setIsSharedSession(false);
    // Clean URL on logout
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
        if (prev.trim().length > 0) {
            return `${actionPrompt}\n\n${prev}`;
        }
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
        if (result.startsWith('data:image')) {
            setAttachedImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRawBase64 = (dataUrl: string) => {
      return dataUrl.split(',')[1];
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading) return;

    // If typing in a shared session, take over the session
    if (isSharedSession) {
        setIsSharedSession(false);
        // Clear URL when user takes over session
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

        // Trigger Personalization ML Analysis in background after every 3rd message
        if (user && !user.id.startsWith('guest') && newMessages.length % 3 === 0) {
            console.log("Triggering Learning Analysis...");
            analyzeAndAdapt(user.id, newMessages.slice(-6)); 
        }

    } catch (err) {
        console.error(err);
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId 
            ? { ...msg, text: "Connection error. Please check your API Key or internet.", isLoading: false } 
            : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  // If not authenticated, show auth screen
  if (!user) {
    return <AuthScreen onAuthSuccess={(u) => { setUser(u); initWelcomeMessage(u); }} />;
  }

  // --- Dynamic Theme Classes ---
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
      
      <ProfileSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        user={user}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />

      <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        messages={messages} 
      />

      {/* Header */}
      <header className={`flex-none border-b p-3 md:p-4 z-10 shadow-md transition-colors duration-300 ${headerClass}`}>
        <div className="max-w-3xl mx-auto flex flex-col gap-2 md:gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary md:w-6 md:h-6">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              InfoStack
            </h1>
            <div className="flex items-center gap-2 md:gap-3">
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </button>

              <button
                onClick={() => setShowShare(true)}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`}
                title="Share Session"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>

              <button 
                onClick={() => setShowKnowledgeBase(true)}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${iconButtonClass}`}
                title="Open Knowledge Base"
              >
                🧠
              </button>
              
              <div className={`h-6 w-px hidden md:block ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

              {/* Profile Avatar Button */}
              <button 
                onClick={() => setShowSettings(true)}
                className="relative group focus:outline-none ml-1"
                title="Profile Settings"
              >
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border overflow-hidden flex items-center justify-center group-hover:border-primary transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-600'}`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{user.email.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* Online Dot */}
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 rounded-full ${isDarkMode ? 'border-slate-900' : 'border-white'}`}></div>
              </button>
            </div>
          </div>
          <TopicSelector currentTopic={topic} onTopicChange={setTopic} isDarkMode={isDarkMode} />
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto flex flex-col">
          {isSharedSession && (
             <div className="mb-6 p-3 bg-blue-900/30 border border-blue-800 rounded-lg text-sm text-blue-200 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                 Viewing a shared secure session. Type to continue the conversation.
             </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isDarkMode={isDarkMode} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className={`flex-none border-t pb-3 pt-2 px-3 md:px-4 md:pb-4 z-20 transition-colors duration-300 ${footerClass}`}>
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          
          {/* Quick Actions Toolbar */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
             {QUICK_ACTIONS.map((action, idx) => (
               <button 
                 key={idx}
                 onClick={() => handleQuickAction(action.prompt)}
                 className={`whitespace-nowrap px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all ${quickActionClass}`}
               >
                 {action.label}
               </button>
             ))}
          </div>

          {attachedImage && (
            <div className={`flex items-center gap-2 p-2 rounded-lg w-fit ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
              <img src={attachedImage} alt="Preview" className="h-8 w-8 md:h-10 md:w-10 object-cover rounded" />
              <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Image attached</span>
              <button onClick={removeAttachment} className="text-slate-400 hover:text-red-400 ml-2">
                 ✕
              </button>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all border ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-slate-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </label>
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
                placeholder="Paste code or type a question..."
                className={`
                  w-full rounded-2xl py-3 px-4 
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  resize-none min-h-[44px] max-h-[120px] custom-scrollbar
                  text-sm md:text-base font-mono border transition-colors
                  ${inputClass}
                `}
                rows={1}
                style={{ height: 'auto', minHeight: '44px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !attachedImage)}
              className={`
                flex items-center justify-center w-10 h-10 rounded-full 
                transition-all duration-200 
                ${isLoading || (!inputText.trim() && !attachedImage)
                  ? `${isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-200 text-slate-400'} cursor-not-allowed` 
                  : 'bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'}
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);