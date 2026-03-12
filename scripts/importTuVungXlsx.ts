/**
 * Script tự động đọc data/Từ vựng.xlsx và dùng Claude AI để sinh nội dung từ vựng chất lượng cao.
 * Mỗi từ AI sẽ tạo: pinyin, nghĩa tiếng Việt, phần loại từ, 1 ví dụ đơn giản + 2 ví dụ phức tạp,
 * từ đồng/trái nghĩa và 6 câu hỏi trắc nghiệm, rồi import thẳng vào MongoDB.
 *
 * Cách dùng:
 *   npm run import:tu-vung               # Sinh lại và cập nhật toàn bộ 399 từ bằng Claude
 *   npm run import:tu-vung -- --no-ai          # Dùng bộ sinh local (không cần API, chỉ để test)
 *   npm run import:tu-vung -- --limit=20       # Chỉ xử lý 20 từ đầu
 *   npm run import:tu-vung -- --start=50       # Bắt đầu từ từ thứ 50
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { pinyinToZhuyin } from 'pinyin-zhuyin';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Vocabulary from '../src/models/Vocabulary';
import Topic from '../src/models/Topic';

dotenv.config();

// ============ Cấu hình ============

const EXCEL_PATH = path.join(__dirname, '../data/Từ vựng.xlsx');
const PROGRESS_PATH = path.join(__dirname, '../data/tu-vung-ai-progress.json');
const OUTPUT_XLSX = path.join(__dirname, '../data/tu-vung-import-result.xlsx');

/** Ánh xạ cấp độ TOCFL A1/A2/B1/B2/C1/C2 → số 1–6 */
const LEVEL_MAP: Record<string, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
};

// ============ Kết nối DB ============

let mongooseConnected = false;

async function ensureDbConnected(): Promise<void> {
  if (!mongooseConnected && process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    mongooseConnected = true;
  }
}

async function importEnrichedToDb(enriched: EnrichedWord[]): Promise<{ created: number; updated: number }> {
  if (enriched.length === 0) return { created: 0, updated: 0 };
  if (!process.env.MONGODB_URI) {
    console.warn('  [Import] Bỏ qua - chưa có MONGODB_URI trong .env');
    return { created: 0, updated: 0 };
  }
  await ensureDbConnected();

  let created = 0;
  let updated = 0;
  const createdTopics: string[] = [];

  for (const v of enriched) {
    // Tạo Topic nếu chưa có
    const topicList = v.topics;
    for (const topicName of topicList) {
      if (topicName && !createdTopics.includes(topicName)) {
        const existing = await Topic.findOne({ name: topicName });
        if (!existing) {
          await Topic.create({
            name: topicName,
            description: `Chủ đề: ${topicName}`,
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          });
          createdTopics.push(topicName);
        }
      }
    }

    const existing = await Vocabulary.findOne({ word: v.word });
    if (existing) {
      existing.pinyin = v.pinyin;
      existing.zhuyin = v.zhuyin || undefined;
      existing.meaning = v.meaning;
      existing.partOfSpeech = v.partOfSpeech;
      existing.level = v.level;
      existing.topics = topicList;
      existing.examples = v.examples;
      existing.synonyms = v.synonyms;
      existing.antonyms = v.antonyms;
      if (v.questions.length > 0) existing.questions = v.questions;
      await existing.save();
      updated++;
    } else {
      await Vocabulary.create({
        word: v.word,
        pinyin: v.pinyin,
        zhuyin: v.zhuyin || undefined,
        meaning: v.meaning,
        partOfSpeech: v.partOfSpeech,
        level: v.level,
        topics: topicList,
        examples: v.examples,
        synonyms: v.synonyms,
        antonyms: v.antonyms,
        questions: v.questions,
      });
      created++;
    }
  }

  return { created, updated };
}

// ============ Đọc Excel ============

