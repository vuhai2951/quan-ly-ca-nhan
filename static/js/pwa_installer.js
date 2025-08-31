// PWA Install Prompt cho iOS
class CaiDatPWA {
    constructor() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isStandalone = window.navigator.standalone === true;
        this.khoi_tao();
    }

    khoi_tao() {
        // Chi hien thi prompt tren iOS Safari va chua duoc cai
        if (this.isIOS && !this.isStandalone) {
            this.hien_thi_prompt_cai_dat();
        }
    }

    hien_thi_prompt_cai_dat() {
        // Kiem tra xem da hien thi prompt chua
        const hasShownPrompt = localStorage.getItem('pwa-prompt-shown');
        if (hasShownPrompt) return;

        // Delay 3 giay sau khi load trang
        setTimeout(() => {
            this.tao_banner_cai_dat();
        }, 3000);
    }

    tao_banner_cai_dat() {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-icon">📱</div>
                <div class="pwa-install-text">
                    <h6>Cài đặt ứng dụng</h6>
                    <p>Thêm vào màn hình chính để sử dụng như app native</p>
                </div>
                <div class="pwa-install-actions">
                    <button class="btn btn-primary btn-sm" onclick="caiDatPWA.hien_thi_huong_dan()">
                        Hướng dẫn
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="caiDatPWA.dong_banner()">
                        ✕
                    </button>
                </div>
            </div>
        `;

        // Thêm CSS
        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: linear-gradient(135deg, #0d6efd, #0056b3);
                color: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(13, 110, 253, 0.3);
                z-index: 1000;
                animation: slideUp 0.3s ease-out;
            }
            
            .pwa-install-content {
                display: flex;
                align-items: center;
                padding: 15px;
                gap: 15px;
            }
            
            .pwa-install-icon {
                font-size: 2rem;
                min-width: 40px;
            }
            
            .pwa-install-text h6 {
                margin: 0 0 5px 0;
                font-weight: 600;
            }
            
            .pwa-install-text p {
                margin: 0;
                font-size: 0.85rem;
                opacity: 0.9;
            }
            
            .pwa-install-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 80px;
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 576px) {
                .pwa-install-actions {
                    flex-direction: row;
                }
                .pwa-install-content {
                    padding: 12px;
                    gap: 10px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Auto dismiss sau 10 giay
        setTimeout(() => {
            this.dong_banner();
        }, 10000);
    }

    hien_thi_huong_dan() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal fade" id="pwa-instructions-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                📱 Cài đặt ứng dụng trên iPhone
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <img src="/static/images/icon-192x192.png" alt="App Icon" style="width: 80px; height: 80px; border-radius: 16px;">
                            </div>
                            <ol class="list-group list-group-numbered">
                                <li class="list-group-item">
                                    <strong>Tap nút Share</strong> <span class="badge bg-primary">⬆️</span> ở bottom bar Safari
                                </li>
                                <li class="list-group-item">
                                    <strong>Scroll xuống</strong> và tìm <strong>"Add to Home Screen"</strong>
                                </li>
                                <li class="list-group-item">
                                    <strong>Tap "Add to Home Screen"</strong> và sau đó <strong>"Add"</strong>
                                </li>
                                <li class="list-group-item">
                                    <strong>Mở app từ Home Screen</strong> - không có thanh địa chỉ!
                                </li>
                            </ol>
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Lưu ý:</strong> Chỉ hoạt động trên Safari, không dùng Chrome hoặc Firefox.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đã hiểu</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(document.getElementById('pwa-instructions-modal'));
        bootstrapModal.show();

        // Clean up modal sau khi đóng
        document.getElementById('pwa-instructions-modal').addEventListener('hidden.bs.modal', function () {
            modal.remove();
        });

        this.dong_banner();
    }

    dong_banner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => {
                banner.remove();
            }, 300);
        }

        // Danh dau da hien thi prompt
        localStorage.setItem('pwa-prompt-shown', 'true');
    }
}

// Khoi tao PWA installer
let caiDatPWA;
document.addEventListener('DOMContentLoaded', function() {
    caiDatPWA = new CaiDatPWA();
});

// CSS cho animation slideDown
const slideDownStyle = document.createElement('style');
slideDownStyle.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(slideDownStyle);
