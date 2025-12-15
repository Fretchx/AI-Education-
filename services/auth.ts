import { User } from '../types';

const STORAGE_KEY = 'cs_companion_user';

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would verify with a backend
  if (email && password.length >= 6) {
    // Check if user exists in storage to retrieve profile data
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedUser = JSON.parse(stored);
      if (storedUser.email === email) {
        return storedUser;
      }
    }

    const user: User = { 
      email, 
      id: Date.now().toString(),
      about: "I am a CS student ready to learn!",
      phoneNumber: "" 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }
  throw new Error("Invalid credentials");
};

export const signup = async (email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  if (email && password.length >= 6) {
    const user: User = { 
      email, 
      id: Date.now().toString(),
      about: "I am a CS student ready to learn!",
      phoneNumber: ""
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }
  throw new Error("Password must be at least 6 characters");
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const updateUserProfile = async (user: User): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
};