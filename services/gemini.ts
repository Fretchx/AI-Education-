import { GoogleGenAI, Chat } from "@google/genai";
import { Topic, StudentProfile, Message, Role } from "../types";
import { getPersonalizedSystemInstruction } from "./personalization";

const SYSTEM_INSTRUCTION_BASE = `You are "InfoStack", an elite Computer Science Professor and Senior Architect. 
Your mission is to provide rigorous, clear, and actionable CS education.

MODUS OPERANDI:
1. NEVER just give the answer. Guide the student using Socratic questioning when appropriate.
2. For coding requests: Provide clean, idiomatic code with Big O complexity analysis.
3. For theoretical requests: Use analogies and provide "Key Takeaways".
4. For math/discrete structures: Use clear formatting for formulas.

RESPONSE STRUCTURE:
- 💡 **Conceptual Overview**: Explain the 'Why' before the 'How'.
- 💻 **Implementation**: Code blocks with comments.
- 🔬 **Complexity Analysis**: Time and Space (Big O).
- 🎓 **Pro-Tip**: Senior-level advice or best practices.

Use Markdown for all formatting.
`;

const getEnv = (key: string): string | undefined => {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const nodeLikeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return viteEnv?.[key] ?? nodeLikeEnv?.[key];
};

const DEFAULT_MODEL = getEnv('GEMINI_MODEL') || 'gemini-2.5-flash';

const TOPIC_CONTEXT: Record<Topic, string> = {
  [Topic.GENERAL]: 'Provide broad-spectrum Computer Science guidance.',
  [Topic.ALGORITHMS]: 'Focus on data structures, optimization, and rigorous algorithm analysis.',
  [Topic.WEB_DEV]: 'Focus on modern web architecture, state management, and performance.',
  [Topic.SYSTEMS]: 'Focus on low-level concepts, memory, concurrency, and OS internals.',
  [Topic.DATABASE]: 'Focus on relational design, query optimization, indexing strategies, and transaction semantics.',
  [Topic.AI_ML]: 'Focus on mathematical foundations, model architectures, and data ethics.',
  [Topic.AI_ENGINEERING_TOOLS]: 'Focus on practical AI engineering tooling: copilots, code review assistants, evals, test generation, CI/CD automation, observability, and responsible usage patterns.'
};

const getApiKey = (): string => {
  const apiKey = getEnv('GEMINI_API_KEY') || getEnv('API_KEY');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY (preferred) or API_KEY.');
  }
  return apiKey;
};

let chatSession: Chat | null = null;
let currentTopic: Topic = Topic.GENERAL;
let currentProfile: StudentProfile | undefined;

export const initializeChat = (topic: Topic, userProfile?: StudentProfile, history?: Message[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    currentTopic = topic;
    currentProfile = userProfile;

    const topicContext = TOPIC_CONTEXT[topic] || TOPIC_CONTEXT[Topic.GENERAL];
    const baseWithTopic = `${SYSTEM_INSTRUCTION_BASE}\n\nTOPIC FOCUS: ${topicContext}`;
    const finalInstruction = getPersonalizedSystemInstruction(baseWithTopic, userProfile);

    const geminiHistory = (history || [])
      .filter(msg => !msg.isLoading && msg.text !== 'Analyzing...')
      .map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    chatSession = ai.chats.create({
      model: DEFAULT_MODEL,
      config: {
        systemInstruction: finalInstruction,
        temperature: 0.75,
        topP: 0.95,
      },
      history: geminiHistory
    });

    console.log(`[InfoStack] Session initialized for ${topic}. History: ${geminiHistory.length} turns.`);
  } catch (error) {
    console.error('[InfoStack] Initialization failed:', error);
  }
};

export const sendMessageToGemini = async (
  text: string,
  imagebase64?: string,
  onChunk?: (text: string) => void
): Promise<string> => {
  let ai: GoogleGenAI;

  try {
    ai = new GoogleGenAI({ apiKey: getApiKey() });
  } catch (error) {
    console.error('[InfoStack] API key validation failed:', error);
    return 'Configuration error: Gemini API key is missing. Add GEMINI_API_KEY to your environment.';
  }

  if (!chatSession) {
    initializeChat(currentTopic, currentProfile);
  }

  try {
    let responseText = '';

    if (imagebase64) {
      const response = await ai.models.generateContentStream({
        model: DEFAULT_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { text: text || 'Analyze this code/image:' },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imagebase64
                }
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE
        }
      });

      for await (const chunk of response) {
        if (chunk.text) {
          responseText += chunk.text;
          if (onChunk) onChunk(responseText);
        }
      }
    } else if (chatSession) {
      const streamResult = await chatSession.sendMessageStream({ message: text });

      for await (const chunk of streamResult) {
        if (chunk.text) {
          responseText += chunk.text;
          if (onChunk) onChunk(responseText);
        }
      }
    } else {
      throw new Error('Chat session lost. Please reload.');
    }

    return responseText;
  } catch (error) {
    console.error('[InfoStack] API error:', error);
    if (error instanceof Error && error.message.includes('401')) {
      return 'Authentication error. Please ensure your API key is correctly configured.';
    }
    return "I'm having trouble processing that right now. Could you try rephrasing or checking your connection?";
  }
};
