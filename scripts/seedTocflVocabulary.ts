/**
 * Script to import 5000 TOCFL vocabulary from dailoan.vn
 * Non-AI version - đảm bảo format giống AI: examples (台灣繁體中文 + Pinyin + Nghĩa),
 * synonyms/antonyms (漢字 pinyin), 6 quiz questions đa dạng
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { pinyinToZhuyin } from 'pinyin-zhuyin';
// @ts-ignore - pinyin package types
import pinyin from 'pinyin';

// ============ Part of speech inference ============
const PART_OF_SPEECH_PATTERNS: Array<{ pattern: string[]; pos: string }> = [
  { pattern: ['yêu', 'thích', 'ăn', 'uống', 'đi', 'đến', 'làm', 'học', 'đọc', 'viết', 'nói', 'nghe', 'xem', 'mua', 'bán', 'mở', 'đóng', 'gọi', 'chơi', 'chạy', 'bay', 'ngủ', 'ghét', 'biết', 'hiểu', 'nghĩ', 'cần', 'muốn', 'phải', 'nên', 'sắp xếp', 'tham gia', 'tham quan', 'giúp đỡ', 'bảo vệ', 'chuyển', 'đánh', 'cầm', 'nắm', 'đặt', 'để', 'chờ', 'chùi', 'đoán', 'bế', 'ôm', 'báo cáo', 'xuất', 'mặc', 'đeo', 'thổi', 'xử lý', 'trở nên', 'đạt được', 'chi trả', 'phục vụ', 'điều tra', 'đặt'], pos: 'verb' },
  { pattern: ['lớn', 'nhỏ', 'đẹp', 'xấu', 'tốt', 'nhanh', 'chậm', 'nóng', 'lạnh', 'mới', 'cũ', 'đúng', 'sai', 'đầy', 'trống', 'cao', 'thấp', 'dài', 'ngắn', 'rộng', 'hẹp', 'sạch', 'bẩn', 'yên', 'ồn', 'lùn', 'thấp', 'tĩnh lặng', 'an toàn', 'thông minh', 'khác biệt', 'thành công'], pos: 'adjective' },
  { pattern: ['rất', 'thường', 'luôn', 'đã', 'đang', 'sẽ', 'cũng', 'chỉ', 'vừa', 'ngay', 'rồi', 'thường thường', 'hay', 'tương đối', 'khá'], pos: 'adverb' },
  { pattern: ['người', 'vật', 'nơi', 'thứ', 'cái', 'con', 'cây', 'nhà', 'trường', 'công ty', 'thành phố', 'nước', 'màu', 'số', 'ngày', 'năm', 'giờ', 'phút', 'bữa', 'món', 'bài', 'cuộc', 'cửa', 'bàn', 'ghế', 'sách', 'bút', 'áo', 'quần', 'giày', 'mũ', 'cốc', 'ly', 'bát', 'đĩa', 'bố', 'mẹ', 'dì', 'cô', 'bác', 'trứng', 'bánh', 'chè', 'cơm', 'rau', 'cỏ', 'ga tàu', 'phòng', 'đèn', 'điện thoại', 'máy tính', 'ti vi', 'phim', 'bản đồ', 'bụng', 'tai', 'mũi', 'bảo tàng', 'văn phòng', 'siêu thị', 'bệnh viện', 'trạm', 'đại học'], pos: 'noun' },
  { pattern: ['tôi', 'bạn', 'anh', 'chị', 'em', 'ông', 'bà', 'nó', 'họ', 'ai', 'gì', 'nào', 'đâu', 'bao nhiêu', 'mọi người', 'người khác'], pos: 'pronoun' },
  { pattern: ['và', 'nhưng', 'hoặc', 'nếu', 'vì', 'nên', 'mà', 'thì', 'hay', 'cho dù', 'mặc dù', 'ngoài ra'], pos: 'conjunction' },
  { pattern: ['trong', 'ngoài', 'trên', 'dưới', 'trước', 'sau', 'giữa', 'từ', 'đến', 'với', 'cho', 'về', 'đối với'], pos: 'preposition' },
  { pattern: ['à', 'ơ', 'chà', 'ồ', 'này', 'nào', 'nhé', 'chứ', 'đi', 'thôi'], pos: 'interjection' },
];

function inferPartOfSpeech(meaning: string, word: string): string {
  const m = meaning.toLowerCase();
  const firstMeaning = m.split(/[,，、]/)[0].trim();
  for (const { pattern, pos } of PART_OF_SPEECH_PATTERNS) {
    if (pattern.some(p => firstMeaning.includes(p) || m.includes(p))) return pos;
  }
  if (word.length === 1) return 'verb';
  if (/[子兒頭家]/.test(word) || /[館店室房廳]/.test(word)) return 'noun';
  if (/[了著過]/.test(word)) return 'verb';
  return 'noun';
}

// ============ Topic inference ============
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Gia đình': ['bố', 'mẹ', 'anh', 'chị', 'em', 'ông', 'bà', 'con', 'gia đình', 'dì', 'chú', 'bác', 'cô'],
  'Thức ăn': ['ăn', 'cơm', 'bánh', 'rau', 'thịt', 'cá', 'trứng', 'sữa', 'trà', 'nước', 'món', 'bữa', 'nhà hàng', 'cafe', 'siêu thị'],
  'Màu sắc': ['màu', 'đỏ', 'xanh', 'vàng', 'trắng', 'đen', 'sắc'],
  'Số đếm': ['số', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'trăm', 'nghìn'],
  'Thời gian': ['ngày', 'tháng', 'năm', 'giờ', 'phút', 'sáng', 'chiều', 'tối', 'đêm', 'tuần', 'mùa'],
  'Địa điểm': ['nhà', 'trường', 'công ty', 'bệnh viện', 'ga', 'sân bay', 'phố', 'thành phố', 'nước'],
  'Giao tiếp': ['chào', 'cảm ơn', 'xin lỗi', 'tạm biệt', 'nói', 'nghe', 'hỏi', 'trả lời'],
  'Học tập': ['học', 'đọc', 'viết', 'bài', 'trường', 'lớp', 'sách', 'thi', 'kiểm tra'],
  'Công việc': ['làm', 'công việc', 'văn phòng', 'công ty', 'lương', 'nghề'],
  'Du lịch': ['đi', 'du lịch', 'máy bay', 'tàu', 'xe', 'khách sạn', 'vé'],
  'TOCFL': [],
};

function inferTopics(meaning: string): string[] {
  const m = meaning.toLowerCase();
  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => m.includes(k))) topics.push(topic);
  }
  if (topics.length === 0) topics.push('TOCFL');
  return topics;
}

// ============ Level ============
function inferLevel(word: string, meaning: string, index: number, total: number): number {
  const m = meaning.toLowerCase();

  const ratio = index / Math.max(1, total - 1);
  let level: number;
  if (ratio < 0.15) level = 1;
  else if (ratio < 0.3) level = 2;
  else if (ratio < 0.5) level = 3;
  else if (ratio < 0.7) level = 4;
  else if (ratio < 0.85) level = 5;
  else level = 6;

  const veryBasicPatterns = [
    /\b(bố|ba|mẹ|má|anh|chị|em|ông|bà|gia đình)\b/,
    /\b(ăn|uống|cơm|bánh|mì|trà|nước|sữa|trái cây|hoa quả|rau)\b/,
    /\b(nhà|phòng|bàn|ghế|giường|cửa sổ|cửa ra vào)\b/,
    /\b(trường|lớp|học sinh|giáo viên|bài tập|thi|kiểm tra)\b/,
    /\b(màu|đỏ|xanh|vàng|trắng|đen|cam|tím|hồng)\b/,
    /\b(ngày|giờ|phút|giây|tháng|năm|hôm nay|hôm qua|ngày mai)\b/,
  ];
  if (veryBasicPatterns.some(r => r.test(m))) {
    level = Math.min(level, 2);
  }

  if (m.match(/\bsố\s*\d+\b/) || m.match(/\b(thứ|ngày)\s+\d+\b/)) {
    level = Math.min(level, 2);
  }

  const advancedPatterns = [
    /\b(kinh tế|chính trị|xã hội|xã hội học|nhân loại học|khảo cổ học)\b/,
    /\b(khoa học công nghệ|công nghệ thông tin|tài chính|ngân hàng|kinh doanh)\b/,
    /\b(giáo dục|triết học|tâm lý học|triết|luận|hệ thống|chính sách)\b/,
    /\b(môi trường|kinh tế vĩ mô|kinh tế vi mô)\b/,
  ];
  if (advancedPatterns.some(r => r.test(m))) {
    level = Math.max(level, 4);
  }

  if (word.length === 1 && level > 3) {
    level -= 1;
  }

  if (level < 1) level = 1;
  if (level > 6) level = 6;
  return level;
}

// ============ Zhuyin ============
function toZhuyin(pinyinStr: string): string {
  try {
    const normalized = pinyinStr.trim().replace(/\s+/g, ' ');
    return pinyinToZhuyin(normalized) || '';
  } catch {
    return '';
  }
}

// ============ Chinese to Pinyin (full sentence) ============
function chineseToPinyin(text: string): string {
  try {
    const result = pinyin(text, { style: pinyin.STYLE_TONE, heteronym: false });
    return result.map((arr: string[]) => arr[0] || '').join(' ');
  } catch {
    return '';
  }
}

// ============ Example templates - 台灣繁體中文 context, format: taiwan | pinyin | nghia ============
const EXAMPLE_TEMPLATES: Array<{ taiwan: string; nghia: string }> = [
  { taiwan: '這家餐廳的${word}很好吃。', nghia: 'Món ${meaning} ở nhà hàng này rất ngon.' },
  { taiwan: '老師在課堂上教我們${word}。', nghia: 'Giáo viên dạy chúng tôi ${meaning} trong lớp.' },
  { taiwan: '我們一家人很喜歡${word}。', nghia: 'Cả nhà chúng tôi rất thích ${meaning}.' },
  { taiwan: '去台灣旅遊一定要試試${word}。', nghia: 'Đi du lịch Đài Loan nhất định phải thử ${meaning}.' },
  { taiwan: '辦公室裡有很多${word}。', nghia: 'Trong văn phòng có rất nhiều ${meaning}.' },
  { taiwan: '在超市可以買到${word}。', nghia: 'Có thể mua ${meaning} ở siêu thị.' },
  { taiwan: '醫院裡需要${word}。', nghia: 'Bệnh viện cần ${meaning}.' },
  { taiwan: '這家店的${word}很有名。', nghia: '${meaning} của tiệm này rất nổi tiếng.' },
  { taiwan: '公園裡有很多人在${word}。', nghia: 'Trong công viên có nhiều người đang ${meaning}.' },
  { taiwan: '車站附近有${word}。', nghia: 'Gần ga có ${meaning}.' },
  { taiwan: '用手機可以${word}。', nghia: 'Dùng điện thoại có thể ${meaning}.' },
  { taiwan: '圖書館裡可以${word}。', nghia: 'Trong thư viện có thể ${meaning}.' },
  { taiwan: '運動場上大家在${word}。', nghia: 'Trên sân vận động mọi người đang ${meaning}.' },
  { taiwan: '便利商店有賣${word}。', nghia: 'Cửa hàng tiện lợi có bán ${meaning}.' },
  { taiwan: '電影院裡在播${word}。', nghia: 'Trong rạp chiếu phim đang chiếu ${meaning}.' },
  { taiwan: '這是一個${word}。', nghia: 'Đây là một ${meaning}.' },
  { taiwan: '我有一個${word}。', nghia: 'Tôi có một ${meaning}.' },
  { taiwan: '台灣的${word}很有名。', nghia: '${meaning} của Đài Loan rất nổi tiếng.' },
  { taiwan: '他會${word}。', nghia: 'Anh ấy biết ${meaning}.' },
  { taiwan: '我們一起${word}吧。', nghia: 'Chúng ta cùng ${meaning} nhé.' },
  { taiwan: '這個很${word}。', nghia: 'Cái này rất ${meaning}.' },
  { taiwan: '今天天氣${word}。', nghia: 'Hôm nay thời tiết ${meaning}.' },
];

function formatExample(taiwan: string, pinyinStr: string, nghia: string): string {
  return `台灣繁體中文: ${taiwan}\nPinyin: ${pinyinStr}\nNghĩa: ${nghia}`;
}

function generateExamples(word: string, pinyinStr: string, meaning: string, partOfSpeech: string, index: number): string[] {
  const firstMeaning = meaning.split(/[,，、]/)[0].trim();
  const templates = EXAMPLE_TEMPLATES;
  const indices = [(index * 3) % templates.length, (index * 5 + 1) % templates.length, (index * 7 + 2) % templates.length];
  const used = new Set<number>();
  const examples: string[] = [];
  for (const i of indices) {
    const idx = i % templates.length;
    if (used.has(idx)) continue;
    used.add(idx);
    const t = templates[idx];
    const taiwan = t.taiwan.replace(/\$\{word\}/g, word);
    const nghia = t.nghia.replace(/\$\{meaning\}/g, firstMeaning);
    const fullPinyin = chineseToPinyin(taiwan);
    examples.push(formatExample(taiwan, fullPinyin || pinyinStr, nghia));
  }
  return examples.slice(0, 3);
}

// ============ Synonyms/Antonyms - 漢字 (pinyin) format, từ vocabulary ============
function buildMeaningToVocabMap(vocab: Array<{ word: string; pinyin: string; meaning: string }>): Map<string, Array<{ word: string; pinyin: string }>> {
  const map = new Map<string, Array<{ word: string; pinyin: string }>>();
  for (const v of vocab) {
    const parts = v.meaning.split(/[,，、:：]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    for (const p of parts) {
      const key = p.replace(/\s+/g, ' ').trim();
      if (!key || key.length < 2) continue;
      if (!map.has(key)) map.set(key, []);
      const arr = map.get(key)!;
      if (!arr.some(x => x.word === v.word)) arr.push({ word: v.word, pinyin: v.pinyin });
    }
  }
  return map;
}

function generateSynonyms(word: string, pinyinStr: string, meaning: string, meaningMap: Map<string, Array<{ word: string; pinyin: string }>>): string[] {
  const parts = meaning.split(/[,，、]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const seen = new Set<string>([word]);
  const result: string[] = [];
  for (const p of parts) {
    const key = p.replace(/\s+/g, ' ').trim();
    if (key.length < 2) continue;
    const candidates = meaningMap.get(key) || [];
    for (const c of candidates) {
      if (!seen.has(c.word) && c.word !== word) {
        seen.add(c.word);
        result.push(`${c.word} (${c.pinyin})`);
        if (result.length >= 3) return result;
      }
    }
  }
  return result;
}

// Antonym pairs: Vietnamese -> Chinese (word, pinyin) - từ vocabulary
const ANTONYM_VIETNAMESE: Array<[string, string]> = [
  ['lớn', 'nhỏ'], ['đẹp', 'xấu'], ['tốt', 'xấu'], ['nhanh', 'chậm'], ['nóng', 'lạnh'],
  ['mới', 'cũ'], ['đúng', 'sai'], ['cao', 'thấp'], ['dài', 'ngắn'], ['nhiều', 'ít'],
  ['mở', 'đóng'], ['vào', 'ra'], ['lên', 'xuống'], ['trước', 'sau'], ['đầu', 'cuối'],
];

function generateAntonyms(meaning: string, meaningMap: Map<string, Array<{ word: string; pinyin: string }>>): string[] {
  const m = meaning.toLowerCase();
  for (const [v1, v2] of ANTONYM_VIETNAMESE) {
    if (m.includes(v1)) {
      const candidates = meaningMap.get(v2) || [];
      return candidates.slice(0, 3).map(c => `${c.word} (${c.pinyin})`);
    }
  }
  return [];
}

// ============ 6 Quiz questions - đa dạng kiểu hỏi ============
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generateQuizQuestions(
  word: string,
  pinyinStr: string,
  meaning: string,
  vocab: Array<{ word: string; pinyin: string; meaning: string }>,
  currentIndex: number
): QuizQuestion[] {
  const parts = meaning.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  const firstMeaning = parts[0] || meaning;
  const wrongMeanings = vocab
    .filter((_, i) => Math.abs(i - currentIndex) > 10)
    .map(v => v.meaning.split(/[,，、]/)[0].trim())
    .filter(Boolean)
    .filter(m => m !== firstMeaning);
  const pickWrong = (n: number) => {
    const shuffled = shuffle(wrongMeanings);
    const result: string[] = [];
    const used = new Set<string>([firstMeaning]);
    for (const w of shuffled) {
      if (!used.has(w) && result.length < n) {
        result.push(w);
        used.add(w);
      }
    }
    while (result.length < n) result.push(`Đáp án ${result.length + 1}`);
    return result;
  };

  const wrongPinyins = vocab
    .filter((_, i) => Math.abs(i - currentIndex) > 15)
    .map(v => v.pinyin)
    .filter(p => p && p !== pinyinStr);
  const pickWrongPinyin = (n: number) => {
    const shuffled = shuffle(wrongPinyins);
    const result: string[] = [];
    const used = new Set<string>([pinyinStr]);
    for (const p of shuffled) {
      if (!used.has(p) && result.length < n) {
        result.push(p);
        used.add(p);
      }
    }
    while (result.length < n) result.push(`pinyin${result.length + 1}`);
    return result;
  };

  const wrongWords = vocab
    .filter((_, i) => Math.abs(i - currentIndex) > 20)
    .map(v => v.word)
    .filter(w => w && w !== word);
  const pickWrongWords = (n: number) => {
    const shuffled = shuffle(wrongWords);
    const result: string[] = [];
    const used = new Set<string>([word]);
    for (const w of shuffled) {
      if (!used.has(w) && result.length < n) {
        result.push(w);
        used.add(w);
      }
    }
    while (result.length < n) result.push(`字${result.length + 1}`);
    return result;
  };

  const q1: QuizQuestion = {
    question: `「${word}」的越南語意思是什麼？`,
    options: shuffle([firstMeaning, ...pickWrong(3)]),
    correctAnswer: 0,
    explanation: `「${word}」的拼音是 ${pinyinStr}，意思是 ${meaning}`,
  };
  q1.correctAnswer = q1.options.indexOf(firstMeaning);

  const q2: QuizQuestion = {
    question: `下列哪個是「${word}」的正確意思？`,
    options: shuffle([firstMeaning, ...pickWrong(3)]),
    correctAnswer: 0,
    explanation: `「${word}」= ${meaning}`,
  };
  q2.correctAnswer = q2.options.indexOf(firstMeaning);

  const q3: QuizQuestion = {
    question: `「${word}」的正確拼音是？`,
    options: shuffle([pinyinStr, ...pickWrongPinyin(3)]),
    correctAnswer: 0,
    explanation: `「${word}」的拼音是 ${pinyinStr}`,
  };
  q3.correctAnswer = q3.options.indexOf(pinyinStr);

  const q4: QuizQuestion = {
    question: `「${meaning}」的繁體中文是？`,
    options: shuffle([word, ...pickWrongWords(3)]),
    correctAnswer: 0,
    explanation: `「${meaning}」= ${word} (${pinyinStr})`,
  };
  q4.correctAnswer = q4.options.indexOf(word);

  const q5: QuizQuestion = {
    question: `「${word}」在句子「這是一個___」中應該填什麼？`,
    options: shuffle([word, ...pickWrongWords(3)]),
    correctAnswer: 0,
    explanation: `「這是一個${word}」= Đây là một ${firstMeaning}`,
  };
  q5.correctAnswer = q5.options.indexOf(word);

  const q6: QuizQuestion = {
    question: `哪個選項是「${word}」的正確解釋？`,
    options: shuffle([firstMeaning, ...pickWrong(3)]),
    correctAnswer: 0,
    explanation: `「${word}」(${pinyinStr}) = ${meaning}`,
  };
  q6.correctAnswer = q6.options.indexOf(firstMeaning);

  return [q1, q2, q3, q4, q5, q6].map(q => ({
    question: q.question,
    options: q.options.slice(0, 6),
    correctAnswer: Math.min(Math.max(0, q.correctAnswer), q.options.length - 1),
  }));
}

// ============ Parse table ============
function parseVocabularyTable(content: string): Array<{ word: string; pinyin: string; meaning: string }> {
  const lines = content.split('\n');
  const vocab: Array<{ word: string; pinyin: string; meaning: string }> = [];
  const rowRegex = /^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/;
  for (const line of lines) {
    const match = line.match(rowRegex);
    if (match) {
      const word = match[1].trim();
      const pinyinStr = match[2].trim();
      const meaning = match[3].trim();
      if (word && pinyinStr && meaning) vocab.push({ word, pinyin: pinyinStr, meaning });
    }
  }
  return vocab;
}

// ============ Main ============
async function main() {
  const sourcePath = path.join(__dirname, '../data/tocfl-vocabulary-source.txt');
  const outputPath = path.join(__dirname, '../data/tocfl-vocabulary-import.xlsx');

  let content: string;
  if (fs.existsSync(sourcePath)) {
    content = fs.readFileSync(sourcePath, 'utf-8');
    console.log(`Reading from ${sourcePath}`);
  } else {
    console.log('Source file not found. Fetching from URL...');
    try {
      const res = await fetch('https://www.dailoan.vn/blog/tieng-trung-40/5000-tu-vung-tieng-trung-hoc-va-luyen-thi-tocfl-tu-band-a-%C4%91en-band-c-181');
      content = await res.text();
    } catch (e) {
      console.error('Could not fetch URL. Please save the page content to:', sourcePath);
      process.exit(1);
    }
  }

  const rawVocab = parseVocabularyTable(content);
  console.log(`Parsed ${rawVocab.length} vocabulary items`);

  const meaningMap = buildMeaningToVocabMap(rawVocab);

  const enriched = rawVocab.map((v, i) => {
    const partOfSpeech = inferPartOfSpeech(v.meaning, v.word);
    const topics = inferTopics(v.meaning);
    const level = inferLevel(v.word, v.meaning, i, rawVocab.length);
    const zhuyin = toZhuyin(v.pinyin);
    const examples = generateExamples(v.word, v.pinyin, v.meaning, partOfSpeech, i);
    const synonyms = generateSynonyms(v.word, v.pinyin, v.meaning, meaningMap);
    const antonyms = generateAntonyms(v.meaning, meaningMap);
    const questions = generateQuizQuestions(v.word, v.pinyin, v.meaning, rawVocab, i);

    return {
      word: v.word,
      pinyin: v.pinyin,
      zhuyin: zhuyin || undefined,
      meaning: v.meaning,
      partOfSpeech,
      level,
      topics: topics.join(', '),
      examples: examples.join('||'),
      synonyms: synonyms.join('||'),
      antonyms: antonyms.join('||'),
      questions: JSON.stringify(questions),
    };
  });

  const headers = [
    'word', 'pinyin', 'zhuyin (optional)', 'meaning', 'partOfSpeech', 'level',
    'topics (comma-separated)', 'examples (|| separated)', 'synonyms (|| separated)',
    'antonyms (|| separated)', 'questions JSON (optional)',
  ];
  const rows = enriched.map(v => [
    v.word, v.pinyin, v.zhuyin || '', v.meaning, v.partOfSpeech, v.level,
    v.topics, v.examples, v.synonyms, v.antonyms, v.questions,
  ]);
  const sheetData = [headers, ...rows];
  const wb = (XLSX.utils as any).book_new();
  const ws = (XLSX.utils as any).aoa_to_sheet(sheetData);
  (XLSX.utils as any).book_append_sheet(wb, ws, 'Vocabularies');

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  XLSX.writeFile(wb, outputPath);

  console.log(`Exported to ${outputPath}`);
  console.log(`Total: ${enriched.length} words. Format: 台灣繁體中文 examples, 漢字 (pinyin) synonyms/antonyms, 6 quiz questions.`);
  console.log(`Import via: npm run import:tocfl`);
}

main().catch(console.error);
