import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Topic, Message, Role } from "../types";

const SYSTEM_INSTRUCTION_BASE = `You are an expert Computer Science Professor and Senior Software Engineer. 
Your goal is not just to provide code, but to teach the student *how* to solve it.

WHEN THE USER PROVIDES CODE, ANALYZE THE REQUEST TYPE AND USE THE APPROPRIATE FORMAT:

=== SCENARIO 1: DEBUGGING, EXPLAINING, OR FIXING ===
If the user asks to find errors, explain logic, or refactor:

### 1. 🧐 Methodology & Concepts
Briefly explain what methods, algorithms, or design patterns are used (e.g., "Recursive Depth-First Search").

### 2. 🐞 Diagnosis (Find Error)
Identify specific errors (Syntax, Logical, Runtime). Explain *why* it fails. (Skip if code is correct).

### 3. ✅ Corrected Code
Provide the fully fixed code block with explanatory comments.

### 4. 🎓 Key Takeaway
A brief lesson summarizing the core concept.

=== SCENARIO 2: CONVERTING / TRANSLATING LANGUAGES ===
If the user asks to convert code from one language to another (e.g., Java to Python, C to C++):

### 1. 🔄 Conversion Logic
Explain how major constructs map to the new language (e.g., "Java's ArrayList maps to C++ std::vector", or "Python handles memory automatically, unlike C").

### 2. 💻 Converted Code
Provide the equivalent code in the target language, adhering to that language's idioms (Pythonic, Modern C++, etc.).

### 3. 💡 Language Specific Differences
Highlight important differences (e.g., Memory Management, Type System, Performance implications).

---
GENERAL RULES:
1. Be concise but thorough.
2. ALWAYS explain Time and Space Complexity (Big O) for algorithms.
3. Use clean, modern coding standards.
4. Format response with Markdown.
`;

let chatSession: Chat | null = null;
let currentTopic: Topic = Topic.GENERAL;

const getSystemInstruction = (topic: Topic): string => {
  let specific = "";
  switch (topic) {
    case Topic.ALGORITHMS:
      specific = "Focus heavily on efficiency, edge cases, and mathematical proofs where relevant.";
      break;
    case Topic.WEB_DEV:
      specific = "Focus on modern frameworks (React, Next.js), accessibility, and best practices.";
      break;
    case Topic.SYSTEMS:
      specific = "Focus on memory management, concurrency, and low-level details.";
      break;
    default:
      specific = "Cover a broad range of CS fundamentals.";
  }
  return `${SYSTEM_INSTRUCTION_BASE}\nCurrent Context: ${specific}`;
};

export const initializeChat = (topic: Topic) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    currentTopic = topic;
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(topic),
        temperature: 0.7,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
  }
};

export const sendMessageToGemini = async (
  text: string, 
  imagebase64?: string,
  onChunk?: (text: string) => void
): Promise<string> => {
  if (!chatSession) {
    initializeChat(currentTopic);
  }

  if (!chatSession) {
    throw new Error("Chat session could not be initialized.");
  }

  try {
    let responseText = "";

    if (imagebase64) {
       const messageContent = [
         { text },
         {
           inlineData: {
             mimeType: 'image/jpeg',
             data: imagebase64
           }
         }
       ];

       const streamResult = await chatSession.sendMessageStream({ 
           message: messageContent 
       });

       for await (const chunk of streamResult) {
         const c = chunk as GenerateContentResponse;
         if (c.text) {
             responseText += c.text;
             if (onChunk) onChunk(responseText);
         }
       }

    } else {
        const streamResult = await chatSession.sendMessageStream({ message: text });
        
        for await (const chunk of streamResult) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
                responseText += c.text;
                if (onChunk) onChunk(responseText);
            }
        }
    }

    return responseText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error connecting to the neural network. Please check your connection or API key.";
  }
};