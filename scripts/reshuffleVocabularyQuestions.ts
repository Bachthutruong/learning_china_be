import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Vocabulary, { IVocabulary, IQuestion } from '../src/models/Vocabulary';

dotenv.config();

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function reshuffleQuestion(q: IQuestion): IQuestion {
  const options = Array.isArray(q.options) ? [...q.options] : [];
  if (options.length < 2) return q;

  const original = q.correctAnswer;
  const correctIndices = Array.isArray(original)
    ? original.filter(i => typeof i === 'number' && i >= 0 && i < options.length)
    : typeof original === 'number' && original >= 0 && original < options.length
    ? [original]
    : [0];

  const items = options.map((value, idx) => ({
    value,
    isCorrect: correctIndices.includes(idx),
  }));

  shuffle(items);

  const newOptions = items.map(i => i.value);
  const newCorrectIndices: number[] = [];
  items.forEach((item, idx) => {
    if (item.isCorrect) newCorrectIndices.push(idx);
  });

  const newCorrect: number | number[] =
    Array.isArray(original) ? newCorrectIndices : (newCorrectIndices[0] ?? 0);

  return {
    ...q,
    options: newOptions,
    correctAnswer: newCorrect,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI không có trong .env, không thể kết nối DB.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  try {
    const total = await Vocabulary.countDocuments({ 'questions.0': { $exists: true } });
    console.log(`Tìm thấy ${total} từ có câu hỏi. Bắt đầu random lại đáp án đúng...`);

    const cursor = Vocabulary.find({ 'questions.0': { $exists: true } }).cursor();
    let scanned = 0;
    let updatedDocs = 0;
    let updatedQuestions = 0;

    for await (const doc of cursor as AsyncIterable<IVocabulary>) {
      scanned++;
      if (!Array.isArray(doc.questions) || doc.questions.length === 0) continue;

      let changed = false;
      const newQuestions: IQuestion[] = doc.questions.map(q => {
        const before = JSON.stringify({ options: q.options, correctAnswer: q.correctAnswer });
        const afterQ = reshuffleQuestion(q);
        const after = JSON.stringify({ options: afterQ.options, correctAnswer: afterQ.correctAnswer });
        if (before !== after) {
          changed = true;
          updatedQuestions++;
        }
        return afterQ;
      });

      if (changed) {
        doc.questions = newQuestions;
        await doc.save();
        updatedDocs++;
      }

      if (scanned % 200 === 0) {
        console.log(`  Đã xử lý ${scanned}/${total} từ... (cập nhật ${updatedDocs} từ, ${updatedQuestions} câu hỏi)`);
      }
    }

    console.log(`Hoàn tất. Đã quét ${scanned} từ, cập nhật ${updatedDocs} từ, ${updatedQuestions} câu hỏi.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

