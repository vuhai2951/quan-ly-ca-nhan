# Script tạo icons PWA từ logo hiện có
# Sử dụng Python với Pillow để resize logo thành các kích thước cần thiết

import os
from PIL import Image, ImageDraw

def create_icon_from_logo():
    """Tạo icons PWA từ logo hiện có"""
    try:
        # Đường dẫn logo gốc
        logo_path = "static/images/logo-vecter.png"
        
        if not os.path.exists(logo_path):
            print(f"❌ Không tìm thấy logo tại: {logo_path}")
            return False
        
        # Mở logo gốc
        logo = Image.open(logo_path)
        print(f"✅ Đã load logo: {logo.size}")
        
        # Chuyển sang RGBA nếu cần
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')
        
        # Kích thước icons cần tạo
        sizes = [
            (192, 192, "icon-192x192.png"),
            (512, 512, "icon-512x512.png"), 
            (180, 180, "apple-touch-icon.png"),
            (32, 32, "favicon-32x32.png"),
            (16, 16, "favicon-16x16.png")
        ]
        
        for width, height, filename in sizes:
            # Resize logo
            icon = logo.resize((width, height), Image.Resampling.LANCZOS)
            
            # Lưu icon
            icon_path = f"static/images/{filename}"
            icon.save(icon_path, "PNG", optimize=True)
            print(f"✅ Đã tạo: {icon_path} ({width}x{height})")
        
        print("\n🎉 Tạo icons PWA thành công!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi tạo icons: {e}")
        return False

if __name__ == "__main__":
    create_icon_from_logo()
