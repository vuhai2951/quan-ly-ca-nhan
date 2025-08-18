# -*- coding: utf-8 -*-
"""
Cấu hình kết nối Supabase
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

# Thông tin kết nối Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def tao_ket_noi_supabase() -> Client:
    """
    Tạo kết nối đến Supabase
    
    Returns:
        Client: Đối tượng client Supabase
    """
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase_client
    except Exception as e:
        print(f"Lỗi kết nối Supabase: {e}")
        return None

# Tạo client toàn cục
supabase = tao_ket_noi_supabase()

def kiem_tra_ket_noi():
    """
    Kiểm tra kết nối Supabase
    
    Returns:
        bool: True nếu kết nối thành công
    """
    try:
        if supabase:
            # Thử một query đơn giản để kiểm tra kết nối
            response = supabase.table('chi_tieu').select("*").limit(1).execute()
            return True
        return False
    except Exception as e:
        print(f"Không thể kết nối đến Supabase: {e}")
        return False
