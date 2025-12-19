
import React from 'react';
import { Message, Role } from '../types';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  isDarkMode: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode }) => {
  const isUser = message.role === Role.USER;

  const renderContent = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return <CodeBlock key={index} language={language} code={code} />;
      }
      
      const inlineCodeClass = isDarkMode 
        ? 'bg-slate-700/50 text-blue-300' 
        : 'bg-slate-200/50 text-blue-700 border border-slate-300/50';

      // Enhanced formatting: Bold, Italic, Inline Code, and basic Math support
      const formattedText = part
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-400">$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>') // Italic
        .replace(/`([^`]+)`/g, `<code class="${inlineCodeClass} px-1.5 py-0.5 rounded font-mono text-[0.9em]">$1</code>`) // Inline Code
        .replace(/\$([^\$]+)\$/g, '<span class="font-serif italic bg-slate-800/20 px-1 rounded">$1</span>') // Inline Math
        .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>') // List items
        .replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-blue-400">$1</h3>') // H3
        .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 border-b border-slate-700 pb-1">$1</h2>'); // H2

      return (
        <div 
          key={index} 
          className="whitespace-pre-wrap mb-3 last:mb-0 leading-relaxed text-[15px] md:text-base"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    });
  };

  const bubbleContainerClass = isUser ? 'justify-end' : 'justify-start';
  const bubbleBg = isUser
    ? 'bg-primary text-white shadow-lg shadow-blue-500/10'
    : isDarkMode
      ? 'bg-slate-800/80 backdrop-blur-md border border-slate-700/50 text-slate-100 shadow-xl'
      : 'bg-white border border-slate-200 text-slate-800 shadow-sm';

  return (
    <div className={`flex w-full mb-8 ${bubbleContainerClass} animate-[fadeIn_0.2s_ease-out]`}>
      <div className={`max-w-[92%] md:max-w-[85%] rounded-2xl px-5 py-4 ${bubbleBg} ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
        {message.image && (
          <div className="mb-4 rounded-xl overflow-hidden border border-white/10 shadow-inner">
            <img src={message.image} alt="Student attachment" className="max-w-full h-auto" />
          </div>
        )}
        <div className="prose prose-invert max-w-none">
          {renderContent(message.text)}
        </div>
        <div className={`text-[10px] mt-3 font-mono opacity-50 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
