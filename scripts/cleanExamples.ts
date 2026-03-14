/**
 * Script dọn dữ liệu DB hiện tại:
 * 1. Xóa tiền tố [Đơn giản] / [Phức tạp] / 台灣繁體中文: khỏi tất cả ví dụ
 * 2. Giữ tối đa 2 ví dụ mỗi từ (bỏ ví dụ thứ 3 nếu có)
 * (Câu hỏi khảo bài GIỮ NGUYÊN — không xóa)
 *
 * Cách dùng:
 *   npm run clean:examples          # Dọn toàn bộ DB
 *   npm run clean:examples -- --dry-run   # Xem trước, không ghi vào DB
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Vocabulary from '../src/models/Vocabulary';

dotenv.config();

function cleanExample(ex: string): string {
  return ex
    .replace(/^\[Đơn giản\]\s*/i, '')
    .replace(/^\[Phức tạp\]\s*/i, '')
    .replace(/^台灣繁體中文:\s*/i, '')
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
  console.log('Đang xử lý...\n');

  const cursor = Vocabulary.find().cursor();
  let processed = 0;
  let changed = 0;
  let examplesCleaned = 0;
  let examplesTrimmed = 0;

  for await (const vocab of cursor) {
    processed++;
    let dirty = false;

    // 1. Dọn tiền tố ví dụ + giới hạn 2 ví dụ
    if (vocab.examples && vocab.examples.length > 0) {
      const cleaned = vocab.examples
        .map(cleanExample)
        .filter(Boolean);

      const hadPrefix = vocab.examples.some(e =>
        /^\[Đơn giản\]|^\[Phức tạp\]|^台灣繁體中文:/i.test(e)
      );
      if (hadPrefix) examplesCleaned++;

      const trimmed = cleaned.slice(0, 2);
      if (cleaned.length > 2) examplesTrimmed++;

      if (JSON.stringify(vocab.examples) !== JSON.stringify(trimmed)) {
        vocab.examples = trimmed;
        dirty = true;
      }
    }

    if (dirty) {
      changed++;
      if (!isDryRun) {
        await vocab.save();
      }
      if (changed <= 5 || changed % 100 === 0) {
        console.log(`  [${processed}] ${vocab.word} — ví dụ: ${JSON.stringify(vocab.examples?.slice(0,1))?.slice(0,60)}...`);
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
  console.log(`   Từ có thay đổi  : ${changed}`);
  console.log(`   Xóa tiền tố     : ${examplesCleaned} từ`);
  console.log(`   Cắt bớt ví dụ   : ${examplesTrimmed} từ (giữ tối đa 2)`);
  if (isDryRun) console.log('\n  Chạy lại không có --dry-run để áp dụng thật.');
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('✗ Lỗi:', err); process.exit(1); });
