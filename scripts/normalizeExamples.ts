/**
 * Chuẩn hóa tất cả ví dụ trong DB: đảm bảo Pinyin và Nghĩa xuống dòng.
 * Thay " Pinyin:" -> "\nPinyin:", " Nghĩa:" -> "\nNghĩa:" để hiển thị dễ kiểm tra ở admin.
 *
 * Cách dùng:
 *   npm run normalize:examples           # Chuẩn hóa toàn bộ DB
 *   npm run normalize:examples -- --dry-run   # Xem trước, không ghi vào DB
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Vocabulary from '../src/models/Vocabulary';

dotenv.config();

function normalizeExample(ex: string): string {
  if (!ex || typeof ex !== 'string') return ex;
  return ex
    .replace(/\s+Pinyin:\s*/g, '\nPinyin: ')
    .replace(/\s+Nghĩa:\s*/g, '\nNghĩa: ')
    .trim();
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGODB_URI) {
    console.error('✗ Cần MONGODB_URI trong .env');
    process.exit(1);
  }

  console.log(`${isDryRun ? '[DRY RUN] ' : ''}Kết nối DB...`);
  await mongoose.connect(process.env.MONGODB_URI);

  const total = await Vocabulary.countDocuments();
  console.log(`Tổng số từ vựng: ${total}`);
  console.log('Đang chuẩn hóa ví dụ (Pinyin / Nghĩa xuống dòng)...\n');

  const cursor = Vocabulary.find().cursor();
  let processed = 0;
  let changed = 0;

  for await (const vocab of cursor) {
    processed++;

    if (!vocab.examples || vocab.examples.length === 0) continue;

    const normalized = vocab.examples.map(normalizeExample);
    const hasChange = normalized.some((n, i) => n !== vocab.examples![i]);

    if (hasChange) {
      changed++;
      vocab.examples = normalized;
      if (!isDryRun) {
        await vocab.save();
      }
      if (changed <= 10 || changed % 100 === 0) {
        console.log(`  [${processed}] ${vocab.word} — đã chuẩn hóa ${vocab.examples.length} ví dụ`);
      }
    }

    if (processed % 500 === 0) {
      process.stdout.write(`  Đã quét: ${processed}/${total}...\r`);
    }
  }

  await mongoose.disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log(`${isDryRun ? '[DRY RUN] ' : ''}✅ Hoàn tất!`);
  console.log(`   Tổng quét       : ${processed} từ`);
  console.log(`   Từ có cập nhật  : ${changed} (ví dụ đã xuống dòng Pinyin / Nghĩa)`);
  if (isDryRun) console.log('\n  Chạy lại không có --dry-run để áp dụng thật.');
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('✗ Lỗi:', err); process.exit(1); });
