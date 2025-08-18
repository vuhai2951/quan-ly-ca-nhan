// -*- coding: utf-8 -*-
/**
 * JavaScript cho trang quản lý danh mục thu chi
 */

// ========================================
// QUẢN LÝ DANH MỤC THU CHI
// ========================================

/**
 * Danh mục mặc định
 */
const DANH_MUC_MAC_DINH = {
    thu: [
        { id: 'luong', emoji: '💰', ten: 'Lương' },
        { id: 'thuong', emoji: '🎁', ten: 'Thưởng' },
        { id: 'dau-tu', emoji: '📈', ten: 'Đầu tư' },
        { id: 'ban-hang', emoji: '🛍️', ten: 'Bán hàng' },
        { id: 'thu-khac', emoji: '💵', ten: 'Thu khác' }
    ],
    chi: [
        { id: 'an-uong', emoji: '🍽️', ten: 'Ăn uống' },
        { id: 'di-chuyen', emoji: '🚗', ten: 'Di chuyển' },
        { id: 'giai-tri', emoji: '🎮', ten: 'Giải trí' },
        { id: 'hoc-tap', emoji: '📚', ten: 'Học tập' },
        { id: 'suc-khoe', emoji: '💊', ten: 'Sức khỏe' },
        { id: 'mua-sam', emoji: '🛒', ten: 'Mua sắm' },
        { id: 'chi-khac', emoji: '📦', ten: 'Chi khác' }
    ]
};

/**
 * Tải danh mục từ localStorage hoặc sử dụng mặc định
 */
function tai_danh_muc() {
    try {
        const danh_muc_luu = localStorage.getItem('danh_muc_thu_chi');
        if (danh_muc_luu) {
            return JSON.parse(danh_muc_luu);
        }
    } catch (error) {
        console.warn('Lỗi tải danh mục từ localStorage:', error);
    }
    
    // Trả về danh mục mặc định
    return DANH_MUC_MAC_DINH;
}

/**
 * Lưu danh mục vào localStorage
 */
function luu_danh_muc(danh_muc) {
    try {
        localStorage.setItem('danh_muc_thu_chi', JSON.stringify(danh_muc));
        } catch (error) {
        console.error('❌ Lỗi lưu danh mục:', error);
        hien_thi_thong_bao('Không thể lưu danh mục!', 'error');
    }
}

/**
 * Hiển thị danh sách danh mục
 */
function hien_thi_danh_muc() {
    const danh_muc = tai_danh_muc();
    
    // Hiển thị danh mục thu
    hien_thi_danh_sach_danh_muc('thu', danh_muc.thu);
    
    // Hiển thị danh mục chi
    hien_thi_danh_sach_danh_muc('chi', danh_muc.chi);
}

/**
 * Hiển thị danh sách cho một loại danh mục
 */
function hien_thi_danh_sach_danh_muc(loai, danh_sach) {
    const container = document.getElementById(`danh-sach-${loai}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (danh_sach.length === 0) {
        container.innerHTML = '<p class="text-muted">Chưa có danh mục nào</p>';
        return;
    }
    
    danh_sach.forEach((item, index) => {
        const element = document.createElement('div');
        element.className = 'list-group-item d-flex justify-content-between align-items-center';
        element.innerHTML = `
            <span>
                <span class="me-2">${item.emoji}</span>
                <span class="ten-danh-muc" data-loai="${loai}" data-index="${index}">${item.ten}</span>
            </span>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" onclick="sua_danh_muc('${loai}', ${index})" title="Sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="xoa_danh_muc('${loai}', ${index})" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(element);
    });
}

/**
 * Thêm danh mục mới
 */
