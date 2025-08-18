#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script tạo bảng ghi_chu trong Supabase
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supabase_config import supabase

def tao_bang_ghi_chu():
    """Tạo bảng ghi_chu và thêm dữ liệu mẫu"""
    try:
        print("🔧 Bắt đầu tạo bảng ghi_chu...")
        
        # Đọc SQL script
        with open('create_ghi_chu_table.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Tách các câu lệnh SQL
        sql_commands = [cmd.strip() for cmd in sql_script.split(';') if cmd.strip()]
        
        for i, cmd in enumerate(sql_commands):
            if cmd:
                print(f"📝 Thực hiện câu lệnh {i+1}...")
                try:
                    # Với Supabase, ta có thể dùng rpc để thực hiện SQL raw
                    # Hoặc tạo trực tiếp bằng cách insert dữ liệu
                    if cmd.strip().upper().startswith('INSERT'):
                        print(f"   ⏭️  Bỏ qua INSERT (sẽ thực hiện sau)")
                    else:
                        print(f"   ⏭️  Bỏ qua câu lệnh CREATE (cần tạo qua Supabase Dashboard)")
                except Exception as e:
                    print(f"   ❌ Lỗi: {e}")
        
        # Thêm dữ liệu mẫu
        print("\n📊 Thêm dữ liệu mẫu...")
        du_lieu_mau = [
            {
                'tieu_de': 'Họp team hàng tuần',
                'noi_dung': 'Thảo luận tiến độ dự án và phân công công việc tuần tới',
                'danh_muc': 'cong-viec',
                'muc_do_uu_tien': 'cao',
                'ngay_nhac_nho': '2025-08-12T09:00:00',
                'da_hoan_thanh': False
            },
            {
                'tieu_de': 'Ôn tập bài kiểm tra',
                'noi_dung': 'Ôn lại chương 5 và 6 môn Toán cao cấp',
                'danh_muc': 'hoc-tap',
                'muc_do_uu_tien': 'trung-binh',
                'ngay_nhac_nho': '2025-08-13T19:00:00',
                'da_hoan_thanh': False
            },
            {
                'tieu_de': 'Mua quà sinh nhật mẹ',
                'noi_dung': 'Tìm hiểu và mua quà sinh nhật cho mẹ',
                'danh_muc': 'ca-nhan',
                'muc_do_uu_tien': 'cao',
                'ngay_nhac_nho': '2025-08-15T10:00:00',
                'da_hoan_thanh': False
            },
            {
                'tieu_de': 'Khám sức khỏe định kỳ',
                'noi_dung': 'Đi khám sức khỏe tổng quát tại bệnh viện',
                'danh_muc': 'suc-khoe',
                'muc_do_uu_tien': 'trung-binh',
                'ngay_nhac_nho': '2025-08-20T08:00:00',
                'da_hoan_thanh': False
            },
            {
                'tieu_de': 'Ghi chú công thức toán',
                'noi_dung': 'Ghi lại các công thức quan trọng để ôn tập',
                'danh_muc': 'hoc-tap',
                'muc_do_uu_tien': 'thap',
                'da_hoan_thanh': False
            }
        ]
        
        try:
            response = supabase.table('ghi_chu').insert(du_lieu_mau).execute()
            print(f"✅ Đã thêm {len(response.data)} ghi chú mẫu!")
            
            for ghi_chu in response.data:
                print(f"   📝 {ghi_chu['tieu_de']}")
                
        except Exception as e:
            print(f"❌ Lỗi thêm dữ liệu mẫu: {e}")
            print("💡 Có thể bảng chưa tồn tại. Hãy tạo bảng 'ghi_chu' trong Supabase Dashboard trước.")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

if __name__ == '__main__':
    tao_bang_ghi_chu()
