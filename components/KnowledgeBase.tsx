
import React, { useEffect, useState } from 'react';
import { getMemory, deleteFromMemory } from '../services/memory';
import { MemoryItem } from '../types';
import CodeBlock from './CodeBlock';
import { Cloud, File, Search } from './Icons';

interface KnowledgeBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setItems(getMemory());
      setSearchQuery(''); // Reset search on open
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    setItems(deleteFromMemory(id));
  };

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">Library</h2>
            <p className="text-xs text-slate-400 mt-1">Personal Code Collection</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search snippets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center text-slate-500 mt-10 flex flex-col items-center">
              <Cloud className="w-12 h-12 mb-3 text-slate-600" />
              <p>Library is empty.</p>
              <p className="text-sm mt-2">Save code snippets from the chat to see them here.</p>
            </div>
          ) : filteredItems.length === 0 ? (
             <div className="text-center text-slate-500 mt-10">
               <p>No results found for "{searchQuery}"</p>
             </div>
          ) : (
            <div className="space-y-6">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono uppercase">
                      <File className="w-3 h-3" /> {item.language}
                    </span>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                       🗑
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
