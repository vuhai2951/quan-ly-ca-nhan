// -*- coding: utf-8 -*-
/**
 * JavaScript cho trang cài đặt
 * Quản lý theme, tiền tệ và các tùy chọn khác
 */

// Mapping tiền tệ và các định dạng liên quan
const TIEN_TE_CONFIG = {
    'VND': {
        timezone: 'Asia/Ho_Chi_Minh',
        currency_format: '1', // 1,000,000 VNĐ
        date_format: 'dd/mm/yyyy',
        formats: [
            { value: '1', text: '1,000,000 VNĐ' },
            { value: '2', text: '1.000.000 VNĐ' },
            { value: '3', text: 'VNĐ 1,000,000' },
            { value: '4', text: '₫1,000,000' }
        ]
    },
    'USD': {
        timezone: 'America/New_York',
        currency_format: '5', // $1,000,000
        date_format: 'mm/dd/yyyy',
        formats: [
            { value: '5', text: '$1,000,000' },
            { value: '6', text: '1,000,000 USD' },
            { value: '7', text: 'USD 1,000,000' }
        ]
    },
    'EUR': {
        timezone: 'Europe/London',
        currency_format: '8', // €1,000,000
        date_format: 'dd/mm/yyyy',
        formats: [
            { value: '8', text: '€1,000,000' },
            { value: '9', text: '1,000,000 EUR' },
            { value: '10', text: 'EUR 1,000,000' }
        ]
    },
    'JPY': {
        timezone: 'Asia/Tokyo',
        currency_format: '11', // ¥1,000,000
        date_format: 'yyyy-mm-dd',
        formats: [
            { value: '11', text: '¥1,000,000' },
            { value: '12', text: '1,000,000円' },
            { value: '13', text: '1,000,000 JPY' }
        ]
    },
    'CNY': {
        timezone: 'Asia/Shanghai',
        currency_format: '14', // ¥1,000,000
        date_format: 'yyyy-mm-dd',
        formats: [
            { value: '14', text: '¥1,000,000' },
            { value: '15', text: '1,000,000元' },
            { value: '16', text: '1,000,000 CNY' }
        ]
    }
};

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    tai_cai_dat_hien_tai();
    gan_su_kien();
    hien_thi_danh_muc(); // Tải danh mục thu chi
});

/**
 * Tải cài đặt hiện tại vào UI
 */
function tai_cai_dat_hien_tai() {
    if (!window.CaiDatToanCuc) {
        console.error('❌ Chưa tải global settings!');
        return;
    }
    
    const cai_dat = window.CaiDatToanCuc.hien_tai;
    cap_nhat_ui_tu_cai_dat(cai_dat);
}

/**
 * Gắn sự kiện cho các elements
 */
function gan_su_kien() {
    // Sự kiện thay đổi theme
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cai_dat_moi = { theme: this.value };
            window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
            hien_thi_thong_bao('Đã thay đổi theme', 'success');
        });
    });

    // Sự kiện thay đổi màu chủ đạo
    document.querySelectorAll('input[name="primary-color"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cai_dat_moi = { primary_color: this.value };
            window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
            hien_thi_thong_bao('Đã thay đổi màu chủ đạo', 'success');
        });
    });

    // Sự kiện thay đổi font size
    document.getElementById('font-size').addEventListener('change', function() {
        const cai_dat_moi = { font_size: this.value };
        window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
        hien_thi_thong_bao('Đã thay đổi kích thước chữ', 'success');
    });

    // Sự kiện thay đổi tiền tệ
    document.getElementById('currency').addEventListener('change', function() {
        const tien_te = this.value;
        const config = TIEN_TE_CONFIG[tien_te];
        
        if (config) {
            // Cập nhật các cài đặt liên quan
            const cai_dat_moi = {
                currency: tien_te,
                timezone: config.timezone,
                currency_format: config.currency_format,
                date_format: config.date_format
            };
            
            // Cập nhật dropdown định dạng tiền tệ
            cap_nhat_dinh_dang_tien_te(config.formats);
            
            // Cập nhật UI
            document.getElementById('timezone').value = config.timezone;
            document.getElementById('currency-format').value = config.currency_format;
            document.getElementById('date-format').value = config.date_format;
            
            // Lưu cài đặt
            window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
            hien_thi_thong_bao(`Đã chuyển sang ${tien_te} và cập nhật các cài đặt liên quan`, 'success');
        }
    });

    // Sự kiện thay đổi định dạng tiền tệ
    document.getElementById('currency-format').addEventListener('change', function() {
        const cai_dat_moi = { currency_format: this.value };
        window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
        hien_thi_thong_bao('Đã thay đổi định dạng tiền tệ', 'success');
    });

    // Sự kiện thay đổi múi giờ
    document.getElementById('timezone').addEventListener('change', function() {
        const cai_dat_moi = { timezone: this.value };
        window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
        hien_thi_thong_bao('Đã thay đổi múi giờ', 'success');
    });

    // Sự kiện thay đổi định dạng ngày
    document.getElementById('date-format').addEventListener('change', function() {
        const cai_dat_moi = { date_format: this.value };
        window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
        hien_thi_thong_bao('Đã thay đổi định dạng ngày', 'success');
    });

    // Các checkbox settings
    const checkboxes = [
        'notifications', 'auto-save', 'google-sync', 
        'auto-backup', 'show-tips', 'smart-dark'
    ];
    
    checkboxes.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                const key = id.replace('-', '_');
                const cai_dat_moi = { [key]: this.checked };
                window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
                hien_thi_thong_bao(`Đã ${this.checked ? 'bật' : 'tắt'} ${this.nextElementSibling.textContent.trim()}`, 'success');
            });
        }
    });

    // Tải danh mục thu chi
    tai_danh_muc_thu_chi();
}

