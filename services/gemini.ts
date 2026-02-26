
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
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

let chatSession: Chat | null = null;
let currentTopic: Topic = Topic.GENERAL;
let currentProfile: StudentProfile | undefined;

export const initializeChat = (topic: Topic, userProfile?: StudentProfile, history?: Message[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    currentTopic = topic;
    currentProfile = userProfile;
    
    let topicContext = "";
    switch (topic) {
      case Topic.ALGORITHMS:
        topicContext = "Focus on data structures, optimization, and rigorous algorithm analysis.";
        break;
      case Topic.WEB_DEV:
        topicContext = "Focus on modern web architecture, state management, and performance.";
        break;
      case Topic.SYSTEMS:
        topicContext = "Focus on low-level concepts, memory, concurrency, and OS internals.";
        break;
      case Topic.AI_ML:
        topicContext = "Focus on mathematical foundations, model architectures, and data ethics.";
        break;
      case Topic.AI_ENGINEERING_TOOLS:
        topicContext = "Focus on practical AI engineering tooling: copilots, code review assistants, evals, test generation, CI/CD automation, and responsible usage patterns.";
        break;
      default:
        topicContext = "Provide broad-spectrum Computer Science guidance.";
    }

    const baseWithTopic = `${SYSTEM_INSTRUCTION_BASE}\n\nTOPIC FOCUS: ${topicContext}`;
    const finalInstruction = getPersonalizedSystemInstruction(baseWithTopic, userProfile);

    // Convert internal Message history to Gemini API format
    const geminiHistory = (history || [])
      .filter(msg => !msg.isLoading && msg.text !== "Analyzing...")
      .map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: finalInstruction,
        temperature: 0.75,
        topP: 0.95,
      },
      history: geminiHistory
    });
    
    console.log(`[InfoStack] Session Initialized for ${topic}. History: ${geminiHistory.length} turns.`);
  } catch (error) {
    console.error("[InfoStack] Initialization failed:", error);
  }
};

export const sendMessageToGemini = async (
  text: string, 
  imagebase64?: string,
  onChunk?: (text: string) => void
): Promise<string> => {
  // Always fetch a fresh AI instance to ensure we pick up potential key updates from the environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Lazy init if session is missing
  if (!chatSession) {
    initializeChat(currentTopic, currentProfile);
  }

  try {
    let responseText = "";

    if (imagebase64) {
       // Multimodal turns are handled as a single turn for safety in stream
       const response = await ai.models.generateContentStream({
         model: 'gemini-3-pro-preview',
         contents: [
           {
             role: 'user',
             parts: [
               { text: text || "Analyze this code/image:" },
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
       throw new Error("Chat session lost. Please reload.");
    }

    return responseText;

  } catch (error) {
    console.error("[InfoStack] API error:", error);
    // If it's an auth error, we might need to reset
    if (error instanceof Error && error.message.includes("401")) {
        return "Authentication error. Please ensure your API key is correctly configured.";
    }
    return "I'm having trouble processing that right now. Could you try rephrasing or checking your connection?";
  }
};
