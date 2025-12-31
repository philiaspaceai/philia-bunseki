import { TokenizedWord } from "../types";

export const tokenizeText = async (text: string): Promise<string[]> => {
  // Check if running on localhost vs production to give helpful hint
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  try {
    const response = await fetch('/api/tokenize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      if (response.status === 404 && isLocal) {
        throw new Error("Development Environment Detected: The Python Tokenizer API only works when deployed to Vercel (Serverless Functions). It cannot run in the browser or via 'npm start'. Please deploy to Vercel to test analysis.");
      }
      throw new Error(`Tokenization API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tokens; // Expecting { tokens: string[] } dictionary forms
  } catch (error: any) {
    console.error("Tokenization failed", error);
    throw error;
  }
};