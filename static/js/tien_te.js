/**
 * Quản lý cài đặt tiền tệ
 * Hỗ trợ VND, JPY và các đơn vị khác
 */

// Cấu hình mặc định
const CAI_DAT_TIEN_TE_MAC_DINH = {
    don_vi: 'VND',
    ty_gia_vnd_jpy: 185,
    dinh_dang: 'standard',
    hien_thi_ky_hieu: 'suffix',
    lan_cuoi_cap_nhat: null
};

// Danh sách ký hiệu tiền tệ
const KY_HIEU_TIEN_TE = {
    'VND': { ky_hieu: '₫', ten: 'Việt Nam Đồng' },
    'JPY': { ky_hieu: '¥', ten: 'Yên Nhật' },
    'USD': { ky_hieu: '$', ten: 'Đô la Mỹ' },
    'EUR': { ky_hieu: '€', ten: 'Euro' }
};

/**
 * Khởi tạo cài đặt tiền tệ
 */
function khoi_tao_cai_dat_tien_te() {
    tai_cai_dat_tien_te();
    cap_nhat_xem_truoc();
    
    // Thêm event listeners
    document.getElementById('don-vi-tien-te').addEventListener('change', cap_nhat_xem_truoc);
    document.getElementById('dinh-dang-tien').addEventListener('change', cap_nhat_xem_truoc);
    document.getElementById('hien-thi-ky-hieu').addEventListener('change', cap_nhat_xem_truoc);
}

/**
 * Tải cài đặt từ localStorage
 */
function tai_cai_dat_tien_te() {
    try {
        const cai_dat = JSON.parse(localStorage.getItem('cai_dat_tien_te')) || CAI_DAT_TIEN_TE_MAC_DINH;
        
        document.getElementById('don-vi-tien-te').value = cai_dat.don_vi;
        document.getElementById('dinh-dang-tien').value = cai_dat.dinh_dang;
        document.getElementById('hien-thi-ky-hieu').value = cai_dat.hien_thi_ky_hieu;
        
        cap_nhat_xem_truoc();
        
    } catch (error) {
        console.error('Lỗi tải cài đặt tiền tệ:', error);
        hien_thi_thong_bao('Lỗi tải cài đặt tiền tệ', 'error');
    }
}

/**
 * Lưu cài đặt vào localStorage
 */
function luu_cai_dat_tien_te() {
    try {
        const cai_dat = {
            don_vi: document.getElementById('don-vi-tien-te').value,
            ty_gia_vnd_jpy: 185, // Giá trị mặc định cố định
            dinh_dang: document.getElementById('dinh-dang-tien').value,
            hien_thi_ky_hieu: document.getElementById('hien-thi-ky-hieu').value,
            lan_cuoi_cap_nhat: new Date().toISOString()
        };
        
        localStorage.setItem('cai_dat_tien_te', JSON.stringify(cai_dat));
        
        hien_thi_thong_bao('Đã lưu cài đặt tiền tệ!', 'success');
        
        // Phát sự kiện để các trang khác cập nhật
        window.dispatchEvent(new CustomEvent('tien_te_thay_doi', { detail: cai_dat }));
        
    } catch (error) {
        console.error('Lỗi lưu cài đặt tiền tệ:', error);
        hien_thi_thong_bao('Lỗi lưu cài đặt tiền tệ', 'error');
    }
}

/**
 * Cập nhật xem trước định dạng tiền
 */
function cap_nhat_xem_truoc() {
    const don_vi = document.getElementById('don-vi-tien-te').value;
    const dinh_dang = document.getElementById('dinh-dang-tien').value;
    const hien_thi = document.getElementById('hien-thi-ky-hieu').value;
    
    const so_tien_mau = 1000;
    const formatted = dinh_dang_tien_te(so_tien_mau, don_vi, dinh_dang, hien_thi);
    
    document.getElementById('xem-truoc-tien').textContent = formatted;
}

/**
 * Cập nhật hiển thị tỷ giá - ĐÃ VÔ HIỆU HÓA
 * Giữ lại để tương thích ngược
 */
function cap_nhat_ty_gia_hien_thi() {
    // Hàm này đã được vô hiệu hóa vì đã xóa UI tỷ giá
    // const ty_gia = 185; // Giá trị mặc định
    // console.log('Tỷ giá mặc định:', ty_gia);
}

/**
 * Định dạng số tiền theo cài đặt
 */
