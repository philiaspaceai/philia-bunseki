export const parseSRT = (content: string): string => {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by double newline which usually separates subtitle blocks
  const blocks = normalized.split('\n\n');
  
  let fullText = "";

  for (const block of blocks) {
    const lines = block.split('\n');
    // Basic SRT structure: 
    // Line 1: Index
    // Line 2: Timestamp
    // Line 3+: Text
    if (lines.length >= 3) {
      // Filter out lines that look like timestamps or indices
      const textLines = lines.filter(line => {
        return !line.match(/^\d+$/) && !line.match(/^\d{2}:\d{2}:\d{2},\d{3}/);
      });
      
      fullText += textLines.join(' ') + " ";
    }
  }

  // Remove HTML tags often found in subtitles (<i>, <b>, <font>)
  fullText = fullText.replace(/<[^>]*>/g, '');
  
  return fullText.trim();
};
