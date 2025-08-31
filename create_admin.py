#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script kiểm tra và tạo user admin cho ứng dụng
"""
import sqlite3
import bcrypt
from datetime import datetime

def check_and_create_admin():
    try:
        # Kết nối database
        conn = sqlite3.connect('quan_ly_ca_nhan.db')
        cursor = conn.cursor()
        
        # Kiểm tra bảng có tồn tại không
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='nguoi_dung'
        """)
        
        if not cursor.fetchone():
            print("❌ Bảng nguoi_dung chưa tồn tại!")
            return False
            
        # Kiểm tra user admin có tồn tại không
        cursor.execute("SELECT id, ten_dang_nhap FROM nguoi_dung WHERE ten_dang_nhap = 'admin'")
        admin_user = cursor.fetchone()
        
        if admin_user:
            print(f"✅ User admin đã tồn tại với ID: {admin_user[0]}")
            
            # Cập nhật mật khẩu admin thành 'admin123'
            password = 'admin123'
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute("""
                UPDATE nguoi_dung 
                SET mat_khau = ?, ngay_cap_nhat = ?
                WHERE ten_dang_nhap = 'admin'
            """, (hashed_password, datetime.now()))
            
            conn.commit()
            print(f"✅ Đã cập nhật mật khẩu admin: {password}")
            
        else:
            # Tạo user admin mới
            password = 'admin123'
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute("""
                INSERT INTO nguoi_dung 
                (ten_dang_nhap, mat_khau, ten_hien_thi, email, trang_thai, ngay_tao, ngay_cap_nhat)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                'admin',
                hashed_password,
                'Administrator',
                'admin@example.com',
                'hoat_dong',
                datetime.now(),
                datetime.now()
            ))
            
            conn.commit()
            print(f"✅ Đã tạo user admin mới với mật khẩu: {password}")
        
        # Hiển thị thông tin đăng nhập
        print("\n" + "="*50)
        print("🔑 THÔNG TIN ĐĂNG NHẬP:")
        print("👤 Username: admin")
        print("🔒 Password: admin123")
        print("="*50)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return False

if __name__ == "__main__":
    check_and_create_admin()