interface RawWord {
  level: string;     // A1, A2, B1, B2, C1, C2
  word: string;      // Từ vựng chữ Hán chính (lấy phần đầu khi có /)
  allForms: string[]; // Tất cả các dạng (split theo /)
  topic: string;     // Chủ đề từ Excel
}

function readExcel(filePath: string): RawWord[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

  const words: RawWord[] = [];
  // Row 0 = trống, Row 1 = header (Level / Từ vựng / chủ đề), Row 2+ = data
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || !row[1]) continue;
    const levelRaw = String(row[0]).trim().toUpperCase();
    const wordRaw = String(row[1]).trim();
    const topicRaw = String(row[2] || '').trim();

    if (!wordRaw || wordRaw === '-') continue;

    // Tách các dạng biến thể (e.g. "爸爸/爸" → ["爸爸", "爸"])
    const allForms = wordRaw.split('/').map(s => s.trim()).filter(Boolean);
    const primaryWord = allForms[0];

    words.push({
      level: levelRaw,
      word: primaryWord,
      allForms,
      topic: topicRaw === '-' ? 'Từ vựng cốt lõi' : (topicRaw || 'Từ vựng cốt lõi'),
    });
  }
  return words;
}

// ============ AI Client ============

function getClaude(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) throw new Error('Cần ANTHROPIC_API_KEY trong .env');
  return new Anthropic({ apiKey: key });
}

// ============ Prompt ============

const EXAMPLE_CONTEXTS_SIMPLE = [
  'hội thoại ngắn gọn hàng ngày',
  'câu giới thiệu bản thân',
  'hỏi thăm đơn giản',
  'câu hỏi cơ bản',
  'trả lời ngắn',
];

