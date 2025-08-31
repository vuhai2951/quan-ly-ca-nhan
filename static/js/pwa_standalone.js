// PWA Standalone Mode Enforcer
(function() {
    'use strict';
    
    // Kiểm tra nếu đang chạy trên iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Kiểm tra nếu đang ở standalone mode
    const isStandalone = window.navigator.standalone === true || 
                        window.matchMedia('(display-mode: standalone)').matches ||
                        window.matchMedia('(display-mode: fullscreen)').matches;
    
    // Kiểm tra nếu có PWA parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isPWALaunch = urlParams.has('pwa');
    
    console.log('🔍 PWA Debug:', {
        isIOS: isIOS,
        isStandalone: isStandalone,
        isPWALaunch: isPWALaunch,
        userAgent: navigator.userAgent
    });
    
    // Neu tren iOS va khong phai standalone mode va khong phai tu PWA launch
    if (isIOS && !isStandalone && !isPWALaunch) {
        console.log('⚠️ App mo trong Safari, khong phai standalone mode');
        
        // Them thong bao khuyen khich cai dat PWA
        setTimeout(() => {
            hien_thi_prompt_standalone();
        }, 2000);
    } else if (isStandalone || isPWALaunch) {
        console.log('✅ App đang chạy ở standalone mode');
        
        // Remove PWA parameter từ URL nếu có
        if (isPWALaunch && window.history && window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.delete('pwa');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }
        
        // Thêm class cho styling standalone
        document.documentElement.classList.add('pwa-standalone');
    }
    
    function hien_thi_prompt_standalone() {
        // Kiem tra neu da hien thi prompt gan day
        const lastShown = localStorage.getItem('pwa-standalone-prompt');
        const now = Date.now();
        
        // Chi hien thi neu chua hien thi trong 24h qua
        if (lastShown && (now - parseInt(lastShown)) < 24 * 60 * 60 * 1000) {
            return;
        }
        
        const banner = document.createElement('div');
        banner.id = 'standalone-prompt';
        banner.innerHTML = `
            <div class="standalone-prompt-content">
                <div class="standalone-prompt-icon">⚡</div>
                <div class="standalone-prompt-text">
                    <h6>Mở từ Home Screen</h6>
                    <p>Để có trải nghiệm app đầy đủ, hãy mở từ icon trên Home Screen thay vì Safari</p>
                </div>
                <button class="btn btn-outline-light btn-sm" onclick="dong_prompt_standalone()">
                    ✕
                </button>
            </div>
        `;
        
        // CSS cho prompt
        const style = document.createElement('style');
        style.textContent = `
            #standalone-prompt {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                z-index: 9999;
                animation: slideDown 0.3s ease-out;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .standalone-prompt-content {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 12px;
                max-width: 100%;
            }
            
            .standalone-prompt-icon {
                font-size: 1.5rem;
                min-width: 30px;
            }
            
            .standalone-prompt-text {
                flex: 1;
            }
            
            .standalone-prompt-text h6 {
                margin: 0 0 2px 0;
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .standalone-prompt-text p {
                margin: 0;
                font-size: 0.8rem;
                opacity: 0.9;
                line-height: 1.3;
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                }
                to {
                    transform: translateY(0);
                }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(-100%);
                }
            }
            
            /* Đảm bảo content không bị che bởi prompt */
            body.has-standalone-prompt {
                padding-top: 80px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(banner);
        document.body.classList.add('has-standalone-prompt');
        
        // Lưu thời gian hiển thị
        localStorage.setItem('pwa-standalone-prompt', now.toString());
        
        // Auto dismiss sau 8 giay
        setTimeout(() => {
            dong_prompt_standalone();
        }, 8000);
    }
    
    // Global function de dismiss prompt
    window.dong_prompt_standalone = function() {
        const prompt = document.getElementById('standalone-prompt');
        if (prompt) {
            prompt.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                prompt.remove();
                document.body.classList.remove('has-standalone-prompt');
            }, 300);
        }
    };
    
    // CSS cho standalone mode
    const standaloneCSS = document.createElement('style');
    standaloneCSS.textContent = `
        /* Styling đặc biệt cho standalone mode */
        .pwa-standalone {
            /* Có thể thêm các style đặc biệt cho standalone */
        }
        
        /* Hide address bar hint cho standalone */
        .pwa-standalone .address-bar-hint {
            display: none !important;
        }
        
        /* Tối ưu navigation cho standalone */
        .pwa-standalone .top-nav {
            position: sticky;
            top: 0;
            z-index: 1000;
        }
    `;
    document.head.appendChild(standaloneCSS);
    
})();
