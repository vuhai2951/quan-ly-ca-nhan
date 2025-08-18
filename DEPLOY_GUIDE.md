# Hướng dẫn Deploy Web App Quản Lý Cá Nhân

## 🚀 Deploy lên Render.com (Miễn phí)

### Bước 1: Tạo Repository GitHub
1. Đăng ký/đăng nhập GitHub
2. Tạo repository mới: `quan-ly-ca-nhan`
3. Upload tất cả code lên GitHub

### Bước 2: Đăng ký Render.com
1. Truy cập https://render.com
2. Đăng ký bằng GitHub account
3. Connect với GitHub repository

### Bước 3: Tạo Web Service
1. Chọn "New" → "Web Service"
2. Connect repository `quan-ly-ca-nhan`
3. Cấu hình:
   - **Name**: quan-ly-ca-nhan
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`

### Bước 4: Cấu hình Environment Variables
Trong Render dashboard, thêm các biến môi trường:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your_secret_key_here
FLASK_ENV=production
PORT=10000
```

### Bước 5: Deploy
- Render sẽ tự động build và deploy
- Thời gian build: 2-5 phút
- Sẽ có URL dạng: `https://quan-ly-ca-nhan.onrender.com`

---

## 🛡️ Deploy lên Railway (Trả phí $5/tháng)

### Bước 1: Đăng ký Railway
1. Truy cập https://railway.app
2. Đăng ký bằng GitHub

### Bước 2: Deploy
1. Chọn "Deploy from GitHub repo"
2. Chọn repository
3. Railway tự động detect Python app
4. Thêm environment variables
5. Deploy!

---

## ☁️ Deploy lên Heroku (Trả phí)

### Bước 1: Cài đặt Heroku CLI
```bash
# Windows
# Download từ https://devcenter.heroku.com/articles/heroku-cli
```

### Bước 2: Login và tạo app
```bash
heroku login
heroku create quan-ly-ca-nhan
```

### Bước 3: Tạo Procfile
```
web: python app.py
```

### Bước 4: Deploy
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

## 📱 Tùy chọn khác: Cloudflare Pages + Workers

Dành cho người có kỹ thuật cao, cần convert Flask thành serverless functions.

---

## 🔧 Checklist trước khi deploy

- [x] Code đã được test kỹ
- [x] Database Supabase đã setup
- [x] Environment variables đã chuẩn bị
- [x] requirements.txt đầy đủ
- [x] app.py đã config production
- [ ] Domain tùy chỉnh (optional)
- [ ] SSL certificate (auto)
- [ ] Backup database strategy

## 💡 Lưu ý quan trọng

1. **Supabase**: Dùng chung database cho dev và prod
2. **Environment Variables**: Phải giữ bí mật
3. **Free Tier**: Render có giới hạn 750 giờ/tháng
4. **Domain**: Có thể mua domain riêng và point về app
5. **SSL**: Tự động có HTTPS

## 🎯 Khuyến nghị

**Cho người mới**: Dùng Render.com (miễn phí, dễ)
**Cho dự án nghiêm túc**: Railway hoặc Heroku (trả phí, ổn định)
**Cho developer cao cấp**: Self-hosted VPS
