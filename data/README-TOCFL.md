# TOCFL 5000 Từ vựng - Hướng dẫn Import

## Nguồn dữ liệu
Từ vựng được lấy từ: https://www.dailoan.vn/blog/tieng-trung-40/5000-tu-vung-tieng-trung-hoc-va-luyen-thi-tocfl-tu-band-a-den-band-c-181

## Cách sử dụng

### Bước 1: Tạo file Excel

**Cách A - Dùng AI (khuyến nghị, chất lượng cao):**
```bash
# Cần GEMINI_API_KEY trong .env
npm run seed:tocfl-ai              # Full 5000 từ (chạy lâu, tốn API)
npm run seed:tocfl-ai -- --limit=20   # Test 20 từ đầu
npm run seed:tocfl-ai -- --no-ai      # Bỏ qua API (khi hết quota), dùng fallback
npm run seed:tocfl-ai -- --force      # Chạy lại cả từ đã có trong DB (bỏ qua skip)
# Từ đã có trong DB sẽ tự động bỏ qua khi chạy lại (tiết kiệm API)
# Thử model khác (free tier cao hơn): GEMINI_MODEL=gemini-2.5-flash-lite npm run seed:tocfl-ai
```
- Format chuẩn như GPT [Từ vựng tiếng Trung](https://chatgpt.com/g/g-68df4fb4f1fc819199678e641a650e7b-tu-vung-tieng-trung)
- Ví dụ: 台灣繁體中文 + Pinyin + Nghĩa (3 câu/ từ)
- Từ đồng nghĩa/trái nghĩa: 漢字 (pinyin)
- 6 câu hỏi khảo bài chuẩn
- Khi hết quota (429): tự retry, thử model khác, fallback dữ liệu cơ bản

**Cách B - Bộ sinh local (không cần API, chính xác + đa dạng):**
```bash
cd learning_china_be

# Gen toàn bộ ~4920 từ (chạy nhanh, không tốn API)
npm run seed:tocfl-ai -- --no-ai

# Test trước với vài từ
npm run seed:tocfl-ai -- --no-ai --limit=50

# Gen từ vị trí X, giới hạn Y từ
npm run seed:tocfl-ai -- --no-ai --start=100 --limit=200
```
- Ví dụ + câu hỏi chọn theo **nhóm nghĩa** (chỗ ngồi, đồ vật, động từ, tính từ, địa điểm, gia đình, đồ ăn...)
- 6 câu hỏi đa dạng: nghĩa, pinyin, dịch 3 ví dụ, chọn chữ Hán
- Đáp án đúng **random A/B/C/D/E/F** (không mặc định A)
- Thêm từ chuẩn vào `data/tocfl-curated.json` để dùng ví dụ chính xác

### Bước 2: Import vào database
**Cách A - Import từ progress (khi đang seed AI):**
```bash
npm run import:tocfl-progress
```
- Import từ `tocfl-ai-progress.json` (dữ liệu đang gen)
- Trùng `word` thì chỉ import 1 lần (giữ bản cuối)

**Cách B - Import từ Excel:**
```bash
npm run import:tocfl
```
- Cần MongoDB đang chạy và `MONGODB_URI` trong `.env`
- Tự động tạo chủ đề mới nếu chưa có

**Cách C - Dùng giao diện Admin:**
1. Đăng nhập Admin
2. Vào **Kho từ vựng** > **Import Excel**
3. Chọn file `learning_china_be/data/tocfl-vocabulary-import.xlsx`

## Cấu trúc dữ liệu
- **Hán tự**: Chữ phồn thể (Traditional Chinese)
- **Pinyin**: Có dấu thanh
- **Chú âm**: Tự động chuyển từ Pinyin sang Zhuyin
- **Ví dụ**: Theo ngữ cảnh Đài Loan, tiếng Trung phồn thể
- **Cấp độ**: Map TOCFL Band A(1) → Band B(2) → Band C(3-6)
