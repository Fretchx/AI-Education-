
import { User, StudentProfile } from '../types';

/**
 * SIMULATED DATABASE SERVICE
 * In a real app, this would connect to PostgreSQL/MongoDB.
 * Here, we structure LocalStorage to act like a relational DB.
 */

const DB_KEYS = {
  USERS: 'db_users',
  PROFILES: 'db_student_profiles',
  SESSIONS: 'db_chat_sessions'
};

// --- Helpers ---
const readTable = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const writeTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
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
    // Initialize default profile
    const profile = await dbProfiles.createDefault(user.id);
    const newUser = { ...user, profile };
    
    users.push(newUser);
    writeTable(DB_KEYS.USERS, users);
    return newUser;
  },

  update: async (user: User): Promise<User> => {
    const users = readTable<User>(DB_KEYS.USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) throw new Error("User not found");
    
    // Merge latest profile data if exists
    const profile = await dbProfiles.findByUserId(user.id);
    const updatedUser = { ...user, profile: profile || undefined };

    users[index] = updatedUser;
    writeTable(DB_KEYS.USERS, users);
    return updatedUser;
  }
};

// --- Student Profile Table APIs (Personalization) ---
export const dbProfiles = {
  findByUserId: async (userId: string): Promise<StudentProfile | null> => {
    const profiles = readTable<StudentProfile>(DB_KEYS.PROFILES);
    return profiles.find(p => p.userId === userId) || null;
  },

  createDefault: async (userId: string): Promise<StudentProfile> => {
    const newProfile: StudentProfile = {
      userId,
      codingLevel: 'Beginner',
      preferredLanguage: 'Python', // Default
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
