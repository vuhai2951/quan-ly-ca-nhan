# 🌟 Ứng Dụng Quản Lý Cá Nhân

Ứng dụng web toàn diện giúp bạn quản lý cuộc sống cá nhân một cách hiệu quả với thiết kế responsive, hoạt động mượt mà trên cả desktop và mobile.

## ✨ Tính Năng Chính

### 💰 Quản Lý Chi Tiêu
- Theo dõi thu chi hàng ngày
- Phân loại chi tiêu theo danh mục
- Thống kê và báo cáo chi tiết
- Biểu đồ trực quan

### 📚 Quản Lý Học Tập
- Quản lý môn học và tín chỉ
- Thời khóa biểu tương tác
- Theo dõi bài tập và deadline
- Nhắc nhở học tập

### 💼 Lịch Làm Việc
- Lên lịch ca làm việc
- Tính lương theo giờ tự động
- Đồng bộ Google Calendar
- Thống kê thời gian làm việc

### 📝 Ghi Chú & Nhắc Nhở
- Tạo ghi chú với nhiều danh mục
- Đánh dấu mức độ ưu tiên
- Tạo nhắc nhở trên Google Calendar
- Tìm kiếm và lọc thông minh

### 📊 Dashboard Tổng Quan
- Hiển thị thống kê tổng quan
- Widget thông tin nhanh
- Biểu đồ và báo cáo
- Thao tác nhanh

## 🛠 Công Nghệ Sử Dụng

### Backend
- **Python 3.8+** - Ngôn ngữ lập trình chính
- **Flask** - Web framework nhẹ và linh hoạt
- **Supabase** - Database PostgreSQL cloud miễn phí
- **Flask-CORS** - Xử lý CORS

### Frontend
- **HTML5 & CSS3** - Cấu trúc và giao diện
- **Bootstrap 5** - Framework CSS responsive
- **Vanilla JavaScript** - Logic frontend
- **Chart.js** - Biểu đồ và thống kê
- **Font Awesome** - Icons đẹp

### Tích Hợp
- **Google Calendar API** - Đồng bộ lịch
- **Responsive Design** - Tương thích mọi thiết bị

## 🚀 Cài Đặt và Chạy

### Yêu Cầu Hệ Thống
- Python 3.8 trở lên
- Tài khoản Supabase (miễn phí)
- Trình duyệt web hiện đại

### 1. Clone Repository
```bash
git clone https://github.com/your-username/quan-ly-ca-nhan.git
cd quan-ly-ca-nhan
```

### 2. Cài Đặt Dependencies
```bash
pip install -r requirements.txt
```

### 3. Cấu Hình Environment
Tạo file `.env` và cập nhật thông tin:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your_secret_key_for_flask
FLASK_ENV=development
FLASK_DEBUG=True
```

### 4. Thiết Lập Database (Supabase)
1. Tạo tài khoản tại [supabase.com](https://supabase.com)
2. Tạo project mới
3. Copy URL và Anon Key vào file `.env`
4. Tạo các bảng sau trong SQL Editor:

```sql
-- Bảng chi tiêu
CREATE TABLE chi_tieu (
    id SERIAL PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    so_tien DECIMAL(15,2) NOT NULL,
    danh_muc VARCHAR(50) NOT NULL,
    mo_ta TEXT,
    ngay_chi DATE NOT NULL,
    ngay_tao TIMESTAMP DEFAULT NOW()
);

-- Bảng môn học
CREATE TABLE mon_hoc (
    id SERIAL PRIMARY KEY,
    ten_mon_hoc VARCHAR(255) NOT NULL,
    ma_mon_hoc VARCHAR(50),
    so_tin_chi INTEGER,
    giang_vien VARCHAR(255),
    ngay_tao TIMESTAMP DEFAULT NOW()
);

-- Bảng lịch làm việc
CREATE TABLE lich_lam_viec (
    id SERIAL PRIMARY KEY,
    ten_cong_viec VARCHAR(255) NOT NULL,
    ngay_lam DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    luong_gio DECIMAL(10,2),
    dia_diem VARCHAR(255),
    ghi_chu TEXT,
    ngay_tao TIMESTAMP DEFAULT NOW()
);

