
import { MemoryItem } from '../types';
import { dbLibrary } from './database';
import { getCurrentUser } from './auth';

/**
 * MEMORY SERVICE ADAPTER
 * Bridges the UI components with the central database.
 */

export const saveToMemory = async (content: string, language: string): Promise<MemoryItem | null> => {
  const user = getCurrentUser();
  if (!user) {
    console.error("Cannot save to library: No active user.");
    return null;
  }

  const newItem: MemoryItem = {
    id: Date.now().toString(),
    userId: user.id,
    content,
    language,
    timestamp: Date.now(),
    tags: [language, 'snippet']
  };

  await dbLibrary.addItem(newItem);
  return newItem;
};

export const getMemory = (): MemoryItem[] => {
  const user = getCurrentUser();
  if (!user) return [];
  return dbLibrary.getItems(user.id);
};

export const deleteFromMemory = (id: string): MemoryItem[] => {
  dbLibrary.deleteItem(id);
  // Return updated list
  return getMemory();
};
