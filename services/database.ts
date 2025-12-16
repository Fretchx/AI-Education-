
import { User, StudentProfile, Message, MemoryItem, ChatHistory } from '../types';

/**
 * INFOSTACK DATABASE SERVICE
 * Centralized persistence layer using LocalStorage to simulate a NoSQL database.
 */

const DB_KEYS = {
  USERS: 'infostack_users',
  PROFILES: 'infostack_profiles',
  CHATS: 'infostack_chats',
  LIBRARY: 'infostack_library'
};

// --- Generic Helpers ---
const readTable = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Database Read Error [${key}]:`, e);
    return [];
  }
};

const writeTable = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Database Write Error [${key}]:`, e);
  }
};

// --- User Table APIs ---
export const dbUsers = {
  findById: async (id: string): Promise<User | null> => {
    const users = readTable<User>(DB_KEYS.USERS);
    return users.find(u => u.id === id) || null;
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const users = readTable<User>(DB_KEYS.USERS);
    return users.find(u => u.email === email) || null;
  },

  create: async (user: User): Promise<User> => {
    const users = readTable<User>(DB_KEYS.USERS);
    if (users.find(u => u.email === user.email)) {
      throw new Error("User already exists");
    }
    
    // Initialize default profile and preferences
    const profile = await dbProfiles.createDefault(user.id);
    const defaultPreferences = {
      emailNotifications: true,
      pushNotifications: true,
      twoFactorAuth: false,
      publicProfile: false
    };

    const newUser = { ...user, profile, preferences: defaultPreferences };
    
    users.push(newUser);
    writeTable(DB_KEYS.USERS, users);
    return newUser;
  },

  update: async (user: User): Promise<User> => {
    const users = readTable<User>(DB_KEYS.USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) throw new Error("User not found");
    
    // Merge latest profile data to ensure consistency
    const profile = await dbProfiles.findByUserId(user.id);
    const updatedUser = { ...user, profile: profile || user.profile };

    users[index] = updatedUser;
    writeTable(DB_KEYS.USERS, users);
    return updatedUser;
  }
};

// --- Student Profile Table APIs ---
export const dbProfiles = {
  findByUserId: async (userId: string): Promise<StudentProfile | null> => {
    const profiles = readTable<StudentProfile>(DB_KEYS.PROFILES);
    return profiles.find(p => p.userId === userId) || null;
  },

  createDefault: async (userId: string): Promise<StudentProfile> => {
    const newProfile: StudentProfile = {
      userId,
      codingLevel: 'Beginner',
      preferredLanguage: 'Python',
      learningStyle: 'Practical',
      strengths: [],
      weaknesses: [],
      topicsMastered: [],
      lastUpdated: Date.now()
    };
    const profiles = readTable<StudentProfile>(DB_KEYS.PROFILES);
    profiles.push(newProfile);
    writeTable(DB_KEYS.PROFILES, profiles);
    return newProfile;
  },

  update: async (profile: StudentProfile): Promise<StudentProfile> => {
    const profiles = readTable<StudentProfile>(DB_KEYS.PROFILES);
    const index = profiles.findIndex(p => p.userId === profile.userId);
    
    if (index === -1) {
      profiles.push(profile);
    } else {
      profiles[index] = profile;
    }
    
    writeTable(DB_KEYS.PROFILES, profiles);
    return profile;
  }
};

// --- Chat History Table APIs ---
export const dbChats = {
  getHistory: async (userId: string): Promise<Message[]> => {
    const chats = readTable<ChatHistory>(DB_KEYS.CHATS);
    const history = chats.find(c => c.userId === userId);
    return history ? history.messages : [];
  },

  saveHistory: async (userId: string, messages: Message[]) => {
    // Filter out temporary loading states or transient errors if needed
    const cleanMessages = messages.filter(m => !m.isLoading && m.text !== "Analyzing...");
    
    const chats = readTable<ChatHistory>(DB_KEYS.CHATS);
    const index = chats.findIndex(c => c.userId === userId);
    
    const newHistory: ChatHistory = {
      userId,
      messages: cleanMessages,
      lastUpdated: Date.now()
    };

    if (index === -1) {
      chats.push(newHistory);
    } else {
      chats[index] = newHistory;
    }
    writeTable(DB_KEYS.CHATS, chats);
  },

  clearHistory: async (userId: string) => {
    const chats = readTable<ChatHistory>(DB_KEYS.CHATS);
    const newChats = chats.filter(c => c.userId !== userId);
    writeTable(DB_KEYS.CHATS, newChats);
  }
};

// --- Library (Knowledge Base) Table APIs ---
export const dbLibrary = {
  getItems: (userId: string): MemoryItem[] => {
    const items = readTable<MemoryItem>(DB_KEYS.LIBRARY);
    // Return items owned by the user
    return items.filter(item => item.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  addItem: async (item: MemoryItem): Promise<MemoryItem> => {
    const items = readTable<MemoryItem>(DB_KEYS.LIBRARY);
    items.unshift(item); // Add to beginning
    writeTable(DB_KEYS.LIBRARY, items);
    return item;
  },

  deleteItem: (id: string) => {
    const items = readTable<MemoryItem>(DB_KEYS.LIBRARY);
    const filtered = items.filter(i => i.id !== id);
    writeTable(DB_KEYS.LIBRARY, filtered);
  }
};