-- Bảng ghi chú
CREATE TABLE ghi_chu (
    id SERIAL PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT,
    danh_muc VARCHAR(50) DEFAULT 'ca-nhan',
    muc_do_uu_tien VARCHAR(20) DEFAULT 'trung-binh',
    quan_trong BOOLEAN DEFAULT FALSE,
    co_nhac_nho BOOLEAN DEFAULT FALSE,
    ngay_nhac_nho TIMESTAMP,
    ngay_tao TIMESTAMP DEFAULT NOW()
);
```

### 5. Chạy Ứng Dụng
```bash
python app.py
```

Truy cập http://localhost:5000 để sử dụng ứng dụng.

## 📱 Responsive Design

Ứng dụng được thiết kế responsive với:
- **Mobile (≤ 767px)**: Bottom navigation, UI tối ưu cho touch
- **Tablet (768px - 991px)**: Layout cân bằng 
- **Desktop (≥ 992px)**: Sidebar navigation, tận dụng không gian

## 🔧 Cấu Trúc Thư Mục

```
quan-ly-ca-nhan/
├── app.py                    # Flask application chính
├── supabase_config.py        # Cấu hình Supabase
├── requirements.txt          # Dependencies
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── README.md                # Tài liệu này
├── static/                  # Static files
│   ├── css/
│   │   └── style.css        # CSS tùy chỉnh
│   ├── js/
│   │   ├── trang_chu.js     # JavaScript trang chủ
│   │   ├── chi_tieu.js      # JavaScript chi tiêu
│   │   ├── hoc_tap.js       # JavaScript học tập
│   │   ├── cong_viec.js     # JavaScript công việc
│   │   └── ghi_chu.js       # JavaScript ghi chú
│   └── images/              # Hình ảnh
└── templates/               # HTML templates
    ├── base.html            # Template chính
    ├── trang_chu.html       # Dashboard
    ├── chi_tieu.html        # Quản lý chi tiêu
    ├── hoc_tap.html         # Quản lý học tập
    ├── cong_viec.html       # Lịch làm việc
    └── ghi_chu.html         # Ghi chú & nhắc nhở
```

## 🎯 Hướng Dẫn Sử Dụng

### Quản Lý Chi Tiêu
1. Vào trang "Chi Tiêu"
2. Nhấn "Thêm Chi Tiêu" 
3. Điền thông tin: tiêu đề, số tiền, danh mục
4. Xem thống kê và biểu đồ

### Quản Lý Học Tập
1. Thêm môn học trong tab "Môn Học"
2. Tạo thời khóa biểu trong tab "Lịch Học"
3. Quản lý bài tập trong tab "Bài Tập"

### Lịch Làm Việc
1. Thêm ca làm với thông tin: công việc, thời gian, lương/giờ
2. Xem lịch tháng với visual calendar
3. Theo dõi thống kê lương và giờ làm

### Ghi Chú & Nhắc Nhở
1. Tạo ghi chú với danh mục và mức độ ưu tiên
2. Đánh dấu quan trọng nếu cần
3. Tạo nhắc nhở trên Google Calendar

## 🔐 Bảo Mật

- Sử dụng biến môi trường cho sensitive data
- Validate dữ liệu đầu vào
- CORS protection
- Secure headers

## 🌟 Tính Năng Nổi Bật

- ✅ **100% Responsive** - Hoạt động hoàn hảo trên mọi thiết bị
- ✅ **Miễn Phí Hoàn Toàn** - Sử dụng các dịch vụ free tier
- ✅ **Giao Diện Thân Thiện** - Bootstrap 5 với custom CSS
- ✅ **Thống Kê Trực Quan** - Biểu đồ và báo cáo chi tiết
- ✅ **Tích Hợp Google** - Đồng bộ Calendar
- ✅ **Code Tiếng Việt** - Dễ hiểu và maintain

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Hãy:
1. Fork repository
2. Tạo branch tính năng (`git checkout -b tinh-nang-moi`)
3. Commit changes (`git commit -am 'Thêm tính năng mới'`)
4. Push branch (`git push origin tinh-nang-moi`)
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới [MIT License](LICENSE).

## 📞 Liên Hệ

- **Email**: your-email@example.com
- **GitHub**: [your-username](https://github.com/your-username)

---

⭐ **Nếu dự án hữu ích, hãy cho một star nhé!** ⭐
