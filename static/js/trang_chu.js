// JavaScript cho trang chủ - Dashboard
// File: static/js/trang_chu.js

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các chức năng
    khoi_tao_dashboard();
    cap_nhat_thoi_gian_thuc();
    kiem_tra_nhac_nho();
    
    // Lắng nghe thay đổi cài đặt toàn cục
    window.addEventListener('caiDatThayDoi', function(event) {
        // Cập nhật lại các hiển thị tiền tệ, ngày tháng nếu có
        cap_nhat_hien_thi_theo_cai_dat();
    });
    
    // Lắng nghe storage events (khi cài đặt thay đổi từ tab khác)
    window.addEventListener('storage', function(event) {
        if (event.key === 'cai_dat_qlcn') {
            // Reload lại global settings
            if (window.CaiDatToanCuc) {
                window.CaiDatToanCuc.khoi_tao();
            }
            cap_nhat_hien_thi_theo_cai_dat();
        }
    });
});

/**
 * Khởi tạo dashboard
 */
function khoi_tao_dashboard() {
    // Tải thống kê thu chi
    tai_thong_ke_thu_chi();
    
    // Tải lịch hôm nay
    tai_lich_hom_nay();
    
    // Tải công việc sắp tới
    tai_cong_viec_sap_toi();
    
    // Tải ghi chú quan trọng
    tai_ghi_chu_quan_trong();
}

/**
 * Tải thống kê thu chi
 */
async function tai_thong_ke_thu_chi() {
    try {
        const response = await fetch('/api/thu-chi/thong-ke');
        const result = await response.json();
        
        if (result.thanh_cong) {
            hien_thi_thong_ke_thu_chi(result.du_lieu);
        } else {
            console.error('❌ Lỗi tải thống kê thu chi:', result.loi);
        }
    } catch (error) {
        console.error('❌ Lỗi kết nối API thống kê thu chi:', error);
    }
}

/**
 * Hiển thị thống kê thu chi
 */
function hien_thi_thong_ke_thu_chi(thong_ke) {
    // Cập nhật các element với data attributes để có thể đồng bộ
    const elements = {
        'tong-thu': thong_ke.tong_thu_thang,
        'tong-chi': thong_ke.tong_chi_thang,
        'so-du': thong_ke.so_du,
        'thu-hom-nay': thong_ke.thu_hom_nay,
        'chi-hom-nay': thong_ke.chi_hom_nay
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const so_tien = elements[id];
            element.textContent = dinh_dang_tien(so_tien);
            element.setAttribute('data-currency', so_tien);
        }
    });
}

/**
 * Cập nhật hiển thị theo cài đặt mới
 */
function cap_nhat_hien_thi_theo_cai_dat() {
    // Cập nhật tất cả element có attribute data-currency
    const currency_elements = document.querySelectorAll('[data-currency]');
    currency_elements.forEach(element => {
        const so_tien = parseFloat(element.dataset.currency);
        if (!isNaN(so_tien)) {
            element.textContent = dinh_dang_tien(so_tien);
        }
    });
    
    // Cập nhật tất cả element có attribute data-date
    const date_elements = document.querySelectorAll('[data-date]');
    date_elements.forEach(element => {
        const ngay = element.dataset.date;
        if (ngay) {
            element.textContent = dinh_dang_ngay(ngay);
        }
    });
    
    // Cập nhật thời gian realtime
    cap_nhat_thoi_gian_thuc();
}

/**
 * Định dạng tiền tệ theo cài đặt
 */
function dinh_dang_tien(so_tien) {
    // Sử dụng hệ thống cài đặt toàn cục
    if (window.CaiDatToanCuc && window.CaiDatToanCuc.dinh_dang_tien) {
        return window.CaiDatToanCuc.dinh_dang_tien(so_tien);
    }
    
    // Fallback
    const don_vi = localStorage.getItem('currency_setting') || 'VND';
    const formatters = {
        'VND': new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
        'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
        'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
        'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
        'CNY': new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' })
    };
    
    const formatter = formatters[don_vi] || formatters['VND'];
    return formatter.format(so_tien);
}

/**
 * Định dạng ngày theo cài đặt
 */
