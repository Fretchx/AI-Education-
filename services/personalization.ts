
import { GoogleGenAI } from "@google/genai";
import { Message, StudentProfile } from "../types";
import { dbProfiles } from "./database";

/**
 * PERSONALIZATION ENGINE (ML Model)
 * Uses Gemini to analyze student interactions and update their profile.
 */

const ANALYSIS_MODEL = 'gemini-2.5-flash';

export const analyzeAndAdapt = async (userId: string, recentMessages: Message[]) => {
  if (recentMessages.length < 3) return; // Need some context

  try {
    const currentProfile = await dbProfiles.findByUserId(userId);
    if (!currentProfile) return;

    // We run this "in background"
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const analysisPrompt = `
      Analyze the following chat history between a CS Student and a Tutor.
      
      Current Student Profile:
      ${JSON.stringify(currentProfile)}
      
      Chat History:
      ${recentMessages.map(m => `${m.role}: ${m.text}`).join('\n')}
      
      Task:
      Update the student's profile based on this interaction.
      1. Identify new topics mastered.
      2. Identify new weaknesses or confusion points.
      3. Infer preferred language if they posted code.
      4. Detect learning style preference (e.g. do they ask for code? examples? theory?)
      
      Return ONLY a JSON object matching the StudentProfile interface. Do not wrap in markdown.
    `;

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      const updatedData = JSON.parse(response.text);
      
      // Merge safe logic
      const newProfile: StudentProfile = {
        ...currentProfile,
        ...updatedData,
        userId: userId, // Ensure ID doesn't get messed up
        lastUpdated: Date.now()
      };

      await dbProfiles.update(newProfile);
      console.log("ML Personalization Updated:", newProfile);
    }

  } catch (error) {
    console.error("Personalization Engine Failed:", error);
  }
};

export const getPersonalizedSystemInstruction = (baseInstruction: string, profile?: StudentProfile): string => {
  if (!profile) return baseInstruction;

  return `${baseInstruction}
  
  === 🧠 ADAPTIVE TEACHING PROFILE ===
  You are teaching a specific student. Adapt your responses:
  - **Coding Level**: ${profile.codingLevel} (Adjust complexity accordingly)
  - **Preferred Language**: ${profile.preferredLanguage} (Use this for examples unless asked otherwise)
  - **Learning Style**: ${profile.learningStyle}
  - **Strengths**: ${profile.topicsMastered.join(', ')} (Don't over-explain these)
  - **Current Weaknesses**: ${profile.weaknesses.join(', ')} (Provide extra care/detail here)
  
  Example adaptation:
  If style is 'Practical', give code first, theory second.
  If style is 'Theoretical', explain concepts first.
  If level is 'Beginner', avoid jargon.
  `;
};
