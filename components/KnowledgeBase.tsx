
import React, { useEffect, useState, useRef } from 'react';
import { fetchLibraryItems, fetchLibraryCategories, deleteFromMemory } from '../services/memory';
import { MemoryItem } from '../types';
import CodeBlock from './CodeBlock';
import { Cloud, File, Search } from './Icons';

interface KnowledgeBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeTab, setActiveTab] = useState('All');
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for async data handling
  const [isTabsLoading, setIsTabsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadContent(activeTab);
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setIsTabsLoading(true);
    try {
      const cats = await fetchLibraryCategories();
      setCategories(cats);
    } catch (e) {
      console.error("Failed to load categories");
    } finally {
      setIsTabsLoading(false);
    }
  };

  const loadContent = async (category: string) => {
    setIsContentLoading(true);
    setError(null);
    try {
      const data = await fetchLibraryItems(category);
      setItems(data);
    } catch (e) {
      setError("Failed to load items. Please check your connection.");
    } finally {
      setIsContentLoading(false);
    }
  };

  const handleTabChange = (category: string) => {
    if (category === activeTab) return;
    setActiveTab(category);
    loadContent(category);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this snippet permanently?")) return;
    
    // We could implement optimistic UI here, but let's stick to the requested "fetch" pattern
    try {
      await deleteFromMemory(id);
      // Refresh content to reflect database state
      loadContent(activeTab);
      // Refresh categories in case we deleted the last item of a language
      loadCategories();
    } catch (e) {
      alert("Failed to delete item.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const next = (index + 1) % categories.length;
      handleTabChange(categories[next]);
      // Ideally move focus to the new tab button here
    } else if (e.key === 'ArrowLeft') {
      const prev = (index - 1 + categories.length) % categories.length;
      handleTabChange(categories[prev]);
    }
  };

  // Client-side search within the currently fetched tab data
  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[540px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Library"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">Library</h2>
            <p className="text-xs text-slate-400 mt-1">Personal Code Collection</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors" aria-label="Close">✕</button>
        </div>

        {/* Controls Container */}
        <div className="bg-slate-900 border-b border-slate-800">
          {/* Search Bar */}
          <div className="p-4 pb-2">
            <div className="relative group">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Filter current view..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          {/* Dynamic Tabs */}
          <div 
            className="flex overflow-x-auto px-4 gap-2 pb-0 no-scrollbar"
            role="tablist"
            aria-label="Filter by language"
          >
            {isTabsLoading ? (
               // Loading Skeletons for Tabs
               [1, 2, 3].map(i => <div key={i} className="h-9 w-20 bg-slate-800 rounded-t animate-pulse my-1 mx-1" />)
            ) : (
              categories.map((cat, idx) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={activeTab === cat}
                  aria-controls={`panel-${cat}`}
                  id={`tab-${cat}`}
                  tabIndex={activeTab === cat ? 0 : -1}
                  onClick={() => handleTabChange(cat)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`
                    whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-all outline-none focus:text-blue-300
                    ${activeTab === cat 
                      ? 'border-blue-500 text-blue-400 bg-slate-800/50 rounded-t' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}
                  `}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div 
          className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900"
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {isContentLoading ? (
            // Content Skeletons
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 animate-pulse">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-4 w-24 bg-slate-700 rounded" />
                    <div className="h-6 w-6 bg-slate-700 rounded" />
                  </div>
                  <div className="h-3 w-32 bg-slate-700/50 rounded mb-4" />
                  <div className="h-24 bg-slate-700/30 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center h-40 text-center space-y-4">
               <div className="text-red-400">{error}</div>
               <button 
                 onClick={() => loadContent(activeTab)}
                 className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors border border-slate-700"
               >
                 Retry Loading
               </button>
            </div>
          ) : filteredItems.length === 0 ? (
            // Empty State
            <div className="text-center text-slate-500 mt-10 flex flex-col items-center">
              {searchQuery ? (
                 <p>No matches for "{searchQuery}" in {activeTab}.</p>
              ) : (
                <>
                  <Cloud className="w-12 h-12 mb-3 text-slate-700" />
                  <p>No {activeTab === 'All' ? '' : activeTab} snippets found.</p>
                  <p className="text-sm mt-2">Saved code will appear here.</p>
                </>
              )}
            </div>
          ) : (
            // Data List
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 transition-all hover:border-slate-600 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono uppercase border border-blue-500/20">
                      <File className="w-3 h-3" /> {item.language}
                    </span>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete snippet"
                      aria-label="Delete snippet"
                    >
                       🗑
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mb-3 font-mono flex gap-3">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="opacity-50">•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
