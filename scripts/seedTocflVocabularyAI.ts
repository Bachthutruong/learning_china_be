/**
 * TOCFL vocabulary generator: dùng AI (Claude hoặc Gemini) để sinh nội dung chính xác.
 *
 * Chạy: npm run seed:tocfl-ai [-- --limit=10] [-- --start=0]
 *       npm run seed:tocfl-ai -- --use-claude   # Dùng Claude API (cần ANTHROPIC_API_KEY)
 *       npm run seed:tocfl-ai -- --no-ai       # Fallback local (không cần API)
 * Từ đã có trong DB sẽ bỏ qua (trừ khi --force).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { pinyinToZhuyin } from 'pinyin-zhuyin';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Vocabulary from '../src/models/Vocabulary';
import Topic from '../src/models/Topic';

dotenv.config();

let mongooseConnected = false;

async function importEnrichedToDb(enriched: any[]): Promise<{ created: number; updated: number }> {
  if (enriched.length === 0) return { created: 0, updated: 0 };
  if (!process.env.MONGODB_URI) {
    console.warn('  [Import] Bỏ qua - chưa có MONGODB_URI trong .env');
    return { created: 0, updated: 0 };
  }
  if (!mongooseConnected) {
    await mongoose.connect(process.env.MONGODB_URI);
    mongooseConnected = true;
  }
  let created = 0;
  let updated = 0;
  const createdTopics: string[] = [];
  for (const v of enriched) {
    const topics = String(v.topics || 'TOCFL').split(',').map((t: string) => t.trim()).filter(Boolean);
    if (topics.length === 0) topics.push('TOCFL');
    for (const topicName of topics) {
      if (topicName && !createdTopics.includes(topicName)) {
        const existing = await Topic.findOne({ name: topicName });
        if (!existing) {
          await Topic.create({
            name: topicName,
            description: `Chủ đề TOCFL: ${topicName}`,
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          });
          createdTopics.push(topicName);
        }
      }
    }
    const examples = String(v.examples || '').split('||').map((t: string) => t.trim()).filter(Boolean);
    const synonyms = String(v.synonyms || '').split('||').map((t: string) => t.trim()).filter(Boolean);
    const antonyms = String(v.antonyms || '').split('||').map((t: string) => t.trim()).filter(Boolean);
    let questions: any[] = [];
    try {
      const parsed = JSON.parse(v.questions || '[]');
      if (Array.isArray(parsed)) questions = parsed;
    } catch (_) {}
    const existing = await Vocabulary.findOne({ word: v.word });
    if (existing) {
      existing.pinyin = v.pinyin;
      existing.zhuyin = v.zhuyin || undefined;
      existing.meaning = v.meaning;
      existing.partOfSpeech = v.partOfSpeech;
      existing.level = v.level;
      existing.topics = topics;
      existing.examples = examples;
      existing.synonyms = synonyms;
      existing.antonyms = antonyms;
      if (questions.length > 0) existing.questions = questions;
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
        topics,
        examples,
        synonyms,
        antonyms,
        questions,
      });
      created++;
    }
  }
  return { created, updated };
}

function getGemini(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('Cần GEMINI_API_KEY trong .env');
  return new GoogleGenAI({ apiKey: key });
}

// ============ Part of speech mapping ============
const POS_MAP: Record<string, string> = {
  'danh từ': 'noun', 'động từ': 'verb', 'tính từ': 'adjective', 'trạng từ': 'adverb', 'trợ từ': 'particle',
  'đại từ': 'pronoun', 'giới từ': 'preposition', 'liên từ': 'conjunction', 'thán từ': 'interjection',
  'noun': 'noun', 'verb': 'verb', 'adjective': 'adjective', 'adverb': 'adverb',
};

function inferPartOfSpeech(meaning: string): string {
  const m = meaning.toLowerCase();
  if (m.match(/\b(yêu|thích|ăn|đi|làm|học|đọc|mua|bán|mở|đóng)\b/)) return 'verb';
  if (m.match(/\b(lớn|nhỏ|đẹp|tốt|nhanh|chậm|cao|thấp)\b/)) return 'adjective';
  if (m.match(/\b(cái|con|người|nhà|trường|bàn|ghế|sách)\b/)) return 'noun';
  return 'noun';
}

function inferLevel(word: string, meaning: string, index: number, total: number): number {
  const m = meaning.toLowerCase();

  // 1) Base theo vị trí trong list TOCFL (độ khó tăng dần theo index)
  const ratio = index / Math.max(1, total - 1);
  let level: number;
  if (ratio < 0.15) level = 1;
  else if (ratio < 0.3) level = 2;
  else if (ratio < 0.5) level = 3;
  else if (ratio < 0.7) level = 4;
  else if (ratio < 0.85) level = 5;
  else level = 6;

  // 2) Hạ cấp cho các chủ đề siêu cơ bản
  const veryBasicPatterns = [
    /\b(bố|ba|mẹ|má|anh|chị|em|ông|bà|gia đình)\b/,
    /\b(ăn|uống|cơm|bánh|mì|trà|nước|sữa|trái cây|hoa quả|rau)\b/,
    /\b(nhà|phòng|bàn|ghế|giường|cửa sổ|cửa ra vào)\b/,
    /\b(trường|lớp|học sinh|giáo viên|bài tập|thi|kiểm tra)\b/,
    /\b(màu|đỏ|xanh|vàng|trắng|đen|cam|tím|hồng)\b/,
    /\b(ngày|giờ|phút|giây|tháng|năm|hôm nay|hôm qua|ngày mai)\b/,
    /\b(đi học|đi làm|đi chơi|ngủ|thức dậy)\b/,
  ];
  if (veryBasicPatterns.some(r => r.test(m))) {
    level = Math.min(level, 2);
  }

  // 3) Số đếm, số thứ tự → ưu tiên level 1–2
  if (m.match(/\bsố\s*\d+\b/) || m.match(/\b(thứ|ngày)\s+\d+\b/)) {
    level = Math.min(level, 2);
  }

  // 4) Từ chuyên ngành, trừu tượng → đẩy lên level cao hơn
  const advancedPatterns = [
    /\b(kinh tế|chính trị|xã hội|xã hội học|nhân loại học|khảo cổ học)\b/,
    /\b(khoa học công nghệ|công nghệ thông tin|tài chính|ngân hàng|kinh doanh)\b/,
    /\b(giáo dục|triết học|tâm lý học|triết|luận|hệ thống|chính sách)\b/,
    /\b(môi trường|kinh tế vĩ mô|kinh tế vi mô)\b/,
  ];
  if (advancedPatterns.some(r => r.test(m))) {
    level = Math.max(level, 4);
  }

  // 5) Độ dài từ: một chữ Hán đơn + nghĩa đơn giản → không nên quá cao
  if (word.length === 1 && level > 3) {
    level -= 1;
  }

  // 6) Ép trong khoảng 1..6
  if (level < 1) level = 1;
  if (level > 6) level = 6;
  return level;
}

function inferTopics(meaning: string): string[] {
  const m = meaning.toLowerCase();
  const topics: string[] = [];
  if (m.match(/\b(bố|mẹ|anh|chị|em|ông|bà)\b/)) topics.push('Gia đình');
  if (m.match(/\b(ăn|cơm|bánh|rau|trà|nước)\b/)) topics.push('Thức ăn');
  if (m.match(/\b(màu|đỏ|xanh|vàng|trắng)\b/)) topics.push('Màu sắc');
  if (m.match(/\b(ngày|giờ|phút|năm|tháng)\b/)) topics.push('Thời gian');
  if (m.match(/\b(nhà|trường|ga|phố|công ty)\b/)) topics.push('Địa điểm');
  if (topics.length === 0) topics.push('TOCFL');
  return topics;
}

function toZhuyin(pinyin: string): string {
  try {
    return pinyinToZhuyin(pinyin.trim().replace(/\s+/g, ' ')) || '';
  } catch {
    return '';
  }
}

// ============ Prompt build - chính xác, linh hoạt theo từng từ ============
function buildAIPrompt(word: string, pinyin: string, meaning: string): string {
  const ctx1 = pickRandom(EXAMPLE_CONTEXTS);
  const ctx2 = pickRandom(EXAMPLE_CONTEXTS);
  const ctx3 = pickRandom(EXAMPLE_CONTEXTS);
  return `Bạn là chuyên gia tiếng Trung phồn thể Đài Loan. Tạo nội dung CHÍNH XÁC cho từ "${word}" (${pinyin}) - nghĩa: ${meaning}.

=== QUY TẮC BẮT BUỘC - PHẢI ĐÚNG VỚI TỪNG TỪ ===

1. PHÂN LOẠI TỪ TRƯỚC KHI VIẾT:
   - Trợ từ/ngữ khí (啊, 吧, 的, 得, 把, 被...): Dùng ĐÚNG vị trí ngữ pháp. VD: 啊=cuối câu biểu cảm; 把=đưa O trước V; 吧=đề nghị/nhẹ nhàng.
   - Động từ: Dùng trong cấu trúc đúng (chủ ngữ + V + tân ngữ...). VD: 愛 phải đi với đối tượng (愛家人).
   - Tính từ: Chỉ bổ nghĩa cho danh từ phù hợp. VD: 矮 chỉ người/đồ cao thấp, KHÔNG dùng "這本書很矮" (sai).
   - Danh từ: Dùng làm chủ/vị/tân ngữ đúng. VD: 安排 là động từ "sắp xếp", KHÔNG phải "đặt 安排 ở đây" (sai).

2. CẤM DÙNG KHUÔN MẪU SAI:
   - KHÔNG: "他很喜歡這個X" khi X là trợ từ, động từ, tính từ.
   - KHÔNG: "請把X放在這裡" khi X không phải đồ vật.
   - KHÔNG: "我們一起去X吧" khi X không phải địa điểm.
   - KHÔNG: "這個X很重要" khi X không phải danh từ trừu tượng.
   - Mỗi câu phải TỰ NHIÊN như người Đài Loan nói thật.

3. VÍ DỤ - 3 câu NGỮ CẢNH KHÁC NHAU:
   - Gợi ý: câu 1 (${ctx1}), câu 2 (${ctx2}), câu 3 (${ctx3}).
   - Mỗi câu phải chứa từ "${word}" và có nghĩa đúng.

4. CÂU HỎI - 6 câu ĐA DẠNG:
   - Ít nhất 1 câu hỏi nghĩa, 1 câu pinyin, 1 câu chọn chữ Hán, 1-2 câu dịch ví dụ.
   - Các câu còn lại: so sánh, ngữ cảnh, từ đồng/trái nghĩa.
   - Đáp án sai phải Hợp lý (từ khác, nghĩa gần nhưng sai).

Trả về ĐÚNG JSON (không markdown, không giải thích):
{
  "partOfSpeech": "danh từ"|"động từ"|"tính từ"|"trạng từ"|"trợ từ",
  "examples": [
    {"taiwan": "câu 1", "pinyin": "pinyin câu 1", "nghia": "nghĩa tiếng Việt"},
    {"taiwan": "câu 2", "pinyin": "pinyin câu 2", "nghia": "nghĩa"},
    {"taiwan": "câu 3", "pinyin": "pinyin câu 3", "nghia": "nghĩa"}
  ],
  "synonyms": "漢字 (pinyin), 漢字 (pinyin)",
  "antonyms": "漢字 (pinyin) hoặc chuỗi rỗng nếu không có",
  "questions": [
    {"question": "câu hỏi", "options": ["đúng", "sai1", "sai2", "sai3", "sai4", "sai5"], "correctAnswer": 0},
    ... 6 câu
  ]
}
Mỗi question: 4-6 options, correctAnswer là index (0-5).`;
}

const EXAMPLE_CONTEXTS = [
  'nhà hàng, quán ăn, gọi món',
  'trường học, lớp học, giáo viên học sinh',
  'gia đình, ở nhà, bố mẹ con cái',
  'du lịch, sân bay, ga tàu, khách sạn',
  'văn phòng, công ty, đồng nghiệp',
  'siêu thị, mua sắm, chợ',
  'bệnh viện, phòng khám, bác sĩ',
  'quán cà phê, trà sữa, giải khát',
  'công viên, dạo chơi, thiên nhiên',
  'nhà ga, xe buýt, phương tiện',
  'điện thoại, chat, gọi video',
  'thư viện, đọc sách, học bài',
  'phòng gym, thể thao, tập luyện',
  'tiệm tạp hóa, mua đồ hàng ngày',
  'rạp chiếu phim, xem phim',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Chỉ số 0..max-1 từ word + seed, mỗi từ chọn template khác nhau */
