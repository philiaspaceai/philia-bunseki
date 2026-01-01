import { SubtitleLine } from '../types';

// ==========================================
// 1. CONSTANTS & DICTIONARIES
// ==========================================

const PARTICLES = new Set([
  'は', 'が', 'を', 'に', 'で', 'と', 'も', 'へ', 'や', 'か', 'な', 'ね', 'よ', 'わ',
  'から', 'まで', 'より', 'の', 'こそ', 'さえ', 'でも', 'しか', 'だけ', 'ばかり',
  'のみ', 'など', 'くらい', 'ぐらい', 'ほど', 'ぞ', 'ぜ', 'さ',
  'には', 'では', 'とは', 'からは', 'までは', 'にも', 'へも', 'までに', 'のか', 'のに'
]);

const KEIGO_MAP: Record<string, string> = {
  'いらっしゃる': '来る', 'いらっしゃいます': '来る',
  'おっしゃる': '言う', 'おっしゃいます': '言う',
  'なさる': 'する', 'なさいます': 'する',
  'くださる': 'くれる', 'くださいます': 'くれる',
  '召し上がる': '食べる', '召し上がります': '食べる',
  'ご覧になる': '見る',
  'お亡くなりになる': '死ぬ',
  '参る': '行く', '参ります': '行く',
  '伺う': '聞く', '伺います': '聞く',
  '申す': '言う', '申します': '言う',
  '申し上げる': '言う',
  'いたす': 'する', 'いたします': 'する',
  'いただく': 'もらう', 'いただきます': 'もらう',
  '拝見する': '見る',
  '拝読する': '読む',
  '存じる': '知る', '存じます': '知る', '存じ上げる': '知る',
  'おる': 'いる', 'おります': 'いる',
  '差し上げる': 'あげる'
};

const COMPOUND_VERB_SUFFIXES = [
  '始める', '終わる', '出す', '込む', '換える', '直す', '返す', '合う', '合わせる', 'すぎる', '過ぎる'
];

const AUX_TO_STRIP = [
    'ている', 'てある', 'ておく', 'てしまう', 'てみる', 'てくる', 'ていく', 
    'てあげる', 'てくれる', 'てもらう', 'て頂く', 'てくださる', 'て下さる',
    'でいる', 'である', 'でおく', 'でしまう', 'でみる', 'でくる', 'でいく'
];

// ==========================================
// 2. PARSING LOGIC
// ==========================================

export const parseSRT = (content: string): SubtitleLine[] => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const lines: SubtitleLine[] = [];

  for (const block of blocks) {
    const linesInBlock = block.split('\n');
    if (linesInBlock.length < 3) continue;
    // Filter out index and timestamp
    const textLines = linesInBlock.filter(line => 
      !line.match(/^\d+$/) && 
      !line.match(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/)
    );
    const fullText = textLines.join('');
    const cleaned = cleanText(fullText);
    if (cleaned) lines.push({ text: cleaned });
  }
  return lines;
};