/**
 * Cập nhật UI theo cài đặt đã tải
 */
function cap_nhat_ui_tu_cai_dat(cai_dat) {
    try {
        // Theme
        const theme_radio = document.querySelector(`input[name="theme"][value="${cai_dat.theme}"]`);
        if (theme_radio) theme_radio.checked = true;
        
        // Primary color
        const color_radio = document.querySelector(`input[name="primary-color"][value="${cai_dat.primary_color}"]`);
        if (color_radio) color_radio.checked = true;
        
        // Font size
        const font_select = document.getElementById('font-size');
        if (font_select) font_select.value = cai_dat.font_size;
        
        // Currency
        const currency_select = document.getElementById('currency');
        if (currency_select) {
            currency_select.value = cai_dat.currency;
            // Cập nhật định dạng tiền tệ theo loại tiền đã chọn
            const config = TIEN_TE_CONFIG[cai_dat.currency];
            if (config) {
                cap_nhat_dinh_dang_tien_te(config.formats);
            }
        }
        
        // Currency format
        const currency_format_select = document.getElementById('currency-format');
        if (currency_format_select) currency_format_select.value = cai_dat.currency_format || '1';
        
        // Timezone
        const timezone_select = document.getElementById('timezone');
        if (timezone_select) timezone_select.value = cai_dat.timezone;
        
        // Date format
        const date_format_select = document.getElementById('date-format');
        if (date_format_select) date_format_select.value = cai_dat.date_format;
        
        // Checkboxes
        const checkbox_mappings = {
            'notifications': cai_dat.notifications,
            'auto-save': cai_dat.auto_save,
            'google-sync': cai_dat.google_sync,
            'auto-backup': cai_dat.auto_backup,
            'show-tips': cai_dat.show_tips,
            'smart-dark': cai_dat.smart_dark
        };
        
        Object.keys(checkbox_mappings).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = checkbox_mappings[id];
            }
        });
        
        } catch (error) {
        console.error('❌ Lỗi cập nhật UI:', error);
    }
}

/**
 * Lưu tất cả cài đặt
 */
