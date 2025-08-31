# -*- coding: utf-8 -*-
"""
SQLAlchemy Models cho ứng dụng Quản lý Cá nhân
"""
from datetime import datetime
from database_config import db

# ================================
# USER MANAGEMENT MODELS
# ================================

class NguoiDung(db.Model):
    __tablename__ = 'nguoi_dung'
    
    id = db.Column(db.Integer, primary_key=True)
    ten_dang_nhap = db.Column(db.String(50), unique=True, nullable=False)
    mat_khau = db.Column(db.String(255), nullable=False)
    ten_hien_thi = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    trang_thai = db.Column(db.String(20), default='hoat_dong')
    cau_hoi_bao_mat = db.Column(db.String(255))
    tra_loi_bao_mat = db.Column(db.String(255))
    lan_dang_nhap_cuoi = db.Column(db.DateTime)
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<NguoiDung {self.ten_dang_nhap}>'

class PhienDangNhap(db.Model):
    __tablename__ = 'phien_dang_nhap'
    
    id = db.Column(db.String(36), primary_key=True)
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'), nullable=False)
    du_lieu_phien = db.Column(db.JSON)
    ngay_het_han = db.Column(db.DateTime, nullable=False)
    hoat_dong = db.Column(db.Boolean, default=True)
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    
    # Relationship
    nguoi_dung = db.relationship('NguoiDung', backref=db.backref('phien_dang_nhap', lazy=True))

# ================================
# FINANCIAL MANAGEMENT MODELS
# ================================

class ThuChi(db.Model):
    __tablename__ = 'thu_chi'
    
    id = db.Column(db.Integer, primary_key=True)
    loai = db.Column(db.String(10), nullable=False)  # 'thu' hoặc 'chi'
    tieu_de = db.Column(db.String(200), nullable=False)
    so_tien = db.Column(db.Numeric(15, 2), nullable=False)
    danh_muc = db.Column(db.String(50), default='khac')
    ngay_giao_dich = db.Column(db.Date, nullable=False)
    mo_ta = db.Column(db.Text)
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<ThuChi {self.tieu_de}: {self.so_tien}>'

# ================================
# WORK MANAGEMENT MODELS
# ================================

class CongViec(db.Model):
    __tablename__ = 'cong_viec'
    
    id = db.Column(db.Integer, primary_key=True)
    ten_cong_viec = db.Column(db.String(200), nullable=False)
    luong_gio = db.Column(db.Numeric(10, 2), nullable=False)
    mau_sac = db.Column(db.String(7), default='#007bff')
    dia_diem_mac_dinh = db.Column(db.String(200))
    mo_ta = db.Column(db.Text)
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<CongViec {self.ten_cong_viec}>'

class LichLam(db.Model):
    __tablename__ = 'lich_lam'
    
    id = db.Column(db.Integer, primary_key=True)
    cong_viec_id = db.Column(db.Integer, db.ForeignKey('cong_viec.id'), nullable=False)
    ngay_lam = db.Column(db.Date, nullable=False)
    gio_bat_dau = db.Column(db.Time, nullable=False)
    gio_ket_thuc = db.Column(db.Time, nullable=False)
    dia_diem = db.Column(db.String(200))
    ghi_chu = db.Column(db.Text)
    dong_bo_google = db.Column(db.Boolean, default=False)
    google_event_id = db.Column(db.String(255))
    google_event_link = db.Column(db.String(500))
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    cong_viec = db.relationship('CongViec', backref=db.backref('lich_lam', lazy=True))
    
    def __repr__(self):
        return f'<LichLam {self.ngay_lam}: {self.cong_viec.ten_cong_viec}>'

# ================================
# EDUCATION MANAGEMENT MODELS
# ================================

class MonHoc(db.Model):
    __tablename__ = 'mon_hoc'
    
    id = db.Column(db.Integer, primary_key=True)
    ten_mon_hoc = db.Column(db.String(200), nullable=False)
    ma_mon_hoc = db.Column(db.String(20))
    so_tin_chi = db.Column(db.Integer)
    giang_vien = db.Column(db.String(100))
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<MonHoc {self.ten_mon_hoc}>'

class BaiTap(db.Model):
    __tablename__ = 'bai_tap'
    
    id = db.Column(db.Integer, primary_key=True)
    tieu_de = db.Column(db.String(200), nullable=False)
    mon_hoc_id = db.Column(db.Integer, db.ForeignKey('mon_hoc.id'))
    han_nop = db.Column(db.Date)
    muc_do_uu_tien = db.Column(db.String(20), default='trung-binh')
    mo_ta = db.Column(db.Text)
    trang_thai = db.Column(db.String(20), default='chua-lam')
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    mon_hoc = db.relationship('MonHoc', backref=db.backref('bai_tap', lazy=True))
    
    def __repr__(self):
        return f'<BaiTap {self.tieu_de}>'

class LichHoc(db.Model):
    __tablename__ = 'lich_hoc'
    
    id = db.Column(db.Integer, primary_key=True)
    mon_hoc_id = db.Column(db.Integer, db.ForeignKey('mon_hoc.id'), nullable=False)
    thu = db.Column(db.Integer, nullable=False)  # 2=T2, 3=T3, ..., 8=CN
    gio_bat_dau = db.Column(db.Time, nullable=False)
    gio_ket_thuc = db.Column(db.Time, nullable=False)
    phong_hoc = db.Column(db.String(50))
    ghi_chu = db.Column(db.Text)
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    mon_hoc = db.relationship('MonHoc', backref=db.backref('lich_hoc', lazy=True))
    
    def __repr__(self):
        return f'<LichHoc {self.mon_hoc.ten_mon_hoc} - Thu {self.thu}>'

# ================================
# NOTE MANAGEMENT MODELS
# ================================

class GhiChu(db.Model):
    __tablename__ = 'ghi_chu'
    
    id = db.Column(db.Integer, primary_key=True)
    tieu_de = db.Column(db.String(200), nullable=False)
    noi_dung = db.Column(db.Text)
    danh_muc = db.Column(db.String(50), default='khac')
    muc_do_uu_tien = db.Column(db.String(20), default='trung-binh')
    quan_trong = db.Column(db.Boolean, default=False)
    ngay_nhac_nho = db.Column(db.DateTime)
    da_hoan_thanh = db.Column(db.Boolean, default=False)
    tags = db.Column(db.String(500))  # JSON string hoặc comma-separated
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<GhiChu {self.tieu_de}>'

# ================================
# SETTINGS & CONFIGURATION MODELS
# ================================

class CaiDat(db.Model):
    __tablename__ = 'cai_dat'
    
    id = db.Column(db.Integer, primary_key=True)
    nguoi_dung_id = db.Column(db.Integer, db.ForeignKey('nguoi_dung.id'), nullable=False)
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.JSON)
    mo_ta = db.Column(db.String(255))
    ngay_tao = db.Column(db.DateTime, default=datetime.now)
    ngay_cap_nhat = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('nguoi_dung_id', 'key', name='unique_user_setting'),)
    
    def __repr__(self):
        return f'<CaiDat {self.key}: {self.value}>'