function dinh_dang_tien_te(so_tien, don_vi = null, dinh_dang = null, hien_thi = null) {
    try {
        // Lấy cài đặt hiện tại nếu không được cung cấp
        if (!don_vi || !dinh_dang || !hien_thi) {
            const cai_dat = lay_cai_dat_tien_te();
            don_vi = don_vi || cai_dat.don_vi;
            dinh_dang = dinh_dang || cai_dat.dinh_dang;
            hien_thi = hien_thi || cai_dat.hien_thi_ky_hieu;
        }
        
        const ky_hieu = KY_HIEU_TIEN_TE[don_vi]?.ky_hieu || don_vi;
        let so_dinh_dang = '';
        
        // Định dạng số
        switch (dinh_dang) {
            case 'short':
                if (so_tien >= 1000000000) {
                    so_dinh_dang = (so_tien / 1000000000).toFixed(1) + 'B';
                } else if (so_tien >= 1000000) {
                    so_dinh_dang = (so_tien / 1000000).toFixed(1) + 'M';
                } else if (so_tien >= 1000) {
                    so_dinh_dang = (so_tien / 1000).toFixed(1) + 'K';
                } else {
                    so_dinh_dang = so_tien.toString();
                }
                break;
            case 'full':
                so_dinh_dang = so_tien.toLocaleString('vi-VN', { minimumFractionDigits: 2 });
                break;
            default: // standard
                so_dinh_dang = so_tien.toLocaleString('vi-VN');
        }
        
        // Hiển thị ký hiệu
        switch (hien_thi) {
            case 'prefix':
                return `${ky_hieu}${so_dinh_dang}`;
            case 'both':
                return `${ky_hieu}${so_dinh_dang} ${don_vi}`;
            default: // suffix
                return `${so_dinh_dang}${ky_hieu}`;
        }
        
    } catch (error) {
        console.error('Lỗi định dạng tiền tệ:', error);
        return so_tien.toLocaleString('vi-VN');
    }
}

/**
 * Lấy cài đặt tiền tệ hiện tại
 */
function lay_cai_dat_tien_te() {
    try {
        return JSON.parse(localStorage.getItem('cai_dat_tien_te')) || CAI_DAT_TIEN_TE_MAC_DINH;
    } catch (error) {
        console.error('Lỗi lấy cài đặt tiền tệ:', error);
        return CAI_DAT_TIEN_TE_MAC_DINH;
    }
}

/**
 * Chuyển đổi tiền tệ
 */
function chuyen_doi_tien_te(so_tien, tu_don_vi, den_don_vi) {
    try {
        const cai_dat = lay_cai_dat_tien_te();
        const ty_gia = cai_dat.ty_gia_vnd_jpy;
        
        if (tu_don_vi === den_don_vi) {
            return so_tien;
        }
        
        if (tu_don_vi === 'VND' && den_don_vi === 'JPY') {
            return so_tien / ty_gia;
        }
        
        if (tu_don_vi === 'JPY' && den_don_vi === 'VND') {
            return so_tien * ty_gia;
        }
        
        // Các đơn vị khác có thể thêm sau
        return so_tien;
        
    } catch (error) {
        console.error('Lỗi chuyển đổi tiền tệ:', error);
        return so_tien;
    }
}

/**
 * Cập nhật tỷ giá từ API - ĐÃ VÔ HIỆU HÓA
 * Giữ lại để tương thích ngược
 */
async function cap_nhat_ty_gia() {
    console.log('Hàm cập nhật tỷ giá đã được vô hiệu hóa');
    hien_thi_thong_bao('Tính năng này đã bị vô hiệu hóa', 'info');
}

// Khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('don-vi-tien-te')) {
        khoi_tao_cai_dat_tien_te();
    }
});

/**
 * Hiển thị thông báo toast
 */
function hien_thi_thong_bao(thong_bao, loai = 'success') {
    try {
        const toastEl = document.getElementById('toast-cai-dat');
        const messageEl = document.getElementById('toast-message');
        
        if (toastEl && messageEl) {
            messageEl.textContent = thong_bao;
            
            // Thay đổi icon dựa trên loại thông báo
            const iconEl = toastEl.querySelector('.toast-header i');
            if (iconEl) {
                iconEl.className = loai === 'error' ? 'fas fa-exclamation-circle text-danger me-2' : 
                                 loai === 'info' ? 'fas fa-info-circle text-info me-2' :
                                 'fas fa-check-circle text-success me-2';
            }
            
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        } else {
            // Fallback nếu không có toast element
            console.log(`${loai.toUpperCase()}: ${thong_bao}`);
            alert(thong_bao);
        }
    } catch (error) {
        console.error('Lỗi hiển thị thông báo:', error);
        alert(thong_bao);
    }
}