function pickIndex(word: string, seed: number, max: number): number {
  let h = seed;
  for (let i = 0; i < word.length; i++) h = ((h << 5) - h + word.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ----- Local generator: ví dụ chính xác, 6 câu hỏi, đáp án đúng random A/B/C/D/E/F -----
let CURATED: Record<string, { examples: Array<{ taiwan: string; pinyin: string; nghia: string }>; synonyms: string; antonyms: string }> = {};
try {
  const curatedPath = path.join(__dirname, '../data/tocfl-curated.json');
  if (fs.existsSync(curatedPath)) {
    CURATED = JSON.parse(fs.readFileSync(curatedPath, 'utf-8'));
  }
} catch (_) {}

// Template ví dụ theo nhóm nghĩa - mỗi từ chọn template phù hợp để câu chính xác
const EXAMPLE_GROUPS: Record<string, Array<{ tw: string; py: string; nghia: string }>> = {
  seat_place: [
    { tw: '請問這個{w}有人嗎？', py: 'Qǐngwèn zhège {py} yǒu rén ma?', nghia: 'Xin hỏi {m} này có người chưa?' },
    { tw: '老師幫學生安排{w}。', py: 'Lǎoshī bāng xuéshēng ānpái {py}.', nghia: 'Giáo viên sắp xếp {m} cho học sinh.' },
    { tw: '我們先找個{w}坐下吧。', py: 'Wǒmen xiān zhǎo gè {py} zuò xià ba.', nghia: 'Chúng ta tìm {m} xuống trước đi.' },
  ],
  thing_object: [
    { tw: '請給我一個{w}。', py: 'Qǐng gěi wǒ yī gè {py}.', nghia: 'Làm ơn cho tôi một {m}.' },
    { tw: '媽媽買了很多{w}。', py: 'Māma mǎi le hěnduō {py}.', nghia: 'Mẹ đã mua rất nhiều {m}.' },
    { tw: '請把{w}放在這裡。', py: 'Qǐng bǎ {py} fàng zài zhèlǐ.', nghia: 'Hãy đặt {m} ở đây.' },
    { tw: '這個{w}很漂亮。', py: 'Zhège {py} hěn piàoliang.', nghia: '{m} này rất đẹp.' },
    { tw: '他很喜歡這個{w}。', py: 'Tā hěn xǐhuan zhège {py}.', nghia: 'Anh ấy rất thích {m} này.' },
  ],
  abstract_concept: [
    { tw: '這個{w}很重要。', py: 'Zhège {py} hěn zhòngyào.', nghia: '{m} này rất quan trọng.' },
    { tw: '我們需要更多的{w}。', py: 'Wǒmen xūyào gèng duō de {py}.', nghia: 'Chúng ta cần thêm {m}.' },
    { tw: '他正在學習{w}。', py: 'Tā zhèngzài xuéxí {py}.', nghia: 'Anh ấy đang học {m}.' },
    { tw: '請解釋一下{w}的意思。', py: 'Qǐng jiěshì yīxià {py} de yìsi.', nghia: 'Hãy giải thích nghĩa của {m}.' },
  ],
  verb_action: [
    { tw: '他會{w}。', py: 'Tā huì {py}.', nghia: 'Anh ấy biết {m}.' },
    { tw: '我們要{w}這個問題。', py: 'Wǒmen yào {py} zhège wèntí.', nghia: 'Chúng ta cần {m} vấn đề này.' },
    { tw: '他正在{w}。', py: 'Tā zhèngzài {py}.', nghia: 'Anh ấy đang {m}.' },
    { tw: '請不要{w}。', py: 'Qǐng bùyào {py}.', nghia: 'Xin đừng {m}.' },
    { tw: '他每天都會{w}。', py: 'Tā měitiān dōu huì {py}.', nghia: 'Anh ấy mỗi ngày đều {m}.' },
    { tw: '我們一起{w}吧。', py: 'Wǒmen yīqǐ {py} ba.', nghia: 'Chúng ta cùng {m} nhé.' },
  ],
  adjective_desc: [
    { tw: '今天的天氣很{w}。', py: 'Jīntiān de tiānqì hěn {py}.', nghia: 'Thời tiết hôm nay rất {m}.' },
    { tw: '這個{w}很漂亮。', py: 'Zhège {py} hěn piàoliang.', nghia: '{m} này rất đẹp.' },
    { tw: '他覺得很{w}。', py: 'Tā juéde hěn {py}.', nghia: 'Anh ấy cảm thấy rất {m}.' },
    { tw: '房間很{w}。', py: 'Fángjiān hěn {py}.', nghia: 'Phòng rất {m}.' },
    { tw: '這本書很{w}。', py: 'Zhè běn shū hěn {py}.', nghia: 'Cuốn sách này rất {m}.' },
  ],
  place_location: [
    { tw: '我們一起去{w}吧。', py: 'Wǒmen yīqǐ qù {py} ba.', nghia: 'Chúng ta cùng đi {m} nhé.' },
    { tw: '他在{w}工作。', py: 'Tā zài {py} gōngzuò.', nghia: 'Anh ấy làm việc ở {m}.' },
    { tw: '{w}在哪裡？', py: '{py} zài nǎlǐ?', nghia: '{m} ở đâu?' },
    { tw: '我們到了{w}。', py: 'Wǒmen dào le {py}.', nghia: 'Chúng ta đã đến {m}.' },
  ],
  person_family: [
    { tw: '他是我的{w}。', py: 'Tā shì wǒ de {py}.', nghia: 'Anh ấy là {m} của tôi.' },
    { tw: '{w}來了。', py: '{py} lái le.', nghia: '{m} đã đến.' },
    { tw: '我{w}很健康。', py: 'Wǒ {py} hěn jiànkāng.', nghia: '{m} tôi rất khỏe.' },
  ],
  food_drink: [
    { tw: '我想吃{w}。', py: 'Wǒ xiǎng chī {py}.', nghia: 'Tôi muốn ăn {m}.' },
    { tw: '請給我一杯{w}。', py: 'Qǐng gěi wǒ yī bēi {py}.', nghia: 'Cho tôi một ly {m}.' },
    { tw: '這個{w}很好吃。', py: 'Zhège {py} hěn hǎochī.', nghia: '{m} này rất ngon.' },
  ],
  default: [
    { tw: '他很喜歡這個{w}。', py: 'Tā hěn xǐhuan zhège {py}.', nghia: 'Anh ấy rất thích {m} này.' },
    { tw: '我們需要{w}。', py: 'Wǒmen xūyào {py}.', nghia: 'Chúng ta cần {m}.' },
    { tw: '這個{w}很重要。', py: 'Zhège {py} hěn zhòngyào.', nghia: '{m} này rất quan trọng.' },
    { tw: '請把{w}放在這裡。', py: 'Qǐng bǎ {py} fàng zài zhèlǐ.', nghia: 'Hãy đặt {m} ở đây.' },
    { tw: '他會說{w}。', py: 'Tā huì shuō {py}.', nghia: 'Anh ấy biết nói {m}.' },
    { tw: '我們一起去{w}吧。', py: 'Wǒmen yīqǐ qù {py} ba.', nghia: 'Chúng ta cùng đi {m} nhé.' },
  ],
};

function pickExampleGroup(word: string, meaning: string, pos: string): string {
  const m = meaning.toLowerCase();
  if (word === '座位' || word === '位子' || m.match(/\b(chỗ ngồi|ghế ngồi|chỗ|ghế|vị trí)\b/)) return 'seat_place';
  if (m.match(/\b(ăn|uống|món|bánh|trà|cơm|nước|ly|cốc|bánh|rau)\b/)) return 'food_drink';
  if (m.match(/\b(bố|mẹ|anh|chị|em|ông|bà|cha|con)\b/)) return 'person_family';
  if (m.match(/\b(nhà|trường|ga|công ty|địa điểm|phố|văn phòng|bệnh viện)\b/)) return 'place_location';
  if (pos === 'verb') return 'verb_action';
  if (pos === 'adjective') return 'adjective_desc';
  if (m.match(/\b(phương pháp|ý nghĩa|vấn đề|khái niệm|tác dụng)\b/)) return 'abstract_concept';
  if (m.match(/\b(cái|con|bàn|ghế|sách|đồ|vật|túi|bao)\b/)) return 'thing_object';
  return 'default';
}

// Nhiều cách hỏi khác nhau - mỗi từ dùng phrasing khác
const Q1_PHRASINGS = [
  (w: string) => `"${w}" có nghĩa là gì?`,
  (w: string) => `Từ "${w}" trong tiếng Trung nghĩa là gì?`,
  (w: string) => `Chọn nghĩa đúng của "${w}".`,
  (w: string) => `"${w}" có nghĩa gì?`,
];
const Q2_PHRASINGS = [
  (w: string) => `Phiên âm đúng của "${w}" là đáp án nào?`,
  (w: string) => `"${w}" đọc theo pinyin là gì?`,
  (w: string) => `Chọn cách đọc pinyin đúng cho "${w}".`,
  (w: string) => `Cách phiên âm đúng của "${w}"?`,
];
const Q_TRANSLATE_PHRASINGS = [
  (s: string) => `"${s}" nghĩa là gì?`,
  (s: string) => `Dịch câu "${s}" sang tiếng Việt.`,
  (s: string) => `"${s}" có nghĩa là gì?`,
  (s: string) => `Câu "${s}" nghĩa là gì?`,
];
const Q6_PHRASINGS = [
  (m: string) => `Chọn chữ tiếng Trung của "${m}"?`,
  (m: string) => `"${m}" viết bằng chữ Hán là gì?`,
  (m: string) => `Chữ Hán nào tương ứng với "${m}"?`,
  (m: string) => `"${m}" - chọn chữ Hán đúng.`,
];

/** Tạo pinyin sai (đổi thanh điệu): zuòwèi -> zuǒwèi, zuòwéi, zuówèi... */
function pinyinWrongVariants(py: string, count: number): string[] {
  const rows = [['a','ā','á','ǎ','à'], ['e','ē','é','ě','è'], ['i','ī','í','ǐ','ì'], ['o','ō','ó','ǒ','ò'], ['u','ū','ú','ǔ','ù'], ['v','ǖ','ǘ','ǚ','ǜ']];
  const out: string[] = [];
  const seen = new Set<string>([py]);
  let shift = 0;
  while (out.length < count && shift < 20) {
    shift++;
    let s = py;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      for (const row of rows) {
        const idx = row.indexOf(c);
        if (idx >= 0) {
          const newIdx = (idx + shift) % 5;
          s = s.slice(0, i) + row[newIdx] + s.slice(i + 1);
          break;
        }
      }
    }
    if (s !== py && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  const fill = ['zǒuwèi', 'zuòwēi', 'zuówèi', 'zuòwěi', 'zuōwèi'];
  while (out.length < count) out.push(fill[out.length % fill.length]);
  return out.slice(0, count);
}

/** Tạo chữ Hán sai (đồng âm khác chữ, gần giống): 座位 -> 座味, 坐位, 座為... */
function charWrongVariants(word: string, count: number): string[] {
  const confusions: Record<string, string[]> = {
    '座': ['坐', '做', '作'], '位': ['味', '為', '衛'], '坐': ['座', '做', '作'],
    '愛': ['礙', '曖'], '安': ['按', '案'], '八': ['巴', '把'], '白': ['百', '柏'],
    '包': ['抱', '飽'], '北': ['背', '被'], '本': ['笨', '奔'], '比': ['筆', '必'],
    '不': ['布', '步'], '大': ['打', '達'], '的': ['得', '地'], '電': ['店', '典'],
    '東': ['冬', '懂'], '多': ['都', '朵'], '發': ['法', '罰'], '分': ['粉', '份'],
    '高': ['告', '搞'], '工': ['公', '功'], '國': ['果', '過'], '好': ['號', '毫'],
    '和': ['合', '河'], '很': ['恨', '狠'], '會': ['回', '惠'], '家': ['加', '假'],
    '見': ['件', '建'], '開': ['凱', '概'], '看': ['刊', '砍'], '來': ['賴', '萊'],
    '老': ['勞', '牢'], '了': ['料', '瞭'], '買': ['賣', '麥'], '沒': ['每', '美'],
    '們': ['門', '悶'], '你': ['泥', '尼'], '年': ['念', '黏'], '女': ['努', '怒'],
    '跑': ['泡', '炮'], '起': ['氣', '器'], '去': ['趣', '娶'], '人': ['認', '任'],
    '日': ['入', '易'], '三': ['散', '傘'], '上': ['尚', '賞'], '少': ['燒', '紹'],
    '生': ['聲', '升'], '時': ['十', '食'], '是': ['事', '市'], '說': ['數', '碩'],
    '他': ['她', '它'], '天': ['田', '甜'], '聽': ['停', '庭'], '我': ['握', '臥'],
    '下': ['夏', '嚇'], '想': ['向', '像'], '小': ['笑', '校'], '新': ['心', '辛'],
    '學': ['雪', '血'], '一': ['以', '已'], '有': ['又', '友'], '在': ['再', '載'],
    '這': ['著', '者'], '中': ['重', '種'], '子': ['字', '自'], '做': ['作', '座'],
  };
  const out: string[] = [];
  const seen = new Set<string>([word]);
  for (let i = 0; i < word.length && out.length < count; i++) {
    const c = word[i];
    const alts = confusions[c] || [];
    for (const a of alts) {
      const w = word.slice(0, i) + a + word.slice(i + 1);
      if (w !== word && !seen.has(w)) { seen.add(w); out.push(w); if (out.length >= count) break; }
    }
  }
  while (out.length < count) {
    const w = word.split('').reverse().join('') + out.length;
    if (!seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out.slice(0, count);
}

/** Shuffle và trả về correctAnswer mới (đáp án đúng random A/B/C/D/E/F) */
function shuffleAndTrack<T>(arr: T[], correctItem: T): { arr: T[]; correctAnswer: number } {
  const copy = [...arr];
  const idx = copy.indexOf(correctItem);
  if (idx < 0) return { arr: copy, correctAnswer: 0 };
  shuffleArray(copy);
  return { arr: copy, correctAnswer: copy.indexOf(correctItem) };
}

function generateLocal(
  word: string,
  pinyin: string,
  meaning: string,
  index: number,
  allMeanings: string[]
): AIGenerated {
  const firstMeaning = meaning.split(/[,，、]/)[0].trim() || meaning;
  const partOfSpeech = inferPartOfSpeech(meaning);
  const posLabel = partOfSpeech === 'verb' ? 'động từ' : partOfSpeech === 'adjective' ? 'tính từ' : partOfSpeech === 'adverb' ? 'trạng từ' : 'danh từ';

  let examples: Array<{ taiwan: string; pinyin: string; nghia: string }>;
  let synonyms: string;
  let antonyms: string;

  const cur = CURATED[word];
  if (cur?.examples?.length >= 3) {
    examples = cur.examples.slice(0, 3);
    synonyms = cur.synonyms || '相關詞 (guāncí)';
    antonyms = cur.antonyms || '反義詞 (fǎnyìcí)';
  } else {
    const groupKey = pickExampleGroup(word, meaning, partOfSpeech);
    const pool = EXAMPLE_GROUPS[groupKey] || EXAMPLE_GROUPS.default;
    const used = new Set<number>();
    examples = [];
    for (let k = 0; k < 3; k++) {
      let idx = pickIndex(word + String(k), index, pool.length);
      for (let t = 0; t < pool.length; t++) {
        if (!used.has(idx)) break;
        idx = (idx + 1) % pool.length;
      }
      used.add(idx);
      const tpl = pool[idx];
      examples.push({
        taiwan: tpl.tw.replace(/\{w\}/g, word),
        pinyin: tpl.py.replace(/\{py\}/g, pinyin).replace(/\{w\}/g, pinyin),
        nghia: tpl.nghia.replace(/\{m\}/g, firstMeaning),
      });
    }
    synonyms = '相關詞 (guāncí), 同義 (tóngyì)';
    antonyms = '反義詞 (fǎnyìcí)';
    const antPairs: [string, string][] = [['大', '小'], ['多', '少'], ['好', '壞'], ['新', '舊'], ['快', '慢'], ['熱', '冷'], ['高', '低'], ['開', '關'], ['坐', '站'], ['愛', '恨']];
    for (const [a, b] of antPairs) {
      if (word.includes(a)) { antonyms = `${b} (${b})`; break; }
      if (word.includes(b)) { antonyms = `${a} (${a})`; break; }
    }
  }

  const wrongMeanings = allMeanings.filter(m => m !== firstMeaning && m.length > 0).slice(0, 80);
  const pickWrong = (n: number, exclude: string[]): string[] => {
    const out: string[] = [];
    const pool = wrongMeanings.filter(m => !exclude.includes(m));
    for (let i = 0; i < n && pool.length > 0; i++) {
      const j = pickIndex(word + 'm' + i + exclude.join(''), index, pool.length);
      out.push(pool.splice(j, 1)[0]);
    }
    const fill = ['chỗ đứng', 'bàn học', 'hành lang', 'cửa ra vào', 'Không biết', 'Không liên quan', 'Ý khác', 'Từ khác'];
    while (out.length < n) out.push(fill[out.length % fill.length]);
    return out.slice(0, n);
  };

  const questions: Array<{ question: string; options: string[]; correctAnswer: number }> = [];
  const q1Phrase = Q1_PHRASINGS[pickIndex(word + 'q1', index, Q1_PHRASINGS.length)];
  const q2Phrase = Q2_PHRASINGS[pickIndex(word + 'q2', index, Q2_PHRASINGS.length)];
  const qTrans = Q_TRANSLATE_PHRASINGS[pickIndex(word + 'qt', index, Q_TRANSLATE_PHRASINGS.length)];
  const q6Phrase = Q6_PHRASINGS[pickIndex(word + 'q6', index, Q6_PHRASINGS.length)];

  // Q1: nghĩa - 6 options
  const q1opts = [firstMeaning, ...pickWrong(5, [firstMeaning])];
  const q1 = shuffleAndTrack(q1opts, firstMeaning);
  questions.push({ question: q1Phrase(word), options: q1.arr, correctAnswer: q1.correctAnswer });

  // Q2: pinyin - 6 options
  const pyWrong = pinyinWrongVariants(pinyin, 5);
  const q2 = shuffleAndTrack([pinyin, ...pyWrong], pinyin);
  questions.push({ question: q2Phrase(word), options: q2.arr, correctAnswer: q2.correctAnswer });

  // Q3-Q5: dịch 3 ví dụ - mỗi câu dùng phrasing có thể khác
  const ex1Nghia = examples[0].nghia;
  const q3 = shuffleAndTrack([ex1Nghia, ...pickWrong(5, [ex1Nghia, firstMeaning])], ex1Nghia);
  questions.push({ question: qTrans(examples[0].taiwan), options: q3.arr, correctAnswer: q3.correctAnswer });

  const ex2Nghia = examples[1].nghia;
  const trans2 = Q_TRANSLATE_PHRASINGS[pickIndex(word + 'q4', index, Q_TRANSLATE_PHRASINGS.length)];
  const q4 = shuffleAndTrack([ex2Nghia, ...pickWrong(5, [ex2Nghia, ex1Nghia, firstMeaning])], ex2Nghia);
  questions.push({ question: trans2(examples[1].taiwan), options: q4.arr, correctAnswer: q4.correctAnswer });

  const ex3Nghia = examples[2].nghia;
  const trans3 = Q_TRANSLATE_PHRASINGS[pickIndex(word + 'q5', index, Q_TRANSLATE_PHRASINGS.length)];
  const q5 = shuffleAndTrack([ex3Nghia, ...pickWrong(5, [ex3Nghia, ex2Nghia, ex1Nghia, firstMeaning])], ex3Nghia);
  questions.push({ question: trans3(examples[2].taiwan), options: q5.arr, correctAnswer: q5.correctAnswer });

  // Q6: chọn chữ Hán - 6 options
  const charWrong = charWrongVariants(word, 5);
  const q6 = shuffleAndTrack([word, ...charWrong], word);
  questions.push({ question: q6Phrase(firstMeaning), options: q6.arr, correctAnswer: q6.correctAnswer });

  // Shuffle thứ tự 6 câu hỏi để mỗi từ có thứ tự khác nhau
  shuffleArray(questions);

  return { partOfSpeech: posLabel, examples, synonyms, antonyms, questions };
}

function parseVocabularyTable(content: string): Array<{ word: string; pinyin: string; meaning: string }> {
  const lines = content.split('\n');
  const vocab: Array<{ word: string; pinyin: string; meaning: string }> = [];
  const rowRegex = /^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/;
  for (const line of lines) {
    const match = line.match(rowRegex);
    if (match) {
      const word = match[1].trim();
      const pinyin = match[2].trim();
      const meaning = match[3].trim();
      if (word && pinyin && meaning) vocab.push({ word, pinyin, meaning });
    }
  }
  return vocab;
}

// ============ AI generation với prompt RANDOM ============
interface AIGenerated {
  partOfSpeech?: string;
  examples?: Array<{ taiwan: string; pinyin: string; nghia: string }>;
  synonyms?: string;
  antonyms?: string;
  questions?: Array<{ question: string; options: string[]; correctAnswer: number }>;
}

async function generateWithAI(
  ai: GoogleGenAI,
  word: string,
  pinyin: string,
  meaning: string
): Promise<AIGenerated | null> {
  const prompt = buildAIPrompt(word, pinyin, meaning);

  // Gemini 3 ưu tiên, fallback Gemini 2.5/2.0/1.5. Có thể set GEMINI_MODEL trong .env để override
  const defaultModels = [
    'gemini-3.1-flash-lite-preview',  // Gemini 3 nhanh, rẻ
    'gemini-3-flash-preview',         // Gemini 3 Flash
    'gemini-3.1-pro-preview',          // Gemini 3 Pro
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];
  const modelOverride = process.env.GEMINI_MODEL;
  const models = modelOverride ? [modelOverride] : defaultModels;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.8 + Math.random() * 0.2,
            maxOutputTokens: 2048,
          },
        });
        const text = (response as { text?: string }).text ?? '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) break;
        const parsed = JSON.parse(jsonMatch[0]) as AIGenerated;
        if (!parsed.examples || !Array.isArray(parsed.examples) || parsed.examples.length < 2) break;
        if (!parsed.questions || parsed.questions.length < 4) break;
        return parsed;
      } catch (e: any) {
        const status = e?.status ?? e?.statusCode;
        const msg = String(e?.message ?? e ?? '');
        const is429 = status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
        const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
        const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 18;

        if (is429 && attempt === 0) {
          console.warn(`  [${word}] Rate limit (429), đợi ${retrySec}s...`);
          await new Promise(r => setTimeout(r, retrySec * 1000));
        } else {
          if (model === models[models.length - 1] && attempt === 1) {
            console.warn(`  [${word}] Hết quota. Dùng fallback.`);
          }
          break;
        }
      }
    }
  }
  return null;
}

