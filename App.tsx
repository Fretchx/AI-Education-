import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, Role, Topic } from './types';
import { initializeChat, sendMessageToGemini } from './services/gemini';
import MessageBubble from './components/MessageBubble';
import TopicSelector from './components/TopicSelector';

const QUICK_ACTIONS = [
  { label: "🐞 Debug Code", prompt: "Find the error in this code and explain it:" },
  { label: "🔀 Convert Code", prompt: "Convert this code to Python (replace with target language):" },
  { label: "🧠 Explain Method", prompt: "What method is used here and how does it work?" },
  { label: "📉 Big O Analysis", prompt: "What is the Time and Space complexity of this solution?" },
  { label: "✨ Clean Code", prompt: "Refactor this code to follow best practices:" },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Hello! I'm your CS Companion. Paste your code below, and I'll act as your guide—identifying errors, converting languages, and explaining concepts.",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [topic, setTopic] = useState<Topic>(Topic.GENERAL);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initializeChat(topic);
    if (messages.length > 1) {
       setMessages(prev => [...prev, {
           id: Date.now().toString(),
           role: Role.MODEL,
           text: `*Switched context to: ${topic}.* Ready to guide you.`,
           timestamp: Date.now()
       }]);
    }
  }, [topic]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading) return;

    const userMsgId = Date.now().toString();
    const rawImage = attachedImage ? getRawBase64(attachedImage) : undefined;
    
    const newMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text: inputText,
      timestamp: Date.now(),
      image: attachedImage || undefined
    };

    setMessages(prev => [...prev, newMessage]);
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

  return (
    <div className="flex flex-col h-screen bg-darker text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 p-4 z-10 shadow-md">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              CS Companion
            </h1>
            <div className="text-xs text-slate-500 font-mono">v1.2.0</div>
          </div>
          <TopicSelector currentTopic={topic} onTopicChange={setTopic} />
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-dark">
        <div className="max-w-3xl mx-auto flex flex-col">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-slate-900 border-t border-slate-800 pb-4 pt-2 px-3 md:px-4 z-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          
          {/* Quick Actions Toolbar */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
             {QUICK_ACTIONS.map((action, idx) => (
               <button 
                 key={idx}
                 onClick={() => handleQuickAction(action.prompt)}
                 className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-primary hover:text-primary rounded-full text-xs font-medium transition-all"
               >
                 {action.label}
               </button>
             ))}
          </div>

          {attachedImage && (
            <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg w-fit">
              <img src={attachedImage} alt="Preview" className="h-10 w-10 object-cover rounded" />
              <span className="text-xs text-slate-300">Image attached</span>
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
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-all border border-slate-700"
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
                className="
                  w-full bg-slate-800 text-slate-100 placeholder-slate-500 
                  border border-slate-700 rounded-2xl py-3 px-4 
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  resize-none min-h-[44px] max-h-[120px] custom-scrollbar
                  text-sm md:text-base font-mono
                "
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
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
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