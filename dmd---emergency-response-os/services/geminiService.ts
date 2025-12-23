
import { GoogleGenAI } from "@google/genai";

// Fix: Use strict initialization for GoogleGenAI with API_KEY from process.env directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSOAPNote = async (patientData: any): Promise<string> => {
  if (!process.env.API_KEY) {
    // Mock response for UI demonstration if no key is present
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Subjective (주관적 호소):
- 63세 남성, 응급 이송 중. 의식 명료, 흉통 호소 없음.

Objective (객관적 소견):
- BP: 140/90 mmHg (Hypertensive)
- HR: 112 bpm (Tachycardia)
- Metabolic Syndrome Score: 3/5
- Vascular Age: +9 years vs actual

Assessment (평가):
- Metabolic Syndrome with Acute Hypertension Risk.
- Rapid deterioration in BP control noted (+20mmHg slope).

Plan (계획):
- Immediate: ABGA, Serum Mg Level checks.
- Diagnostic: Carotid Ultrasound to assess vascular status.
- Monitor: Continuous EKG for arrhythmia.`);
      }, 1500);
    });
  }

  try {
    const prompt = `Generate a SOAP note for the following patient status: ${JSON.stringify(patientData)}. 
    Format it clearly with Subjective, Objective, Assessment, and Plan sections.`;
    
    // Fix: Using generateContent with correct parameters as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Fix: Access response.text property directly as recommended
    return response.text || "Failed to generate note.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};

export const getAudioBriefing = async (text: string): Promise<void> => {
    // This function would interface with the TTS capabilities
    // For this prototype, we handle the UI state in the component
    console.log("Requesting TTS for:", text);
    return Promise.resolve();
};
