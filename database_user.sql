-- Tạo bảng người dùng cho hệ thống đăng nhập
CREATE TABLE IF NOT EXISTS nguoi_dung (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    ten_hien_thi VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    avatar_url TEXT,
    lan_dang_nhap_cuoi TIMESTAMP WITH TIME ZONE,
    trang_thai VARCHAR(20) DEFAULT 'hoat_dong' CHECK (trang_thai IN ('hoat_dong', 'khoa')),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho hiệu suất
CREATE INDEX IF NOT EXISTS idx_nguoi_dung_ten_dang_nhap ON nguoi_dung(ten_dang_nhap);
CREATE INDEX IF NOT EXISTS idx_nguoi_dung_email ON nguoi_dung(email);
CREATE INDEX IF NOT EXISTS idx_nguoi_dung_trang_thai ON nguoi_dung(trang_thai);

-- Trigger tự động cập nhật ngày sửa đổi
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat_nguoi_dung()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ngay_cap_nhat_nguoi_dung
    BEFORE UPDATE ON nguoi_dung
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat_nguoi_dung();

-- Tạo tài khoản mặc định (password: admin123)
-- Mật khẩu đã được hash bằng bcrypt
INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau, ten_hien_thi, email) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthePvdPovJ2Sou', 'Quản Trị Viên', 'admin@quanlycn.local')
ON CONFLICT (ten_dang_nhap) DO NOTHING;

-- Tạo bảng phiên đăng nhập (sessions)
CREATE TABLE IF NOT EXISTS phien_dang_nhap (
    id VARCHAR(255) PRIMARY KEY,
    nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    du_lieu_phien JSONB,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_het_han TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    hoat_dong BOOLEAN DEFAULT TRUE
);

-- Index cho bảng phiên đăng nhập
CREATE INDEX IF NOT EXISTS idx_phien_dang_nhap_nguoi_dung_id ON phien_dang_nhap(nguoi_dung_id);
CREATE INDEX IF NOT EXISTS idx_phien_dang_nhap_hoat_dong ON phien_dang_nhap(hoat_dong);
CREATE INDEX IF NOT EXISTS idx_phien_dang_nhap_het_han ON phien_dang_nhap(ngay_het_han);

-- Function để dọn dẹp phiên hết hạn
CREATE OR REPLACE FUNCTION don_dep_phien_het_han()
RETURNS INTEGER AS $$
DECLARE
    so_phien_xoa INTEGER;
BEGIN
    DELETE FROM phien_dang_nhap 
    WHERE ngay_het_han < NOW() OR hoat_dong = FALSE;
    
    GET DIAGNOSTICS so_phien_xoa = ROW_COUNT;
    RETURN so_phien_xoa;
END;
$$ LANGUAGE plpgsql;

-- Tạo view để xem thông tin phiên đăng nhập
CREATE OR REPLACE VIEW v_phien_dang_nhap AS
SELECT 
    p.id as phien_id,
    p.ngay_tao as phien_tao,
    p.ngay_het_han as phien_het_han,
    p.hoat_dong as phien_hoat_dong,
    n.id as nguoi_dung_id,
    n.ten_dang_nhap,
    n.ten_hien_thi,
    n.email,
    n.lan_dang_nhap_cuoi
FROM phien_dang_nhap p
JOIN nguoi_dung n ON p.nguoi_dung_id = n.id
WHERE p.hoat_dong = TRUE AND p.ngay_het_han > NOW();

COMMENT ON TABLE nguoi_dung IS 'Bảng quản lý người dùng hệ thống';
COMMENT ON TABLE phien_dang_nhap IS 'Bảng quản lý phiên đăng nhập';
COMMENT ON COLUMN nguoi_dung.mat_khau IS 'Mật khẩu đã được hash bằng bcrypt';
COMMENT ON COLUMN phien_dang_nhap.du_lieu_phien IS 'Dữ liệu phiên được lưu dưới dạng JSON';

SELECT 'Đã tạo bảng người dùng và phiên đăng nhập thành công!' as ket_qua;