const EXAMPLE_CONTEXTS_COMPLEX = [
  'nhà hàng, gọi món, phục vụ',
  'văn phòng, cuộc họp, đồng nghiệp',
  'trường học, lớp học, thảo luận',
  'du lịch, đặt phòng khách sạn',
  'bệnh viện, khám bệnh, bác sĩ',
  'siêu thị, mặc cả, thanh toán',
  'điện thoại, tin nhắn, trao đổi thông tin',
  'gia đình, đám cưới, tiệc',
  'thư viện, đọc sách, nghiên cứu',
  'sân bay, check-in, hành lý',
  'quán cà phê, bạn bè, tán gẫu',
  'công ty, báo cáo, sếp nhân viên',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Xây prompt yêu cầu AI sinh nội dung đầy đủ cho từ (bao gồm cả pinyin và nghĩa).
 * Ví dụ: 1 câu đơn giản + 2 câu phức tạp.
 */
function buildPrompt(word: string, topic: string, level: string): string {
  const ctxSimple = pickRandom(EXAMPLE_CONTEXTS_SIMPLE);
  const ctxComplex1 = pickRandom(EXAMPLE_CONTEXTS_COMPLEX);
  let ctxComplex2 = pickRandom(EXAMPLE_CONTEXTS_COMPLEX);
  while (ctxComplex2 === ctxComplex1) ctxComplex2 = pickRandom(EXAMPLE_CONTEXTS_COMPLEX);

  return `Bạn là chuyên gia tiếng Trung phồn thể Đài Loan. Sinh nội dung học tập CHÍNH XÁC cho từ "${word}" (chủ đề: ${topic}, cấp độ: ${level}).

=== QUY TẮC BẮT BUỘC ===

1. PHÂN LOẠI TỪ TRƯỚC:
   - Trợ từ/ngữ khí từ (啊,吧,的,得,把,被,嗎...): Dùng đúng vị trí ngữ pháp đặc thù.
   - Động từ: cấu trúc chủ ngữ + V + tân ngữ phù hợp.
   - Tính từ: chỉ bổ nghĩa cho danh từ thích hợp.
   - Danh từ: làm chủ/vị/tân ngữ đúng ngữ pháp.

2. VÍ DỤ - PHẢI CÓ ĐÚNG 3 CÂU:
   - Câu 1 (ĐƠN GIẢN): ngắn gọn, dễ hiểu, phù hợp người mới học, ngữ cảnh: ${ctxSimple}.
     Ví dụ mẫu câu đơn giản: 5-10 chữ, cấu trúc chủ-vị-tân cơ bản.
   - Câu 2 (PHỨC TẠP): dài hơn, có mệnh đề phụ hoặc cấu trúc nâng cao, ngữ cảnh: ${ctxComplex1}.
     Ví dụ mẫu câu phức tạp: 12-20 chữ, có trạng ngữ/mệnh đề điều kiện/liên từ.
   - Câu 3 (PHỨC TẠP): khác ngữ cảnh câu 2, ngữ cảnh: ${ctxComplex2}.
     Ví dụ mẫu câu phức tạp: 12-20 chữ.

3. MỖI CÂU PHẢI:
   - Chứa đúng từ "${word}".
   - Tự nhiên như người Đài Loan nói thật (dùng phồn thể).
   - Pinyin có đầy đủ dấu thanh điệu.
   - Nghĩa tiếng Việt rõ ràng, đúng văn cảnh.

4. CÂU HỎI - 6 câu ĐA DẠNG (QUAN TRỌNG):
   - Q1: hỏi nghĩa tiếng Việt của "${word}" (4-6 đáp án).
   - Q2: hỏi phiên âm pinyin của "${word}" (4-6 đáp án, đáp án sai phải đổi thanh điệu).
   - Q3: dịch câu đơn giản (ví dụ 1) sang tiếng Việt (4-6 đáp án).
   - Q4: dịch câu phức tạp (ví dụ 2) sang tiếng Việt (4-6 đáp án).
   - Q5: dịch câu phức tạp (ví dụ 3) sang tiếng Việt (4-6 đáp án).
   - Q6: chọn chữ Hán đúng cho nghĩa "${word}" (4-6 đáp án, đáp án sai phải gần giống).
   - Đáp án đúng ở VỊ TRÍ NGẪU NHIÊN (không luôn là index 0).
   - Đáp án sai phải hợp lý (từ cùng cấp độ, gần nghĩa nhưng sai).

Trả về ĐÚNG JSON (không markdown, không giải thích thêm):
{
  "pinyin": "phiên âm có đầy đủ thanh điệu (ví dụ: ài, bā, bàba)",
  "meaning": "nghĩa tiếng Việt ngắn gọn, chính xác",
  "partOfSpeech": "danh từ" | "động từ" | "tính từ" | "trạng từ" | "trợ từ" | "đại từ" | "giới từ" | "liên từ" | "thán từ",
  "examples": [
    {
      "type": "simple",
      "taiwan": "câu phồn thể đơn giản chứa ${word}",
      "pinyin": "pinyin đầy đủ dấu",
      "nghia": "nghĩa tiếng Việt"
    },
    {
      "type": "complex",
      "taiwan": "câu phồn thể phức tạp hơn chứa ${word}",
      "pinyin": "pinyin đầy đủ dấu",
      "nghia": "nghĩa tiếng Việt"
    },
    {
      "type": "complex",
      "taiwan": "câu phồn thể phức tạp khác chứa ${word}",
      "pinyin": "pinyin đầy đủ dấu",
      "nghia": "nghĩa tiếng Việt"
    }
  ],
  "synonyms": "漢字1 (pinyin1), 漢字2 (pinyin2) — để trống nếu không có",
  "antonyms": "漢字 (pinyin) — để trống nếu không có",
  "questions": [
    {
      "question": "nội dung câu hỏi",
      "options": ["đáp án 1", "đáp án 2", "đáp án 3", "đáp án 4"],
      "correctAnswer": 2
    }
  ]
}`;
}

// ============ Gọi AI ============

interface AIResult {
  pinyin?: string;
  meaning?: string;
  partOfSpeech?: string;
  examples?: Array<{ type?: string; taiwan: string; pinyin: string; nghia: string }>;
  synonyms?: string;
  antonyms?: string;
  questions?: Array<{ question: string; options: string[]; correctAnswer: number }>;
}

async function callClaude(client: Anthropic, word: string, topic: string, level: string): Promise<AIResult | null> {
  const prompt = buildPrompt(word, topic, level);
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7 + Math.random() * 0.3,
      });
      const text = (msg.content as Array<{ type: string; text?: string }>)
        .filter(c => c.type === 'text' && c.text)
        .map(c => c.text!)
        .join('');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) break;
      const parsed = JSON.parse(jsonMatch[0]) as AIResult;
      if (!parsed.pinyin || !parsed.meaning) break;
      if (!parsed.examples || parsed.examples.length < 3) break;
      if (!parsed.questions || parsed.questions.length < 4) break;
      return parsed;
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode;
      const msg = String(e?.message ?? e ?? '');
      const is429 = status === 429 || msg.includes('429') || msg.includes('overloaded');

      if (is429 && attempt === 0) {
        console.warn(`  [${word}] Claude rate limit, đợi 20s...`);
        await sleep(20000);
      } else {
        console.warn(`  [${word}] Claude lỗi:`, msg.slice(0, 100));
        break;
      }
    }
  }
  return null;
}

