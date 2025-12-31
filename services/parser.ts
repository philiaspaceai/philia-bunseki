/**
 * Cleans raw subtitle text by removing noises, names, and tags.
 */
const cleanSubtitleText = (text: string): string => {
  let cleaned = text;

  // 1. Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 2. Remove ASS/SSA tags (positioning, etc.) e.g., {\pos(192,210)}
  cleaned = cleaned.replace(/\{[^}]*\}/g, '');

  // 3. Remove Names in brackets (standard, full-width, square, lenticular)
  // e.g. （阿良々木）, 【名前】, [Name]
  cleaned = cleaned.replace(/（[^）]*）/g, '');
  cleaned = cleaned.replace(/【[^】]*】/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
  cleaned = cleaned.replace(/\([^\)]*\)/g, ''); // Standard parentheses often used for furigana too

  // 4. Remove Sound Effects/Music indicators
  cleaned = cleaned.replace(/[♪～☆★※]/g, '');
  cleaned = cleaned.replace(/\(BGM[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\(SE[^)]*\)/gi, '');

  // 5. Remove extra whitespace and newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

export const parseSRT = (fileContent: string): string => {
  const lines = fileContent.split(/\r?\n/);
  let accumulatedText = "";

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return;
    
    // Skip numeric index lines (simple check: is it just a number?)
    if (/^\d+$/.test(trimmed)) return;

    // Skip Timestamp lines (e.g., 00:00:03,628 --> 00:00:05,547)
    if (trimmed.includes('-->')) return;

    // It's likely dialog text. Add it.
    accumulatedText += trimmed + " ";
  });

  return cleanSubtitleText(accumulatedText);
};