function getClaude(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) throw new Error('Cần ANTHROPIC_API_KEY hoặc CLAUDE_API_KEY trong .env');
  return new Anthropic({ apiKey: key });
}

async function generateWithClaude(
  client: Anthropic,
  word: string,
  pinyin: string,
  meaning: string
): Promise<AIGenerated | null> {
  const prompt = buildAIPrompt(word, pinyin, meaning);

  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8 + Math.random() * 0.2,
      });
      const text = (msg.content as Array<{ type: string; text?: string }>)
        .filter(c => c.type === 'text' && c.text)
        .map(c => c.text!)
        .join('');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) break;
      const parsed = JSON.parse(jsonMatch[0]) as AIGenerated;
      if (!parsed.examples || !Array.isArray(parsed.examples) || parsed.examples.length < 2) break;
      if (!parsed.questions || parsed.questions.length < 4) break;
      return parsed;
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode;
      const msg = String(e?.message ?? e ?? '');
      const is429 = status === 429 || msg.includes('429') || msg.includes('overloaded');
      const retrySec = 18;
      if (is429 && attempt === 0) {
        console.warn(`  [${word}] Claude rate limit, đợi ${retrySec}s...`);
        await new Promise(r => setTimeout(r, retrySec * 1000));
      } else {
        console.warn(`  [${word}] Claude lỗi:`, msg.slice(0, 80));
        break;
      }
    }
  }
  return null;
}