// ============ Local fallback ============

const POS_MAP: Record<string, string> = {
  'danh từ': 'noun', 'động từ': 'verb', 'tính từ': 'adjective',
  'trạng từ': 'adverb', 'trợ từ': 'particle', 'đại từ': 'pronoun',
  'giới từ': 'preposition', 'liên từ': 'conjunction', 'thán từ': 'interjection',
  noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb',
};

function inferPartOfSpeech(meaning: string): string {
  const m = meaning.toLowerCase();
  if (m.match(/\b(yêu|thích|ăn|đi|làm|học|đọc|mua|bán|mở|đóng|nói|hỏi|trả lời)\b/)) return 'verb';
  if (m.match(/\b(lớn|nhỏ|đẹp|tốt|nhanh|chậm|cao|thấp|khỏe|mệt)\b/)) return 'adjective';
  return 'noun';
}

function toZhuyin(pinyin: string): string {
  try {
    return pinyinToZhuyin(pinyin.trim().replace(/\s+/g, ' ')) || '';
  } catch {
    return '';
  }
}

/** Tạo pinyin sai bằng cách đổi thanh điệu */
function pinyinWrongVariants(py: string, count: number): string[] {
  const rows = [
    ['a', 'ā', 'á', 'ǎ', 'à'], ['e', 'ē', 'é', 'ě', 'è'],
    ['i', 'ī', 'í', 'ǐ', 'ì'], ['o', 'ō', 'ó', 'ǒ', 'ò'],
    ['u', 'ū', 'ú', 'ǔ', 'ù'], ['v', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ];
  const out: string[] = [];
  const seen = new Set<string>([py]);
  for (let shift = 1; shift <= 20 && out.length < count; shift++) {
    let s = py;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      for (const row of rows) {
        const idx = row.indexOf(c);
        if (idx >= 0) {
          s = s.slice(0, i) + row[(idx + shift) % 5] + s.slice(i + 1);
          break;
        }
      }
    }
    if (s !== py && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  const fill = ['mā', 'má', 'mǎ', 'mà', 'ma'];
  while (out.length < count) out.push(fill[out.length % fill.length]);
  return out.slice(0, count);
}

function charWrongVariants(word: string, count: number): string[] {
  const confusions: Record<string, string[]> = {
    '愛': ['礙', '曖', '挨'], '八': ['巴', '把', '吧'], '白': ['百', '柏', '擺'],
    '包': ['抱', '飽', '報'], '本': ['笨', '奔', '賁'], '比': ['筆', '必', '畢'],
    '不': ['布', '步', '補'], '大': ['打', '達', '答'], '的': ['得', '地', '底'],
    '電': ['店', '典', '點'], '東': ['冬', '懂', '董'], '多': ['都', '朵', '度'],
    '發': ['法', '罰', '乏'], '分': ['粉', '份', '憤'], '高': ['告', '搞', '稿'],
    '工': ['公', '功', '弓'], '國': ['果', '過', '裹'], '好': ['號', '毫', '豪'],
    '和': ['合', '河', '荷'], '很': ['恨', '狠', '痕'], '會': ['回', '惠', '匯'],
    '家': ['加', '假', '架'], '見': ['件', '建', '鍵'], '開': ['凱', '概', '蓋'],
    '看': ['刊', '砍', '侃'], '來': ['賴', '萊', '籟'], '老': ['勞', '牢', '撈'],
    '買': ['賣', '麥', '邁'], '沒': ['每', '美', '妹'], '你': ['泥', '尼', '膩'],
    '年': ['念', '黏', '捻'], '女': ['努', '怒', '奴'], '跑': ['泡', '炮', '袍'],
    '起': ['氣', '器', '棄'], '去': ['趣', '娶', '渠'], '人': ['認', '任', '刃'],
    '日': ['入', '易', '益'], '三': ['散', '傘', '酸'], '上': ['尚', '賞', '傷'],
    '少': ['燒', '紹', '哨'], '生': ['聲', '升', '勝'], '時': ['十', '食', '識'],
    '是': ['事', '市', '試'], '說': ['數', '碩', '朔'], '他': ['她', '它', '踏'],
    '天': ['田', '甜', '添'], '聽': ['停', '庭', '廷'], '我': ['握', '臥', '渦'],
    '下': ['夏', '嚇', '暇'], '想': ['向', '像', '象'], '小': ['笑', '校', '效'],
    '新': ['心', '辛', '薪'], '學': ['雪', '血', '削'], '一': ['以', '已', '意'],
    '有': ['又', '友', '右'], '在': ['再', '載', '栽'], '這': ['著', '者', '遮'],
    '中': ['重', '種', '鐘'], '子': ['字', '自', '紫'], '做': ['作', '座', '坐'],
    '走': ['奏', '湊', '輳'], '最': ['醉', '罪', '嘴'], '左': ['佐', '坐', '做'],
  };
  const out: string[] = [];
  const seen = new Set<string>([word]);
  for (let i = 0; i < word.length && out.length < count; i++) {
    for (const alt of (confusions[word[i]] || [])) {
      const w = word.slice(0, i) + alt + word.slice(i + 1);
      if (!seen.has(w)) { seen.add(w); out.push(w); if (out.length >= count) break; }
    }
  }
  while (out.length < count) out.push(word + out.length);
  return out.slice(0, count);
}

function shuffleAndTrack<T>(arr: T[], correct: T): { arr: T[]; correctAnswer: number } {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return { arr: copy, correctAnswer: copy.indexOf(correct) };
}

function generateLocalFallback(word: string, topic: string, levelStr: string): AIResult {
  const meaning = `[${word}] - ${topic}`;
  const pos = inferPartOfSpeech(meaning);
  const pinyin = word.split('').map(() => 'X').join(''); // placeholder

  const exSimple = {
    type: 'simple',
    taiwan: `他說「${word}」。`,
    pinyin: `Tā shuō "${pinyin}".`,
    nghia: `Anh ấy nói "${word}".`,
  };
  const exComplex1 = {
    type: 'complex',
    taiwan: `在${topic}的課堂上，老師教我們「${word}」這個詞。`,
    pinyin: `Zài ${topic} de kètáng shàng, lǎoshī jiāo wǒmen "${pinyin}" zhège cí.`,
    nghia: `Trong lớp học về ${topic}, giáo viên dạy chúng tôi từ "${word}".`,
  };
  const exComplex2 = {
    type: 'complex',
    taiwan: `學習「${word}」對我們理解中文非常有幫助。`,
    pinyin: `Xuéxí "${pinyin}" duì wǒmen lǐjiě Zhōngwén fēicháng yǒu bāngzhù.`,
    nghia: `Học từ "${word}" rất có ích cho việc hiểu tiếng Trung của chúng ta.`,
  };

  const wrongMeanings = ['không biết', 'từ khác', 'nghĩa khác', 'không liên quan', 'đáp án sai'];
  const q1 = shuffleAndTrack([meaning, ...wrongMeanings.slice(0, 3)], meaning);
  const pyVariants = pinyinWrongVariants(pinyin, 3);
  const q2 = shuffleAndTrack([pinyin, ...pyVariants], pinyin);
  const charVariants = charWrongVariants(word, 3);
  const q6 = shuffleAndTrack([word, ...charVariants], word);

  return {
    pinyin,
    meaning,
    partOfSpeech: pos === 'noun' ? 'danh từ' : pos === 'verb' ? 'động từ' : 'tính từ',
    examples: [exSimple, exComplex1, exComplex2],
    synonyms: '',
    antonyms: '',
    questions: [
      { question: `"${word}" có nghĩa là gì?`, options: q1.arr, correctAnswer: q1.correctAnswer },
      { question: `Phiên âm đúng của "${word}" là gì?`, options: q2.arr, correctAnswer: q2.correctAnswer },
      { question: `"${exSimple.taiwan}" nghĩa là gì?`, options: shuffleAndTrack([exSimple.nghia, ...wrongMeanings.slice(0, 3)], exSimple.nghia).arr, correctAnswer: shuffleAndTrack([exSimple.nghia, ...wrongMeanings.slice(0, 3)], exSimple.nghia).correctAnswer },
      { question: `"${exComplex1.taiwan}" nghĩa là gì?`, options: shuffleAndTrack([exComplex1.nghia, ...wrongMeanings.slice(0, 3)], exComplex1.nghia).arr, correctAnswer: shuffleAndTrack([exComplex1.nghia, ...wrongMeanings.slice(0, 3)], exComplex1.nghia).correctAnswer },
      { question: `"${exComplex2.taiwan}" nghĩa là gì?`, options: shuffleAndTrack([exComplex2.nghia, ...wrongMeanings.slice(0, 3)], exComplex2.nghia).arr, correctAnswer: shuffleAndTrack([exComplex2.nghia, ...wrongMeanings.slice(0, 3)], exComplex2.nghia).correctAnswer },
      { question: `Chữ Hán nào có nghĩa là "${meaning}"?`, options: q6.arr, correctAnswer: q6.correctAnswer },
    ],
  };
}

// ============ Format ví dụ để lưu vào DB ============

/**
 * Format 1 ví dụ thành chuỗi lưu DB.
 * Prefix: [Đơn giản] hoặc [Phức tạp] để phân biệt loại câu.
 */
function formatExample(ex: { type?: string; taiwan: string; pinyin: string; nghia: string }): string {
  // const label = ex.type === 'simple' ? '[Đơn giản]' : '[Phức tạp]';
  return `${ex.taiwan}\nPinyin: ${ex.pinyin}\nNghĩa: ${ex.nghia}`;
}

// ============ Kiểu dữ liệu kết quả ============

interface EnrichedWord {
  word: string;
  pinyin: string;
  zhuyin?: string;
  meaning: string;
  partOfSpeech: string;
  level: number;
  topics: string[];
  examples: string[];   // mảng string đã format, lưu vào DB
  synonyms: string[];
  antonyms: string[];
  questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }>;
  // Thêm biến thể chữ (dùng để xuất Excel)
  allForms?: string;
}

// ============ Tiện ích ============

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function processAIResult(
  raw: RawWord,
  aiResult: AIResult,
): EnrichedWord {
  const levelNum = LEVEL_MAP[raw.level] ?? 1;
  const partOfSpeech = POS_MAP[aiResult.partOfSpeech?.toLowerCase() ?? ''] || inferPartOfSpeech(aiResult.meaning ?? '');

  const examplesRaw = (aiResult.examples ?? []).slice(0, 3);
  // Đảm bảo đúng thứ tự: 1 simple trước, 2 complex sau
  const simpleExs = examplesRaw.filter(e => e.type === 'simple');
  const complexExs = examplesRaw.filter(e => e.type === 'complex');
  // Nếu AI không set type, xử lý theo thứ tự
  const orderedExs = simpleExs.length > 0 && complexExs.length >= 2
    ? [simpleExs[0], complexExs[0], complexExs[1]]
    : examplesRaw.slice(0, 3);
  const examples = orderedExs.map(formatExample);

  const synonyms = (aiResult.synonyms ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const antonyms = (aiResult.antonyms ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const questions = (aiResult.questions ?? []).slice(0, 6).map(q => {
    const opts = Array.isArray(q.options) ? [...q.options].slice(0, 6) : [];
    while (opts.length < 4) opts.push(`Đáp án ${opts.length + 1}`);
    const correctIdx = Math.min(q.correctAnswer ?? 0, opts.length - 1);
    const correctItem = opts[correctIdx];
    const shuffled = shuffleAndTrack(opts, correctItem);
    return {
      question: q.question,
      options: shuffled.arr,
      correctAnswer: shuffled.correctAnswer,
      explanation: undefined,
    };
  });

  return {
    word: raw.word,
    pinyin: aiResult.pinyin ?? '',
    zhuyin: toZhuyin(aiResult.pinyin ?? '') || undefined,
    meaning: aiResult.meaning ?? '',
    partOfSpeech,
    level: levelNum,
    topics: [raw.topic],
    examples,
    synonyms,
    antonyms,
    questions,
    allForms: raw.allForms.join(' / '),
  };
}

// ============ Xuất Excel kết quả ============

function writeResultExcel(enriched: EnrichedWord[], outputPath: string): void {
  const headers = [
    'word', 'allForms', 'pinyin', 'zhuyin', 'meaning', 'partOfSpeech',
    'level', 'topics', 'examples (|| separated)', 'synonyms (|| separated)',
    'antonyms (|| separated)', 'questions JSON',
  ];
  const rows = enriched.map(v => [
    v.word,
    v.allForms ?? v.word,
    v.pinyin,
    v.zhuyin ?? '',
    v.meaning,
    v.partOfSpeech,
    v.level,
    v.topics.join(', '),
    v.examples.join('||'),
    v.synonyms.join('||'),
    v.antonyms.join('||'),
    JSON.stringify(v.questions),
  ]);
  const wb = (XLSX.utils as any).book_new();
  const ws = (XLSX.utils as any).aoa_to_sheet([headers, ...rows]);
  (XLSX.utils as any).book_append_sheet(wb, ws, 'Vocabularies');
  XLSX.writeFile(wb, outputPath);
}

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const startArg = args.find(a => a.startsWith('--start='));
  const noAi = args.includes('--no-ai');
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const start = startArg ? parseInt(startArg.split('=')[1], 10) : 0;

  const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  let claude: Anthropic | null = null;
  let useLocalOnly = noAi;

  if (!noAi) {
    if (claudeKey) {
      claude = getClaude();
      console.log(`✓ Dùng Claude (${process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'}) để sinh nội dung.`);
    } else {
      useLocalOnly = true;
      console.warn('⚠ Chưa có ANTHROPIC_API_KEY trong .env. Chạy với bộ sinh local (chất lượng thấp).');
      console.warn('  Thêm ANTHROPIC_API_KEY=sk-ant-... vào file .env để dùng Claude.');
    }
  } else {
    console.log('✓ Chạy với bộ sinh local (--no-ai).');
  }

  // Đọc Excel
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`✗ Không tìm thấy file: ${EXCEL_PATH}`);
    process.exit(1);
  }
  const allWords = readExcel(EXCEL_PATH);
  console.log(`\nĐọc được ${allWords.length} từ từ file Excel.`);

  // Lọc theo start/limit
  const endIdx = limit ? Math.min(start + limit, allWords.length) : allWords.length;
  const toProcess = allWords.slice(start, endIdx);

  console.log(`Sẽ sinh lại và cập nhật toàn bộ ${toProcess.length} từ (${start + 1}–${endIdx} / ${allWords.length}).`);

  // Khôi phục progress nếu có (tiếp tục từ điểm bị gián đoạn)
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
      if (saved?.enriched?.length > 0) {
        const { created, updated } = await importEnrichedToDb(saved.enriched);
        console.log(`[Resume] Đã import ${saved.enriched.length} từ từ progress file (+${created} mới, ~${updated} cập nhật).`);
      }
    } catch (e: any) {
      console.warn('[Resume] Không đọc được progress file:', e?.message);
    }
  }

  const modelLabel = useLocalOnly
    ? 'local fallback'
    : (process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514');

  console.log(`\nBắt đầu xử lý ${toProcess.length} từ (${start + 1}–${endIdx} / ${allWords.length}) với [${modelLabel}]`);
  console.log('─'.repeat(60));

  const enriched: EnrichedWord[] = [];
  let lastImportedCount = 0;
  let okCount = 0;
  let fallbackCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const raw = toProcess[i];
    const displayWord = raw.allForms.length > 1 ? raw.allForms.join('/') : raw.word;
    process.stdout.write(`  [${i + 1}/${toProcess.length}] ${displayWord} (${raw.level}, ${raw.topic})... `);

    let aiResult: AIResult | null = null;

    if (!useLocalOnly && claude) {
      aiResult = await callClaude(claude, raw.word, raw.topic, raw.level);
    }

    let enrichedWord: EnrichedWord;
    if (aiResult) {
      enrichedWord = processAIResult(raw, aiResult);
      process.stdout.write(`✓ ${aiResult.meaning}\n`);
      okCount++;
    } else {
      // Fallback local
      const fallback = generateLocalFallback(raw.word, raw.topic, raw.level);
      enrichedWord = processAIResult(raw, fallback);
      process.stdout.write(`⚠ fallback local\n`);
      fallbackCount++;
    }

    enriched.push(enrichedWord);

    // Lưu progress và import vào DB mỗi 5 từ
    if ((i + 1) % 5 === 0 || i === toProcess.length - 1) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ start, end: start + i + 1, enriched }, null, 2));
      try {
        const toImport = enriched.slice(lastImportedCount);
        const { created, updated } = await importEnrichedToDb(toImport);
        lastImportedCount = enriched.length;
        console.log(`  → [DB] +${created} mới, ~${updated} cập nhật`);
      } catch (e: any) {
        console.warn(`  → [DB] Lỗi import:`, e?.message);
      }
    }

    // Delay giữa các request API
    if (!useLocalOnly) {
      await sleep(500);
    }
  }

  // Xuất Excel kết quả
  writeResultExcel(enriched, OUTPUT_XLSX);

  // Import cuối nếu còn sót
  if (lastImportedCount < enriched.length) {
    try {
      const toImport = enriched.slice(lastImportedCount);
      const { created, updated } = await importEnrichedToDb(toImport);
      console.log(`[Import cuối] +${created} mới, ~${updated} cập nhật`);
    } catch (e: any) {
      console.warn('[Import cuối] Lỗi:', e?.message);
    }
  }

  if (mongooseConnected) await mongoose.disconnect();

  // Xóa progress file khi hoàn tất
  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH);

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Hoàn tất! Đã xử lý ${enriched.length} từ`);
  console.log(`   AI thành công : ${okCount}`);
  console.log(`   Fallback local: ${fallbackCount}`);
  console.log(`   Xuất Excel    : ${OUTPUT_XLSX}`);
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('\n✗ Lỗi nghiêm trọng:', err);
  process.exit(1);
});
