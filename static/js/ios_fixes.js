/**
 * iOS Specific Fixes and Enhancements
 * File: static/js/ios_fixes.js
 */

(function() {
    'use strict';
    
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Detect Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // iOS specific initializations
    if (isIOS) {
        document.body.classList.add('ios-device');
        console.log('🍎 iOS device detected, applying iOS-specific fixes');
        
        // Apply iOS fixes when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', khoi_tao_sua_loi_ios);
        } else {
            khoi_tao_sua_loi_ios();
        }
    }
    
    /**
     * Khoi tao iOS specific fixes
     */
    function khoi_tao_sua_loi_ios() {
        // Fix viewport height issues
        sua_chieu_cao_viewport();
        
        // Fix button touch behavior
        sua_hanh_vi_cham_nut();
        
        // Fix bottom navigation
        sua_thanh_dieu_huong_duoi();
        
        // Fix form input focus issues
        sua_input_form();
        
        // Fix scroll issues
        sua_van_de_cuon();
        
        // Handle orientation changes
        xu_ly_thay_doi_huong();
        
        console.log('✅ iOS fixes applied successfully');
    }
    
    /**
     * Sua chieu cao viewport tren iOS Safari
     */
    function sua_chieu_cao_viewport() {
        // Set CSS custom property for actual viewport height
        function setVH() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', function() {
            setTimeout(setVH, 100); // Delay to ensure viewport has changed
        });
    }
    
    /**
     * Sua hanh vi cham nut tren iOS
     */
    function sua_hanh_vi_cham_nut() {
        // Add proper touch feedback for all buttons
        const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"]');
        
        buttons.forEach(button => {
            // Ensure button is properly styled for iOS
            button.style.webkitAppearance = 'none';
            button.style.appearance = 'none';
            button.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
            button.style.touchAction = 'manipulation';
            
            // Add active state handling
            button.addEventListener('touchstart', function() {
                this.classList.add('ios-active');
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('ios-active');
                }, 150);
            }, { passive: true });
            
            button.addEventListener('touchcancel', function() {
                this.classList.remove('ios-active');
            }, { passive: true });
        });
        
        // Add CSS for active state
        if (!document.getElementById('ios-button-styles')) {
            const style = document.createElement('style');
            style.id = 'ios-button-styles';
            style.textContent = `
                .ios-device .ios-active {
                    opacity: 0.7 !important;
                    transform: scale(0.95) !important;
                    transition: all 0.1s ease !important;
                }
                
                .ios-device button,
                .ios-device .btn {
                    -webkit-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Sua thanh dieu huong duoi cho iOS
     */
    function sua_thanh_dieu_huong_duoi() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (!bottomNav) return;
        
        // Ensure bottom nav items are properly touchable
        const navItems = bottomNav.querySelectorAll('.nav-item, .nav-link');
        navItems.forEach(item => {
            item.style.touchAction = 'manipulation';
            item.style.webkitTapHighlightColor = 'rgba(0, 123, 255, 0.2)';
            
            // Add touch feedback
            item.addEventListener('touchstart', function() {
                this.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
            }, { passive: true });
            
            item.addEventListener('touchend', function() {
                setTimeout(() => {
                    if (!this.classList.contains('active')) {
                        this.style.backgroundColor = '';
                    }
                }, 150);
            }, { passive: true });
        });
    }
    
    /**
     * Sua input form tren iOS
     */
    function sua_input_form() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Prevent zoom on focus for inputs with font-size < 16px
            if (input.type !== 'range' && input.type !== 'checkbox' && input.type !== 'radio') {
                const computedStyle = window.getComputedStyle(input);
                const fontSize = parseFloat(computedStyle.fontSize);
                
                if (fontSize < 16) {
                    input.style.fontSize = '16px';
                }
            }
            
            // Fix input focus behavior
            input.addEventListener('focus', function() {
                // Scroll input into view on iOS
                setTimeout(() => {
                    this.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            });
        });
    }
    
    /**
     * Sua van de cuon tren iOS
     */
    function sua_van_de_cuon() {
        // Fix momentum scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
        document.documentElement.style.webkitOverflowScrolling = 'touch';
        
        // Ensure body can scroll properly
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.overflowX = 'hidden';
        
        // Fix dashboard container scrolling
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.webkitOverflowScrolling = 'touch';
            dashboardContainer.style.touchAction = 'pan-y';
        }
        
        // Allow scroll only at page level, prevent unwanted scroll blocks
        let lastY = 0;
        let isScrolling = false;
        
        document.addEventListener('touchstart', function(e) {
            lastY = e.touches[0].clientY;
            isScrolling = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (isScrolling) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - lastY;
            
            // Check if we're scrolling within a scrollable element
            let target = e.target;
            let canScroll = false;
            
            while (target && target !== document) {
                const style = window.getComputedStyle(target);
                const overflowY = style.overflowY;
                
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    const scrollTop = target.scrollTop;
                    const scrollHeight = target.scrollHeight;
                    const clientHeight = target.clientHeight;
                    
                    // If element can still scroll, allow it
                    if ((deltaY < 0 && scrollTop > 0) || 
                        (deltaY > 0 && scrollTop < scrollHeight - clientHeight)) {
                        canScroll = true;
                        break;
                    }
                }
                target = target.parentElement;
            }
            
            // For page-level scrolling
            if (!canScroll) {
                // Allow normal page scroll unless at boundaries
                const isScrollingUp = deltaY > 0;
                const isScrollingDown = deltaY < 0;
                
                // Only prevent if at absolute boundaries
                if (window.scrollY === 0 && isScrollingUp) {
                    // At top, prevent over-scroll
                    if (deltaY > 50) e.preventDefault();
                } else if (window.scrollY + window.innerHeight >= document.body.scrollHeight && isScrollingDown) {
                    // At bottom, prevent over-scroll
                    if (Math.abs(deltaY) > 50) e.preventDefault();
                }
            }
            
            lastY = currentY;
            isScrolling = true;
        }, { passive: false });
        
        document.addEventListener('touchend', function() {
            isScrolling = false;
        }, { passive: true });
    }
    
    /**
     * Xu ly thay doi huong man hinh
     */
    function xu_ly_thay_doi_huong() {
        window.addEventListener('orientationchange', function() {
            // Hide keyboard and refresh viewport after orientation change
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
            
            // Recalculate viewport after a delay
            setTimeout(() => {
                sua_chieu_cao_viewport();
                
                // Trigger resize event for charts and other components
                window.dispatchEvent(new Event('resize'));
            }, 500);
        });
    }
    
    /**
     * Ngan zoom khi cham doi
     */
    function ngan_zoom_cham_doi() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // Initialize double-tap prevention
    ngan_zoom_cham_doi();
    
    /**
     * Sua hanh vi PWA tren iOS
     */
    function sua_hanh_vi_pwa() {
        // Detect if running as PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        if (isPWA) {
            document.body.classList.add('pwa-mode');
            
            // Prevent navigation away from PWA
            window.addEventListener('beforeunload', function(e) {
                // Only prevent if it's an external link
                return null;
            });
            
            // Handle link clicks in PWA mode
            document.addEventListener('click', function(e) {
                const link = e.target.closest('a');
                if (link && link.hostname !== window.location.hostname) {
                    e.preventDefault();
                    // Open external links in new tab
                    window.open(link.href, '_blank');
                }
            });
        }
    }
    
    // Initialize PWA fixes
    sua_hanh_vi_pwa();
    
    // Expose utilities globally
    window.iOSFixes = {
        isIOS: isIOS,
        isSafari: isSafari,
        sua_chieu_cao_viewport: sua_chieu_cao_viewport,
        lam_moi_sua_loi: khoi_tao_sua_loi_ios
    };
    
})();
