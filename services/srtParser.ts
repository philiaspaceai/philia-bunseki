
export const parseSrt = (srtContent: string): string => {
    // Remove sequence numbers
    let text = srtContent.replace(/^\d+$/gm, '');
    // Remove timestamps
    text = text.replace(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/gm, '');
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Remove furigana and other parenthesized text (e.g., (あららぎこよみ))
    text = text.replace(/[\(（][^)）]+[\)）]/g, '');
    // Remove speaker annotations or other bracketed text (e.g., 【笑】)
    text = text.replace(/[\[【][^\]】]+[\]】]/g, '');
    // Remove empty lines
    text = text.replace(/^\s*[\r\n]/gm, '');
    // Trim and return
    return text.trim();
};
