export function cleanText(text: string): string {
  return text
    // Remove parentheses containing speaker names e.g. （阿良々木）
    .replace(/[（(].*?[)）]/g, '')
    // Remove HTML tags if any
    .replace(/<[^>]*>/g, '')
    // Remove special chars but keep Japanese text
    // We want to keep punctuation for context, but maybe normalize spaces
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

export function parseSRT(content: string): string {
  const lines = content.split('\n');
  let fullText = '';
  
  const timeRegex = /^\s*\d+\s*$|^\s*\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}\s*.*$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Skip numeric counters and timestamps
    if (timeRegex.test(trimmed) || /^\d+$/.test(trimmed)) {
      continue;
    }

    fullText += trimmed + '\n';
  }

  return cleanText(fullText);
}

export async function processFiles(files: File[]): Promise<{ text: string; fileStats: any[] }> {
  let combinedText = '';
  const fileStats = [];

  for (const file of files) {
    try {
      const text = await readFileAsText(file);
      const parsed = parseSRT(text);
      combinedText += parsed + '\n';
      fileStats.push({ name: file.name, size: file.size, charCount: parsed.length });
    } catch (e) {
      console.error(`Error processing file ${file.name}`, e);
    }
  }

  return { text: combinedText, fileStats };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file); // Browser usually detects encoding, but UTF-8 is standard for web
  });
}