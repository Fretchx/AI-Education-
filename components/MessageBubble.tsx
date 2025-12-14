import React from 'react';
import { Message, Role } from '../types';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
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
      const formattedText = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 py-0.5 rounded text-sm font-mono text-blue-200">$1</code>'); // Inline code

      return (
        <p 
          key={index} 
          className="whitespace-pre-wrap mb-2 last:mb-0 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-4 shadow-md
          ${isUser 
            ? 'bg-primary text-white rounded-br-sm' 
            : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'}
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
        <div className={`text-[10px] mt-2 opacity-50 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