function dinh_dang_ngay(ngay) {
    // Sử dụng hệ thống cài đặt toàn cục
    if (window.CaiDatToanCuc && window.CaiDatToanCuc.dinh_dang_ngay) {
        return window.CaiDatToanCuc.dinh_dang_ngay(ngay);
    }
    
    // Fallback
    const date = new Date(ngay);
    return date.toLocaleDateString('vi-VN');
}

/**
 * Khởi tạo dashboard
 */
function khoi_tao_dashboard() {
    // Hiển thị thông báo chào mừng
    const gio_hien_tai = new Date().getHours();
    let loi_chao = '';
    
    if (gio_hien_tai < 12) {
        loi_chao = 'Chào buổi sáng! ☀️';
    } else if (gio_hien_tai < 18) {
        loi_chao = 'Chào buổi chiều! 🌤️';
    } else {
        loi_chao = 'Chào buổi tối! 🌙';
    }
    
    // Có thể hiển thị lời chào trong UI
    }

/**
 * Cập nhật thời gian thực
 */
function cap_nhat_thoi_gian_thuc() {
    // Cập nhật ngay lập tức
    cap_nhat_thoi_gian();
    
    // Cập nhật mỗi giây
    setInterval(cap_nhat_thoi_gian, 1000);
}

/**
 * Cập nhật thời gian hiển thị
 */
function cap_nhat_thoi_gian() {
    const bay_gio = new Date();
    const thoi_gian_string = bay_gio.toLocaleString('vi-VN');
    const ngay_string = bay_gio.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Cập nhật thời gian nếu có element hiển thị
    const element_thoi_gian = document.getElementById('thoi-gian-hien-tai');
    if (element_thoi_gian) {
        element_thoi_gian.textContent = thoi_gian_string;
        element_thoi_gian.setAttribute('data-date', ngay_string);
    }
}

/**
 * Kiểm tra nhắc nhở sắp tới
 */
function kiem_tra_nhac_nho() {
    // Placeholder - sẽ kiểm tra nhắc nhở từ database
    }

/**
 * Tải dữ liệu thống kê dashboard
 */
async function tai_du_lieu_thong_ke() {
    try {
        // Gọi API để lấy thống kê tổng quan
        const [chi_tieu_res, hoc_tap_res, cong_viec_res, ghi_chu_res] = await Promise.all([
            fetch('/api/chi-tieu/thong-ke'),
            fetch('/api/hoc-tap/thong-ke'), 
            fetch('/api/cong-viec/thong-ke'),
            fetch('/api/ghi-chu/thong-ke')
        ]);

        // Xử lý dữ liệu và cập nhật UI
        } catch (error) {
        console.error('Lỗi tải thống kê:', error);
        hien_thi_thong_bao('Không thể tải dữ liệu thống kê', 'error');
    }
}

/**
 * Tạo biểu đồ chi tiêu
 */
