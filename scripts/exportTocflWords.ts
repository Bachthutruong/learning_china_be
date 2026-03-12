import * as fs from 'fs';
import * as path from 'path';

function parseVocabularyTable(content: string): Array<{ word: string }> {
  const lines = content.split('\n');
  const vocab: Array<{ word: string }> = [];
  const rowRegex = /^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/;

  for (const line of lines) {
    const match = line.match(rowRegex);
    if (match) {
      const word = match[1].trim();
      if (word) {
        vocab.push({ word });
      }
    }
  }

  return vocab;
}

async function main() {
  const sourcePath = path.join(__dirname, '../data/tocfl-vocabulary-source.txt');
  const outputPath = path.join(__dirname, '../data/tocfl-words.txt');

  if (!fs.existsSync(sourcePath)) {
    console.error('Không tìm thấy', sourcePath);
    process.exit(1);
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const vocab = parseVocabularyTable(content);
  const words = vocab.map(v => v.word).join(', ');

  fs.writeFileSync(outputPath, words, 'utf-8');

  console.log(`Đã xuất ${vocab.length} từ vào: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