async function luu_cai_dat() {
    try {
        // Lấy tất cả cài đặt từ form
        const cai_dat_moi = {
            theme: document.querySelector('input[name="theme"]:checked')?.value,
            primary_color: document.querySelector('input[name="primary-color"]:checked')?.value,
            font_size: document.getElementById('font-size')?.value,
            currency: document.getElementById('currency')?.value,
            currency_format: document.getElementById('currency-format')?.value,
            timezone: document.getElementById('timezone')?.value,
            date_format: document.getElementById('date-format')?.value,
            notifications: document.getElementById('notifications')?.checked,
            auto_save: document.getElementById('auto-save')?.checked,
            google_sync: document.getElementById('google-sync')?.checked,
            auto_backup: document.getElementById('auto-backup')?.checked,
            show_tips: document.getElementById('show-tips')?.checked,
            smart_dark: document.getElementById('smart-dark')?.checked
        };
        
        // Lưu qua hệ thống global
        const thanh_cong = window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
        
        if (thanh_cong) {
            // Thử lưu lên server
            try {
                const response = await fetch('/api/cai-dat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cai_dat_moi)
                });
                
                if (response.ok) {
                    hien_thi_thong_bao('Đã lưu tất cả cài đặt thành công!', 'success');
                } else {
                    hien_thi_thong_bao('Đã lưu cài đặt cục bộ (không thể đồng bộ server)', 'warning');
                }
            } catch (error) {
                hien_thi_thong_bao('Đã lưu cài đặt cục bộ (không có kết nối server)', 'warning');
            }
        } else {
            hien_thi_thong_bao('Lỗi khi lưu cài đặt!', 'error');
        }
        
    } catch (error) {
        console.error('Lỗi lưu cài đặt:', error);
        hien_thi_thong_bao('Lỗi khi lưu cài đặt!', 'error');
    }
}

/**
 * Khôi phục cài đặt mặc định
 */
function tai_lai_cai_dat() {
    if (confirm('Bạn có chắc muốn khôi phục tất cả cài đặt về mặc định?')) {
        // Reset về cài đặt mặc định qua hệ thống global
        const cai_dat_mac_dinh = { ...window.CaiDatToanCuc.mac_dinh };
        window.CaiDatToanCuc.luu_cai_dat(cai_dat_mac_dinh);
        
        // Cập nhật UI
        cap_nhat_ui_tu_cai_dat(cai_dat_mac_dinh);
        
        hien_thi_thong_bao('Đã khôi phục cài đặt mặc định', 'info');
    }
}

/**
 * Tải danh mục thu chi
 */
function tai_danh_muc_thu_chi() {
    const cai_dat = window.CaiDatToanCuc.hien_tai;
    
    // Danh mục mặc định
    const danh_muc_mac_dinh = {
        expense: ['Ăn uống', 'Di chuyển', 'Giải trí', 'Mua sắm', 'Hóa đơn', 'Y tế', 'Khác'],
        income: ['Lương', 'Freelance', 'Đầu tư', 'Quà tặng', 'Khác']
    };
    
    const danh_muc_chi = cai_dat.expense_categories || danh_muc_mac_dinh.expense;
    const danh_muc_thu = cai_dat.income_categories || danh_muc_mac_dinh.income;
    
    hien_thi_danh_muc(danh_muc_chi, 'chi-tieu-categories', 'expense');
    hien_thi_danh_muc(danh_muc_thu, 'thu-nhap-categories', 'income');
}

/**
 * Hiển thị danh mục
 */
function hien_thi_danh_muc(danh_muc, container_id, loai) {
    const container = document.getElementById(container_id);
    if (!container) return;
    
    container.innerHTML = '';
    
    danh_muc.forEach((ten_danh_muc, index) => {
        const badge = document.createElement('span');
        badge.className = `badge ${loai === 'expense' ? 'bg-danger' : 'bg-success'} me-2 mb-2`;
        badge.innerHTML = `
            ${ten_danh_muc}
            <button type="button" class="btn-close btn-close-white ms-1" 
                    onclick="xoa_danh_muc('${loai}', ${index})" 
                    style="font-size: 0.7em;"></button>
        `;
        container.appendChild(badge);
    });
}

/**
 * Thêm danh mục mới
 */
function them_danh_muc(loai) {
    const input_id = loai === 'expense' ? 'new-expense-category' : 'new-income-category';
    const input = document.getElementById(input_id);
    const ten_danh_muc = input.value.trim();
    
    if (!ten_danh_muc) {
        hien_thi_thong_bao('Vui lòng nhập tên danh mục', 'warning');
        return;
    }
    
    const cai_dat = window.CaiDatToanCuc.hien_tai;
    const key = loai === 'expense' ? 'expense_categories' : 'income_categories';
    
    // Danh mục mặc định nếu chưa có
    const danh_muc_mac_dinh = {
        expense: ['Ăn uống', 'Di chuyển', 'Giải trí', 'Mua sắm', 'Hóa đơn', 'Y tế', 'Khác'],
        income: ['Lương', 'Freelance', 'Đầu tư', 'Quà tặng', 'Khác']
    };
    
    const danh_muc_hien_tai = cai_dat[key] || danh_muc_mac_dinh[loai];
    
    // Kiểm tra trùng lặp
    if (danh_muc_hien_tai.includes(ten_danh_muc)) {
        hien_thi_thong_bao('Danh mục đã tồn tại', 'warning');
        return;
    }
    
    // Thêm danh mục mới
    const danh_muc_moi = [...danh_muc_hien_tai, ten_danh_muc];
    const cai_dat_moi = { [key]: danh_muc_moi };
    
    window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
    
    // Cập nhật UI
    const container_id = loai === 'expense' ? 'chi-tieu-categories' : 'thu-nhap-categories';
    hien_thi_danh_muc(danh_muc_moi, container_id, loai);
    
    // Clear input
    input.value = '';
    
    hien_thi_thong_bao(`Đã thêm danh mục "${ten_danh_muc}"`, 'success');
}

