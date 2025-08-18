# -*- coding: utf-8 -*-
"""
Ứng dụng quản lý cá nhân với Flask và Supabase
Có tính năng đăng nhập và phân quyền
"""

import os
import uuid
import bcrypt
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, send_from_directory
from datetime import datetime, timedelta, date
from supabase_config import supabase
import json
from flask_cors import CORS
from functools import wraps

app = Flask(__name__)
CORS(app)

# Cấu hình session
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'quan-ly-ca-nhan-secret-key-2024')
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

# Kiểm tra kết nối Supabase
try:
    # Test connection
    response = supabase.table('cong_viec').select('id').limit(1).execute()
    print("✅ Kết nối Supabase thành công!")
except Exception as e:
    print(f"❌ Lỗi kết nối Supabase: {e}")

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
        response = supabase.table('nguoi_dung').select('*').eq('id', nguoi_dung_id).single().execute()
        return response.data if response.data else None
    except Exception as e:
        print(f"Lỗi lấy thông tin người dùng: {e}")
        return None

def tao_phien_dang_nhap(nguoi_dung_id, ghi_nho=False):
    """Tạo phiên đăng nhập mới"""
    try:
        phien_id = str(uuid.uuid4())
        ngay_het_han = datetime.now() + timedelta(days=30 if ghi_nho else 1)
        
        # Lưu phiên vào database
        supabase.table('phien_dang_nhap').insert({
            'id': phien_id,
            'nguoi_dung_id': nguoi_dung_id,
            'du_lieu_phien': {'ghi_nho': ghi_nho},
            'ngay_het_han': ngay_het_han.isoformat(),
            'hoat_dong': True
        }).execute()
        
        # Lưu thông tin vào session
        session['nguoi_dung_id'] = nguoi_dung_id
        session['phien_id'] = phien_id
        session['ghi_nho'] = ghi_nho
        session.permanent = ghi_nho
        
        # Cập nhật lần đăng nhập cuối
        supabase.table('nguoi_dung').update({
            'lan_dang_nhap_cuoi': datetime.now().isoformat()
        }).eq('id', nguoi_dung_id).execute()
        
        return True
    except Exception as e:
        print(f"Lỗi tạo phiên đăng nhập: {e}")
        return False

def xoa_phien_dang_nhap():
    """Xóa phiên đăng nhập hiện tại"""
    try:
        if 'phien_id' in session:
            # Vô hiệu hóa phiên trong database
            supabase.table('phien_dang_nhap').update({
                'hoat_dong': False
            }).eq('id', session['phien_id']).execute()
        
        # Xóa session
        session.clear()
        return True
    except Exception as e:
        print(f"Lỗi xóa phiên đăng nhập: {e}")
        return False

@app.route('/dang-nhap', methods=['GET'])
def dang_nhap():
    """Trang đăng nhập"""
    # Nếu đã đăng nhập, chuyển hướng về trang chính
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
        response = supabase.table('nguoi_dung').select('*').eq('ten_dang_nhap', ten_dang_nhap).execute()
        
        if not response.data:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tên đăng nhập hoặc mật khẩu không đúng'
            })
        
        nguoi_dung = response.data[0]
        
        # Kiểm tra trạng thái tài khoản
        if nguoi_dung.get('trang_thai') != 'hoat_dong':
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên'
            })
        
        # Kiểm tra mật khẩu
        mat_khau_hash = nguoi_dung['mat_khau'].encode('utf-8')
        if not bcrypt.checkpw(mat_khau.encode('utf-8'), mat_khau_hash):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tên đăng nhập hoặc mật khẩu không đúng'
            })
        
        # Tạo phiên đăng nhập
        if tao_phien_dang_nhap(nguoi_dung['id'], ghi_nho):
            return jsonify({
                'thanh_cong': True,
                'thong_bao': f'Chào mừng {nguoi_dung["ten_hien_thi"]}!',
                'nguoi_dung': {
                    'id': nguoi_dung['id'],
                    'ten_dang_nhap': nguoi_dung['ten_dang_nhap'],
                    'ten_hien_thi': nguoi_dung['ten_hien_thi'],
                    'email': nguoi_dung['email']
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

@app.route('/api/kiem-tra-dang-nhap', methods=['GET'])
def api_kiem_tra_dang_nhap():
    """API kiểm tra trạng thái đăng nhập"""
    if kiem_tra_da_dang_nhap():
        nguoi_dung = lay_thong_tin_nguoi_dung_hien_tai()
        return jsonify({
            'da_dang_nhap': True,
            'nguoi_dung': {
                'id': nguoi_dung['id'],
                'ten_dang_nhap': nguoi_dung['ten_dang_nhap'],
                'ten_hien_thi': nguoi_dung['ten_hien_thi'],
                'email': nguoi_dung['email']
            } if nguoi_dung else None
        })
    else:
        return jsonify({
            'da_dang_nhap': False,
            'nguoi_dung': None
        })

@app.route('/api/doi-mat-khau', methods=['POST'])
@yeu_cau_dang_nhap
def api_doi_mat_khau():
    """API đổi mật khẩu"""
    try:
        du_lieu = request.get_json()
        mat_khau_cu = du_lieu.get('mat_khau_cu', '')
        mat_khau_moi = du_lieu.get('mat_khau_moi', '')
        xac_nhan_mat_khau = du_lieu.get('xac_nhan_mat_khau', '')
        
        # Validate dữ liệu
        if not mat_khau_cu or not mat_khau_moi or not xac_nhan_mat_khau:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Vui lòng nhập đầy đủ thông tin'
            })
        
        if mat_khau_moi != xac_nhan_mat_khau:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Mật khẩu mới và xác nhận không khớp'
            })
        
        if len(mat_khau_moi) < 6:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Mật khẩu mới phải có ít nhất 6 ký tự'
            })
        
        # Lấy thông tin người dùng hiện tại
        nguoi_dung = lay_thong_tin_nguoi_dung_hien_tai()
        if not nguoi_dung:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không tìm thấy thông tin người dùng'
            })
        
        # Kiểm tra mật khẩu cũ
        mat_khau_hash_cu = nguoi_dung['mat_khau'].encode('utf-8')
        if not bcrypt.checkpw(mat_khau_cu.encode('utf-8'), mat_khau_hash_cu):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Mật khẩu cũ không đúng'
            })
        
        # Hash mật khẩu mới
        mat_khau_hash_moi = bcrypt.hashpw(mat_khau_moi.encode('utf-8'), bcrypt.gensalt())
        
        # Cập nhật mật khẩu
        supabase.table('nguoi_dung').update({
            'mat_khau': mat_khau_hash_moi.decode('utf-8'),
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', nguoi_dung['id']).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã đổi mật khẩu thành công'
        })
        
    except Exception as e:
        print(f"Lỗi API đổi mật khẩu: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': 'Có lỗi hệ thống. Vui lòng thử lại'
        })

