-- TỔNG HỢP CẤU TRÚC VÀ DỮ LIỆU MẪU CHO SUPABASE
-- File này gồm tất cả các lệnh tạo bảng, cập nhật, và dữ liệu mẫu

-- =====================
-- 1. TẠO BẢNG VÀ DỮ LIỆU CHO CÔNG VIỆC & LỊCH LÀM VIỆC
-- =====================

-- create_cong_viec_tables.sql
-- Tạo bảng công việc và lịch làm việc trên Supabase
CREATE TABLE cong_viec (
    id SERIAL PRIMARY KEY,
    ten_cong_viec VARCHAR(255) NOT NULL,
    luong_gio DECIMAL(10,2) NOT NULL CHECK (luong_gio > 0),
    mau_sac VARCHAR(7) DEFAULT '#007bff',
    dia_diem_mac_dinh VARCHAR(255),
    mo_ta TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE lich_lam (
    id SERIAL PRIMARY KEY,
    cong_viec_id INTEGER REFERENCES cong_viec(id) ON DELETE CASCADE,
    ngay_lam DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    dia_diem VARCHAR(255),
    ghi_chu TEXT,
    dong_bo_google BOOLEAN DEFAULT FALSE,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_cong_viec_ten ON cong_viec(ten_cong_viec);
CREATE INDEX idx_lich_lam_cong_viec_id ON lich_lam(cong_viec_id);
CREATE INDEX idx_lich_lam_ngay_lam ON lich_lam(ngay_lam);
CREATE INDEX idx_lich_lam_thoi_gian ON lich_lam(ngay_lam, gio_bat_dau, gio_ket_thuc);
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat_cong_viec()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ngay_cap_nhat_cong_viec
    BEFORE UPDATE ON cong_viec
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat_cong_viec();
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat_lich_lam()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ngay_cap_nhat_lich_lam
    BEFORE UPDATE ON lich_lam
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat_lich_lam();
INSERT INTO cong_viec (ten_cong_viec, luong_gio, mau_sac, dia_diem_mac_dinh, mo_ta) VALUES
('Part-time bán hàng', 50000, '#28a745', 'Vincom Center, Q1', 'Bán hàng tại cửa hàng thời trang'),
('Gia sư Toán', 80000, '#007bff', 'Tại nhà học sinh', 'Dạy toán cho học sinh THCS'),
('Freelance thiết kế', 120000, '#6f42c1', 'Remote/Online', 'Thiết kế logo, banner cho khách hàng'),
('Phục vụ bàn', 45000, '#ffc107', 'Quán café ABC, Q3', 'Phục vụ khách hàng tại quán café'),
('Nhập liệu', 35000, '#dc3545', 'Văn phòng XYZ, Q2', 'Nhập dữ liệu và xử lý văn bản');
INSERT INTO lich_lam (cong_viec_id, ngay_lam, gio_bat_dau, gio_ket_thuc, dia_diem, ghi_chu, dong_bo_google) VALUES
(1, '2025-08-08', '09:00', '17:00', 'Vincom Center, Q1', 'Ca sáng chiều', FALSE),
(1, '2025-08-09', '14:00', '22:00', 'Vincom Center, Q1', 'Ca chiều tối', FALSE),
(2, '2025-08-08', '19:00', '21:00', '123 Nguyễn Văn Cừ, Q5', 'Dạy học sinh lớp 8', FALSE),
(3, '2025-08-10', '10:00', '16:00', 'Remote', 'Thiết kế logo cho công ty ABC', FALSE),
(4, '2025-08-11', '18:00', '23:00', 'Quán café ABC, Q3', 'Ca tối cuối tuần', FALSE),
(2, '2025-08-10', '19:00', '21:00', '456 Lê Văn Sỹ, Q3', 'Dạy học sinh lớp 9', FALSE),
(5, '2025-08-12', '08:00', '12:00', 'Văn phòng XYZ, Q2', 'Nhập liệu báo cáo tháng', FALSE);
CREATE OR REPLACE VIEW v_thong_ke_luong_thang AS
SELECT 
    cv.id as cong_viec_id,
    cv.ten_cong_viec,
    cv.luong_gio,
    EXTRACT(YEAR FROM ll.ngay_lam) as nam,
    EXTRACT(MONTH FROM ll.ngay_lam) as thang,
    COUNT(ll.id) as so_ca_lam,
    SUM(
        EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600
    ) as tong_gio_lam,
    SUM(
        EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600 * cv.luong_gio
    ) as tong_luong
FROM cong_viec cv
LEFT JOIN lich_lam ll ON cv.id = ll.cong_viec_id
GROUP BY cv.id, cv.ten_cong_viec, cv.luong_gio, nam, thang
ORDER BY nam DESC, thang DESC, cv.ten_cong_viec;
CREATE OR REPLACE FUNCTION tinh_luong_khoang_thoi_gian(
    p_tu_ngay DATE,
    p_den_ngay DATE,
    p_cong_viec_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    cong_viec_id INTEGER,
    ten_cong_viec VARCHAR,
    so_ca_lam BIGINT,
    tong_gio_lam NUMERIC,
    luong_gio DECIMAL,
    tong_luong NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.id,
        cv.ten_cong_viec,
        COUNT(ll.id)::BIGINT,
        SUM(EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600),
        cv.luong_gio,
        SUM(EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600 * cv.luong_gio)
    FROM cong_viec cv
    LEFT JOIN lich_lam ll ON cv.id = ll.cong_viec_id 
        AND ll.ngay_lam BETWEEN p_tu_ngay AND p_den_ngay
    WHERE p_cong_viec_id IS NULL OR cv.id = p_cong_viec_id
    GROUP BY cv.id, cv.ten_cong_viec, cv.luong_gio
    HAVING COUNT(ll.id) > 0
    ORDER BY cv.ten_cong_viec;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- 2. TẠO BẢNG VÀ DỮ LIỆU CHO GHI CHÚ
-- =====================
CREATE TABLE IF NOT EXISTS ghi_chu (
    id SERIAL PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT,
    danh_muc VARCHAR(50) DEFAULT 'khac',
    muc_do_uu_tien VARCHAR(20) DEFAULT 'thap',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_nhac_nho TIMESTAMP,
    da_hoan_thanh BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ghi_chu_danh_muc ON ghi_chu(danh_muc);
CREATE INDEX IF NOT EXISTS idx_ghi_chu_muc_do_uu_tien ON ghi_chu(muc_do_uu_tien);
CREATE INDEX IF NOT EXISTS idx_ghi_chu_ngay_tao ON ghi_chu(ngay_tao);
CREATE INDEX IF NOT EXISTS idx_ghi_chu_ngay_nhac_nho ON ghi_chu(ngay_nhac_nho);
INSERT INTO ghi_chu (tieu_de, noi_dung, danh_muc, muc_do_uu_tien, ngay_nhac_nho) VALUES
('Họp team hàng tuần', 'Thảo luận tiến độ dự án và phân công công việc tuần tới', 'cong-viec', 'cao', '2025-08-12 09:00:00'),
('Ôn tập bài kiểm tra', 'Ôn lại chương 5 và 6 môn Toán cao cấp', 'hoc-tap', 'trung-binh', '2025-08-13 19:00:00'),
('Mua quà sinh nhật mẹ', 'Tìm hiểu và mua quà sinh nhật cho mẹ', 'ca-nhan', 'cao', '2025-08-15 10:00:00'),
('Khám sức khỏe định kỳ', 'Đi khám sức khỏe tổng quát tại bệnh viện', 'suc-khoe', 'trung-binh', '2025-08-20 08:00:00'),
('Ghi chú công thức toán', 'Ghi lại các công thức quan trọng để ôn tập', 'hoc-tap', 'thap', NULL);

-- =====================
-- 3. TẠO BẢNG VÀ DỮ LIỆU CHO HỌC TẬP
-- =====================
CREATE TABLE mon_hoc (
    id SERIAL PRIMARY KEY,
    ten_mon_hoc VARCHAR(255) NOT NULL,
    ma_mon_hoc VARCHAR(50),
    so_tin_chi INTEGER CHECK (so_tin_chi > 0 AND so_tin_chi <= 10),
    giang_vien VARCHAR(255),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE bai_tap (
    id SERIAL PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    mon_hoc_id INTEGER REFERENCES mon_hoc(id) ON DELETE SET NULL,
    han_nop TIMESTAMP WITH TIME ZONE NOT NULL,
    muc_do_uu_tien VARCHAR(20) DEFAULT 'trung-binh' CHECK (muc_do_uu_tien IN ('thap', 'trung-binh', 'cao')),
    mo_ta TEXT,
    trang_thai VARCHAR(20) DEFAULT 'chua-lam' CHECK (trang_thai IN ('chua-lam', 'dang-lam', 'hoan-thanh')),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE lich_hoc (
    id SERIAL PRIMARY KEY,
    mon_hoc_id INTEGER REFERENCES mon_hoc(id) ON DELETE CASCADE,
    thu INTEGER CHECK (thu >= 2 AND thu <= 8),
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    phong_hoc VARCHAR(100),
    ghi_chu TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_bai_tap_han_nop ON bai_tap(han_nop);
CREATE INDEX idx_bai_tap_mon_hoc_id ON bai_tap(mon_hoc_id);
CREATE INDEX idx_bai_tap_trang_thai ON bai_tap(trang_thai);
CREATE INDEX idx_lich_hoc_mon_hoc_id ON lich_hoc(mon_hoc_id);
CREATE INDEX idx_lich_hoc_thu ON lich_hoc(thu);
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat_mon_hoc()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ngay_cap_nhat_mon_hoc
    BEFORE UPDATE ON mon_hoc
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat_mon_hoc();
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat_bai_tap()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ngay_cap_nhat_bai_tap
    BEFORE UPDATE ON bai_tap
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat_bai_tap();
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat_lich_hoc()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ngay_cap_nhat_lich_hoc
    BEFORE UPDATE ON lich_hoc
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat_lich_hoc();
INSERT INTO mon_hoc (ten_mon_hoc, ma_mon_hoc, so_tin_chi, giang_vien) VALUES
('Lập trình Python', 'CS101', 3, 'TS. Nguyễn Văn A'),
('Cơ sở dữ liệu', 'CS102', 4, 'ThS. Trần Thị B'),
('Phát triển Web', 'CS103', 3, 'TS. Lê Văn C'),
('Toán cao cấp', 'MATH101', 4, 'PGS. Phạm Thị D'),
('Tiếng Anh chuyên ngành', 'ENG101', 2, 'ThS. Hoàng Văn E');
INSERT INTO bai_tap (tieu_de, mon_hoc_id, han_nop, muc_do_uu_tien, mo_ta, trang_thai) VALUES
('Bài tập 1: Cấu trúc dữ liệu', 1, '2025-08-15 23:59:00', 'cao', 'Viết chương trình quản lý danh sách liên kết', 'chua-lam'),
('Project cuối kỳ: Hệ quản trị CSDL', 2, '2025-08-20 23:59:00', 'cao', 'Thiết kế và triển khai CSDL cho hệ thống bán hàng', 'dang-lam'),
('Bài tập 2: HTML/CSS', 3, '2025-08-12 23:59:00', 'trung-binh', 'Tạo website responsive với Bootstrap', 'hoan-thanh'),
('Bài tập giải tích', 4, '2025-08-18 23:59:00', 'trung-binh', 'Giải các bài toán về đạo hàm và tích phân', 'chua-lam'),
('Essay: My future career', 5, '2025-08-14 23:59:00', 'thap', 'Viết bài luận 500 từ về nghề nghiệp tương lai', 'chua-lam');
INSERT INTO lich_hoc (mon_hoc_id, thu, gio_bat_dau, gio_ket_thuc, phong_hoc, ghi_chu) VALUES
(1, 2, '09:10', '10:40', 'P.201', 'Lý thuyết + Thực hành'),
(2, 3, '13:10', '14:40', 'Lab.A1', 'Thực hành SQL'),
(3, 4, '10:50', '12:20', 'P.303', 'Thực hành Web'),
(4, 5, '09:10', '10:40', 'P.101', 'Lý thuyết'),
(5, 6, '16:30', '18:00', 'P.205', 'Speaking practice'),
(1, 4, '13:10', '14:40', 'Lab.B2', 'Thực hành Python'),
(2, 2, '10:50', '12:20', 'P.202', 'Lý thuyết CSDL');

-- =====================
-- 4. TẠO BẢNG VÀ DỮ LIỆU CHO THU CHI
-- =====================
CREATE TABLE thu_chi (
    id SERIAL PRIMARY KEY,
    loai VARCHAR(10) NOT NULL CHECK (loai IN ('thu', 'chi')),
    tieu_de VARCHAR(255) NOT NULL,
    so_tien DECIMAL(15,2) NOT NULL CHECK (so_tien >= 0),
    danh_muc VARCHAR(50) NOT NULL,
    ngay_giao_dich DATE NOT NULL,
    mo_ta TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_thu_chi_ngay_giao_dich ON thu_chi(ngay_giao_dich);
CREATE INDEX idx_thu_chi_loai ON thu_chi(loai);
CREATE INDEX idx_thu_chi_danh_muc ON thu_chi(danh_muc);
CREATE OR REPLACE FUNCTION update_ngay_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_ngay_cap_nhat
    BEFORE UPDATE ON thu_chi
    FOR EACH ROW
    EXECUTE FUNCTION update_ngay_cap_nhat();
INSERT INTO thu_chi (loai, tieu_de, so_tien, danh_muc, ngay_giao_dich, mo_ta) VALUES
('thu', 'Lương tháng 8', 15000000, 'luong', '2025-08-01', 'Lương cơ bản + phụ cấp'),
('thu', 'Thưởng dự án', 3000000, 'thuong', '2025-08-05', 'Thưởng hoàn thành dự án ABC'),
('chi', 'Ăn sáng', 35000, 'an-uong', '2025-08-06', 'Phở bò tại quán gần nhà'),
('chi', 'Xăng xe', 200000, 'di-chuyen', '2025-08-06', 'Đổ xăng RON 95'),
('chi', 'Mua sách', 150000, 'hoc-tap', '2025-08-05', 'Sách lập trình Python'),
('thu', 'Bán hàng online', 500000, 'ban-hang', '2025-08-04', 'Bán đồ cũ trên Facebook'),
('chi', 'Cafe với bạn', 80000, 'giai-tri', '2025-08-03', 'Cafe Highlands'),
('chi', 'Thuốc cảm', 45000, 'suc-khoe', '2025-08-02', 'Mua thuốc tại nhà thuốc');

-- =====================
-- 5. CẬP NHẬT BẢNG VÀ VIEW LIÊN QUAN ĐẾN GOOGLE CALENDAR
-- =====================
ALTER TABLE lich_lam 
ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_event_link TEXT;
CREATE INDEX IF NOT EXISTS idx_lich_lam_google_event_id ON lich_lam(google_event_id);
DROP VIEW IF EXISTS v_thong_ke_luong_thang;
CREATE OR REPLACE VIEW v_thong_ke_luong_thang AS
SELECT 
    cv.id as cong_viec_id,
    cv.ten_cong_viec,
    cv.luong_gio,
    cv.mau_sac,
    EXTRACT(YEAR FROM ll.ngay_lam) as nam,
    EXTRACT(MONTH FROM ll.ngay_lam) as thang,
    COUNT(ll.id) as so_ca_lam,
    SUM(
        EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600
    ) as tong_gio_lam,
    SUM(
        EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600 * cv.luong_gio
    ) as tong_luong,
    COUNT(CASE WHEN ll.google_event_id IS NOT NULL THEN 1 END) as so_ca_dong_bo_google,
    ROUND(
        COUNT(CASE WHEN ll.google_event_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(ll.id),
        2
    ) as ty_le_dong_bo_google
FROM cong_viec cv
LEFT JOIN lich_lam ll ON cv.id = ll.cong_viec_id
WHERE ll.id IS NOT NULL
GROUP BY cv.id, cv.ten_cong_viec, cv.luong_gio, cv.mau_sac, nam, thang
ORDER BY nam DESC, thang DESC, tong_luong DESC;
CREATE OR REPLACE VIEW v_lich_lam_chi_tiet AS
SELECT 
    ll.id,
    ll.ngay_lam,
    ll.gio_bat_dau,
    ll.gio_ket_thuc,
    ll.dia_diem,
    ll.ghi_chu,
    ll.dong_bo_google,
    ll.google_event_id,
    ll.google_event_link,
    ll.ngay_tao,
    ll.ngay_cap_nhat,
    cv.id as cong_viec_id,
    cv.ten_cong_viec,
    cv.luong_gio,
    cv.mau_sac,
    cv.dia_diem_mac_dinh,
    cv.mo_ta as mo_ta_cong_viec,
    EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600 as gio_lam,
    (EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600) * cv.luong_gio as luong_ca
FROM lich_lam ll
JOIN cong_viec cv ON ll.cong_viec_id = cv.id
ORDER BY ll.ngay_lam DESC, ll.gio_bat_dau ASC;
CREATE OR REPLACE FUNCTION tinh_luong_khoang_thoi_gian_v2(
    p_tu_ngay DATE,
    p_den_ngay DATE,
    p_cong_viec_id INTEGER DEFAULT NULL,
    p_bao_gom_chua_dong_bo BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    cong_viec_id INTEGER,
    ten_cong_viec VARCHAR,
    mau_sac VARCHAR,
    so_ca_lam BIGINT,
    so_ca_dong_bo_google BIGINT,
    ty_le_dong_bo_google NUMERIC,
    tong_gio_lam NUMERIC,
    luong_gio DECIMAL,
    tong_luong NUMERIC,
    chi_tiet_ngay JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.id,
        cv.ten_cong_viec,
        cv.mau_sac,
        COUNT(ll.id)::BIGINT as so_ca_lam,
        COUNT(CASE WHEN ll.google_event_id IS NOT NULL THEN 1 END)::BIGINT as so_ca_dong_bo_google,
        CASE 
            WHEN COUNT(ll.id) > 0 THEN 
                ROUND(COUNT(CASE WHEN ll.google_event_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(ll.id), 2)
            ELSE 0 
        END as ty_le_dong_bo_google,
        SUM(EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600) as tong_gio_lam,
        cv.luong_gio,
        SUM(EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600 * cv.luong_gio) as tong_luong,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'ngay_lam', ll.ngay_lam,
                'gio_bat_dau', ll.gio_bat_dau,
                'gio_ket_thuc', ll.gio_ket_thuc,
                'gio_lam', EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600,
                'luong_ca', EXTRACT(EPOCH FROM (ll.gio_ket_thuc - ll.gio_bat_dau)) / 3600 * cv.luong_gio,
                'dong_bo_google', CASE WHEN ll.google_event_id IS NOT NULL THEN true ELSE false END,
                'google_event_id', ll.google_event_id
            ) ORDER BY ll.ngay_lam, ll.gio_bat_dau
        ) as chi_tiet_ngay
    FROM cong_viec cv
    LEFT JOIN lich_lam ll ON cv.id = ll.cong_viec_id 
        AND ll.ngay_lam BETWEEN p_tu_ngay AND p_den_ngay
        AND (p_bao_gom_chua_dong_bo OR ll.google_event_id IS NOT NULL)
    WHERE (p_cong_viec_id IS NULL OR cv.id = p_cong_viec_id)
    GROUP BY cv.id, cv.ten_cong_viec, cv.mau_sac, cv.luong_gio
    HAVING COUNT(ll.id) > 0
    ORDER BY cv.ten_cong_viec;
END;
$$ LANGUAGE plpgsql;
COMMENT ON COLUMN lich_lam.google_event_id IS 'ID của sự kiện trên Google Calendar';
COMMENT ON COLUMN lich_lam.google_event_link IS 'Link đến sự kiện trên Google Calendar';
SELECT 'Đã cập nhật bảng lich_lam với hỗ trợ Google Calendar!' as ket_qua;