function formatExample(ex: { taiwan: string; pinyin: string; nghia: string }): string {
  return `台灣繁體中文: ${ex.taiwan}\nPinyin: ${ex.pinyin}\nNghĩa: ${ex.nghia}`;
}

// ============ Main ============
async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const startArg = args.find(a => a.startsWith('--start='));
  const noAi = args.includes('--no-ai');
  const useClaude = args.includes('--use-claude');
  const force = args.includes('--force');
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const start = startArg ? parseInt(startArg.split('=')[1], 10) : 0;

  const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  let ai: GoogleGenAI | null = null;
  let claude: Anthropic | null = null;
  let useLocalOnly = noAi;
  if (!noAi) {
    if (useClaude && claudeKey) {
      claude = getClaude();
      if (geminiKey) ai = getGemini(); // fallback khi Claude lỗi
      console.log('Dùng Claude API để sinh nội dung.');
    } else if (geminiKey) {
      ai = getGemini();
      console.log('Dùng Gemini API để sinh nội dung.');
    } else {
      useLocalOnly = true;
      console.warn('Chưa có API key. Thêm GEMINI_API_KEY hoặc ANTHROPIC_API_KEY (với --use-claude).');
    }
  }

  const sourcePath = path.join(__dirname, '../data/tocfl-vocabulary-source.txt');
  const outputPath = path.join(__dirname, '../data/tocfl-vocabulary-import.xlsx');
  const progressPath = path.join(__dirname, '../data/tocfl-ai-progress.json');

  if (!fs.existsSync(sourcePath)) {
    console.error('Không tìm thấy', sourcePath);
    process.exit(1);
  }

  // Từ đã có trong DB sẽ bỏ qua (trừ khi --force)
  let existingWords = new Set<string>();
  if (process.env.MONGODB_URI && !force) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      mongooseConnected = true;
      const words = await Vocabulary.find({}).select('word').lean();
      existingWords = new Set((words as { word: string }[]).map(d => d.word));
      console.log(`[Skip] Đã có ${existingWords.size} từ trong DB - sẽ bỏ qua (dùng --force để chạy lại tất cả)`);
    } catch (e: any) {
      console.warn('[Skip] Không đọc được DB, sẽ xử lý tất cả:', e?.message || e);
    }
  }

  if (fs.existsSync(progressPath)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      if (progress?.enriched?.length > 0) {
        const { created, updated } = await importEnrichedToDb(progress.enriched);
        console.log(`[Import] Đã import ${progress.enriched.length} từ từ progress (+${created} mới, ~${updated} cập nhật)`);
      }
    } catch (e: any) {
      console.warn('[Import] Không đọc được progress:', e?.message || e);
    }
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const rawVocab = parseVocabularyTable(content);
  const end = limit ? Math.min(start + limit, rawVocab.length) : rawVocab.length;
  const toProcessRaw = rawVocab.slice(start, end);
  let toProcess = force ? toProcessRaw : toProcessRaw.filter(v => !existingWords.has(v.word));
  const skipped = toProcessRaw.length - toProcess.length;
  if (skipped > 0) {
    console.log(`[Skip] Bỏ qua ${skipped} từ đã có trong DB (${toProcess.length} từ sẽ xử lý)`);
  }
  if (toProcess.length === 0) {
    console.log('Không còn từ nào cần xử lý. Thoát.');
    if (mongooseConnected) await mongoose.disconnect();
    return;
  }
  const modelInfo = useLocalOnly ? 'Bộ sinh local (fallback)' : (claude ? (process.env.CLAUDE_MODEL || 'Claude') : (process.env.GEMINI_MODEL || 'Gemini'));
  console.log(`Xử lý ${toProcess.length} từ (${start + 1}-${end} / ${rawVocab.length}) - ${modelInfo}`);

  const enriched: any[] = [];
  let processed = 0;
  let failed = 0;
  let lastImportedCount = 0;
  const allMeanings = toProcess.map(v => (v.meaning.split(/[,，、]/)[0] || '').trim()).filter(Boolean);

  for (let i = 0; i < toProcess.length; i++) {
    const v = toProcess[i];
    const rawIndex = rawVocab.findIndex(x => x.word === v.word && x.pinyin === v.pinyin);
    const idx = rawIndex >= 0 ? rawIndex : start + i;
    const zhuyin = toZhuyin(v.pinyin);
    let aiResult: AIGenerated | null = null;
    if (useLocalOnly || (!ai && !claude)) {
      aiResult = generateLocal(v.word, v.pinyin, v.meaning, i, allMeanings);
    } else if (claude) {
      aiResult = await generateWithClaude(claude, v.word, v.pinyin, v.meaning);
      if (!aiResult && ai) aiResult = await generateWithAI(ai, v.word, v.pinyin, v.meaning); // fallback Gemini
    } else if (ai) {
      aiResult = await generateWithAI(ai!, v.word, v.pinyin, v.meaning);
    }

    if (aiResult) {
      const partOfSpeech = POS_MAP[aiResult.partOfSpeech || ''] || inferPartOfSpeech(v.meaning);
      const examples = (aiResult.examples || []).slice(0, 3).map(formatExample);
      const synonyms = (aiResult.synonyms || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const antonyms = (aiResult.antonyms || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const questions = (aiResult.questions || []).slice(0, 6).map(q => {
        const opts = Array.isArray(q.options) ? q.options.slice(0, 6) : [];
        while (opts.length < 4) opts.push(`Đáp án ${opts.length + 1}`);
        const baseCorrectIndex = Math.min(q.correctAnswer ?? 0, opts.length - 1);
        const correctItem = opts[baseCorrectIndex];
        const shuffled = shuffleAndTrack(opts, correctItem);
        return {
          question: q.question,
          options: shuffled.arr,
          correctAnswer: shuffled.correctAnswer,
          explanation: undefined,
        };
      });

      enriched.push({
        word: v.word,
        pinyin: v.pinyin,
        zhuyin: zhuyin || undefined,
        meaning: v.meaning,
        partOfSpeech,
        level: inferLevel(v.word, v.meaning, idx, rawVocab.length),
        topics: inferTopics(v.meaning).join(', '),
        examples: examples.join('||'),
        synonyms: synonyms.join('||'),
        antonyms: antonyms.join('||'),
        questions: JSON.stringify(questions),
      });
      processed++;
    } else {
      // AI trả về null (lỗi/hết quota) -> fallback local
      const fallback = generateLocal(v.word, v.pinyin, v.meaning, i, allMeanings);
      const partOfSpeech = POS_MAP[fallback.partOfSpeech || ''] || inferPartOfSpeech(v.meaning);
      const examples = (fallback.examples || []).slice(0, 3).map(formatExample);
      const synonyms = (fallback.synonyms || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const antonyms = (fallback.antonyms || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const questions = (fallback.questions || []).slice(0, 6).map(q => {
        const opts = Array.isArray(q.options) ? q.options.slice(0, 6) : [];
        while (opts.length < 4) opts.push(`Đáp án ${opts.length + 1}`);
        const baseCorrectIndex = Math.min(q.correctAnswer ?? 0, opts.length - 1);
        const correctItem = opts[baseCorrectIndex];
        const shuffled = shuffleAndTrack(opts, correctItem);
        return {
          question: q.question,
          options: shuffled.arr,
          correctAnswer: shuffled.correctAnswer,
          explanation: undefined,
        };
      });
      enriched.push({
        word: v.word,
        pinyin: v.pinyin,
        zhuyin: zhuyin || undefined,
        meaning: v.meaning,
        partOfSpeech,
        level: inferLevel(v.word, v.meaning, idx, rawVocab.length),
        topics: inferTopics(v.meaning).join(', '),
        examples: examples.join('||'),
        synonyms: synonyms.join('||'),
        antonyms: antonyms.join('||'),
        questions: JSON.stringify(questions),
      });
      processed++;
    }

    if ((i + 1) % 5 === 0) {
      console.log(`  ${i + 1}/${toProcess.length} - OK: ${processed}, Fail: ${failed}`);
      fs.writeFileSync(progressPath, JSON.stringify({ start, end: start + i + 1, enriched }, null, 2));
      try {
        const toImport = enriched.slice(lastImportedCount);
        const { created, updated } = await importEnrichedToDb(toImport);
        lastImportedCount = enriched.length;
        if (created > 0 || updated > 0) console.log(`  [Import] Đã đưa vào DB: +${created} mới, ~${updated} cập nhật`);
      } catch (e: any) {
        console.warn(`  [Import] Lỗi:`, e?.message || e);
      }
    }

    await new Promise(r => setTimeout(r, useLocalOnly ? 5 : 400));
  }

  const headers = [
    'word', 'pinyin', 'zhuyin (optional)', 'meaning', 'partOfSpeech', 'level',
    'topics (comma-separated)', 'examples (|| separated)', 'synonyms (|| separated)',
    'antonyms (|| separated)', 'questions JSON (optional)',
  ];
  const rows = enriched.map(v => [
    v.word, v.pinyin, v.zhuyin || '', v.meaning, v.partOfSpeech, v.level,
    v.topics, v.examples, v.synonyms, v.antonyms, v.questions,
  ]);
  const wb = (XLSX.utils as any).book_new();
  const ws = (XLSX.utils as any).aoa_to_sheet([headers, ...rows]);
  (XLSX.utils as any).book_append_sheet(wb, ws, 'Vocabularies');
  XLSX.writeFile(wb, outputPath);

  try {
    const toImport = enriched.slice(lastImportedCount);
    const { created, updated } = await importEnrichedToDb(toImport);
    if (created > 0 || updated > 0) console.log(`[Import] Đã đưa ${toImport.length} từ cuối vào DB (+${created} mới, ~${updated} cập nhật)`);
  } catch (e: any) {
    console.warn(`[Import] Lỗi:`, e?.message || e);
  }
  if (mongooseConnected) await mongoose.disconnect();

  console.log(`\nHoàn tất: ${processed} từ đã gen${useLocalOnly ? ' (bộ sinh local)' : failed > 0 ? `, ${failed} fallback local` : ''}`);
  console.log(`Xuất: ${outputPath}`);
  if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);
}

main().catch(console.error);
