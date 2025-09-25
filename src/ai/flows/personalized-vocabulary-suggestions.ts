import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';

const inputSchema = z.object({
  topic: z.string().describe('The topic for vocabulary suggestions'),
  keywords: z.string().describe('Additional keywords for suggestions')
});

const outputSchema = z.object({
  suggestedVocabulary: z.array(z.object({
    hanzi: z.string(),
    pinyin: z.string(),
    meaning: z.string(),
    partOfSpeech: z.string(),
    level: z.string(),
    examples: z.array(z.string())
  }))
});

export const personalizedVocabularySuggestions = defineFlow(
  {
    name: 'personalizedVocabularySuggestions',
    inputSchema,
    outputSchema
  },
  async (input: { topic: string; keywords: string }) => {
    // Mock AI suggestions based on topic and keywords
    const suggestions = generateVocabularySuggestions(input.topic, input.keywords);
    
    return {
      suggestedVocabulary: suggestions
    };
  }
);

// Export a simple function that can be called directly
export async function getPersonalizedVocabularySuggestions(input: { topic: string; keywords: string }) {
  const suggestions = generateVocabularySuggestions(input.topic, input.keywords);
  
  return {
    suggestedVocabulary: suggestions
  };
}

function generateVocabularySuggestions(topic: string, keywords: string): any[] {
  // Mock vocabulary database based on topics
  const vocabularyDatabase: Record<string, any[]> = {
    'gia đình': [
      { hanzi: '爸爸', pinyin: 'bàba', meaning: 'bố', partOfSpeech: 'noun', level: 'A', examples: ['我的爸爸很忙'] },
      { hanzi: '妈妈', pinyin: 'māma', meaning: 'mẹ', partOfSpeech: 'noun', level: 'A', examples: ['妈妈在做饭'] },
      { hanzi: '哥哥', pinyin: 'gēge', meaning: 'anh trai', partOfSpeech: 'noun', level: 'A', examples: ['我有一个哥哥'] },
      { hanzi: '姐姐', pinyin: 'jiějie', meaning: 'chị gái', partOfSpeech: 'noun', level: 'A', examples: ['姐姐很漂亮'] },
      { hanzi: '弟弟', pinyin: 'dìdi', meaning: 'em trai', partOfSpeech: 'noun', level: 'A', examples: ['弟弟在玩'] },
      { hanzi: '妹妹', pinyin: 'mèimei', meaning: 'em gái', partOfSpeech: 'noun', level: 'A', examples: ['妹妹很可爱'] },
      { hanzi: '爷爷', pinyin: 'yéye', meaning: 'ông nội', partOfSpeech: 'noun', level: 'A', examples: ['爷爷在看书'] },
      { hanzi: '奶奶', pinyin: 'nǎinai', meaning: 'bà nội', partOfSpeech: 'noun', level: 'A', examples: ['奶奶在做饭'] },
      { hanzi: '外公', pinyin: 'wàigōng', meaning: 'ông ngoại', partOfSpeech: 'noun', level: 'A', examples: ['外公很健康'] },
      { hanzi: '外婆', pinyin: 'wàipó', meaning: 'bà ngoại', partOfSpeech: 'noun', level: 'A', examples: ['外婆很慈祥'] }
    ],
    'màu sắc': [
      { hanzi: '红色', pinyin: 'hóngsè', meaning: 'màu đỏ', partOfSpeech: 'noun', level: 'A', examples: ['我喜欢红色'] },
      { hanzi: '蓝色', pinyin: 'lánsè', meaning: 'màu xanh dương', partOfSpeech: 'noun', level: 'A', examples: ['天空是蓝色的'] },
      { hanzi: '绿色', pinyin: 'lǜsè', meaning: 'màu xanh lá', partOfSpeech: 'noun', level: 'A', examples: ['草是绿色的'] },
      { hanzi: '黄色', pinyin: 'huángsè', meaning: 'màu vàng', partOfSpeech: 'noun', level: 'A', examples: ['太阳是黄色的'] },
      { hanzi: '黑色', pinyin: 'hēisè', meaning: 'màu đen', partOfSpeech: 'noun', level: 'A', examples: ['头发是黑色的'] },
      { hanzi: '白色', pinyin: 'báisè', meaning: 'màu trắng', partOfSpeech: 'noun', level: 'A', examples: ['雪是白色的'] },
      { hanzi: '紫色', pinyin: 'zǐsè', meaning: 'màu tím', partOfSpeech: 'noun', level: 'A', examples: ['花是紫色的'] },
      { hanzi: '橙色', pinyin: 'chéngsè', meaning: 'màu cam', partOfSpeech: 'noun', level: 'A', examples: ['橘子是橙色的'] },
      { hanzi: '粉色', pinyin: 'fěnsè', meaning: 'màu hồng', partOfSpeech: 'noun', level: 'A', examples: ['花是粉色的'] },
      { hanzi: '灰色', pinyin: 'huīsè', meaning: 'màu xám', partOfSpeech: 'noun', level: 'A', examples: ['云是灰色的'] }
    ],
    'thức ăn': [
      { hanzi: '米饭', pinyin: 'mǐfàn', meaning: 'cơm', partOfSpeech: 'noun', level: 'A', examples: ['我吃米饭'] },
      { hanzi: '面条', pinyin: 'miàntiáo', meaning: 'mì', partOfSpeech: 'noun', level: 'A', examples: ['我喜欢吃面条'] },
      { hanzi: '包子', pinyin: 'bāozi', meaning: 'bánh bao', partOfSpeech: 'noun', level: 'A', examples: ['包子很好吃'] },
      { hanzi: '饺子', pinyin: 'jiǎozi', meaning: 'bánh chẻo', partOfSpeech: 'noun', level: 'A', examples: ['饺子是传统食物'] },
      { hanzi: '汤', pinyin: 'tāng', meaning: 'canh', partOfSpeech: 'noun', level: 'A', examples: ['汤很热'] },
      { hanzi: '菜', pinyin: 'cài', meaning: 'rau', partOfSpeech: 'noun', level: 'A', examples: ['菜很新鲜'] },
      { hanzi: '肉', pinyin: 'ròu', meaning: 'thịt', partOfSpeech: 'noun', level: 'A', examples: ['肉很香'] },
      { hanzi: '鱼', pinyin: 'yú', meaning: 'cá', partOfSpeech: 'noun', level: 'A', examples: ['鱼很新鲜'] },
      { hanzi: '水果', pinyin: 'shuǐguǒ', meaning: 'trái cây', partOfSpeech: 'noun', level: 'A', examples: ['水果很甜'] },
      { hanzi: '茶', pinyin: 'chá', meaning: 'trà', partOfSpeech: 'noun', level: 'A', examples: ['茶很香'] }
    ],
    'Tùy chỉnh': [
      { hanzi: '学习', pinyin: 'xuéxí', meaning: 'học tập', partOfSpeech: 'verb', level: 'A', examples: ['我在学习中文'] },
      { hanzi: '工作', pinyin: 'gōngzuò', meaning: 'làm việc', partOfSpeech: 'verb', level: 'A', examples: ['我在工作'] },
      { hanzi: '睡觉', pinyin: 'shuìjiào', meaning: 'ngủ', partOfSpeech: 'verb', level: 'A', examples: ['我要睡觉'] },
      { hanzi: '吃饭', pinyin: 'chīfàn', meaning: 'ăn cơm', partOfSpeech: 'verb', level: 'A', examples: ['我要吃饭'] },
      { hanzi: '喝水', pinyin: 'hēshuǐ', meaning: 'uống nước', partOfSpeech: 'verb', level: 'A', examples: ['我要喝水'] },
      { hanzi: '看书', pinyin: 'kànshū', meaning: 'đọc sách', partOfSpeech: 'verb', level: 'A', examples: ['我喜欢看书'] },
      { hanzi: '听音乐', pinyin: 'tīngyīnyuè', meaning: 'nghe nhạc', partOfSpeech: 'verb', level: 'A', examples: ['我喜欢听音乐'] },
      { hanzi: '看电影', pinyin: 'kàndiànyǐng', meaning: 'xem phim', partOfSpeech: 'verb', level: 'A', examples: ['我喜欢看电影'] },
      { hanzi: '运动', pinyin: 'yùndòng', meaning: 'tập thể dục', partOfSpeech: 'verb', level: 'A', examples: ['我喜欢运动'] },
      { hanzi: '旅游', pinyin: 'lǚyóu', meaning: 'du lịch', partOfSpeech: 'verb', level: 'A', examples: ['我喜欢旅游'] }
    ]
  };

  // Get suggestions based on topic
  let suggestions = vocabularyDatabase[topic] || vocabularyDatabase['Tùy chỉnh'];
  
  // If keywords are provided, try to find related vocabulary
  if (keywords && keywords.trim()) {
    const keywordSuggestions = vocabularyDatabase['Tùy chỉnh'].filter(vocab => 
      vocab.meaning.toLowerCase().includes(keywords.toLowerCase()) ||
      vocab.hanzi.includes(keywords) ||
      vocab.pinyin.includes(keywords.toLowerCase())
    );
    
    if (keywordSuggestions.length > 0) {
      suggestions = keywordSuggestions.slice(0, 10);
    }
  }
  
  // Return 10 random suggestions
  return suggestions.slice(0, 10);
}
