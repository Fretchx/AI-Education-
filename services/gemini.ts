
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Topic, StudentProfile, Message, Role } from "../types";
import { getPersonalizedSystemInstruction } from "./personalization";

const SYSTEM_INSTRUCTION_BASE = `You are an expert Computer Science Professor and Senior Software Engineer. 
Your goal is not just to provide code, but to teach the student *how* to solve it.

WHEN THE USER PROVIDES CODE, ANALYZE THE REQUEST TYPE AND USE THE APPROPRIATE FORMAT:

=== SCENARIO 1: DEBUGGING, EXPLAINING, OR FIXING ===
If the user asks to find errors, explain logic, or refactor:

### 1. 🧐 Methodology & Concepts
Briefly explain what methods, algorithms, or design patterns are used.

### 2. 🐞 Diagnosis (Find Error)
Identify specific errors (Syntax, Logical, Runtime). Explain *why* it fails.

### 3. ✅ Corrected Code
Provide the fully fixed code block with explanatory comments.

### 4. 🎓 Key Takeaway
A brief lesson summarizing the core concept.

=== SCENARIO 2: CONVERTING / TRANSLATING LANGUAGES ===
If the user asks to convert code from one language to another:

### 1. 🔄 Conversion Logic
Explain how major constructs map to the new language.

### 2. 💻 Converted Code
Provide the equivalent code in the target language.

### 3. 💡 Language Specific Differences
Highlight important differences (Memory, Types, Performance).

---
GENERAL RULES:
1. Be concise but thorough.
2. ALWAYS explain Time and Space Complexity (Big O) for algorithms.
3. Use clean, modern coding standards.
4. Format response with Markdown.
`;

let chatSession: Chat | null = null;
let currentTopic: Topic = Topic.GENERAL;

export const initializeChat = (topic: Topic, userProfile?: StudentProfile, history?: Message[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    currentTopic = topic;
    
    let specificContext = "";
    switch (topic) {
      case Topic.ALGORITHMS:
        specificContext = "Focus heavily on efficiency, edge cases, and mathematical proofs where relevant.";
        break;
      case Topic.WEB_DEV:
        specificContext = "Focus on modern frameworks (React, Next.js), accessibility, and best practices.";
        break;
      case Topic.SYSTEMS:
        specificContext = "Focus on memory management, concurrency, and low-level details.";
        break;
      default:
        specificContext = "Cover a broad range of CS fundamentals.";
    }

    const baseWithTopic = `${SYSTEM_INSTRUCTION_BASE}\nCurrent Context: ${specificContext}`;
    const finalInstruction = getPersonalizedSystemInstruction(baseWithTopic, userProfile);

    // Filter history to remove loading states and transient messages
    const geminiHistory = (history || [])
      .filter(msg => !msg.isLoading && msg.text !== "Analyzing...")
      .map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: finalInstruction,
        temperature: 0.7,
      },
      history: geminiHistory
    });
    console.log("Chat Initialized. Topic:", topic, "History items:", geminiHistory.length);
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
  }
};

export const sendMessageToGemini = async (
  text: string, 
  imagebase64?: string,
  onChunk?: (text: string) => void
): Promise<string> => {
  // Always ensure a fresh AI instance for API calls to pick up potential key updates
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (!chatSession) {
    initializeChat(currentTopic);
  }

  try {
    let responseText = "";

    // Multimodal turns are more reliably handled by generateContentStream directly
    if (imagebase64) {
       const response = await ai.models.generateContentStream({
         model: 'gemini-3-flash-preview',
         contents: [
           {
             role: 'user',
             parts: [
               { text: text || "Analyze this image" },
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
       throw new Error("Chat session unavailable");
    }

    return responseText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error connecting to the neural network. Please ensure the API_KEY environment variable is correctly configured.";
  }
};
