/**
 * Script import từ vựng TẤT CẢ cấp độ A1→C2 từ 6 file Excel.
 * Dùng Claude AI để sinh: pinyin, nghĩa, loại từ, 1 ví dụ đơn + 2 ví dụ phức, từ đồng/trái nghĩa, 6 câu hỏi.
 *
 * Cách dùng:
 *   npm run import:all-levels                      # Import toàn bộ 6 cấp
 *   npm run import:all-levels -- --level=A1        # Chỉ import cấp A1
 *   npm run import:all-levels -- --level=A1,A2     # Import A1 và A2
 *   npm run import:all-levels -- --limit=20        # Chỉ xử lý 20 từ (test)
 *   npm run import:all-levels -- --start=100       # Bắt đầu từ từ thứ 100 (tính gộp tất cả level)
 *   npm run import:all-levels -- --no-ai           # Dùng local fallback (test, không cần API)
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

// ============ Cấu hình file Excel ============

interface LevelConfig {
  level: string;       // A1, A2, B1, B2, C1, C2
  levelNum: number;    // 1–6
  file: string;        // tên file
  sheet: string;       // tên sheet trong file
  headerRow: number;   // index của dòng header (0-based)
}

const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 'A2', levelNum: 2, file: 'Từ vựng cấp A2.xlsx', sheet: 'A2', headerRow: 0 },
  { level: 'B1', levelNum: 3, file: 'Từ vựng cấp B1.xlsx', sheet: 'B1', headerRow: 0 },
  { level: 'B2', levelNum: 4, file: 'Từ vựng cấp B2.xlsx', sheet: 'B2', headerRow: 0 },
  { level: 'C1', levelNum: 5, file: 'Từ vựng cấp C1.xlsx', sheet: 'C1', headerRow: 0 },
  { level: 'C2', levelNum: 6, file: 'Từ vựng cấp C2.xlsx', sheet: 'C2', headerRow: 0 },
  { level: 'A1', levelNum: 1, file: 'Từ vựng cấp A1.xlsx', sheet: 'A1', headerRow: 1 },
];

const DATA_DIR = path.join(__dirname, '../data');
const PROGRESS_PATH = path.join(DATA_DIR, 'all-levels-progress.json');
const OUTPUT_XLSX = path.join(DATA_DIR, 'all-levels-result.xlsx');

// ============ Đọc Excel ============

interface RawWord {
  level: string;
  levelNum: number;
  word: string;
  allForms: string[];
  topic: string;
}

function readLevelFile(cfg: LevelConfig): RawWord[] {
  const filePath = path.join(DATA_DIR, cfg.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Không tìm thấy: ${cfg.file}`);
    return [];
  }
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) {
    console.warn(`  ⚠ Không tìm thấy sheet "${cfg.sheet}" trong ${cfg.file}`);
    return [];
  }
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
  const words: RawWord[] = [];
  // Data bắt đầu từ dòng sau header
  for (let i = cfg.headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue;
    const wordRaw = String(row[1]).trim();
    const topicRaw = String(row[2] || '').trim();
    if (!wordRaw || wordRaw === '-') continue;
    const allForms = wordRaw.split('/').map((s: string) => s.trim()).filter(Boolean);
    words.push({
      level: cfg.level,
      levelNum: cfg.levelNum,
      word: allForms[0],
      allForms,
      topic: topicRaw === '-' || !topicRaw ? 'Từ vựng cốt lõi' : topicRaw,
    });
  }
  return words;
}

// ============ DB ============

let mongooseConnected = false;

async function ensureDb(): Promise<void> {
  if (!mongooseConnected && process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    mongooseConnected = true;
  }
}

async function importToDb(enriched: EnrichedWord[]): Promise<{ created: number; updated: number }> {
  if (enriched.length === 0) return { created: 0, updated: 0 };
  if (!process.env.MONGODB_URI) {
    console.warn('  [DB] Bỏ qua - chưa có MONGODB_URI');
    return { created: 0, updated: 0 };
  }
  await ensureDb();
  let created = 0, updated = 0;
  const createdTopics: string[] = [];

  for (const v of enriched) {
    for (const topicName of v.topics) {
      if (topicName && !createdTopics.includes(topicName)) {
        if (!(await Topic.findOne({ name: topicName }))) {
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
    const doc = {
      pinyin: v.pinyin, zhuyin: v.zhuyin || undefined,
      meaning: v.meaning, partOfSpeech: v.partOfSpeech,
      level: v.levelNum, topics: v.topics,
      examples: v.examples, synonyms: v.synonyms,
      antonyms: v.antonyms,
      ...(v.questions.length > 0 ? { questions: v.questions } : {}),
    };
    if (existing) {
      Object.assign(existing, doc);
      await existing.save();
      updated++;
    } else {
      await Vocabulary.create({ word: v.word, ...doc });
      created++;
    }
  }
  return { created, updated };
}

// ============ Claude ============

function getClaude(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) throw new Error('Cần ANTHROPIC_API_KEY trong .env');
  return new Anthropic({ apiKey: key });
}

const EXAMPLE_CONTEXTS_SIMPLE = [
  'hội thoại ngắn gọn hàng ngày', 'câu giới thiệu bản thân',
  'hỏi thăm đơn giản', 'trả lời ngắn',
];
const EXAMPLE_CONTEXTS_COMPLEX = [
  'nhà hàng, gọi món, phục vụ', 'văn phòng, cuộc họp',
  'trường học, lớp học, thảo luận', 'du lịch, đặt phòng khách sạn',
  'bệnh viện, khám bệnh', 'siêu thị, mua sắm',
  'điện thoại, trao đổi thông tin', 'gia đình, tiệc tùng',
  'thư viện, nghiên cứu', 'sân bay, check-in',
  'quán cà phê, bạn bè', 'công ty, báo cáo',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function buildPrompt(word: string, topic: string, level: string): string {
  const ctxSimple = pick(EXAMPLE_CONTEXTS_SIMPLE);
  let cx1 = pick(EXAMPLE_CONTEXTS_COMPLEX);
  let cx2 = pick(EXAMPLE_CONTEXTS_COMPLEX);
  while (cx2 === cx1) cx2 = pick(EXAMPLE_CONTEXTS_COMPLEX);

  return `Bạn là chuyên gia tiếng Trung phồn thể Đài Loan. Sinh nội dung học tập CHÍNH XÁC cho từ "${word}" (chủ đề: ${topic}, cấp độ: ${level}).

=== QUY TẮC ===
1. Phân loại từ trước: trợ từ/ngữ khí dùng đúng vị trí; động từ cần tân ngữ phù hợp; tính từ bổ nghĩa đúng danh từ.
2. VÍ DỤ - ĐÚNG 2 CÂU:
   - Câu 1 (đơn giản): 5-10 chữ, cấu trúc cơ bản, ngữ cảnh: ${ctxSimple}.
   - Câu 2 (phức tạp): 12-20 chữ, có mệnh đề phụ/liên từ, ngữ cảnh: ${cx1}.
   - Mỗi câu phải chứa từ "${word}", tự nhiên như người Đài Loan nói thật, pinyin đầy đủ dấu.

Trả về JSON (không markdown, không giải thích):
{
  "pinyin": "phiên âm đầy đủ thanh điệu",
  "meaning": "nghĩa tiếng Việt ngắn gọn",
  "partOfSpeech": "danh từ"|"động từ"|"tính từ"|"trạng từ"|"trợ từ"|"đại từ"|"giới từ"|"liên từ"|"thán từ",
  "examples": [
    {"taiwan":"câu phồn thể đơn giản","pinyin":"pinyin","nghia":"nghĩa VN"},
    {"taiwan":"câu phồn thể phức tạp","pinyin":"pinyin","nghia":"nghĩa VN"}
  ],
  "synonyms": "漢字 (pinyin), ... hoặc rỗng",
  "antonyms": "漢字 (pinyin) hoặc rỗng"
}`;
}

interface AIResult {
  pinyin?: string; meaning?: string; partOfSpeech?: string;
  examples?: Array<{ taiwan: string; pinyin: string; nghia: string }>;
  synonyms?: string; antonyms?: string;
}

async function callClaude(client: Anthropic, word: string, topic: string, level: string): Promise<AIResult | null> {
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model, max_tokens: 2048,
        messages: [{ role: 'user', content: buildPrompt(word, topic, level) }],
        temperature: 0.7 + Math.random() * 0.3,
      });
      const text = (msg.content as Array<{ type: string; text?: string }>)
        .filter(c => c.type === 'text').map(c => c.text!).join('');
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) break;
      const parsed = JSON.parse(match[0]) as AIResult;
      if (!parsed.pinyin || !parsed.meaning) break;
      if (!parsed.examples || parsed.examples.length < 2) break;
      return parsed;
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? '');
      const is429 = (e?.status === 429) || msg.includes('429') || msg.includes('overloaded');
      if (is429 && attempt === 0) {
        const wait = 25;
        console.warn(`  [${word}] Claude rate limit, đợi ${wait}s...`);
        await sleep(wait * 1000);
      } else {
        console.warn(`  [${word}] Claude lỗi:`, msg.slice(0, 80));
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

function inferPos(m: string): string {
  const s = m.toLowerCase();
  if (s.match(/\b(yêu|thích|ăn|đi|làm|học|nói|mua|bán)\b/)) return 'verb';
  if (s.match(/\b(lớn|nhỏ|đẹp|tốt|nhanh|chậm|cao|thấp)\b/)) return 'adjective';
  return 'noun';
}

function toZhuyin(py: string): string {
  try { return pinyinToZhuyin(py.trim().replace(/\s+/g, ' ')) || ''; } catch { return ''; }
}


function generateFallback(word: string, topic: string, _level: string): AIResult {
  const meaning = `[${word}] (${topic})`;
  const pinyin = word.split('').map(() => 'x').join('');
  const exSimple = { type: 'simple', taiwan: `他說「${word}」。`, pinyin: `Tā shuō "${pinyin}".`, nghia: `Anh ấy nói "${word}".` };
  const exComplex = { taiwan: `學習「${word}」對我們理解中文非常有幫助。`, pinyin: `Xuéxí "${pinyin}" duì wǒmen lǐjiě Zhōngwén fēicháng yǒu bāngzhù.`, nghia: `Học từ "${word}" rất có ích cho việc hiểu tiếng Trung.` };
  return {
    pinyin, meaning,
    partOfSpeech: inferPos(meaning) === 'verb' ? 'động từ' : inferPos(meaning) === 'adjective' ? 'tính từ' : 'danh từ',
    examples: [exSimple, exComplex],
    synonyms: '', antonyms: '',
  };
}

// ============ Format & Process ============

function formatExample(ex: { taiwan: string; pinyin: string; nghia: string }): string {
  return `${ex.taiwan}\nPinyin: ${ex.pinyin}\nNghĩa: ${ex.nghia}`;
}

interface EnrichedWord {
  word: string; allForms: string; level: string; levelNum: number;
  pinyin: string; zhuyin?: string; meaning: string; partOfSpeech: string;
  topics: string[]; examples: string[]; synonyms: string[]; antonyms: string[];
  questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation?: string }>;
}

function processResult(raw: RawWord, ai: AIResult): EnrichedWord {
  const pos = POS_MAP[ai.partOfSpeech?.toLowerCase() ?? ''] || inferPos(ai.meaning ?? '');
  const ordered = (ai.examples ?? []).slice(0, 2);

  return {
    word: raw.word, allForms: raw.allForms.join(' / '),
    level: raw.level, levelNum: raw.levelNum,
    pinyin: ai.pinyin ?? '', zhuyin: toZhuyin(ai.pinyin ?? '') || undefined,
    meaning: ai.meaning ?? '', partOfSpeech: pos,
    topics: [raw.topic],
    examples: ordered.map(formatExample),
    synonyms: (ai.synonyms ?? '').split(',').map(s => s.trim()).filter(Boolean),
    antonyms: (ai.antonyms ?? '').split(',').map(s => s.trim()).filter(Boolean),
    questions: [],
  };
}

function writeResultExcel(enriched: EnrichedWord[], outPath: string): void {
  const headers = ['word','allForms','level','pinyin','zhuyin','meaning','partOfSpeech','topics','examples','synonyms','antonyms','questions'];
  const rows = enriched.map(v => [
    v.word, v.allForms, v.level, v.pinyin, v.zhuyin??'', v.meaning, v.partOfSpeech,
    v.topics.join(', '), v.examples.join('||'), v.synonyms.join('||'), v.antonyms.join('||'),
    JSON.stringify(v.questions),
  ]);
  const wb = (XLSX.utils as any).book_new();
  (XLSX.utils as any).book_append_sheet(wb, (XLSX.utils as any).aoa_to_sheet([headers,...rows]), 'All');
  XLSX.writeFile(wb, outPath);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const startArg = args.find(a => a.startsWith('--start='));
  const levelArg = args.find(a => a.startsWith('--level='));
  const noAi = args.includes('--no-ai');

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const start = startArg ? parseInt(startArg.split('=')[1], 10) : 0;
  const filterLevels = levelArg
    ? levelArg.split('=')[1].toUpperCase().split(',').map(s => s.trim())
    : null;

  // Chọn configs cần xử lý
  const configs = filterLevels
    ? LEVEL_CONFIGS.filter(c => filterLevels.includes(c.level))
    : LEVEL_CONFIGS;

  if (configs.length === 0) {
    console.error('Không tìm thấy cấp độ hợp lệ. Dùng: --level=A1,A2,B1,B2,C1,C2');
    process.exit(1);
  }

  // Claude client
  const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  let claude: Anthropic | null = null;
  let useLocalOnly = noAi;
  if (!noAi) {
    if (claudeKey) {
      claude = getClaude();
      console.log(`✓ Dùng Claude (${process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'}).`);
    } else {
      useLocalOnly = true;
      console.warn('⚠ Không có ANTHROPIC_API_KEY. Dùng bộ sinh local (chất lượng thấp).');
    }
  }

  // Đọc tất cả file
  console.log('\nĐọc file Excel...');
  let allWords: RawWord[] = [];
  for (const cfg of configs) {
    const words = readLevelFile(cfg);
    console.log(`  ${cfg.level} [${cfg.file}]: ${words.length} từ`);
    allWords = allWords.concat(words);
  }

  // Lấy danh sách từ đã có trong DB để skip A1
  let existingA1Words = new Set<string>();
  if (process.env.MONGODB_URI) {
    try {
      await ensureDb();
      const docs = await Vocabulary.find({ level: 1 }).select('word').lean();
      existingA1Words = new Set((docs as { word: string }[]).map(d => d.word));
      if (existingA1Words.size > 0) {
        console.log(`\n[A1] Đã có ${existingA1Words.size} từ trong DB → sẽ bỏ qua khi xử lý A1.`);
      }
    } catch (e: any) {
      console.warn('[A1 skip] Không đọc được DB:', e?.message);
    }
  }

  // Lọc: A1 bỏ qua từ đã có, các cấp khác xử lý tất cả
  const allWordsFiltered = allWords.filter(w =>
    w.level !== 'A1' || !existingA1Words.has(w.word)
  );
  const skippedA1 = allWords.filter(w => w.level === 'A1' && existingA1Words.has(w.word)).length;
  if (skippedA1 > 0) {
    console.log(`[A1] Bỏ qua ${skippedA1} từ đã có → còn ${allWordsFiltered.filter(w => w.level === 'A1').length} từ A1 mới cần xử lý.`);
  }

  const endIdx = limit ? Math.min(start + limit, allWordsFiltered.length) : allWordsFiltered.length;
  const toProcess = allWordsFiltered.slice(start, endIdx);
  console.log(`\nTổng sau lọc: ${allWordsFiltered.length} từ | Sẽ xử lý: ${toProcess.length} từ (${start + 1}–${endIdx})`);

  // Khôi phục progress
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
      if (saved?.enriched?.length > 0) {
        const { created, updated } = await importToDb(saved.enriched);
        console.log(`[Resume] Import ${saved.enriched.length} từ từ progress (+${created} mới, ~${updated} cập nhật).`);
      }
    } catch (e: any) { console.warn('[Resume] Lỗi progress:', e?.message); }
  }

  const modelLabel = useLocalOnly ? 'local fallback' : (process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514');
  console.log(`\nBắt đầu với [${modelLabel}]`);
  console.log('─'.repeat(60));

  const enriched: EnrichedWord[] = [];
  let lastImported = 0;
  let okCount = 0, fallbackCount = 0;

  // Thống kê theo cấp
  const levelStats: Record<string, { ok: number; fallback: number }> = {};
  for (const cfg of configs) levelStats[cfg.level] = { ok: 0, fallback: 0 };

  for (let i = 0; i < toProcess.length; i++) {
    const raw = toProcess[i];
    const display = raw.allForms.length > 1 ? raw.allForms.join('/') : raw.word;
    process.stdout.write(`  [${i + 1}/${toProcess.length}] ${raw.level} ${display} (${raw.topic})... `);

    let aiResult: AIResult | null = null;
    if (!useLocalOnly && claude) {
      aiResult = await callClaude(claude, raw.word, raw.topic, raw.level);
    }

    let enrichedWord: EnrichedWord;
    if (aiResult) {
      enrichedWord = processResult(raw, aiResult);
      process.stdout.write(`✓ ${aiResult.meaning}\n`);
      okCount++;
      levelStats[raw.level].ok++;
    } else {
      enrichedWord = processResult(raw, generateFallback(raw.word, raw.topic, raw.level));
      process.stdout.write(`⚠ fallback\n`);
      fallbackCount++;
      levelStats[raw.level].fallback++;
    }
    enriched.push(enrichedWord);

    // Lưu progress + import mỗi 5 từ
    if ((i + 1) % 5 === 0 || i === toProcess.length - 1) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ start, end: start + i + 1, enriched }, null, 2));
      try {
        const toImport = enriched.slice(lastImported);
        const { created, updated } = await importToDb(toImport);
        lastImported = enriched.length;
        if (created > 0 || updated > 0) console.log(`  → [DB] +${created} mới, ~${updated} cập nhật`);
      } catch (e: any) { console.warn(`  → [DB] Lỗi:`, e?.message); }
    }

    if (!useLocalOnly) await sleep(500);
  }

  // Import cuối
  if (lastImported < enriched.length) {
    try {
      const { created, updated } = await importToDb(enriched.slice(lastImported));
      console.log(`[Import cuối] +${created} mới, ~${updated} cập nhật`);
    } catch (e: any) { console.warn('[Import cuối] Lỗi:', e?.message); }
  }

  // Xuất Excel
  writeResultExcel(enriched, OUTPUT_XLSX);

  if (mongooseConnected) await mongoose.disconnect();
  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH);

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Hoàn tất! Đã xử lý ${enriched.length} từ`);
  console.log(`   AI thành công : ${okCount}`);
  console.log(`   Fallback local: ${fallbackCount}`);
  console.log('\n  Thống kê theo cấp:');
  for (const [lvl, s] of Object.entries(levelStats)) {
    if (s.ok + s.fallback > 0)
      console.log(`    ${lvl}: ${s.ok} AI ✓ / ${s.fallback} fallback`);
  }
  console.log(`\n  Xuất Excel: ${OUTPUT_XLSX}`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('✗ Lỗi:', err); process.exit(1); });
