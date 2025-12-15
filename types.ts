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
  AI_ML = 'AI & Machine Learning'
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  topic: Topic;
}

export interface User {
  email: string;
  id: string;
  phoneNumber?: string;
  about?: string;
  avatar?: string; // Base64 string
}

export interface MemoryItem {
  id: string;
  content: string;
  language: string;
  timestamp: number;
  tags: string[];
}