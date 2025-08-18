/**
 * Cài đặt toàn cục cho ứng dụng quản lý cá nhân
 * File này chứa các hằng số và cấu hình dùng chung
 */

// Cấu hình API endpoints
const API_BASE_URL = '';

// Cấu hình thông báo
const NOTIFICATION_TIMEOUT = 5000; // 5 giây

// Cấu hình định dạng ngày tháng
const DATE_FORMAT = 'vi-VN';

let DEBUG_MODE = true;

/**
 * Mở modal đổi mật khẩu
 */
function moModalDoiMatKhau() {
    hien_thi_thong_bao('Chức năng đổi mật khẩu đang được phát triển', 'info');
}

/**
 * Đăng xuất khỏi hệ thống
 */
function dangXuat() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Xóa thông tin đăng nhập
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/dang-nhap';
    }
}

/**
 * Kiểm tra đăng nhập
 */
async function kiemTraDangNhap() {
    try {
        const response = await fetch('/api/kiem-tra-dang-nhap');
        const result = await response.json();
        
        return result.da_dang_nhap || false;
    } catch (error) {
        console.error('Lỗi kiểm tra đăng nhập:', error);
        return false;
    }
}

/**
 * Lấy thông tin người dùng
 */
async function layThongTinNguoiDung() {
    try {
        const da_dang_nhap = await kiemTraDangNhap();
        
        if (!da_dang_nhap) {
            // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
            if (window.location.pathname !== '/dang-nhap') {
                window.location.href = '/dang-nhap';
            }
            return null;
        }
        
        return { da_dang_nhap: true };
    } catch (error) {
        console.error('Lỗi lấy thông tin người dùng:', error);
        return null;
    }
}

/**
 * Hiển thị thông báo toast
 */
function hien_thi_thong_bao(message, type = 'info', duration = 5000) {
    // Tạo container cho toast nếu chưa có
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Tạo toast element
    const toastId = 'toast-' + Date.now();
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastElement.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${getIconForType(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    
    // Khởi tạo và hiển thị toast
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duration
    });
    
    toast.show();
    
    // Tự động xóa toast sau khi ẩn
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

/**
 * Lấy icon cho loại thông báo
 */
function getIconForType(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'primary': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Định dạng ngày tháng
 */
function dinh_dang_ngay(ngay_str, format = 'dd/MM/yyyy') {
    if (!ngay_str) return '';
    
    const ngay = new Date(ngay_str);
    if (isNaN(ngay.getTime())) return ngay_str;
    
    return ngay.toLocaleDateString(DATE_FORMAT, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Định dạng thời gian
 */
function dinh_dang_gio(gio_str) {
    if (!gio_str) return '';
    
    // Nếu đã có dạng HH:MM thì trả về luôn
    if (gio_str.match(/^\d{2}:\d{2}$/)) {
        return gio_str;
    }
    
    // Nếu là timestamp thì chuyển đổi
    const ngay = new Date(gio_str);
    if (!isNaN(ngay.getTime())) {
        return ngay.toLocaleTimeString(DATE_FORMAT, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    return gio_str;
}

/**
 * Thiết lập active nav link
 */
function cap_nhat_active_nav() {
    const currentPath = window.location.pathname;
    
    // Desktop navigation
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        }
    });
    
    // Mobile bottom navigation
    document.querySelectorAll('.bottom-nav .nav-item').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        }
    });
}

/**
 * Cập nhật thời gian hiện tại
 */
function cap_nhat_thoi_gian_hien_tai() {
    const element = document.getElementById('thoi-gian-hien-tai');
    if (element) {
        const now = new Date();
        element.textContent = now.toLocaleString(DATE_FORMAT, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    // Cập nhật active navigation
    cap_nhat_active_nav();
    
    // Cập nhật thời gian hiện tại
    cap_nhat_thoi_gian_hien_tai();
    
    // Cập nhật thời gian mỗi phút
    setInterval(cap_nhat_thoi_gian_hien_tai, 60000);
    
    console.log('✅ Global settings loaded');
});