@app.route('/api/quen-mat-khau', methods=['POST'])
def api_quen_mat_khau():
    """API xử lý quên mật khẩu"""
    try:
        du_lieu = request.get_json()
        email = du_lieu.get('email', '').strip()
        cau_hoi_bao_mat = du_lieu.get('cau_hoi_bao_mat', '')
        tra_loi_bao_mat = du_lieu.get('tra_loi_bao_mat', '').strip()
        
        # Validate dữ liệu đầu vào
        if not email or not cau_hoi_bao_mat or not tra_loi_bao_mat:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Vui lòng nhập đầy đủ thông tin'
            })
        
        # Validate email format
        import re
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, email):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Email không hợp lệ'
            })
        
        # Tìm người dùng theo email
        response = supabase.table('nguoi_dung').select('*').eq('email', email).execute()
        
        if not response.data:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không tìm thấy tài khoản với email này'
            })
        
        nguoi_dung = response.data[0]
        
        # Kiểm tra câu hỏi và câu trả lời bảo mật
        cau_hoi_luu = nguoi_dung.get('cau_hoi_bao_mat')
        tra_loi_luu = nguoi_dung.get('tra_loi_bao_mat', '').lower().strip()
        
        if not cau_hoi_luu or not tra_loi_luu:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tài khoản chưa thiết lập câu hỏi bảo mật. Vui lòng liên hệ quản trị viên'
            })
        
        if cau_hoi_luu != cau_hoi_bao_mat or tra_loi_luu != tra_loi_bao_mat.lower().strip():
            return jsonify({
                'thanh_cong': False,
                'loi': 'Câu hỏi hoặc câu trả lời bảo mật không đúng'
            })
        
        # Tạo mật khẩu tạm thời
        import random
        import string
        mat_khau_tam = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        
        # Mã hóa mật khẩu tạm
        mat_khau_hash = bcrypt.hashpw(mat_khau_tam.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Cập nhật mật khẩu tạm trong database
        supabase.table('nguoi_dung').update({
            'mat_khau': mat_khau_hash,
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', nguoi_dung['id']).execute()
        
        # Lưu token khôi phục (tùy chọn, cho tương lai)
        token_khoi_phuc = str(uuid.uuid4())
        ngay_het_han = datetime.now() + timedelta(hours=24)
        
        try:
            supabase.table('token_khoi_phuc').insert({
                'id': token_khoi_phuc,
                'nguoi_dung_id': nguoi_dung['id'],
                'mat_khau_tam': mat_khau_tam,
                'ngay_het_han': ngay_het_han.isoformat(),
                'da_su_dung': False
            }).execute()
        except:
            # Bỏ qua lỗi nếu bảng chưa tồn tại
            pass
        
        # Trong thực tế, sẽ gửi email ở đây
        # Hiện tại chỉ trả về mật khẩu tạm (cho demo)
        return jsonify({
            'thanh_cong': True,
            'thong_bao': f'Mật khẩu tạm thời đã được tạo: {mat_khau_tam}. Vui lòng đăng nhập và đổi mật khẩu ngay lập tức!'
        })
        
    except Exception as e:
        print(f"Lỗi API quên mật khẩu: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': 'Có lỗi hệ thống. Vui lòng thử lại'
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
# API QUẢN LÝ CÔNG VIỆC
# ================================

@app.route('/api/cong-viec', methods=['GET'])
@yeu_cau_dang_nhap
def lay_danh_sach_cong_viec():
    """API lấy danh sách công việc"""
    try:
        response = supabase.table('cong_viec').select('*').order('ngay_tao', desc=True).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/cong-viec', methods=['POST'])
def them_cong_viec():
    """API thêm công việc mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        if not du_lieu.get('ten_cong_viec'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tên công việc là bắt buộc'
            })
        
        if not du_lieu.get('luong_gio'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Lương theo giờ là bắt buộc'
            })
        
        # Thêm vào database
        response = supabase.table('cong_viec').insert({
            'ten_cong_viec': du_lieu['ten_cong_viec'],
            'luong_gio': float(du_lieu['luong_gio']),
            'mau_sac': du_lieu.get('mau_sac', '#007bff'),
            'dia_diem_mac_dinh': du_lieu.get('dia_diem_mac_dinh', ''),
            'mo_ta': du_lieu.get('mo_ta', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã thêm công việc mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/cong-viec/<int:id>', methods=['PUT'])
def cap_nhat_cong_viec(id):
    """API cập nhật công việc"""
    try:
        du_lieu = request.get_json()
        
        # Cập nhật database
        response = supabase.table('cong_viec').update({
            'ten_cong_viec': du_lieu.get('ten_cong_viec'),
            'luong_gio': float(du_lieu.get('luong_gio')),
            'mau_sac': du_lieu.get('mau_sac'),
            'dia_diem_mac_dinh': du_lieu.get('dia_diem_mac_dinh'),
            'mo_ta': du_lieu.get('mo_ta'),
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã cập nhật công việc!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/cong-viec/<int:id>', methods=['DELETE'])
def xoa_cong_viec(id):
    """API xóa công việc"""
    try:
        # Kiểm tra xem có lịch làm việc nào liên quan không
        lich_lam_response = supabase.table('lich_lam').select('id').eq('cong_viec_id', id).execute()
        
        if lich_lam_response.data:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không thể xóa công việc vì còn lịch làm việc liên quan'
            })
        
        # Xóa công việc
        response = supabase.table('cong_viec').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa công việc!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# API QUẢN LÝ LỊCH LÀM VIỆC
# ================================

@app.route('/api/lich-lam', methods=['GET'])
def lay_danh_sach_lich_lam():
    """API lấy danh sách lịch làm việc"""
    try:
        # Lấy kèm thông tin công việc
        response = supabase.table('lich_lam').select(
            '*, cong_viec:cong_viec_id(ten_cong_viec, luong_gio, mau_sac)'
        ).order('ngay_lam', desc=True).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-lam', methods=['POST'])
def them_lich_lam():
    """API thêm lịch làm việc đơn lẻ"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        required_fields = ['cong_viec_id', 'ngay_lam', 'gio_bat_dau', 'gio_ket_thuc']
        for field in required_fields:
            if not du_lieu.get(field):
                return jsonify({
                    'thanh_cong': False,
                    'loi': f'Thiếu trường bắt buộc: {field}'
                })
        
        # Thêm vào database
        response = supabase.table('lich_lam').insert({
            'cong_viec_id': du_lieu['cong_viec_id'],
            'ngay_lam': du_lieu['ngay_lam'],
            'gio_bat_dau': du_lieu['gio_bat_dau'],
            'gio_ket_thuc': du_lieu['gio_ket_thuc'],
            'dia_diem': du_lieu.get('dia_diem', ''),
            'ghi_chu': du_lieu.get('ghi_chu', ''),
            'dong_bo_google': du_lieu.get('dong_bo_google', False),
            'google_event_id': du_lieu.get('google_event_id', ''),
            'google_event_link': du_lieu.get('google_event_link', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        # Lấy lại dữ liệu với thông tin công việc để có màu sắc
        lich_lam_id = response.data[0]['id']
        lich_with_cong_viec = supabase.table('lich_lam').select(
            '*, cong_viec:cong_viec_id(ten_cong_viec, luong_gio, mau_sac)'
        ).eq('id', lich_lam_id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': lich_with_cong_viec.data[0],
            'thong_bao': 'Đã thêm lịch làm việc!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-lam/<int:id>', methods=['PUT'])
def cap_nhat_lich_lam(id):
    """API cập nhật lịch làm việc"""
    try:
        du_lieu = request.get_json()
        
        # Cập nhật database
        response = supabase.table('lich_lam').update({
            **du_lieu,
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã cập nhật lịch làm việc!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-lam/<int:id>', methods=['DELETE'])
def xoa_lich_lam(id):
    """API xóa lịch làm việc"""
    try:
        response = supabase.table('lich_lam').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa lịch làm việc!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-lam/google-event/<string:google_event_id>', methods=['DELETE'])
def xoa_lich_lam_theo_google_event_id(google_event_id):
    """API xóa lịch làm việc theo Google Event ID"""
    try:
        # Tìm và xóa lịch làm việc có google_event_id tương ứng
        response = supabase.table('lich_lam').delete().eq('google_event_id', google_event_id).execute()
        
        if response.data:
            return jsonify({
                'thanh_cong': True,
                'thong_bao': f'Đã xóa {len(response.data)} lịch làm việc liên quan!',
                'so_luong_xoa': len(response.data)
            })
        else:
            return jsonify({
                'thanh_cong': True,
                'thong_bao': 'Không tìm thấy lịch làm việc nào để xóa',
                'so_luong_xoa': 0
            })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-lam/google-event/<string:google_event_id>', methods=['PUT'])
def cap_nhat_lich_lam_theo_google_event_id(google_event_id):
    """API cập nhật lịch làm việc theo Google Event ID"""
    try:
        du_lieu = request.get_json()
        
        # Tìm lịch làm việc có google_event_id tương ứng
        tim_kiem_response = supabase.table('lich_lam').select('*').eq('google_event_id', google_event_id).execute()
        
        if not tim_kiem_response.data:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không tìm thấy lịch làm việc với Google Event ID này'
            })
        
        # Chuẩn bị dữ liệu cập nhật
        du_lieu_cap_nhat = {}
        
        # Mapping từ Google Calendar event sang lich_lam fields
        if 'summary' in du_lieu:
            # Tìm công việc theo tên (summary)
            cong_viec_response = supabase.table('cong_viec').select('id').eq('ten_cong_viec', du_lieu['summary']).execute()
            if cong_viec_response.data:
                du_lieu_cap_nhat['cong_viec_id'] = cong_viec_response.data[0]['id']
        
        if 'start' in du_lieu and 'dateTime' in du_lieu['start']:
            start_datetime = datetime.fromisoformat(du_lieu['start']['dateTime'].replace('Z', '+00:00'))
            du_lieu_cap_nhat['ngay_lam'] = start_datetime.date().isoformat()
            du_lieu_cap_nhat['gio_bat_dau'] = start_datetime.time().isoformat()
        
        if 'end' in du_lieu and 'dateTime' in du_lieu['end']:
            end_datetime = datetime.fromisoformat(du_lieu['end']['dateTime'].replace('Z', '+00:00'))
            du_lieu_cap_nhat['gio_ket_thuc'] = end_datetime.time().isoformat()
        
        if 'location' in du_lieu:
            du_lieu_cap_nhat['dia_diem'] = du_lieu['location']
        
        if 'description' in du_lieu:
            du_lieu_cap_nhat['ghi_chu'] = du_lieu['description']
        
        # Cập nhật thời gian sửa đổi
        du_lieu_cap_nhat['ngay_cap_nhat'] = datetime.now().isoformat()
        
        # Thực hiện cập nhật
        response = supabase.table('lich_lam').update(du_lieu_cap_nhat).eq('google_event_id', google_event_id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data,
            'thong_bao': f'Đã cập nhật {len(response.data)} lịch làm việc!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# API THỐNG KÊ LƯƠNG
# ================================

@app.route('/api/thong-ke-luong', methods=['GET'])
def lay_thong_ke_luong():
    """API lấy thống kê lương theo kỳ hạn hoặc khoảng thời gian tùy chỉnh"""
    try:
        ky_han = request.args.get('ky_han', 'tuan')  # tuan, thang
        tu_ngay = request.args.get('tu_ngay')  # YYYY-MM-DD
        den_ngay = request.args.get('den_ngay')  # YYYY-MM-DD
        thang = request.args.get('thang')
        nam = request.args.get('nam')
        cong_viec_id = request.args.get('cong_viec_id')
        
        # Tính toán khoảng thời gian
        hom_nay = date.today()
        
        if tu_ngay and den_ngay:
            # Sử dụng khoảng thời gian tùy chỉnh
            ngay_bat_dau = tu_ngay
            ngay_ket_thuc = den_ngay
        elif ky_han == 'tuan':
            # Tính từ thứ 2 tuần này
            dau_tuan = hom_nay - timedelta(days=hom_nay.weekday())
            cuoi_tuan = dau_tuan + timedelta(days=6)
            ngay_bat_dau = str(dau_tuan)
            ngay_ket_thuc = str(cuoi_tuan)
        elif ky_han == 'thang':
            # Tháng hiện tại
            ngay_bat_dau = f'{hom_nay.year}-{hom_nay.month:02d}-01'
            if hom_nay.month == 12:
                ngay_ket_thuc = f'{hom_nay.year + 1}-01-01'
            else:
                ngay_ket_thuc = f'{hom_nay.year}-{hom_nay.month + 1:02d}-01'
        else:
            # Custom range nếu có thang, nam
            if not nam:
                nam = hom_nay.year
            if not thang:
                thang = hom_nay.month
            ngay_bat_dau = f'{nam}-{thang:02d}-01'
            ngay_ket_thuc = f'{nam}-{thang:02d}-31'
        
        # Xây dựng điều kiện lọc
        query = supabase.table('lich_lam').select('*, cong_viec:cong_viec_id(ten_cong_viec, luong_gio, mau_sac)')
        query = query.gte('ngay_lam', ngay_bat_dau).lte('ngay_lam', ngay_ket_thuc)
        
        # Lọc theo công việc nếu có
        if cong_viec_id:
            query = query.eq('cong_viec_id', int(cong_viec_id))
        
        response = query.execute()
        
        # Tính toán thống kê
        thong_ke = tinh_toan_thong_ke_luong_moi(response.data, ky_han)
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': thong_ke
        })
        
    except Exception as e:
        print(f"Lỗi API thống kê lương: {e}")
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

def tinh_toan_thong_ke_luong(danh_sach_lich):
    """Tính toán thống kê lương từ danh sách lịch làm việc"""
    if not danh_sach_lich:
        return {
            'tong_ca_lam': 0,
            'tong_gio_lam': 0,
            'tong_luong': 0,
            'luong_trung_binh_ngay': 0,
            'theo_cong_viec': {},
            'theo_ngay': [],
            'dong_bo_google': {
                'thanh_cong': 0,
                'chua_dong_bo': 0
            }
        }
    
    tong_ca_lam = len(danh_sach_lich)
    tong_gio_lam = 0
    tong_luong = 0
    theo_cong_viec = {}
    ngay_dict = {}
    dong_bo_google = {'thanh_cong': 0, 'chua_dong_bo': 0}
    
    for lich in danh_sach_lich:
        try:
            # Tính số giờ làm việc
            gio_bat_dau = datetime.strptime(lich['gio_bat_dau'], '%H:%M:%S').time()
            gio_ket_thuc = datetime.strptime(lich['gio_ket_thuc'], '%H:%M:%S').time()
            
            # Chuyển đổi sang datetime để tính toán
            dt_bat_dau = datetime.combine(datetime.today().date(), gio_bat_dau)
            dt_ket_thuc = datetime.combine(datetime.today().date(), gio_ket_thuc)
            
            # Xử lý trường hợp qua đêm
            if dt_ket_thuc < dt_bat_dau:
                dt_ket_thuc += timedelta(days=1)
            
            so_gio = (dt_ket_thuc - dt_bat_dau).total_seconds() / 3600
            tong_gio_lam += so_gio
            
            # Tính lương nếu có thông tin công việc
            if lich.get('cong_viec') and lich['cong_viec'].get('luong_gio'):
                luong_gio = lich['cong_viec']['luong_gio']
                luong_ca = so_gio * luong_gio
                tong_luong += luong_ca
                
                # Thống kê theo công việc
                ten_cong_viec = lich['cong_viec']['ten_cong_viec']
                if ten_cong_viec not in theo_cong_viec:
                    theo_cong_viec[ten_cong_viec] = {
                        'so_ca': 0,
                        'tong_gio': 0,
                        'tong_luong': 0,
                        'luong_trung_binh': 0
                    }
                
                theo_cong_viec[ten_cong_viec]['so_ca'] += 1
                theo_cong_viec[ten_cong_viec]['tong_gio'] += so_gio
                theo_cong_viec[ten_cong_viec]['tong_luong'] += luong_ca
                theo_cong_viec[ten_cong_viec]['luong_trung_binh'] = luong_gio
            
            # Thống kê theo ngày
            ngay_lam = lich['ngay_lam']
            if ngay_lam not in ngay_dict:
                ngay_dict[ngay_lam] = {
                    'ngay': ngay_lam,
                    'so_ca': 0,
                    'tong_gio': 0,
                    'tong_luong': 0
                }
            
            ngay_dict[ngay_lam]['so_ca'] += 1
            ngay_dict[ngay_lam]['tong_gio'] += so_gio
            if lich.get('cong_viec') and lich['cong_viec'].get('luong_gio'):
                ngay_dict[ngay_lam]['tong_luong'] += so_gio * lich['cong_viec']['luong_gio']
            
            # Thống kê đồng bộ Google
            if lich.get('dong_bo_google'):
                dong_bo_google['thanh_cong'] += 1
            else:
                dong_bo_google['chua_dong_bo'] += 1
                
        except Exception as e:
            print(f"Lỗi tính toán cho lịch {lich.get('id', 'unknown')}: {e}")
            continue
    
    thong_ke = {
        'tong_ca_lam': tong_ca_lam,
        'tong_gio_lam': round(tong_gio_lam, 2),
        'tong_luong': tong_luong,
        'luong_trung_binh_ngay': round(tong_luong / max(len(ngay_dict), 1), 2),
        'theo_cong_viec': theo_cong_viec,
        'dong_bo_google': dong_bo_google
    }
    
    # Chuyển dict thành list cho theo_ngay
    thong_ke['theo_ngay'] = list(ngay_dict.values())
    
    return thong_ke

def tinh_toan_thong_ke_luong_moi(danh_sach_lich, ky_han):
    """Tính toán thống kê lương mới cho dashboard"""
    if not danh_sach_lich:
        return {
            'tong_gio_lam': 0,
            'luong_co_ban': 0,
            'luong_overtime': 0,
            'tong_luong': 0,
            'chi_tiet_theo_ngay': []
        }
    
    GIO_LAM_CHUAN = 8  # 8 giờ/ngày
    LUONG_GIO_MAC_DINH = 50000  # 50k/giờ
    HE_SO_OVERTIME = 1.5  # 150% lương cơ bản
    
    tong_gio_lam = 0
    tong_luong_co_ban = 0
    tong_luong_overtime = 0
    ngay_dict = {}
    
    for lich in danh_sach_lich:
        try:
            # Tính số giờ làm việc
            gio_bat_dau = datetime.strptime(lich['gio_bat_dau'], '%H:%M:%S').time()
            gio_ket_thuc = datetime.strptime(lich['gio_ket_thuc'], '%H:%M:%S').time()
            
            # Chuyển đổi sang datetime để tính toán
            dt_bat_dau = datetime.combine(date.today(), gio_bat_dau)
            dt_ket_thuc = datetime.combine(date.today(), gio_ket_thuc)
            
            # Xử lý trường hợp qua đêm
            if dt_ket_thuc < dt_bat_dau:
                dt_ket_thuc += timedelta(days=1)
            
            so_gio = (dt_ket_thuc - dt_bat_dau).total_seconds() / 3600
            tong_gio_lam += so_gio
            
            # Lấy lương giờ từ công việc hoặc dùng mặc định
            luong_gio = LUONG_GIO_MAC_DINH
            if lich.get('cong_viec') and lich['cong_viec'].get('luong_gio'):
                luong_gio = lich['cong_viec']['luong_gio']
            
            # Tính lương cơ bản và overtime
            gio_co_ban = min(so_gio, GIO_LAM_CHUAN)
            gio_overtime = max(0, so_gio - GIO_LAM_CHUAN)
            
            luong_co_ban = gio_co_ban * luong_gio
            luong_overtime = gio_overtime * luong_gio * HE_SO_OVERTIME
            
            tong_luong_co_ban += luong_co_ban
            tong_luong_overtime += luong_overtime
            
            # Thống kê theo ngày
            ngay_lam = lich['ngay_lam']
            if ngay_lam not in ngay_dict:
                ngay_dict[ngay_lam] = {
                    'ngay': ngay_lam,
                    'gio_bat_dau': lich['gio_bat_dau'],
                    'gio_ket_thuc': lich['gio_ket_thuc'],
                    'tong_gio': 0,
                    'gio_co_ban': 0,
                    'gio_overtime': 0,
                    'luong_du_tinh': 0
                }
            
            ngay_dict[ngay_lam]['tong_gio'] += so_gio
            ngay_dict[ngay_lam]['gio_co_ban'] += gio_co_ban
            ngay_dict[ngay_lam]['gio_overtime'] += gio_overtime
            ngay_dict[ngay_lam]['luong_du_tinh'] += (luong_co_ban + luong_overtime)
            
            # Cập nhật giờ bắt đầu/kết thúc sớm nhất và muộn nhất
            if lich['gio_bat_dau'] < ngay_dict[ngay_lam]['gio_bat_dau']:
                ngay_dict[ngay_lam]['gio_bat_dau'] = lich['gio_bat_dau']
            if lich['gio_ket_thuc'] > ngay_dict[ngay_lam]['gio_ket_thuc']:
                ngay_dict[ngay_lam]['gio_ket_thuc'] = lich['gio_ket_thuc']
                
        except Exception as e:
            print(f"Lỗi tính toán lương cho lịch {lich.get('id', 'unknown')}: {e}")
            continue
    
    # Format dữ liệu cho frontend
    chi_tiet_theo_ngay = []
    for ngay_data in sorted(ngay_dict.values(), key=lambda x: x['ngay']):
        chi_tiet_theo_ngay.append({
            'ngay': ngay_data['ngay'],
            'gio_bat_dau': ngay_data['gio_bat_dau'][:5],  # HH:MM
            'gio_ket_thuc': ngay_data['gio_ket_thuc'][:5],  # HH:MM
            'tong_gio': round(ngay_data['tong_gio'], 1),
            'gio_co_ban': round(ngay_data['gio_co_ban'], 1),
            'gio_overtime': round(ngay_data['gio_overtime'], 1),
            'luong_du_tinh': round(ngay_data['luong_du_tinh'])
        })
    
    return {
        'tong_gio_lam': round(tong_gio_lam, 1),
        'luong_co_ban': round(tong_luong_co_ban),
        'luong_overtime': round(tong_luong_overtime),
        'tong_luong': round(tong_luong_co_ban + tong_luong_overtime),
        'chi_tiet_theo_ngay': chi_tiet_theo_ngay
    }

# ================================
# GOOGLE CALENDAR API
# ================================

# ================================
# API QUẢN LÝ HỌC TẬP
# ================================

@app.route('/api/mon-hoc', methods=['GET'])
def lay_danh_sach_mon_hoc():
    """API lấy danh sách môn học"""
    try:
        response = supabase.table('mon_hoc').select('*').order('ngay_tao', desc=True).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/mon-hoc', methods=['POST'])
def them_mon_hoc():
    """API thêm môn học mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        if not du_lieu.get('ten_mon_hoc'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tên môn học là bắt buộc'
            })
        
        # Thêm vào database
        response = supabase.table('mon_hoc').insert({
            'ten_mon_hoc': du_lieu['ten_mon_hoc'],
            'ma_mon_hoc': du_lieu.get('ma_mon_hoc', ''),
            'so_tin_chi': du_lieu.get('so_tin_chi'),
            'giang_vien': du_lieu.get('giang_vien', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã thêm môn học mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/mon-hoc/<int:id>', methods=['PUT'])
def cap_nhat_mon_hoc(id):
    """API cập nhật môn học"""
    try:
        du_lieu = request.get_json()
        
        response = supabase.table('mon_hoc').update({
            'ten_mon_hoc': du_lieu.get('ten_mon_hoc'),
            'ma_mon_hoc': du_lieu.get('ma_mon_hoc'),
            'so_tin_chi': du_lieu.get('so_tin_chi'),
            'giang_vien': du_lieu.get('giang_vien'),
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã cập nhật môn học!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/mon-hoc/<int:id>', methods=['DELETE'])
def xoa_mon_hoc(id):
    """API xóa môn học"""
    try:
        response = supabase.table('mon_hoc').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa môn học!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/bai-tap', methods=['GET'])
def lay_danh_sach_bai_tap():
    """API lấy danh sách bài tập"""
    try:
        response = supabase.table('bai_tap').select(
            '*, mon_hoc:mon_hoc_id(ten_mon_hoc, ma_mon_hoc)'
        ).order('han_nop', desc=False).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/bai-tap', methods=['POST'])
def them_bai_tap():
    """API thêm bài tập mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        if not du_lieu.get('tieu_de'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tiêu đề bài tập là bắt buộc'
            })
        
        # Thêm vào database
        response = supabase.table('bai_tap').insert({
            'tieu_de': du_lieu['tieu_de'],
            'mon_hoc_id': du_lieu.get('mon_hoc_id'),
            'han_nop': du_lieu.get('han_nop'),
            'muc_do_uu_tien': du_lieu.get('muc_do_uu_tien', 'trung-binh'),
            'mo_ta': du_lieu.get('mo_ta', ''),
            'trang_thai': du_lieu.get('trang_thai', 'chua-lam'),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã thêm bài tập mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/bai-tap/<int:id>', methods=['PUT'])
def cap_nhat_bai_tap(id):
    """API cập nhật bài tập"""
    try:
        du_lieu = request.get_json()
        
        response = supabase.table('bai_tap').update({
            'tieu_de': du_lieu.get('tieu_de'),
            'mon_hoc_id': du_lieu.get('mon_hoc_id'),
            'han_nop': du_lieu.get('han_nop'),
            'muc_do_uu_tien': du_lieu.get('muc_do_uu_tien'),
            'mo_ta': du_lieu.get('mo_ta'),
            'trang_thai': du_lieu.get('trang_thai'),
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã cập nhật bài tập!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/bai-tap/<int:id>', methods=['DELETE'])
def xoa_bai_tap(id):
    """API xóa bài tập"""
    try:
        response = supabase.table('bai_tap').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa bài tập!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-hoc', methods=['GET'])
def lay_danh_sach_lich_hoc():
    """API lấy danh sách lịch học"""
    try:
        response = supabase.table('lich_hoc').select(
            '*, mon_hoc:mon_hoc_id(ten_mon_hoc, ma_mon_hoc, giang_vien)'
        ).order('thu', desc=False).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-hoc', methods=['POST'])
def them_lich_hoc():
    """API thêm lịch học mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        required_fields = ['mon_hoc_id', 'thu', 'gio_bat_dau', 'gio_ket_thuc']
        for field in required_fields:
            if not du_lieu.get(field):
                return jsonify({
                    'thanh_cong': False,
                    'loi': f'Thiếu trường bắt buộc: {field}'
                })
        
        # Thêm vào database
        response = supabase.table('lich_hoc').insert({
            'mon_hoc_id': du_lieu['mon_hoc_id'],
            'thu': du_lieu['thu'],
            'gio_bat_dau': du_lieu['gio_bat_dau'],
            'gio_ket_thuc': du_lieu['gio_ket_thuc'],
            'phong_hoc': du_lieu.get('phong_hoc', ''),
            'ghi_chu': du_lieu.get('ghi_chu', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã thêm lịch học mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-hoc/them-nhanh', methods=['POST'])
def them_lich_hoc_nhanh():
    """API thêm lịch học nhanh từ giao diện"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        required_fields = ['mon_hoc_id', 'thu', 'tiet']
        for field in required_fields:
            if not du_lieu.get(field):
                return jsonify({
                    'thanh_cong': False,
                    'loi': f'Thiếu trường bắt buộc: {field}'
                })
        
        # Mapping tiết học sang giờ
        mapping_tiet = {
            1: {'bat_dau': '09:10', 'ket_thuc': '10:40'},
            2: {'bat_dau': '10:50', 'ket_thuc': '12:20'},
            3: {'bat_dau': '13:10', 'ket_thuc': '14:40'},
            4: {'bat_dau': '14:50', 'ket_thuc': '16:20'},
            5: {'bat_dau': '16:30', 'ket_thuc': '18:00'},
            6: {'bat_dau': '18:10', 'ket_thuc': '19:40'}
        }
        
        tiet = du_lieu['tiet']
        if tiet not in mapping_tiet:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tiết học không hợp lệ'
            })
        
        gio_hoc = mapping_tiet[tiet]
        
        # Thêm vào database
        response = supabase.table('lich_hoc').insert({
            'mon_hoc_id': du_lieu['mon_hoc_id'],
            'thu': du_lieu['thu'],
            'gio_bat_dau': gio_hoc['bat_dau'],
            'gio_ket_thuc': gio_hoc['ket_thuc'],
            'phong_hoc': du_lieu.get('phong_hoc', ''),
            'ghi_chu': du_lieu.get('ghi_chu', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã thêm lịch học!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/lich-hoc/<int:id>', methods=['DELETE'])
def xoa_lich_hoc(id):
    """API xóa lịch học"""
    try:
        response = supabase.table('lich_hoc').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa lịch học!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# API QUẢN LÝ THU CHI
# ================================

@app.route('/api/thu-chi', methods=['GET'])
def lay_danh_sach_thu_chi():
    """API lấy danh sách thu chi với bộ lọc"""
    try:
        loai = request.args.get('loai')  # 'thu' hoặc 'chi' hoặc None (tất cả)
        danh_muc = request.args.get('danh_muc')  # danh mục cụ thể
        tu_ngay = request.args.get('tu_ngay')  # từ ngày
        den_ngay = request.args.get('den_ngay')  # đến ngày
        
        query = supabase.table('thu_chi').select('*')
        
        # Filter theo loại
        if loai:
            query = query.eq('loai', loai)
        
        # Filter theo danh mục
        if danh_muc:
            query = query.eq('danh_muc', danh_muc)
        
        # Filter theo ngày
        if tu_ngay:
            query = query.gte('ngay_giao_dich', tu_ngay)
        
        if den_ngay:
            query = query.lte('ngay_giao_dich', den_ngay)
        
        response = query.order('ngay_giao_dich', desc=True).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/thu-chi', methods=['POST'])
def them_thu_chi():
    """API thêm thu chi mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        if not du_lieu.get('tieu_de'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tiêu đề là bắt buộc'
            })
        
        if not du_lieu.get('so_tien'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Số tiền là bắt buộc'
            })
        
        if not du_lieu.get('loai') or du_lieu['loai'] not in ['thu', 'chi']:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Loại giao dịch phải là "thu" hoặc "chi"'
            })
        
        # Thêm vào database
        response = supabase.table('thu_chi').insert({
            'loai': du_lieu['loai'],
            'tieu_de': du_lieu['tieu_de'],
            'so_tien': float(du_lieu['so_tien']),
            'danh_muc': du_lieu.get('danh_muc', 'khac'),
            'ngay_giao_dich': du_lieu.get('ngay_giao_dich', datetime.now().date().isoformat()),
            'mo_ta': du_lieu.get('mo_ta', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': f'Đã thêm {"thu nhập" if du_lieu["loai"] == "thu" else "chi tiêu"} mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/thu-chi/<int:id>', methods=['PUT'])
def cap_nhat_thu_chi(id):
    """API cập nhật thu chi"""
    try:
        du_lieu = request.get_json()
        
        update_data = {}
        if 'tieu_de' in du_lieu:
            update_data['tieu_de'] = du_lieu['tieu_de']
        if 'so_tien' in du_lieu:
            update_data['so_tien'] = float(du_lieu['so_tien'])
        if 'danh_muc' in du_lieu:
            update_data['danh_muc'] = du_lieu['danh_muc']
        if 'ngay_giao_dich' in du_lieu:
            update_data['ngay_giao_dich'] = du_lieu['ngay_giao_dich']
        if 'mo_ta' in du_lieu:
            update_data['mo_ta'] = du_lieu['mo_ta']
        if 'loai' in du_lieu:
            update_data['loai'] = du_lieu['loai']
        
        update_data['ngay_cap_nhat'] = datetime.now().isoformat()
        
        response = supabase.table('thu_chi').update(update_data).eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã cập nhật thu chi!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/thu-chi/<int:id>', methods=['DELETE'])
def xoa_thu_chi(id):
    """API xóa thu chi"""
    try:
        response = supabase.table('thu_chi').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa thu chi!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/thu-chi/thong-ke', methods=['GET'])
def lay_thong_ke_thu_chi():
    """API lấy thống kê thu chi theo tháng/năm và hôm nay"""
    try:
        # Lấy ngày hôm nay
        hom_nay = date.today()
        thang_hien_tai = hom_nay.month
        nam_hien_tai = hom_nay.year
        
        # Lấy dữ liệu tháng này
        query_thang = supabase.table('thu_chi').select('*')
        query_thang = query_thang.gte('ngay_giao_dich', f'{nam_hien_tai}-{thang_hien_tai:02d}-01')
        query_thang = query_thang.lte('ngay_giao_dich', f'{nam_hien_tai}-{thang_hien_tai:02d}-31')
        response_thang = query_thang.execute()
        
        # Lấy dữ liệu hôm nay
        query_hom_nay = supabase.table('thu_chi').select('*')
        query_hom_nay = query_hom_nay.eq('ngay_giao_dich', str(hom_nay))
        response_hom_nay = query_hom_nay.execute()
        
        # Tính toán thống kê
        thong_ke = tinh_toan_thong_ke_chi_tiet(response_thang.data, response_hom_nay.data)
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': thong_ke
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

def tinh_toan_thong_ke_chi_tiet(du_lieu_thang, du_lieu_hom_nay):
    """Tính toán thống kê chi tiết cho frontend"""
    # Thống kê tháng này
    tong_thu_thang = 0
    tong_chi_thang = 0
    so_giao_dich = len(du_lieu_thang)
    
    for item in du_lieu_thang:
        so_tien = float(item['so_tien'] or 0)
        if item['loai'] == 'thu':
            tong_thu_thang += so_tien
        elif item['loai'] == 'chi':
            tong_chi_thang += so_tien
    
    # Thống kê hôm nay
    thu_hom_nay = 0
    chi_hom_nay = 0
    
    for item in du_lieu_hom_nay:
        so_tien = float(item['so_tien'] or 0)
        if item['loai'] == 'thu':
            thu_hom_nay += so_tien
        elif item['loai'] == 'chi':
            chi_hom_nay += so_tien
    
    # Số dư
    so_du = tong_thu_thang - tong_chi_thang
    
    return {
        'tong_thu_thang': tong_thu_thang,
        'tong_chi_thang': tong_chi_thang,
        'so_du': so_du,
        'thu_hom_nay': thu_hom_nay,
        'chi_hom_nay': chi_hom_nay,
        'so_giao_dich': so_giao_dich
    }

def tinh_toan_thong_ke_thu_chi(danh_sach_thu_chi):
    """Tính toán thống kê thu chi"""
    if not danh_sach_thu_chi:
        return {
            'tong_thu': 0,
            'tong_chi': 0,
            'so_balance': 0,
            'so_giao_dich_thu': 0,
            'so_giao_dich_chi': 0,
            'theo_danh_muc_thu': {},
            'theo_danh_muc_chi': {},
            'theo_ngay': []
        }
    
    tong_thu = 0
    tong_chi = 0
    so_giao_dich_thu = 0
    so_giao_dich_chi = 0
    theo_danh_muc_thu = {}
    theo_danh_muc_chi = {}
    theo_ngay = {}
    
    for item in danh_sach_thu_chi:
        so_tien = float(item['so_tien'])
        loai = item['loai']
        danh_muc = item.get('danh_muc', 'khac')
        ngay = item['ngay_giao_dich']
        
        if loai == 'thu':
            tong_thu += so_tien
            so_giao_dich_thu += 1
            
            if danh_muc not in theo_danh_muc_thu:
                theo_danh_muc_thu[danh_muc] = {'tong_tien': 0, 'so_giao_dich': 0}
            theo_danh_muc_thu[danh_muc]['tong_tien'] += so_tien
            theo_danh_muc_thu[danh_muc]['so_giao_dich'] += 1
            
        elif loai == 'chi':
            tong_chi += so_tien
            so_giao_dich_chi += 1
            
            if danh_muc not in theo_danh_muc_chi:
                theo_danh_muc_chi[danh_muc] = {'tong_tien': 0, 'so_giao_dich': 0}
            theo_danh_muc_chi[danh_muc]['tong_tien'] += so_tien
            theo_danh_muc_chi[danh_muc]['so_giao_dich'] += 1
        
        # Thống kê theo ngày
        if ngay not in theo_ngay:
            theo_ngay[ngay] = {'ngay': ngay, 'thu': 0, 'chi': 0, 'balance': 0}
        
        if loai == 'thu':
            theo_ngay[ngay]['thu'] += so_tien
        elif loai == 'chi':
            theo_ngay[ngay]['chi'] += so_tien
        
        theo_ngay[ngay]['balance'] = theo_ngay[ngay]['thu'] - theo_ngay[ngay]['chi']
    
    return {
        'tong_thu': tong_thu,
        'tong_chi': tong_chi,
        'balance': tong_thu - tong_chi,
        'so_giao_dich_thu': so_giao_dich_thu,
        'so_giao_dich_chi': so_giao_dich_chi,
        'theo_danh_muc_thu': theo_danh_muc_thu,
        'theo_danh_muc_chi': theo_danh_muc_chi,
        'theo_ngay': list(theo_ngay.values())
    }

# ================================
# API DASHBOARD TỔNG HỢP
# ================================

@app.route('/api/dashboard', methods=['GET'])
def lay_du_lieu_dashboard():
    """API lấy tất cả dữ liệu cho dashboard"""
    try:
        # Lấy ngày hôm nay
        hom_nay = date.today()
        thang_hien_tai = hom_nay.month
        nam_hien_tai = hom_nay.year
        
        # 1. Thống kê thu chi
        stats_response = lay_thong_ke_thu_chi()
        stats_data = stats_response.get_json()
        thong_ke_thu_chi = stats_data.get('du_lieu', {}) if stats_data.get('thanh_cong') else {}
        
        # 2. Giao dịch gần đây (5 giao dịch)
        query_gan_day = supabase.table('thu_chi').select('*')
        query_gan_day = query_gan_day.order('ngay_giao_dich', desc=True)
        query_gan_day = query_gan_day.limit(5)
        response_gan_day = query_gan_day.execute()
        
        # 3. Top danh mục chi tiêu (tháng này)
        query_danh_muc = supabase.table('thu_chi').select('*')
        query_danh_muc = query_danh_muc.eq('loai', 'chi')
        query_danh_muc = query_danh_muc.gte('ngay_giao_dich', f'{nam_hien_tai}-{thang_hien_tai:02d}-01')
        query_danh_muc = query_danh_muc.lte('ngay_giao_dich', f'{nam_hien_tai}-{thang_hien_tai:02d}-31')
        response_danh_muc = query_danh_muc.execute()
        
        # Xử lý top danh mục
        danh_muc_stats = {}
        for item in response_danh_muc.data:
            danh_muc = item.get('danh_muc', 'khac')
            so_tien = float(item.get('so_tien', 0))
            
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
            query_bai_tap = supabase.table('bai_tap').select('*')
            query_bai_tap = query_bai_tap.lte('han_nop', str(ngay_han))
            query_bai_tap = query_bai_tap.gte('han_nop', str(hom_nay))
            query_bai_tap = query_bai_tap.eq('trang_thai', 'chua_hoan_thanh')
            query_bai_tap = query_bai_tap.order('han_nop', desc=False)
            query_bai_tap = query_bai_tap.limit(5)
            response_bai_tap = query_bai_tap.execute()
            bai_tap_sap_han = response_bai_tap.data
        except Exception as e:
            print(f"Lỗi lấy bài tập: {e}")
            bai_tap_sap_han = []
        
        # 5. Ghi chú quan trọng
        try:
            query_ghi_chu = supabase.table('ghi_chu').select('*')
            query_ghi_chu = query_ghi_chu.eq('muc_do_uu_tien', 'cao')
            query_ghi_chu = query_ghi_chu.order('ngay_tao', desc=True)
            query_ghi_chu = query_ghi_chu.limit(3)
            response_ghi_chu = query_ghi_chu.execute()
            ghi_chu_quan_trong = response_ghi_chu.data
        except Exception as e:
            print(f"Lỗi lấy ghi chú: {e}")
            ghi_chu_quan_trong = []
        
        # 6. Công việc hôm nay
        try:
            query_cong_viec = supabase.table('cong_viec').select('*')
            query_cong_viec = query_cong_viec.eq('ngay', str(hom_nay))
            query_cong_viec = query_cong_viec.order('gio_bat_dau', desc=False)
            response_cong_viec = query_cong_viec.execute()
            cong_viec_hom_nay = response_cong_viec.data
        except Exception as e:
            print(f"Lỗi lấy công việc: {e}")
            cong_viec_hom_nay = []
        
        # Tổng hợp dữ liệu
        dashboard_data = {
            'thong_ke_thu_chi': thong_ke_thu_chi,
            'giao_dich_gan_day': response_gan_day.data,
            'top_danh_muc_chi': top_danh_muc,
            'bai_tap_sap_han': bai_tap_sap_han,
            'ghi_chu_quan_trong': ghi_chu_quan_trong,
            'cong_viec_hom_nay': cong_viec_hom_nay,
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
# API QUẢN LÝ CHI TIÊU (Tương thích ngược)
# ================================

@app.route('/api/chi-tieu', methods=['GET'])
def lay_danh_sach_chi_tieu():
    """API lấy danh sách chi tiêu"""
    try:
        response = supabase.table('thu_chi').select('*').eq('loai', 'chi').order('ngay_giao_dich', desc=True).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/chi-tieu', methods=['POST'])
def them_chi_tieu():
    """API thêm chi tiêu mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        if not du_lieu.get('tieu_de'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tiêu đề chi tiêu là bắt buộc'
            })
        
        if not du_lieu.get('so_tien'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Số tiền là bắt buộc'
            })
        
        # Thêm vào database
        response = supabase.table('thu_chi').insert({
            'loai': 'chi',
            'tieu_de': du_lieu['tieu_de'],
            'so_tien': float(du_lieu['so_tien']),
            'danh_muc': du_lieu.get('danh_muc', 'khac'),
            'ngay_giao_dich': du_lieu.get('ngay_giao_dich', datetime.now().date().isoformat()),
            'mo_ta': du_lieu.get('mo_ta', ''),
            'ngay_tao': datetime.now().isoformat()
        }).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã thêm chi tiêu mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/chi-tieu/<int:id>', methods=['PUT'])
def cap_nhat_chi_tieu(id):
    """API cập nhật chi tiêu"""
    try:
        du_lieu = request.get_json()
        
        response = supabase.table('thu_chi').update({
            'tieu_de': du_lieu.get('tieu_de'),
            'so_tien': float(du_lieu.get('so_tien')) if du_lieu.get('so_tien') else None,
            'danh_muc': du_lieu.get('danh_muc'),
            'ngay_giao_dich': du_lieu.get('ngay_giao_dich'),
            'mo_ta': du_lieu.get('mo_ta'),
            'ngay_cap_nhat': datetime.now().isoformat()
        }).eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã cập nhật chi tiêu!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/chi-tieu/<int:id>', methods=['DELETE'])
def xoa_chi_tieu(id):
    """API xóa chi tiêu"""
    try:
        response = supabase.table('thu_chi').delete().eq('id', id).execute()
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa chi tiêu!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/thong-ke-chi-tieu', methods=['GET'])
def lay_thong_ke_chi_tieu():
    """API lấy thống kê chi tiêu theo tháng/năm"""
    try:
        thang = request.args.get('thang')
        nam = request.args.get('nam')
        
        if not nam:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Vui lòng cung cấp năm'
            })
        
        # Xây dựng điều kiện lọc
        query = supabase.table('thu_chi').select('*').eq('loai', 'chi')
        
        # Lọc theo năm
        query = query.gte('ngay_giao_dich', f'{nam}-01-01').lte('ngay_giao_dich', f'{nam}-12-31')
        
        # Lọc theo tháng nếu có
        if thang:
            thang_str = str(thang).zfill(2)
            query = query.gte('ngay_giao_dich', f'{nam}-{thang_str}-01').lte('ngay_giao_dich', f'{nam}-{thang_str}-31')
        
        response = query.execute()
        
        # Tính toán thống kê
        thong_ke = tinh_toan_thong_ke_chi_tieu(response.data)
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': thong_ke
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

def tinh_toan_thong_ke_chi_tieu(danh_sach_chi_tieu):
    """Tính toán thống kê chi tiêu"""
    if not danh_sach_chi_tieu:
        return {
            'tong_chi_tieu': 0,
            'so_giao_dich': 0,
            'chi_tieu_trung_binh': 0,
            'theo_danh_muc': {},
            'theo_ngay': []
        }
    
    tong_chi_tieu = sum(float(item['so_tien']) for item in danh_sach_chi_tieu)
    so_giao_dich = len(danh_sach_chi_tieu)
    chi_tieu_trung_binh = tong_chi_tieu / so_giao_dich if so_giao_dich > 0 else 0
    
    # Thống kê theo danh mục
    theo_danh_muc = {}
    for item in danh_sach_chi_tieu:
        danh_muc = item.get('danh_muc', 'khac')
        if danh_muc not in theo_danh_muc:
            theo_danh_muc[danh_muc] = {
                'tong_tien': 0,
                'so_giao_dich': 0
            }
        theo_danh_muc[danh_muc]['tong_tien'] += float(item['so_tien'])
        theo_danh_muc[danh_muc]['so_giao_dich'] += 1
    
    # Thống kê theo ngày
    theo_ngay = {}
    for item in danh_sach_chi_tieu:
        ngay = item['ngay_giao_dich']  # Thay đổi từ 'ngay_chi' thành 'ngay_giao_dich'
        if ngay not in theo_ngay:
            theo_ngay[ngay] = {
                'ngay': ngay,
                'tong_tien': 0,
                'so_giao_dich': 0
            }
        theo_ngay[ngay]['tong_tien'] += float(item['so_tien'])
        theo_ngay[ngay]['so_giao_dich'] += 1
    
    return {
        'tong_chi_tieu': tong_chi_tieu,
        'so_giao_dich': so_giao_dich,
        'chi_tieu_trung_binh': round(chi_tieu_trung_binh, 2),
        'theo_danh_muc': theo_danh_muc,
        'theo_ngay': list(theo_ngay.values())
    }

@app.route('/api/google-calendar/config')
def google_calendar_config():
    """Trả về cấu hình Google Calendar API"""
    try:
        config = {
            'api_key': os.getenv('GOOGLE_API_KEY'),
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'discovery_docs': ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            'scopes': 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        # Kiểm tra xem có đầy đủ cấu hình không
        if not config['api_key'] or not config['client_id']:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Chưa cấu hình Google Calendar API. Vui lòng thêm GOOGLE_API_KEY và GOOGLE_CLIENT_ID vào file .env'
            })
        
        return jsonify({
            'thanh_cong': True,
            'cau_hinh': config
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# API QUẢN LÝ GHI CHÚ
# ================================

@app.route('/api/ghi-chu', methods=['GET'])
def lay_danh_sach_ghi_chu():
    """API lấy danh sách ghi chú với bộ lọc"""
    try:
        id_ghi_chu = request.args.get('id')
        danh_muc = request.args.get('danh_muc')
        muc_do_uu_tien = request.args.get('muc_do_uu_tien')
        tu_khoa = request.args.get('tu_khoa')
        
        query = supabase.table('ghi_chu').select('*')
        
        # Filter theo ID (để lấy chi tiết 1 ghi chú)
        if id_ghi_chu:
            query = query.eq('id', id_ghi_chu)
        
        # Filter theo danh mục
        if danh_muc:
            query = query.eq('danh_muc', danh_muc)
        
        # Filter theo mức độ ưu tiên
        if muc_do_uu_tien:
            query = query.eq('muc_do_uu_tien', muc_do_uu_tien)
        
        # Tìm kiếm theo từ khóa
        if tu_khoa:
            query = query.or_(f'tieu_de.ilike.%{tu_khoa}%,noi_dung.ilike.%{tu_khoa}%')
        
        response = query.order('ngay_tao', desc=True).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data
        })
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/ghi-chu', methods=['POST'])
def them_ghi_chu():
    """API thêm ghi chú mới"""
    try:
        du_lieu = request.get_json()
        
        # Validate dữ liệu bắt buộc
        if not du_lieu.get('tieu_de'):
            return jsonify({
                'thanh_cong': False,
                'loi': 'Tiêu đề là bắt buộc'
            })
        
        # Chuẩn bị dữ liệu để insert
        ghi_chu_moi = {
            'tieu_de': du_lieu['tieu_de'],
            'noi_dung': du_lieu.get('noi_dung', ''),
            'danh_muc': du_lieu.get('danh_muc', 'khac'),
            'muc_do_uu_tien': du_lieu.get('muc_do_uu_tien', 'thap'),
            'ngay_nhac_nho': du_lieu.get('ngay_nhac_nho')
        }
        
        response = supabase.table('ghi_chu').insert(ghi_chu_moi).execute()
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0] if response.data else None,
            'thong_bao': 'Đã thêm ghi chú mới!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/ghi-chu/<int:id>', methods=['PUT'])
def cap_nhat_ghi_chu(id):
    """API cập nhật ghi chú"""
    try:
        du_lieu = request.get_json()
        
        # Chuẩn bị dữ liệu để update
        du_lieu_cap_nhat = {}
        
        if 'tieu_de' in du_lieu:
            du_lieu_cap_nhat['tieu_de'] = du_lieu['tieu_de']
        if 'noi_dung' in du_lieu:
            du_lieu_cap_nhat['noi_dung'] = du_lieu['noi_dung']
        if 'danh_muc' in du_lieu:
            du_lieu_cap_nhat['danh_muc'] = du_lieu['danh_muc']
        if 'muc_do_uu_tien' in du_lieu:
            du_lieu_cap_nhat['muc_do_uu_tien'] = du_lieu['muc_do_uu_tien']
        if 'ngay_nhac_nho' in du_lieu:
            du_lieu_cap_nhat['ngay_nhac_nho'] = du_lieu['ngay_nhac_nho']
        
        response = supabase.table('ghi_chu').update(du_lieu_cap_nhat).eq('id', id).execute()
        
        if not response.data:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không tìm thấy ghi chú để cập nhật'
            })
        
        return jsonify({
            'thanh_cong': True,
            'du_lieu': response.data[0],
            'thong_bao': 'Đã cập nhật ghi chú!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

@app.route('/api/ghi-chu/<int:id>', methods=['DELETE'])
def xoa_ghi_chu(id):
    """API xóa ghi chú"""
    try:
        response = supabase.table('ghi_chu').delete().eq('id', id).execute()
        
        if not response.data:
            return jsonify({
                'thanh_cong': False,
                'loi': 'Không tìm thấy ghi chú để xóa'
            })
        
        return jsonify({
            'thanh_cong': True,
            'thong_bao': 'Đã xóa ghi chú!'
        })
        
    except Exception as e:
        return jsonify({
            'thanh_cong': False,
            'loi': str(e)
        })

# ================================
# PWA ROUTES
# ================================

@app.route('/manifest.json')
def manifest():
    """Trả về PWA manifest"""
    return send_from_directory('static', 'manifest.json', mimetype='application/json')

@app.route('/sw.js')
def service_worker():
    """Trả về Service Worker"""
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')

@app.route('/offline.html')
def offline():
    """Trang offline cho PWA"""
    return render_template('offline.html')

# ================================
# KHỞI ĐỘNG ỨNG DỤNG  
# ================================

# Export app cho Vercel
app_handler = app

if __name__ == '__main__':
    print("🚀 Khởi động ứng dụng Quản lý Cá nhân...")
    print("📱 Truy cập: http://localhost:5000")
    
    # Chạy Flask app
    port = int(os.getenv('PORT', 5000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('FLASK_ENV') != 'production'
    )
