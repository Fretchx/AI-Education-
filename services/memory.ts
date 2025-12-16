
import { MemoryItem } from '../types';
import { dbLibrary } from './database';
import { getCurrentUser } from './auth';

// Simulate network delay to demonstrate loading states
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const saveToMemory = async (content: string, language: string): Promise<MemoryItem | null> => {
  const user = getCurrentUser();
  if (!user) return null;

  const newItem: MemoryItem = {
    id: Date.now().toString(),
    userId: user.id,
    content,
    language,
    timestamp: Date.now(),
    tags: [language, 'snippet']
  };

  await delay(300); // Simulate network latency
  await dbLibrary.addItem(newItem);
  return newItem;
};

// Async fetch for dynamic tabs
export const fetchLibraryCategories = async (): Promise<string[]> => {
  await delay(400); 
  const user = getCurrentUser();
  if (!user) return ['All'];
  const items = dbLibrary.getItems(user.id);
  // Extract unique languages
  const langs = new Set(items.map(i => i.language).filter(l => l));
  return ['All', ...Array.from(langs).sort()];
};

// Async fetch for tab content
export const fetchLibraryItems = async (category: string = 'All'): Promise<MemoryItem[]> => {
  await delay(600); // Simulate network latency
  const user = getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  // Random failure simulation (commented out for stability, but logic exists in UI)
  // if (Math.random() < 0.05) throw new Error("Network error");

  const items = dbLibrary.getItems(user.id);
  
  if (category === 'All') return items;
  return items.filter(i => i.language === category);
};

export const deleteFromMemory = async (id: string): Promise<void> => {
  await delay(300);
  dbLibrary.deleteItem(id);
};

// Keep sync getter for legacy or immediate access if needed
export const getMemory = (): MemoryItem[] => {
  const user = getCurrentUser();
  if (!user) return [];
  return dbLibrary.getItems(user.id);
};