/**
 * Xóa danh mục
 */
function xoa_danh_muc(loai, index) {
    const cai_dat = window.CaiDatToanCuc.hien_tai;
    const key = loai === 'expense' ? 'expense_categories' : 'income_categories';
    
    // Danh mục mặc định nếu chưa có
    const danh_muc_mac_dinh = {
        expense: ['Ăn uống', 'Di chuyển', 'Giải trí', 'Mua sắm', 'Hóa đơn', 'Y tế', 'Khác'],
        income: ['Lương', 'Freelance', 'Đầu tư', 'Quà tặng', 'Khác']
    };
    
    const danh_muc_hien_tai = [...(cai_dat[key] || danh_muc_mac_dinh[loai])];
    const ten_danh_muc = danh_muc_hien_tai[index];
    
    if (confirm(`Bạn có chắc muốn xóa danh mục "${ten_danh_muc}"?`)) {
        // Xóa danh mục
        danh_muc_hien_tai.splice(index, 1);
        const cai_dat_moi = { [key]: danh_muc_hien_tai };
        
        window.CaiDatToanCuc.luu_cai_dat(cai_dat_moi);
        
        // Cập nhật UI
        const container_id = loai === 'expense' ? 'chi-tieu-categories' : 'thu-nhap-categories';
        hien_thi_danh_muc(danh_muc_hien_tai, container_id, loai);
        
        hien_thi_thong_bao(`Đã xóa danh mục "${ten_danh_muc}"`, 'info');
    }
}

/**
 * Hiển thị thông báo toast
 */
function hien_thi_thong_bao(thong_bao, loai = 'success') {
    const toast_element = document.getElementById('toast-cai-dat');
    const toast_message = document.getElementById('toast-message');
    
    if (!toast_element || !toast_message) return;
    
    // Cập nhật nội dung
    toast_message.textContent = thong_bao;
    
    // Cập nhật icon theo loại
    const toast_icon = toast_element.querySelector('.toast-header i');
    if (toast_icon) {
        toast_icon.className = '';
        
        switch (loai) {
            case 'success':
                toast_icon.className = 'fas fa-check-circle text-success me-2';
                break;
            case 'error':
                toast_icon.className = 'fas fa-exclamation-circle text-danger me-2';
                break;
            case 'warning':
                toast_icon.className = 'fas fa-exclamation-triangle text-warning me-2';
                break;
            case 'info':
                toast_icon.className = 'fas fa-info-circle text-info me-2';
                break;
        }
    }
    
    // Hiển thị toast
    const toast = new bootstrap.Toast(toast_element);
    toast.show();
}

/**
 * Cập nhật dropdown định dạng tiền tệ theo loại tiền
 */
function cap_nhat_dinh_dang_tien_te(formats) {
    const select_element = document.getElementById('currency-format');
    if (!select_element) return;
    
    // Xóa các option cũ
    select_element.innerHTML = '';
    
    // Thêm các option mới
    formats.forEach(format => {
        const option = document.createElement('option');
        option.value = format.value;
        option.textContent = format.text;
        select_element.appendChild(option);
    });
    
    // Chọn option đầu tiên
    if (formats.length > 0) {
        select_element.value = formats[0].value;
    }
}

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
    const emoji_select = document.getElementById(`emoji-${loai}`);
    const ten_input = document.getElementById(`ten-danh-muc-${loai}`);
    
    if (!emoji_select || !ten_input) return;
    
    const emoji = emoji_select.value.trim();
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
    emoji_select.selectedIndex = 0; // Chọn lại emoji đầu tiên
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