const cleanText = (text: string): string => {
  let t = text;
  t = t.replace(/<[^>]*>/g, ''); // HTML
  t = t.replace(/（[^）]*）/g, ''); // Fullwidth parenthesis
  t = t.replace(/\([^)]*\)/g, ''); // Halfwidth parenthesis
  // Remove specific furigana pattern Name(reading)
  t = t.replace(/([一-龠]+)\([ぁ-んァ-ン]+\)/g, '$1');
  // Remove punctuation
  t = t.replace(/[。、！？「」『』\.,!?"'#%&;:\-\(\)\{\}<>～~…・]/g, ' ');
  return t.trim();
};

// ==========================================
// 3. MORPHOLOGICAL ANALYSIS LOGIC
// ==========================================

export const tokenizeText = (text: string): string[] => {
    // @ts-ignore: Intl.Segmenter might not be in TS lib yet
    const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
    const segments = segmenter.segment(text);
    
    const results: string[] = [];

    for (const seg of segments) {
        if (!seg.isWordLike) continue;
        const token = seg.segment.trim();
        if (!token) continue;

        // --- DECISION TREE START ---
        
        // 1. Particle Check (Exact match)
        if (PARTICLES.has(token)) continue;

        // 2. Number + Counter Split
        // Regex: (Number)(Counter) -> e.g. 三本 -> 三, 本
        const numMatch = token.match(/^([0-9０-９一二三四五六七八九十百千万億兆]+)(.+)$/);
        if (numMatch && isCounter(numMatch[2])) {
             // Keep both separately
             results.push(numMatch[1]);
             results.push(numMatch[2]);
             continue;
        }

        // 3. Interjections / Fixed Phrases (Keep as is)
        if (isFixedPhrase(token)) {
            results.push(token);
            continue;
        }

        // 4. Clean Suffixes (Plural, Etc)
        let processed = token;
        if (processed.endsWith('たち')) processed = processed.replace(/たち$/, '');
        else if (processed.endsWith('達')) processed = processed.replace(/達$/, '');
        else if (processed.endsWith('ら')) processed = processed.replace(/ら$/, '');

        // 5. Suru-Verbs (Noun + Suru)
        // e.g. 勉強する -> 勉強 + する
        // Regex look for Noun (Kanji/Katakana usually) + suru forms
        if (processed.match(/[一-龠ァ-ン]+(する|した|して|します|しない|しよう|せずに)/)) {
             const stem = processed.replace(/(する|した|して|します|しない|しよう|せずに).*$/, '');
             if (stem.length > 0 && stem !== processed) {
                 results.push(stem);
                 results.push('する');
                 continue;
             }
        }

        // 6. Compound Verbs
        // e.g. 書き始める -> 書く + 始める
        let compoundSplit = false;
        for (const suffix of COMPOUND_VERB_SUFFIXES) {
             // Check if token ends with a compound suffix conjugated or base
             // Note: This is simplified. Proper implementation needs to check conjugation of suffix.
             // We'll check base forms appearing at end for simplicity first, or heuristic
             if (processed.includes(suffix.charAt(0)) && processed.length > suffix.length) {
                 // Try to split at the kanji of suffix
                 const suffixStartChar = suffix.charAt(0);
                 const lastIndex = processed.lastIndexOf(suffixStartChar);
                 if (lastIndex > 0) {
                     const v1Stem = processed.substring(0, lastIndex);
                     const v2Part = processed.substring(lastIndex);
                     // Heuristic: v1Stem should look like a stem (ends in i-column sound mostly)
                     // Convert v1Stem to Dictionary
                     const v1Dict = stemToDict(v1Stem);
                     const v2Dict = performDeepDeconjugation(v2Part);
                     
                     if (v1Dict && v2Dict) {
                         results.push(v1Dict);
                         results.push(v2Dict);
                         compoundSplit = true;
                         break;
                     }
                 }
             }
        }
        if (compoundSplit) continue;

        // 7. Auxiliary Verbs Stripping
        // e.g. 食べている -> 食べる
        let auxStripped = false;
        for (const pattern of AUX_TO_STRIP) {
            // Check if ends with pattern (conjugated or not)
            // Simplified: check "te" + aux start
            const teFormIndex = Math.max(processed.lastIndexOf('て'), processed.lastIndexOf('で'));
            if (teFormIndex > 0) {
                 const tail = processed.substring(teFormIndex); // ている...
                 // Only strip if the tail *is* an aux verb sequence
                 if (isAuxVerbSequence(tail)) {
                      const base = processed.substring(0, teFormIndex + 1); // 食べて
                      const dict = performDeepDeconjugation(base);
                      if (dict) {
                          results.push(dict);
                          auxStripped = true;
                          break;
                      }
                 }
            }
        }
        if (auxStripped) continue;

        // 8. Main De-conjugation (Verb/Adj)
        const deconjugated = performDeepDeconjugation(processed);
        results.push(deconjugated);
    }

    return results;
};

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

const isCounter = (str: string): boolean => {
    // Common counters
    const counters = ['個', '本', '枚', '匹', '人', '冊', '台', '杯', '回', 'つ', '歳', '才', '円', '時', '分', '秒', '年', '月', '日', '階', '番'];
    return counters.includes(str) || str.length === 1; // Assume single kanji after number is counter
};

const isFixedPhrase = (str: string): boolean => {
    const fixed = ['ありがとう', 'ございます', 'すみません', 'ごめんなさい', 'おはよう', 'こんにちは', 'こんばんは', 'さようなら', 'いただきます', 'ごちそうさま', 'はい', 'いいえ'];
    return fixed.some(f => str.includes(f));
};

const isAuxVerbSequence = (tail: string): boolean => {
    // Check if tail matches things like ている, であった, etc.
    return /^(て|で)(いる|いた|いない|ある|あった|ない|おく|おいた|しまう|しまった|みる|みた|くる|きた|いく|いった|あげる|くれる|もらう)/.test(tail);
};

// Convert Verb Stem (Masu-stem) to Dictionary Form
const stemToDict = (stem: string): string | null => {
    // Godan map from i-column to u-column
    const map: Record<string, string> = {
        'き': 'く', 'ぎ': 'ぐ', 'し': 'す', 'ち': 'つ', 'に': 'ぬ', 'ひ': 'ぶ', 'び': 'ぶ', 'み': 'む', 'り': 'る', 'い': 'う'
    };
    const lastChar = stem.slice(-1);
    
    // Heuristic: If kanji + e-column + r + u -> Ichidan?
    // Here we just try to convert stem to u-sound.
    
    // Ichidan check: Stem ends in 'e' sound? (e, ke, ge, se, te, ne, he, be, me, re)
    const eColumn = ['え','け','げ','せ','て','ね','へ','べ','め','れ'];
    if (eColumn.includes(lastChar)) {
        return stem + 'る'; // 食べる stem 食べ
    }
    
    // Godan check
    if (map[lastChar]) {
        return stem.slice(0, -1) + map[lastChar];
    }
    
    // Ambiguous i-column (could be Ichidan or Godan)
    // e.g. み (Miru or Mu?) -> Default to Godan Mu usually, but Miru is very common.
    // For "kaki-hajimeru", kaki -> kaku. 
    if (lastChar === 'み') return stem.slice(0, -1) + 'む';
    if (lastChar === 'き') return stem.slice(0, -1) + 'く';
    if (lastChar === 'り') return stem.slice(0, -1) + 'る'; // kaeru -> kaeri
    
    return null;
};

// THE CORE LOGIC: Converts conjugated forms to Dictionary form
const performDeepDeconjugation = (word: string): string => {
    let w = word;

    // 0. Keigo Check
    if (KEIGO_MAP[w]) return KEIGO_MAP[w];

    // 1. Remove specific particles if stuck to word (heuristic for bad segmentation)
    if (w.length > 2) {
         if (w.endsWith('よ') || w.endsWith('ね') || w.endsWith('な') || w.endsWith('さ') || w.endsWith('ぞ') || w.endsWith('ぜ') || w.endsWith('わ')) {
             w = w.slice(0, -1);
         }
    }

    // 2. Adjectives
    // I-Adj
    if (w.endsWith('くない')) return w.slice(0, -3) + 'い';
    if (w.endsWith('かった')) return w.slice(0, -3) + 'い';
    if (w.endsWith('くて')) return w.slice(0, -2) + 'い';
    if (w.endsWith('ければ')) return w.slice(0, -3) + 'い';
    // Na-Adj / Copula
    if (w.endsWith('だ')) return w.slice(0, -1);
    if (w.endsWith('です')) return w.slice(0, -2);
    if (w.endsWith('な')) return w.slice(0, -1);
    if (w.endsWith('に') && !w.match(/[aeiou]に/)) return w.slice(0, -1); // Careful not to strip verbs ending in ni like shini
    if (w.endsWith('じゃない')) return w.slice(0, -4);
    if (w.endsWith('ではない')) return w.slice(0, -4);
    
    // 3. Verbs
    
    // Masu Form
    if (w.endsWith('ます')) return stemToDict(w.slice(0, -2)) || w;
    if (w.endsWith('ました')) return stemToDict(w.slice(0, -3)) || w;
    if (w.endsWith('ません')) return stemToDict(w.slice(0, -3)) || w;
    
    // Tai Form
    if (w.endsWith('たい')) return stemToDict(w.slice(0, -2)) || w;
    if (w.endsWith('たくない')) return stemToDict(w.slice(0, -4)) || w;
    if (w.endsWith('たかった')) return stemToDict(w.slice(0, -4)) || w;

    // Negative (Nai)
    if (w.endsWith('ない')) {
        const stem = w.slice(0, -2);
        // Ichidan: tabenai -> taberu
        // Godan: kakanai -> kaku
        const last = stem.slice(-1);
        const aToU: Record<string, string> = {'か':'く','が':'ぐ','さ':'す','た':'つ','な':'ぬ','ば':'ぶ','ま':'む','ら':'る','わ':'う'};
        
        if (aToU[last]) return stem.slice(0, -1) + aToU[last];
        // If not a-column, assume ichidan
        return stem + 'る';
    }
    if (w.endsWith('ず')) {
         // tabezu -> taberu
         // kakazu -> kaku
         const stem = w.slice(0, -1);
         const last = stem.slice(-1);
         const aToU: Record<string, string> = {'か':'く','が':'ぐ','さ':'す','た':'つ','な':'ぬ','ば':'ぶ','ま':'む','ら':'る','わ':'う'};
         if (aToU[last]) return stem.slice(0, -1) + aToU[last];
         return stem + 'る';
    }

    // Te/Ta Forms (The Tricky Part)
    // った -> う, つ, る
    if (w.endsWith('った') || w.endsWith('って')) {
        const stem = w.slice(0, -2);
        // Heuristic: Most common is tsu or ru. 
        // We will return 'る' as default for tta because many verbs are u-verbs or ru-verbs.
        // But actually, we don't know without dict. 
        // Strategy: Return stem + 'る' OR stem + 'つ' OR stem + 'う'.
        // Let's try checking previous char. 
        // If kanji, usually ru/tsu.
        return stem + 'る'; // Default guess
    }
    // んだ -> む, ぶ, ぬ
    if (w.endsWith('んだ') || w.endsWith('んで')) {
        const stem = w.slice(0, -2);
        return stem + 'む'; // Default guess (yomu, nomu most common)
    }
    // いた -> く
    if (w.endsWith('いた') || w.endsWith('いて')) {
        return w.slice(0, -2) + 'く';
    }
    // いだ -> ぐ
    if (w.endsWith('いだ') || w.endsWith('いで')) {
        return w.slice(0, -2) + 'ぐ';
    }
    // した -> す
    if (w.endsWith('した') || w.endsWith('して')) {
        return w.slice(0, -2) + 'す';
    }
    
    // Ichidan Te/Ta (e.g. 食べて -> 食べる)
    // Matches if it ends in te/ta but wasn't caught by the compound patterns above (like いて, して, etc.)
    if (w.endsWith('て')) return w.slice(0, -1) + 'る';
    if (w.endsWith('た')) return w.slice(0, -1) + 'る';
    
    // Potential / Passive / Causative
    // rareru, reru, saseru
    if (w.endsWith('られる')) return w.slice(0, -3) + 'る'; // Taberareru -> Taberu
    if (w.endsWith('される')) return w.slice(0, -3) + 'する';
    if (w.endsWith('れる') && !w.endsWith('くれる')) { 
         // kakareru -> kaku
         // This is hard. stem-a + reru.
         // kaka-reru -> kaku.
         const stem = w.slice(0, -2);
         const last = stem.slice(-1);
         const aToU: Record<string, string> = {'か':'く','が':'ぐ','さ':'す','た':'つ','な':'ぬ','ば':'ぶ','ま':'む','ら':'る','わ':'う'};
         if (aToU[last]) return stem.slice(0, -1) + aToU[last];
    }
    if (w.endsWith('せる')) {
         // kakaseru -> kaku (Godan)
         // tabesaseru -> taberu (Ichidan)
         const stem = w.slice(0, -2);
         const last = stem.slice(-1);
         const aToU: Record<string, string> = {'か':'く','が':'ぐ','さ':'す','た':'つ','な':'ぬ','ば':'ぶ','ま':'む','ら':'る','わ':'う'};
         if (aToU[last]) return stem.slice(0, -1) + aToU[last];
         return stem + 'る';
    }
    
    // Volitional
    if (w.endsWith('よう')) return w.slice(0, -2) + 'る'; // Tabeyou -> Taberu
    if (w.endsWith('おう')) {
        // Kakou -> Kaku
        const stem = w.slice(0, -2);
        const last = stem.slice(-1);
        // o-column -> u-column
        const oToU: Record<string, string> = {'こ':'く','ご':'ぐ','そ':'す','と':'つ','の':'ぬ','ぼ':'ぶ','も':'む','ろ':'る'};
        if (oToU[last]) return stem.slice(0, -1) + oToU[last];
    }

    // Ba-form (Conditional)
    if (w.endsWith('ば')) {
        // Kakeba -> Kaku (e -> u)
        // Tabereba -> Taberu
        if (w.endsWith('れば')) return w.slice(0, -2) + 'る'; // Ichidan
        
        const stem = w.slice(0, -1);
        const last = stem.slice(-1);
        const eToU: Record<string, string> = {'け':'く','げ':'ぐ','せ':'す','て':'つ','ね':'ぬ','べ':'ぶ','め':'む','れ':'る'};
        if (eToU[last]) return stem.slice(0, -1) + eToU[last];
    }

    // 4. Specific Grammar Patterns
    if (w.endsWith('そう')) {
         // Oishisou -> Oishii / Benrisou -> Benri
         // Heuristic: if kanji before sou, probably na-adj/verb stem.
         // If i-adj stem... hard to know.
         // Default: strip sou
         return w.slice(0, -2);
    }
    if (w.endsWith('すぎ')) return w.slice(0, -2); // Tabesugi -> Tabe(ru)
    if (w.endsWith('やす')) return w.slice(0, -2); // Tabeyasu(i) -> Tabe(ru)
    if (w.endsWith('にく')) return w.slice(0, -2); 

    // Return original if no rules matched
    return w;
};

// Re-export countKanji for analyzer
export const countKanji = (text: string): number => {
    const kanjiRegex = /[一-龠]/g;
    const matches = text.match(kanjiRegex);
    return matches ? new Set(matches).size : 0;
};

// Re-export isParticleOrAux for legacy check compatibility (though unused in new logic)
export const isParticleOrAux = (word: string): boolean => {
    return PARTICLES.has(word);
};

export const generateCandidates = (s: string) => [s]; // Legacy stub