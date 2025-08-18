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
            document.addEventListener('DOMContentLoaded', initIOSFixes);
        } else {
            initIOSFixes();
        }
    }
    
    /**
     * Initialize iOS specific fixes
     */
    function initIOSFixes() {
        // Fix viewport height issues
        fixViewportHeight();
        
        // Fix button touch behavior
        fixButtonTouchBehavior();
        
        // Fix bottom navigation
        fixBottomNavigation();
        
        // Fix form input focus issues
        fixFormInputs();
        
        // Fix scroll issues
        fixScrollIssues();
        
        // Handle orientation changes
        handleOrientationChange();
        
        console.log('✅ iOS fixes applied successfully');
    }
    
    /**
     * Fix viewport height issues on iOS Safari
     */
    function fixViewportHeight() {
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
     * Fix button touch behavior on iOS
     */
    function fixButtonTouchBehavior() {
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
     * Fix bottom navigation for iOS
     */
    function fixBottomNavigation() {
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
     * Fix form input issues on iOS
     */
    function fixFormInputs() {
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
     * Fix scroll issues on iOS
     */
    function fixScrollIssues() {
        // Fix momentum scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Prevent bounce scroll at the top and bottom
        let lastY = 0;
        
        document.addEventListener('touchstart', function(e) {
            lastY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            const currentY = e.touches[0].clientY;
            const isScrollingUp = currentY > lastY;
            const isScrollingDown = currentY < lastY;
            
            // Prevent bounce at top
            if (window.scrollY === 0 && isScrollingUp) {
                e.preventDefault();
            }
            
            // Prevent bounce at bottom
            const isAtBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight;
            if (isAtBottom && isScrollingDown) {
                e.preventDefault();
            }
            
            lastY = currentY;
        }, { passive: false });
    }
    
    /**
     * Handle orientation changes
     */
    function handleOrientationChange() {
        window.addEventListener('orientationchange', function() {
            // Hide keyboard and refresh viewport after orientation change
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
            
            // Recalculate viewport after a delay
            setTimeout(() => {
                fixViewportHeight();
                
                // Trigger resize event for charts and other components
                window.dispatchEvent(new Event('resize'));
            }, 500);
        });
    }
    
    /**
     * Prevent double-tap zoom
     */
    function preventDoubleTabZoom() {
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
    preventDoubleTabZoom();
    
    /**
     * Fix PWA behavior on iOS
     */
    function fixPWABehavior() {
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
    fixPWABehavior();
    
    // Expose utilities globally
    window.iOSFixes = {
        isIOS: isIOS,
        isSafari: isSafari,
        fixViewportHeight: fixViewportHeight,
        refreshFixes: initIOSFixes
    };
    
})();
