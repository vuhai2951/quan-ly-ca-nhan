<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Hướng dẫn Copilot cho Dự án Quản Lý Cá Nhân

## Tổng quan dự án
Đây là ứng dụng web quản lý cá nhân được viết bằng Python Flask với Supabase làm database. Ứng dụng có thiết kế responsive cho cả desktop và mobile.

## Cấu trúc dự án
```
quan-ly-ca-nhan/
├── app.py                 # Flask application chính
├── supabase_config.py     # Cấu hình kết nối Supabase
├── templates/             # HTML templates
├── static/               # CSS, JS, images
└── requirements.txt      # Python dependencies
```

## Quy tắc coding

### Python (Backend)
- Sử dụng **tiếng Việt** cho tất cả comments, tên biến, tên hàm
- Encode file với UTF-8: `# -*- coding: utf-8 -*-`
- Tên hàm sử dụng snake_case với tiếng Việt: `tai_danh_sach_chi_tieu()`
- Tên biến sử dụng tiếng Việt: `danh_sach_chi_tieu`, `tong_chi_tieu`
- Docstrings bằng tiếng Việt
- Xử lý lỗi và log bằng tiếng Việt

### HTML Templates
- Sử dụng Bootstrap 5 cho responsive design
- Tất cả text, placeholder, label bằng tiếng Việt
- Tên class và ID sử dụng tiếng Việt với dấu gạch ngang: `chi-tieu`, `hoc-tap`
- Responsive breakpoints: mobile-first approach
- Icons sử dụng Font Awesome
- làm các nút đồng nhất 1 kiểu, không sử dụng hover nhiều , chỉ cần đổi màu sáng nhẹ khi chạm vào

### CSS
- File `static/css/style.css` chứa custom styles
- Sử dụng CSS variables cho colors và spacing
- Mobile-first responsive design
- Comment bằng tiếng Việt

### JavaScript
- Tên hàm và biến bằng tiếng Việt: `tai_du_lieu()`, `hien_thi_thong_bao()`
- Comment bằng tiếng Việt
- Async/await cho API calls
- Error handling với thông báo tiếng Việt

## Database (Supabase)
- Tên bảng: `chi_tieu`, `mon_hoc`, `lich_lam_viec`, `ghi_chu`
- Tên cột bằng tiếng Việt với underscore: `ngay_tao`, `so_tien`
- Sử dụng UUID cho primary keys
- Timestamps: `ngay_tao`, `ngay_cap_nhat`

## API Endpoints
- Prefix: `/api/`
- RESTful design: GET, POST, PUT, DELETE
- Response format JSON với `thanh_cong`, `du_lieu`, `loi`
- Error messages bằng tiếng Việt

## Chức năng chính
1. **Quản lý chi tiêu** (`/chi-tieu`)
2. **Quản lý học tập** (`/hoc-tap`) 
3. **Lịch làm việc** (`/cong-viec`)
4. **Ghi chú & nhắc nhở** (`/ghi-chu`)
5. **Dashboard tổng quan** (`/`)

## Responsive Design
- Mobile: <= 767px (bottom navigation)
- Tablet: 768px - 991px
- Desktop: >= 992px
- Bootstrap grid system
- Mobile-first CSS

## External Integrations
- **Google Calendar API**: Đồng bộ lịch làm việc và nhắc nhở
- **Chart.js**: Biểu đồ thống kê
- **Font Awesome**: Icons

## Development Guidelines
- Luôn kiểm tra responsive trên nhiều kích thước màn hình
- Xử lý lỗi gracefully với thông báo user-friendly
- Sử dụng loading states cho async operations
- Validate dữ liệu cả frontend và backend
- SEO-friendly URLs

## Example Code Patterns

### Flask Route
```python
@app.route('/api/chi-tieu', methods=['POST'])
def them_chi_tieu():
    """API thêm chi tiêu mới"""
    try:
        du_lieu = request.get_json()
        # Xử lý logic
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã thêm chi tiêu mới!'
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })
```

### JavaScript API Call
```javascript
async function them_chi_tieu() {
    try {
        const response = await fetch('/api/chi-tieu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(du_lieu)
        });
        const result = await response.json();
        if (result.thanh_cong) {
            hien_thi_thong_bao('Thành công!', 'success');
        }
    } catch (error) {
        hien_thi_thong_bao('Có lỗi xảy ra', 'error');
    }
}
```

Khi làm việc với dự án này, hãy luôn tuân thủ các quy tắc trên để đảm bảo tính nhất quán.
