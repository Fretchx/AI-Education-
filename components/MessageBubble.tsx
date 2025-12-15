import React from 'react';
import { Message, Role } from '../types';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  isDarkMode: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode }) => {
  const isUser = message.role === Role.USER;

  // Simple Markdown parser to separate code blocks from text
  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return <CodeBlock key={index} language={language} code={code} />;
      }
      
      // Render Bold and Italic text (simplified)
      // Dynamic inline code style based on theme
      const inlineCodeClass = isDarkMode 
        ? 'bg-slate-700 text-blue-200' 
        : 'bg-slate-200 text-blue-700 border border-slate-300';

      const formattedText = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, `<code class="${inlineCodeClass} px-1.5 py-0.5 rounded text-sm font-mono">$1</code>`); // Inline code

      return (
        <p 
          key={index} 
          className="whitespace-pre-wrap mb-2 last:mb-0 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    });
  };

  const bubbleStyle = isUser
    ? 'bg-primary text-white rounded-br-sm shadow-md' // User bubble stays primary
    : isDarkMode
      ? 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700 shadow-md' // Dark Mode Bot
      : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-sm'; // Light Mode Bot

  const timestampColor = isUser
    ? 'text-blue-100'
    : isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-4
          ${bubbleStyle}
        `}
      >
        {message.image && (
          <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
            <img src={message.image} alt="User upload" className="max-w-full h-auto" />
          </div>
        )}
        <div className="text-sm md:text-base">
          {renderContent(message.text)}
        </div>
        <div className={`text-[10px] mt-2 opacity-70 ${timestampColor}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;