function tao_bieu_do_chi_tieu() {
    const canvas = document.getElementById('bieu-do-chi-tieu');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Dữ liệu mẫu - sẽ thay thế bằng dữ liệu thực
    const du_lieu_chi_tieu = {
        labels: ['Ăn uống', 'Di chuyển', 'Giải trí', 'Học tập', 'Mua sắm', 'Khác'],
        datasets: [{
            label: 'Chi tiêu (VNĐ)',
            data: [800000, 300000, 200000, 150000, 400000, 100000],
            backgroundColor: [
                '#FF6384',
                '#36A2EB', 
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    // Kiểm tra nếu Chart.js đã load
    if (typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'doughnut',
            data: du_lieu_chi_tieu,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = dinh_dang_tien(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

/**
 * Cập nhật widget thời tiết
 */
async function cap_nhat_thoi_tiet() {
    try {
        // Có thể tích hợp API thời tiết miễn phí
        const thoi_tiet_element = document.getElementById('thoi-tiet');
        if (thoi_tiet_element) {
            thoi_tiet_element.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-sun text-warning me-2"></i>
                    <div>
                        <div class="fw-bold">28°C</div>
                        <small class="text-muted">Hà Nội</small>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi cập nhật thời tiết:', error);
    }
}

/**
 * Tạo widget công việc hôm nay
 */
function tao_widget_cong_viec_hom_nay() {
    const container = document.getElementById('cong-viec-hom-nay');
    if (!container) return;

    // Dữ liệu mẫu
    const cong_viec_hom_nay = [
        { ten: 'Họp team', gio: '09:00', trang_thai: 'sap-toi' },
        { ten: 'Làm bài tập', gio: '14:00', trang_thai: 'hoan-thanh' },
        { ten: 'Part-time', gio: '18:00', trang_thai: 'sap-toi' }
    ];

    if (cong_viec_hom_nay.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-calendar-check fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-0">Không có công việc hôm nay</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cong_viec_hom_nay.map(cv => `
        <div class="d-flex align-items-center mb-2 p-2 rounded ${cv.trang_thai === 'hoan-thanh' ? 'bg-light text-muted' : 'bg-warning bg-opacity-10'}">
            <div class="flex-shrink-0">
                <i class="fas fa-${cv.trang_thai === 'hoan-thanh' ? 'check-circle text-success' : 'clock text-warning'}"></i>
            </div>
            <div class="flex-grow-1 ms-2">
                <div class="fw-semibold ${cv.trang_thai === 'hoan-thanh' ? 'text-decoration-line-through' : ''}">${cv.ten}</div>
                <small class="text-muted">${cv.gio}</small>
            </div>
        </div>
    `).join('');
}

/**
 * Tạo widget bài tập sắp hết hạn
 */
function tao_widget_bai_tap_sap_het_han() {
    const container = document.getElementById('bai-tap-sap-het-han');
    if (!container) return;

    // Dữ liệu mẫu
    const bai_tap_sap_het_han = [
        { ten: 'Bài tập Toán', mon: 'Toán học', han_nop: '2024-01-15', muc_do: 'cao' },
        { ten: 'Thuyết trình', mon: 'Tiếng Anh', han_nop: '2024-01-16', muc_do: 'trung-binh' }
    ];

    if (bai_tap_sap_het_han.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-clipboard-check fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-0">Không có bài tập sắp hết hạn</p>
            </div>
        `;
        return;
    }

    container.innerHTML = bai_tap_sap_het_han.map(bt => {
        const mau_muc_do = bt.muc_do === 'cao' ? 'danger' : bt.muc_do === 'trung-binh' ? 'warning' : 'success';
        const ngay_con_lai = tinh_ngay_con_lai(bt.han_nop);
        
        return `
            <div class="d-flex align-items-center mb-2 p-2 border-start border-3 border-${mau_muc_do} bg-light">
                <div class="flex-grow-1">
                    <div class="fw-semibold">${bt.ten}</div>
                    <small class="text-muted">${bt.mon} • ${ngay_con_lai}</small>
                </div>
                <span class="badge bg-${mau_muc_do}">${bt.muc_do}</span>
            </div>
        `;
    }).join('');
}

/**
 * Utilities Functions
 */

function dinh_dang_tien(so_tien) {
    // Sử dụng global settings nếu có
    if (window.CaiDatToanCuc && window.CaiDatToanCuc.dinh_dang_tien) {
        return window.CaiDatToanCuc.dinh_dang_tien(so_tien);
    }
    
    // Fallback
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(so_tien);
}

function dinh_dang_ngay(ngay) {
    // Sử dụng global settings nếu có
    if (window.CaiDatToanCuc && window.CaiDatToanCuc.dinh_dang_ngay) {
        return window.CaiDatToanCuc.dinh_dang_ngay(ngay);
    }
    
    // Fallback
    const date_obj = new Date(ngay);
    const ngay_num = date_obj.getDate().toString().padStart(2, '0');
    const thang_num = (date_obj.getMonth() + 1).toString().padStart(2, '0');
    const nam_num = date_obj.getFullYear();
    return `${ngay_num}/${thang_num}/${nam_num}`;
}

function tinh_ngay_con_lai(ngay_target) {
    const hom_nay = new Date();
    const ngay_het_han = new Date(ngay_target);
    const chenh_lech = Math.ceil((ngay_het_han - hom_nay) / (1000 * 60 * 60 * 24));
    
    if (chenh_lech < 0) {
        return 'Đã quá hạn';
    } else if (chenh_lech === 0) {
        return 'Hôm nay';
    } else if (chenh_lech === 1) {
        return 'Ngày mai';
    } else {
        return `Còn ${chenh_lech} ngày`;
    }
}

function hien_thi_thong_bao(thong_bao, loai = 'info') {
    // Function được định nghĩa trong base.html
    if (typeof window.hien_thi_thong_bao === 'function') {
        window.hien_thi_thong_bao(thong_bao, loai);
    } else {
        console.log(`${loai.toUpperCase()}: ${thong_bao}`);
    }
}

/**
 * Xử lý sự kiện click trên các quick actions
 */
document.addEventListener('click', function(e) {
    if (e.target.closest('[data-action="refresh-stats"]')) {
        e.preventDefault();
        tai_du_lieu_thong_ke();
        hien_thi_thong_bao('Đang cập nhật dữ liệu...', 'info');
    }
    
    if (e.target.closest('[data-action="export-data"]')) {
        e.preventDefault();
        xuat_du_lieu_dashboard();
    }
});

/**
 * Xuất dữ liệu dashboard
 */
function xuat_du_lieu_dashboard() {
    // Placeholder cho chức năng xuất dữ liệu
    hien_thi_thong_bao('Chức năng xuất dữ liệu đang phát triển', 'info');
}

/**
 * Làm mới toàn bộ dashboard
 */
function lam_moi_dashboard() {
    // Hiển thị loading
    const loading_elements = document.querySelectorAll('.dashboard-loading');
    loading_elements.forEach(el => el.classList.remove('d-none'));
    
    // Tải lại dữ liệu
    Promise.all([
        tai_du_lieu_thong_ke(),
        cap_nhat_thoi_tiet()
    ]).then(() => {
        // Ẩn loading
        loading_elements.forEach(el => el.classList.add('d-none'));
        hien_thi_thong_bao('Dashboard đã được cập nhật!', 'success');
    }).catch(error => {
        console.error('Lỗi làm mới dashboard:', error);
        hien_thi_thong_bao('Có lỗi xảy ra khi cập nhật', 'error');
        // Ẩn loading
        loading_elements.forEach(el => el.classList.add('d-none'));
    });
}

/**
 * Tải lịch hôm nay
 */
async function tai_lich_hom_nay() {
    // Placeholder - sẽ implement sau
    }

/**
 * Tải công việc sắp tới
 */
async function tai_cong_viec_sap_toi() {
    // Placeholder - sẽ implement sau
    }

/**
 * Tải ghi chú quan trọng
 */
async function tai_ghi_chu_quan_trong() {
    // Placeholder - sẽ implement sau
    }

/**
 * Cập nhật thời tiết (placeholder)
 */
async function cap_nhat_thoi_tiet() {
    // Placeholder - sẽ implement sau
    }

/**
 * Hiển thị thông báo
 */
function hien_thi_thong_bao(thong_bao, loai = 'info') {
    // Tạo toast element nếu chưa có
    let toast_container = document.getElementById('toast-container');
    if (!toast_container) {
        toast_container = document.createElement('div');
        toast_container.id = 'toast-container';
        toast_container.className = 'position-fixed bottom-0 end-0 p-3';
        toast_container.style.zIndex = '11';
        document.body.appendChild(toast_container);
    }
    
    // Tạo toast
    const toast_id = 'toast-' + Date.now();
    const toast_html = `
        <div id="${toast_id}" class="toast" role="alert">
            <div class="toast-header">
                <i class="fas fa-info-circle text-${loai} me-2"></i>
                <strong class="me-auto">Thông báo</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${thong_bao}
            </div>
        </div>
    `;
    
    toast_container.insertAdjacentHTML('beforeend', toast_html);
    
    // Hiển thị toast
    const toast_element = document.getElementById(toast_id);
    const toast = new bootstrap.Toast(toast_element);
    toast.show();
    
    // Tự động xóa sau khi ẩn
    toast_element.addEventListener('hidden.bs.toast', function() {
        toast_element.remove();
    });
}

// Export functions để có thể sử dụng từ HTML
window.trang_chu = {
    tai_du_lieu_thong_ke,
    tao_bieu_do_chi_tieu,
    lam_moi_dashboard,
    cap_nhat_thoi_tiet
};

