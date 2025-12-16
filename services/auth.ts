
import { User } from '../types';
import { dbUsers } from './database';

const SESSION_KEY = 'cs_companion_session_user_id';

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (email && password.length >= 6) {
    const user = await dbUsers.findByEmail(email);
    if (user) {
      localStorage.setItem(SESSION_KEY, user.id);
      return user;
    }
    
    // Auto-signup for demo simplicity if not found (Optional, usually we throw error)
    // For this prompt, let's strictly create if not exists for smoother UX
    return signup(email, password);
  }
  throw new Error("Invalid credentials");
};

export const signup = async (email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  if (email && password.length >= 6) {
    const newUser: User = { 
      email, 
      id: Date.now().toString(),
      about: "I am a CS student ready to learn!",
      phoneNumber: ""
    };
    
    try {
      const created = await dbUsers.create(newUser);
      localStorage.setItem(SESSION_KEY, created.id);
      return created;
    } catch (e) {
      // If user exists, try logging in
      return login(email, password);
    }
  }
  throw new Error("Password must be at least 6 characters");
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  
  // Sync read from DB (since we need profile updates)
  const users = localStorage.getItem('db_users');
  if (users) {
      const parsed = JSON.parse(users);
      return parsed.find((u: User) => u.id === userId) || null;
  }
  return null;
};

export const updateUserProfile = async (user: User): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return await dbUsers.update(user);
};
