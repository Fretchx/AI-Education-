

export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isLoading?: boolean;
  image?: string; // Base64 data
}

export enum Topic {
  GENERAL = 'General CS',
  ALGORITHMS = 'Algorithms & Data Structures',
  WEB_DEV = 'Web Development',
  SYSTEMS = 'Systems & OS',
  DATABASE = 'Databases & SQL',
  AI_ML = 'AI & Machine Learning',
  AI_ENGINEERING_TOOLS = 'AI Aided Engineering Tools'
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  topic: Topic;
}

export interface StudentProfile {
  userId: string;
  codingLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredLanguage: string;
  learningStyle: 'Theoretical' | 'Practical' | 'Socratic' | 'Visual';
  strengths: string[];
  weaknesses: string[];
  topicsMastered: string[];
  lastUpdated: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorAuth: boolean;
  publicProfile: boolean;
  // Accessibility
  reducedMotion?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
}

export interface User {
  email: string;
  id: string;
  displayName?: string;
  phoneNumber?: string;
  about?: string;
  avatar?: string; // Base64 string
  profile?: StudentProfile; // Linked ML Profile
  preferences?: UserPreferences;
}

export interface MemoryItem {
  id: string;
  userId: string;
  content: string;
  language: string;
  timestamp: number;
  tags: string[];
}

export interface ChatHistory {
  userId: string;
  messages: Message[];
  lastUpdated: number;
}
