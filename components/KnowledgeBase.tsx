import React, { useEffect, useState } from 'react';
import { getMemory, deleteFromMemory } from '../services/memory';
import { MemoryItem } from '../types';
import CodeBlock from './CodeBlock';

interface KnowledgeBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MemoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(getMemory());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    setItems(deleteFromMemory(id));
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Slide-out Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full md:w-[480px] bg-slate-900 border-l border-slate-700 
        shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🧠</span> Knowledge Base
            </h2>
            <p className="text-xs text-slate-400 mt-1">Pinecone Vector Store (Simulated)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <p>Memory is empty.</p>
              <p className="text-sm mt-2">Save code snippets from the chat to see them here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono uppercase">
                      {item.language}
                    </span>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete Memory"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mb-2 font-mono">
                    ID: {item.id.slice(-6)} • {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                  <CodeBlock language={item.language} code={item.content} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default KnowledgeBase;