function them_danh_muc(loai) {
    // Lấy emoji từ emoji picker thay vì select
    const emoji_hidden = document.getElementById(`emoji-${loai}`);
    const ten_input = document.getElementById(`ten-danh-muc-${loai}`);
    
    if (!emoji_hidden || !ten_input) {
        console.error('Không tìm thấy elements:', `emoji-${loai}`, `ten-danh-muc-${loai}`);
        return;
    }
    
    const emoji = emoji_hidden.value?.trim();
    const ten = ten_input.value.trim();
    
    if (!emoji || !ten) {
        hien_thi_thong_bao('Vui lòng chọn emoji và nhập tên danh mục!', 'error');
        return;
    }
    
    // Tạo ID từ tên (chuyển thành dạng slug)
    const id = ten.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
        .replace(/[^a-z0-9\s]/g, '') // Chỉ giữ chữ, số, khoảng trắng
        .replace(/\s+/g, '-'); // Thay khoảng trắng bằng dấu gạch ngang
    
    const danh_muc = tai_danh_muc();
    
    // Kiểm tra trùng lặp
    const da_ton_tai = danh_muc[loai].some(item => 
        item.id === id || item.ten.toLowerCase() === ten.toLowerCase()
    );
    
    if (da_ton_tai) {
        hien_thi_thong_bao('Danh mục này đã tồn tại!', 'error');
        return;
    }
    
    // Thêm danh mục mới
    danh_muc[loai].push({ id, emoji, ten });
    
    // Lưu và cập nhật hiển thị
    luu_danh_muc(danh_muc);
    hien_thi_danh_muc();
    
    // Reset form
    // Reset emoji picker về emoji đầu tiên
    const emoji_default = loai === 'thu' ? '💰' : '🍽️';
    emoji_hidden.value = emoji_default;
    const emoji_display = document.getElementById(`emoji-${loai}-selected`);
    if (emoji_display) {
        emoji_display.textContent = emoji_default;
    }
    
    ten_input.value = '';
    
    hien_thi_thong_bao(`Đã thêm danh mục ${loai}: ${emoji} ${ten}`, 'success');
}

/**
 * Xóa danh mục
 */
function xoa_danh_muc(loai, index) {
    const danh_muc = tai_danh_muc();
    const item = danh_muc[loai][index];
    
    if (!item) return;
    
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${item.emoji} ${item.ten}"?`)) {
        return;
    }
    
    // Xóa khỏi mảng
    danh_muc[loai].splice(index, 1);
    
    // Lưu và cập nhật hiển thị
    luu_danh_muc(danh_muc);
    hien_thi_danh_muc();
    
    hien_thi_thong_bao(`Đã xóa danh mục: ${item.emoji} ${item.ten}`, 'success');
}

/**
 * Sửa danh mục (inline editing)
 */
function sua_danh_muc(loai, index) {
    const danh_muc = tai_danh_muc();
    const item = danh_muc[loai][index];
    
    if (!item) return;
    
    const ten_element = document.querySelector(`.ten-danh-muc[data-loai="${loai}"][data-index="${index}"]`);
    if (!ten_element) return;
    
    const ten_cu = item.ten;
    
    // Tạo input để sửa
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm';
    input.value = ten_cu;
    input.style.width = '150px';
    
    // Thay thế text bằng input
    ten_element.replaceWith(input);
    input.focus();
    input.select();
    
    // Xử lý khi hoàn thành
    function hoan_thanh_sua() {
        const ten_moi = input.value.trim();
        
        if (!ten_moi) {
            // Khôi phục tên cũ nếu để trống
            input.replaceWith(ten_element);
            return;
        }
        
        if (ten_moi !== ten_cu) {
            // Cập nhật tên mới
            item.ten = ten_moi;
            
            // Cập nhật ID mới
            item.id = ten_moi.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-');
            
            // Lưu danh mục
            luu_danh_muc(danh_muc);
            
            hien_thi_thong_bao(`Đã cập nhật danh mục: ${item.emoji} ${ten_moi}`, 'success');
        }
        
        // Cập nhật lại hiển thị
        hien_thi_danh_muc();
    }
    
    // Lắng nghe sự kiện
    input.addEventListener('blur', hoan_thanh_sua);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            hoan_thanh_sua();
        } else if (e.key === 'Escape') {
            input.replaceWith(ten_element);
        }
    });
}

/**
 * Hiển thị thông báo
 */
function hien_thi_thong_bao(thong_bao, loai = 'success') {
    // Sử dụng hàm thông báo global từ base template
    if (typeof window.hien_thi_thong_bao === 'function') {
        window.hien_thi_thong_bao(thong_bao, loai);
    } else {
        alert(thong_bao);
    }
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    hien_thi_danh_muc(); // Tải danh mục thu chi
});
