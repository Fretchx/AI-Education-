import { MemoryItem } from '../types';

const MEMORY_KEY = 'cs_companion_memory';

/**
 * In a production app, this would connect to Pinecone.
 * 
 * Example Pinecone Logic:
 * 1. Generate embedding for `content` using OpenAI or Gemini Embedding API.
 * 2. Upsert vector to Pinecone index with metadata.
 */

export const saveToMemory = async (content: string, language: string): Promise<MemoryItem> => {
  // Simulate API call to Vector DB
  await new Promise(resolve => setTimeout(resolve, 500));

  const newItem: MemoryItem = {
    id: Date.now().toString(),
    content,
    language,
    timestamp: Date.now(),
    tags: [language, 'snippet']
  };

  const current = getMemory();
  const updated = [newItem, ...current];
  localStorage.setItem(MEMORY_KEY, JSON.stringify(updated));
  
  return newItem;
};

export const getMemory = (): MemoryItem[] => {
  const stored = localStorage.getItem(MEMORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const deleteFromMemory = (id: string) => {
  const current = getMemory();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(updated));
  return updated;
};