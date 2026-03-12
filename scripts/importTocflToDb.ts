/**
 * Import TOCFL vocabulary from generated Excel into MongoDB
 * Run after: npm run seed:tocfl
 * Requires: MONGODB_URI in .env
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import Vocabulary from '../src/models/Vocabulary';
import Topic from '../src/models/Topic';

dotenv.config();

async function main() {
  const excelPath = path.join(__dirname, '../data/tocfl-vocabulary-import.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('Excel file not found. Run: npm run seed:tocfl');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-china');
  console.log('Connected to MongoDB');

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  let created = 0;
  let updated = 0;
  const errors: Array<{ row: number; message: string }> = [];
  const createdTopics: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const word = String(row.word || '').trim();
      const pinyin = String(row.pinyin || '').trim();
      const zhuyin = String(row.zhuyin || row['zhuyin (optional)'] || '').trim();
      const meaning = String(row.meaning || '').trim();
      const partOfSpeech = String(row.partOfSpeech || 'noun').trim();
      const level = Math.min(6, Math.max(1, Number(row.level) || 1));
      const topicsRaw = String(row.topics || row['topics (comma-separated)'] || 'TOCFL').trim();
      const topics = topicsRaw.split(',').map((t: string) => t.trim()).filter(Boolean);
      const examples = String(row.examples || row['examples (|| separated)'] || '')
        .split('||').map((t: string) => t.trim()).filter(Boolean);
      const synonyms = String(row.synonyms || row['synonyms (|| separated)'] || '')
        .split('||').map((t: string) => t.trim()).filter(Boolean);
      const antonyms = String(row.antonyms || row['antonyms (|| separated)'] || '')
        .split('||').map((t: string) => t.trim()).filter(Boolean);
      let questions: any[] = [];
      const qRaw = String(row.questions || row['questions JSON (optional)'] || '').trim();
      if (qRaw) {
        try {
          const parsed = JSON.parse(qRaw);
          if (Array.isArray(parsed)) questions = parsed;
        } catch (_) {}
      }

      if (!word || !pinyin || !meaning || !partOfSpeech) {
        throw new Error('Thiếu trường bắt buộc');
      }

      if (topics.length === 0) topics.push('TOCFL');

      // Auto-create topics
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

      const existing = await Vocabulary.findOne({ word });
      if (existing) {
        existing.pinyin = pinyin;
        existing.zhuyin = zhuyin;
        existing.meaning = meaning;
        existing.partOfSpeech = partOfSpeech;
        existing.level = level;
        existing.topics = topics;
        existing.examples = examples;
        existing.synonyms = synonyms;
        existing.antonyms = antonyms;
        if (questions.length > 0) existing.questions = questions;
        await existing.save();
        updated++;
      } else {
        await Vocabulary.create({
          word,
          pinyin,
          zhuyin: zhuyin || undefined,
          meaning,
          partOfSpeech,
          level,
          topics,
          examples,
          synonyms,
          antonyms,
          questions,
        });
        created++;
      }

      if ((i + 1) % 500 === 0) console.log(`Processed ${i + 1}/${rows.length}...`);
    } catch (e: any) {
      errors.push({ row: i + 2, message: e?.message || 'Lỗi không rõ' });
    }
  }

  console.log('\n=== Import hoàn tất ===');
  console.log(`Tạo mới: ${created}`);
  console.log(`Cập nhật: ${updated}`);
  console.log(`Lỗi: ${errors.length}`);
  if (createdTopics.length > 0) {
    console.log(`Chủ đề mới: ${createdTopics.join(', ')}`);
  }
  if (errors.length > 0 && errors.length <= 20) {
    errors.forEach(e => console.error(`  Dòng ${e.row}: ${e.message}`));
  } else if (errors.length > 20) {
    console.error('  (Xem chi tiết lỗi trong mảng errors)');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
