# Database Seeding Scripts

Tài liệu hướng dẫn sử dụng các script seed dữ liệu cho hệ thống học tiếng Trung.

## 📋 Tổng quan

Hệ thống có 6 script seed chính:

1. **seed:data** - Seed dữ liệu cơ bản
2. **seed:advanced** - Seed dữ liệu nâng cao
3. **seed:complete** - Seed dữ liệu hoàn chỉnh (Khuyến nghị)
4. **seed:admin** - Seed tài khoản admin
5. **seed:master** - Chạy tất cả script một cách có tổ chức
6. **seed:all** - Chạy tất cả script cơ bản

## 🚀 Cách sử dụng

### 1. Seed dữ liệu cơ bản
```bash
npm run seed:data
```
**Tạo ra:**
- 8 topics (chủ đề)
- 6 levels (cấp độ)
- 10 users (người dùng)
- 30+ vocabularies (từ vựng)
- 3 tests (bài test)
- 3 proficiency tests (bài test năng lực)
- 2 competitions (cuộc thi)
- 3 reports (báo cáo)

### 2. Seed dữ liệu nâng cao
```bash
npm run seed:advanced
```
**Tạo ra:**
- 20+ vocabularies nâng cao
- 10 users bổ sung
- 3 tests nâng cao
- Competition results (kết quả thi đấu)
- Payment history (lịch sử thanh toán)
- Additional reports (báo cáo bổ sung)

### 3. Seed tài khoản admin
```bash
npm run seed:admin
```
**Tạo ra:**
- 1 admin user với quyền quản trị

### 4. Seed dữ liệu hoàn chỉnh (Khuyến nghị)
```bash
npm run seed:complete
```
**Tạo dữ liệu hoàn chỉnh cho tất cả tính năng**

### 5. Seed tất cả (Alternative)
```bash
npm run seed:master
```
**Chạy tất cả script theo thứ tự và báo cáo kết quả**

## 📊 Dữ liệu được tạo

### Topics (Chủ đề)
- Gia đình, Màu sắc, Thức ăn, Thời tiết
- Động vật, Công việc, Trường học, Du lịch

### Levels (Cấp độ)
- Mới bắt đầu (Level 1)
- Cơ bản (Level 2) 
- Trung cấp (Level 3)
- Nâng cao (Level 4)
- Thành thạo (Level 5)
- Chuyên gia (Level 6)

### Users (Người dùng)
- 20+ users với các cấp độ khác nhau
- Experience và coins khác nhau
- Streak khác nhau

### Vocabularies (Từ vựng)
- 50+ từ vựng từ cơ bản đến nâng cao
- Có pinyin, nghĩa, ví dụ
- Phân loại theo topics và levels

### Tests (Bài test)
- 6+ bài test với độ khó khác nhau
- Câu hỏi trắc nghiệm
- Thời gian và phần thưởng khác nhau

### Competitions (Cuộc thi)
- 2 cuộc thi với thời gian khác nhau
- Phần thưởng và quy tắc rõ ràng
- Kết quả thi đấu thực tế

### Reports (Báo cáo)
- 6+ báo cáo với trạng thái khác nhau
- Phân loại theo loại lỗi
- Có phần thưởng cho báo cáo được duyệt

## 🔧 Cấu hình

### Environment Variables
Đảm bảo file `.env` có các biến sau:
```env
MONGODB_URI=mongodb+srv://...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=Administrator
```

### Database
Script sẽ tự động:
- Xóa dữ liệu cũ (nếu có)
- Tạo dữ liệu mới
- Kết nối và đóng kết nối database

## 🎯 Kết quả mong đợi

Sau khi chạy `npm run seed:master`, bạn sẽ có:

### Admin Dashboard
- Thống kê đầy đủ về users, vocabularies, tests
- Dữ liệu thực tế thay vì hardcoded
- Analytics và báo cáo

### User Experience
- 20+ users để test
- Dữ liệu đa dạng cho tất cả tính năng
- Competitions và leaderboards

### Content Management
- 8 topics với màu sắc khác nhau
- 6 levels với yêu cầu experience
- 50+ vocabularies có cấu trúc đầy đủ

## 🚨 Lưu ý

1. **Backup dữ liệu** trước khi chạy seed nếu có dữ liệu quan trọng
2. **Kiểm tra kết nối database** trước khi chạy
3. **Chạy từng script riêng lẻ** nếu gặp lỗi
4. **Kiểm tra logs** để đảm bảo tất cả dữ liệu được tạo thành công

## 🔍 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MONGODB_URI trong .env
# Đảm bảo database server đang chạy
```

### Lỗi permission
```bash
# Đảm bảo có quyền ghi vào database
# Kiểm tra network connection
```

### Lỗi TypeScript
```bash
# Cài đặt dependencies
npm install

# Build project
npm run build
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console logs để xem lỗi cụ thể
2. Database connection
3. Environment variables
4. Dependencies đã cài đặt đầy đủ

---

**Chúc bạn seed dữ liệu thành công! 🎉**
