/**
 * Import TOCFL vocabulary từ file tocfl-ai-progress.json vào MongoDB
 * Trùng word thì chỉ import 1 lần (giữ bản cuối)
 *
 * Chạy: npm run import:tocfl-progress
 * Cần: MONGODB_URI trong .env
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import Vocabulary from '../src/models/Vocabulary';
import Topic from '../src/models/Topic';

dotenv.config();

async function main() {
  const progressPath = path.join(__dirname, '../data/tocfl-ai-progress.json');
  if (!fs.existsSync(progressPath)) {
    console.error('Không tìm thấy', progressPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(progressPath, 'utf-8');
  let data: { enriched?: any[] };
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('File JSON không hợp lệ');
    process.exit(1);
  }

  const enriched = data?.enriched;
  if (!Array.isArray(enriched) || enriched.length === 0) {
    console.error('Không có dữ liệu enriched trong file');
    process.exit(1);
  }

  const byWord = new Map<string, any>();
  for (const v of enriched) {
    const word = String(v?.word || '').trim();
    if (word) byWord.set(word, v);
  }
  const unique = Array.from(byWord.values());
  console.log(`Đọc ${enriched.length} từ, sau khi bỏ trùng còn ${unique.length} từ`);

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-china');
  console.log('Connected to MongoDB');

  let created = 0;
  let updated = 0;
  const createdTopics: string[] = [];

  for (let i = 0; i < unique.length; i++) {
    const v = unique[i];
    try {
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

      if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${unique.length}...`);
    } catch (e: any) {
      console.error(`  [${v.word}] Lỗi:`, e?.message || e);
    }
  }

  console.log('\n=== Import hoàn tất ===');
  console.log(`Tạo mới: ${created}`);
  console.log(`Cập nhật: ${updated}`);
  if (createdTopics.length > 0) {
    console.log(`Chủ đề mới: ${createdTopics.join(', ')}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
