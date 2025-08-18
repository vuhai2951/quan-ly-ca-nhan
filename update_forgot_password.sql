-- Thêm các cột cho tính năng quên mật khẩu
ALTER TABLE nguoi_dung 
ADD COLUMN IF NOT EXISTS cau_hoi_bao_mat VARCHAR(50),
ADD COLUMN IF NOT EXISTS tra_loi_bao_mat VARCHAR(255);

-- Cập nhật admin với câu hỏi bảo mật mặc định
UPDATE nguoi_dung 
SET 
    cau_hoi_bao_mat = 'pet',
    tra_loi_bao_mat = 'meo',
    ngay_cap_nhat = NOW()
WHERE ten_dang_nhap = 'admin';

-- Tạo bảng token khôi phục (tùy chọn)
CREATE TABLE IF NOT EXISTS token_khoi_phuc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    mat_khau_tam VARCHAR(50) NOT NULL,
    ngay_het_han TIMESTAMP WITH TIME ZONE NOT NULL,
    da_su_dung BOOLEAN DEFAULT FALSE,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm index cho hiệu suất
CREATE INDEX IF NOT EXISTS idx_token_khoi_phuc_nguoi_dung ON token_khoi_phuc(nguoi_dung_id);
CREATE INDEX IF NOT EXISTS idx_token_khoi_phuc_het_han ON token_khoi_phuc(ngay_het_han);

-- Thêm comment
COMMENT ON COLUMN nguoi_dung.cau_hoi_bao_mat IS 'Câu hỏi bảo mật để khôi phục mật khẩu';
COMMENT ON COLUMN nguoi_dung.tra_loi_bao_mat IS 'Câu trả lời cho câu hỏi bảo mật (lưu lowercase)';
COMMENT ON TABLE token_khoi_phuc IS 'Bảng lưu token khôi phục mật khẩu';
