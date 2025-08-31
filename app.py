# -*- coding: utf-8 -*-
"""
Ứng dụng quản lý cá nhân với Flask và SQLite
Phiên bản 2.0 - Standalone với SQLAlchemy
"""

import os
import uuid
import bcrypt
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, send_from_directory
from datetime import datetime, timedelta, date
from flask_cors import CORS
from functools import wraps

# Import database config và models
from database_config import init_database, db, test_connection
from models import *

app = Flask(__name__)
CORS(app)

# Cấu hình session
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'quan-ly-ca-nhan-secret-key-2024')
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

# Khởi tạo database
database = init_database(app)

# Kiểm tra kết nối database
with app.app_context():
    if test_connection():
        print("✅ Kết nối SQLite thành công!")
    else:
        print("❌ Lỗi kết nối SQLite!")

# ================================
# AUTHENTICATION & SESSION MANAGEMENT
# ================================

def yeu_cau_dang_nhap(f):
    """Decorator yêu cầu đăng nhập để truy cập"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not kiem_tra_da_dang_nhap():
            if request.is_json:
                return jsonify({
                    'thanh_cong': False,
                    'loi': 'Cần đăng nhập để truy cập',
                    'redirect_url': '/dang-nhap'
                }), 401
            else:
                return redirect(url_for('dang_nhap'))
        return f(*args, **kwargs)
    return decorated_function

def kiem_tra_da_dang_nhap():
    """Kiểm tra xem người dùng đã đăng nhập chưa"""
    return 'nguoi_dung_id' in session and session.get('nguoi_dung_id') is not None

def lay_thong_tin_nguoi_dung_hien_tai():
    """Lấy thông tin người dùng hiện tại từ session"""
    if not kiem_tra_da_dang_nhap():
        return None
    
    try:
        nguoi_dung_id = session.get('nguoi_dung_id')
        nguoi_dung = NguoiDung.query.get(nguoi_dung_id)
        return nguoi_dung
    except Exception as e:
        print(f"Lỗi lấy thông tin người dùng: {e}")
        return None

def tao_phien_dang_nhap(nguoi_dung_id, ghi_nho=False):
    """Tạo phiên đăng nhập mới"""
    try:
        phien_id = str(uuid.uuid4())
        ngay_het_han = datetime.now() + timedelta(days=30 if ghi_nho else 1)
        
        # Lưu phiên vào database
        phien = PhienDangNhap(
            id=phien_id,
            nguoi_dung_id=nguoi_dung_id,
            du_lieu_phien={'ghi_nho': ghi_nho},
            ngay_het_han=ngay_het_han,
            hoat_dong=True
        )
        db.session.add(phien)
        
        # Lưu thông tin vào session
        session['nguoi_dung_id'] = nguoi_dung_id
        session['phien_id'] = phien_id
        session['ghi_nho'] = ghi_nho
        session.permanent = ghi_nho
        
        # Cập nhật lần đăng nhập cuối
        nguoi_dung = NguoiDung.query.get(nguoi_dung_id)
        nguoi_dung.lan_dang_nhap_cuoi = datetime.now()
        
        db.session.commit()
        return True
    except Exception as e:
        print(f"Lỗi tạo phiên đăng nhập: {e}")
        db.session.rollback()
        return False

def xoa_phien_dang_nhap():
    """Xóa phiên đăng nhập hiện tại"""
    try:
        if 'phien_id' in session:
            # Vô hiệu hóa phiên trong database
            phien = PhienDangNhap.query.get(session['phien_id'])
            if phien:
                phien.hoat_dong = False
                db.session.commit()
        
        # Xóa session
        session.clear()
        return True
    except Exception as e:
        print(f"Lỗi xóa phiên đăng nhập: {e}")
        return False

# ================================
# ROUTES
# ================================

@app.route('/dang-nhap', methods=['GET'])
def dang_nhap():
    """Trang đăng nhập"""
    if kiem_tra_da_dang_nhap():
        return redirect(url_for('trang_chu'))
    return render_template('dang_nhap.html')

@app.route('/api/dang-nhap', methods=['POST'])
def api_dang_nhap():
    """API xử lý đăng nhập"""
    try:
        du_lieu = request.get_json()
        ten_dang_nhap = du_lieu.get('ten_dang_nhap', '').strip()
        mat_khau = du_lieu.get('mat_khau', '')
        ghi_nho = du_lieu.get('ghi_nho', False)
        
        # Validate dữ liệu đầu vào
        if not ten_dang_nhap or not mat_khau:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
            })
        
        # Tìm người dùng trong database
        nguoi_dung = NguoiDung.query.filter_by(ten_dang_nhap=ten_dang_nhap).first()
        
        if not nguoi_dung:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tên đăng nhập hoặc mật khẩu không đúng'
            })
        
        # Kiểm tra trạng thái tài khoản
        if nguoi_dung.trang_thai != 'hoat_dong':
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên'
            })
        
        # Kiểm tra mật khẩu
        mat_khau_hash = nguoi_dung.mat_khau.encode('utf-8')
        if not bcrypt.checkpw(mat_khau.encode('utf-8'), mat_khau_hash):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tên đăng nhập hoặc mật khẩu không đúng'
            })
        
        # Tạo phiên đăng nhập
        if tao_phien_dang_nhap(nguoi_dung.id, ghi_nho):
            return jsonify({
                'thanh_cong': True,
                'thong_bao': f'Chào mừng {nguoi_dung.ten_hien_thi}!',
                'nguoi_dung': {
                    'id': nguoi_dung.id,
                    'ten_dang_nhap': nguoi_dung.ten_dang_nhap,
                    'ten_hien_thi': nguoi_dung.ten_hien_thi,
                    'email': nguoi_dung.email
                },
                'redirect_url': '/'
            })
        else:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không thể tạo phiên đăng nhập. Vui lòng thử lại'
            })
        
    except Exception as e:
        print(f"Lỗi API đăng nhập: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': 'Có lỗi hệ thống. Vui lòng thử lại sau'
        })

@app.route('/api/dang-xuat', methods=['POST'])
@yeu_cau_dang_nhap
def api_dang_xuat():
    """API đăng xuất"""
    try:
        if xoa_phien_dang_nhap():
            return jsonify({
                'thanh_cong': True,
                'thong_bao': 'Đã đăng xuất thành công',
                'redirect_url': '/dang-nhap'
            })
        else:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Có lỗi khi đăng xuất'
            })
    except Exception as e:
        print(f"Lỗi API đăng xuất: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': 'Có lỗi hệ thống'
        })

# Main route
@app.route('/')
@yeu_cau_dang_nhap
def trang_chu():
    """Trang chủ ứng dụng"""
    return render_template('trang_chu.html')

# Routes cho các trang
@app.route('/chi-tieu')
@yeu_cau_dang_nhap
def chi_tieu():
    """Trang quản lý chi tiêu"""
    return render_template('chi_tieu.html')

@app.route('/hoc-tap')
@yeu_cau_dang_nhap
def hoc_tap():
    """Trang quản lý học tập"""
    return render_template('hoc_tap.html')

@app.route('/cong-viec')
@yeu_cau_dang_nhap
def cong_viec():
    """Trang quản lý công việc"""
    return render_template('cong_viec.html')

@app.route('/ghi-chu')
@yeu_cau_dang_nhap
def ghi_chu():
    """Trang ghi chú"""
    return render_template('ghi_chu.html')

@app.route('/cai-dat')
@yeu_cau_dang_nhap
def cai_dat():
    """Trang cài đặt"""
    return render_template('cai_dat.html')

# ================================
# API EXAMPLES (Thu Chi)
# ================================

@app.route('/api/thu-chi', methods=['GET'])
@yeu_cau_dang_nhap
def lay_danh_sach_thu_chi():
    """API lấy danh sách thu chi"""
    try:
        nguoi_dung = lay_thong_tin_nguoi_dung_hien_tai()
        if not nguoi_dung:
            return jsonify({'thanh_cong': False, 'loi': 'Không tìm thấy người dùng'})
        
        # Query với SQLAlchemy
        query = ThuChi.query.filter_by(nguoi_dung_id=nguoi_dung.id)
        
        # Filters
        loai = request.args.get('loai')
        if loai:
            query = query.filter_by(loai=loai)
        
        danh_muc = request.args.get('danh_muc')
        if danh_muc:
            query = query.filter_by(danh_muc=danh_muc)
        
        tu_ngay = request.args.get('tu_ngay')
        if tu_ngay:
            query = query.filter(ThuChi.ngay_giao_dich >= tu_ngay)
        
        den_ngay = request.args.get('den_ngay')
        if den_ngay:
            query = query.filter(ThuChi.ngay_giao_dich <= den_ngay)
        
        # Lấy kết quả
        thu_chi_list = query.order_by(ThuChi.ngay_giao_dich.desc()).all()
        
        # Convert to dict
        result = []
        for item in thu_chi_list:
            result.append({
                'id': item.id,
                'loai': item.loai,
                'tieu_de': item.tieu_de,
                'so_tien': float(item.so_tien),
                'danh_muc': item.danh_muc,
                'ngay_giao_dich': item.ngay_giao_dich.isoformat(),
                'mo_ta': item.mo_ta,
                'ngay_tao': item.ngay_tao.isoformat()
            })
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': result
        })
        
    except Exception as e:
        print(f"Lỗi API thu chi: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/thu-chi', methods=['POST'])
@yeu_cau_dang_nhap
def them_thu_chi():
    """API thêm thu chi mới"""
    try:
        nguoi_dung = lay_thong_tin_nguoi_dung_hien_tai()
        if not nguoi_dung:
            return jsonify({'thanh_cong': False, 'loi': 'Không tìm thấy người dùng'})
        
        du_lieu = request.get_json()
        
        # Validate
        if not du_lieu.get('tieu_de'):
            return jsonify({'thanh_cong': False, 'loi': 'Tiêu đề là bắt buộc'})
        
        if not du_lieu.get('so_tien'):
            return jsonify({'thanh_cong': False, 'loi': 'Số tiền là bắt buộc'})
        
        if not du_lieu.get('loai') or du_lieu['loai'] not in ['thu', 'chi']:
            return jsonify({'thanh_cong': False, 'loi': 'Loại giao dịch phải là "thu" hoặc "chi"'})
        
        # Tạo record mới
        thu_chi = ThuChi(
            loai=du_lieu['loai'],
            tieu_de=du_lieu['tieu_de'],
            so_tien=float(du_lieu['so_tien']),
            danh_muc=du_lieu.get('danh_muc', 'khac'),
            ngay_giao_dich=datetime.strptime(du_lieu.get('ngay_giao_dich', datetime.now().date().isoformat()), '%Y-%m-%d').date(),
            mo_ta=du_lieu.get('mo_ta', ''),
            nguoi_dung_id=nguoi_dung.id
        )
        
        db.session.add(thu_chi)
        db.session.commit()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': {
                'id': thu_chi.id,
                'loai': thu_chi.loai,
                'tieu_de': thu_chi.tieu_de,
                'so_tien': float(thu_chi.so_tien),
                'danh_muc': thu_chi.danh_muc,
                'ngay_giao_dich': thu_chi.ngay_giao_dich.isoformat(),
                'mo_ta': thu_chi.mo_ta
            },
            'thong_bao': f'Đã thêm {"thu nhập" if du_lieu["loai"] == "thu" else "chi tiêu"} mới!'
        })
        
    except Exception as e:
        print(f"Lỗi API thêm thu chi: {e}")
        db.session.rollback()
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# HEALTH CHECK
# ================================

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        with app.app_context():
            db.session.execute('SELECT 1')
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# ================================
# API KIỂM TRA ĐĂNG NHẬP
# ================================

@app.route('/api/kiem-tra-dang-nhap', methods=['GET'])
def api_kiem_tra_dang_nhap():
    """API kiểm tra trạng thái đăng nhập"""
    if kiem_tra_da_dang_nhap():
        nguoi_dung = lay_thong_tin_nguoi_dung_hien_tai()
        if nguoi_dung:
            return jsonify({
                'da_dang_nhap': True,
                'nguoi_dung': {
                    'id': nguoi_dung.id,
                    'ten_dang_nhap': nguoi_dung.ten_dang_nhap,
                    'ten_hien_thi': nguoi_dung.ten_hien_thi,
                    'email': nguoi_dung.email
                }
            })
        else:
            return jsonify({
                'da_dang_nhap': False,
                'nguoi_dung': None
            })
    else:
        return jsonify({
            'da_dang_nhap': False,
            'nguoi_dung': None
        })

# ================================
# API THỐNG KÊ THU CHI
# ================================

@app.route('/api/thu-chi/thong-ke', methods=['GET'])
def lay_thong_ke_thu_chi():
    """API lấy thống kê thu chi theo tháng/năm và hôm nay"""
    try:
        from datetime import date, timedelta
        
        # Lấy ngày hôm nay
        hom_nay = date.today()
        thang_hien_tai = hom_nay.month
        nam_hien_tai = hom_nay.year
        
        # Lấy dữ liệu tháng này
        thang_data = ThuChi.query.filter(
            ThuChi.ngay_giao_dich >= date(nam_hien_tai, thang_hien_tai, 1),
            ThuChi.ngay_giao_dich <= date(nam_hien_tai, thang_hien_tai, 31)
        ).all()
        
        # Lấy dữ liệu hôm nay  
        hom_nay_data = ThuChi.query.filter_by(ngay_giao_dich=hom_nay).all()
        
        # Tính toán thống kê
        thong_ke = {
            'thang_hien_tai': {
                'tong_thu': sum(float(item.so_tien) for item in thang_data if item.loai == 'thu'),
                'tong_chi': sum(float(item.so_tien) for item in thang_data if item.loai == 'chi'),
                'so_giao_dich': len(thang_data)
            },
            'hom_nay': {
                'tong_thu': sum(float(item.so_tien) for item in hom_nay_data if item.loai == 'thu'),
                'tong_chi': sum(float(item.so_tien) for item in hom_nay_data if item.loai == 'chi'),
                'so_giao_dich': len(hom_nay_data)
            }
        }
        
        # Tính số dư
        thong_ke['thang_hien_tai']['so_du'] = thong_ke['thang_hien_tai']['tong_thu'] - thong_ke['thang_hien_tai']['tong_chi']
        thong_ke['hom_nay']['so_du'] = thong_ke['hom_nay']['tong_thu'] - thong_ke['hom_nay']['tong_chi']
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': thong_ke
        })
        
    except Exception as e:
        print(f"Lỗi API thống kê thu chi: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# API DASHBOARD
# ================================

@app.route('/api/dashboard', methods=['GET'])
def lay_du_lieu_dashboard():
    """API lấy tất cả dữ liệu cho dashboard"""
    try:
        from datetime import date, timedelta
        
        # Lấy ngày hôm nay
        hom_nay = date.today()
        thang_hien_tai = hom_nay.month
        nam_hien_tai = hom_nay.year
        
        # 1. Thống kê thu chi
        stats_response = lay_thong_ke_thu_chi()
        stats_data = stats_response.get_json()
        thong_ke_thu_chi = stats_data.get('du_lieu', {}) if stats_data.get('thanh_cong') else {}
        
        # 2. Giao dịch gần đây (5 giao dịch)
        giao_dich_gan_day = ThuChi.query.order_by(ThuChi.ngay_giao_dich.desc()).limit(5).all()
        giao_dich_data = []
        for gd in giao_dich_gan_day:
            giao_dich_data.append({
                'id': gd.id,
                'so_tien': float(gd.so_tien),
                'loai': gd.loai,
                'danh_muc': gd.danh_muc,
                'mo_ta': gd.mo_ta,
                'ngay_giao_dich': gd.ngay_giao_dich.isoformat() if gd.ngay_giao_dich else None
            })
        
        # 3. Top danh mục chi tiêu (tháng này)
        chi_thang_nay = ThuChi.query.filter(
            ThuChi.loai == 'chi',
            ThuChi.ngay_giao_dich >= date(nam_hien_tai, thang_hien_tai, 1),
            ThuChi.ngay_giao_dich <= date(nam_hien_tai, thang_hien_tai, 31)
        ).all()
        
        # Xử lý top danh mục
        danh_muc_stats = {}
        for item in chi_thang_nay:
            danh_muc = item.danh_muc or 'khac'
            so_tien = float(item.so_tien)
            
            if danh_muc not in danh_muc_stats:
                danh_muc_stats[danh_muc] = {'tong_tien': 0, 'so_giao_dich': 0}
            
            danh_muc_stats[danh_muc]['tong_tien'] += so_tien
            danh_muc_stats[danh_muc]['so_giao_dich'] += 1
        
        # Sắp xếp top 5 danh mục chi nhiều nhất
        top_danh_muc = sorted(
            [{'danh_muc': k, 'tong_tien': v['tong_tien'], 'so_giao_dich': v['so_giao_dich']} 
             for k, v in danh_muc_stats.items()],
            key=lambda x: x['tong_tien'],
            reverse=True
        )[:5]
        
        # 4. Bài tập sắp đến hạn (3 ngày tới)
        try:
            ngay_han = hom_nay + timedelta(days=3)
            bai_tap_sap_han = BaiTap.query.filter(
                BaiTap.han_nop <= ngay_han,
                BaiTap.han_nop >= hom_nay,
                BaiTap.trang_thai == 'chua_hoan_thanh'
            ).order_by(BaiTap.han_nop).limit(5).all()
            
            bai_tap_data = []
            for bt in bai_tap_sap_han:
                bai_tap_data.append({
                    'id': bt.id,
                    'tieu_de': bt.tieu_de,
                    'han_nop': bt.han_nop.isoformat() if bt.han_nop else None,
                    'mon_hoc': bt.mon_hoc.ten_mon_hoc if bt.mon_hoc else None
                })
        except Exception as e:
            print(f"Lỗi lấy bài tập: {e}")
            bai_tap_data = []
        
        # 5. Ghi chú quan trọng
        try:
            ghi_chu_quan_trong = GhiChu.query.filter_by(muc_do_uu_tien='cao').order_by(GhiChu.ngay_tao.desc()).limit(3).all()
            ghi_chu_data = []
            for gc in ghi_chu_quan_trong:
                ghi_chu_data.append({
                    'id': gc.id,
                    'tieu_de': gc.tieu_de,
                    'noi_dung': gc.noi_dung[:100] + '...' if len(gc.noi_dung) > 100 else gc.noi_dung,
                    'ngay_tao': gc.ngay_tao.isoformat() if gc.ngay_tao else None
                })
        except Exception as e:
            print(f"Lỗi lấy ghi chú: {e}")
            ghi_chu_data = []
        
        # 6. Công việc hôm nay (từ lich_lam)
        try:
            lich_lam_hom_nay = LichLam.query.filter_by(ngay_lam=hom_nay).order_by(LichLam.gio_bat_dau).all()
            cong_viec_data = []
            for ll in lich_lam_hom_nay:
                if ll.cong_viec:
                    cong_viec_data.append({
                        'id': ll.id,
                        'tieu_de': ll.cong_viec.ten_cong_viec,
                        'mo_ta': ll.ghi_chu or ll.cong_viec.mo_ta,
                        'gio_bat_dau': ll.gio_bat_dau.strftime('%H:%M') if ll.gio_bat_dau else None,
                        'gio_ket_thuc': ll.gio_ket_thuc.strftime('%H:%M') if ll.gio_ket_thuc else None,
                        'dia_diem': ll.dia_diem or ll.cong_viec.dia_diem_mac_dinh,
                        'luong_gio': float(ll.cong_viec.luong_gio) if ll.cong_viec.luong_gio else 0
                    })
        except Exception as e:
            print(f"Lỗi lấy công việc: {e}")
            cong_viec_data = []
        
        # Tổng hợp dữ liệu
        dashboard_data = {
            'thong_ke_thu_chi': thong_ke_thu_chi,
            'giao_dich_gan_day': giao_dich_data,
            'top_danh_muc_chi': top_danh_muc,
            'bai_tap_sap_han': bai_tap_data,
            'ghi_chu_quan_trong': ghi_chu_data,
            'cong_viec_hom_nay': cong_viec_data,
            'ngay_cap_nhat': hom_nay.isoformat()
        }
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': dashboard_data
        })
        
    except Exception as e:
        print(f"Lỗi API dashboard: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# MAIN
# ================================

if __name__ == '__main__':
    with app.app_context():
        # Tạo bảng nếu chưa có
        db.create_all()
        print("📚 Database tables ready!")
    
    print("🚀 Khởi động ứng dụng Quản lý Cá nhân với SQLite...")
    print("📱 Truy cập: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
