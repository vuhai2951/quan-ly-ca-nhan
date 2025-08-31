/**
 * Modal Mobile Fix JavaScript
 * Xử lý các vấn đề modal trên mobile và iOS
 */

(function() {
    'use strict';
    
    let original_body_overflow = '';
    let original_body_position = '';
    let original_body_top = '';
    let original_body_width = '';
    let scroll_y = 0;
    
    // Khoi tao khi DOM loaded
    document.addEventListener('DOMContentLoaded', function() {
        cai_dat_sua_loi_modal();
    });
    
    function cai_dat_sua_loi_modal() {
        console.log('🔧 Setting up modal fixes for mobile...');
        
        // Lắng nghe tất cả các modal
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(function(modal) {
            // When modal is about to show
            modal.addEventListener('show.bs.modal', function(e) {
                xu_ly_modal_hien_thi(e);
            });
            
            // When modal is fully shown
            modal.addEventListener('shown.bs.modal', function(e) {
                xu_ly_modal_da_hien_thi(e);
            });
            
            // When modal is about to hide
            modal.addEventListener('hide.bs.modal', function(e) {
                xu_ly_modal_an(e);
            });
            
            // When modal is fully hidden
            modal.addEventListener('hidden.bs.modal', function(e) {
                xu_ly_modal_da_an(e);
            });
        });
        
        // iOS keyboard fix
        if (kiem_tra_ios()) {
            cai_dat_sua_loi_ban_phim_ios();
        }
        
        console.log('✅ Modal fixes setup complete');
    }
    
    function xu_ly_modal_hien_thi(e) {
        console.log('📱 Modal showing:', e.target.id);
        
        if (kiem_tra_mobile()) {
            // Save current scroll position
            scroll_y = window.scrollY;
            
            // Save original body styles
            original_body_overflow = document.body.style.overflow;
            original_body_position = document.body.style.position;
            original_body_top = document.body.style.top;
            original_body_width = document.body.style.width;
            
            // Prevent body scrolling
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scroll_y}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            
            // Add modal-open class với delay nhỏ
            setTimeout(() => {
                document.body.classList.add('modal-open-fixed');
            }, 10);
        }
    }
    
    function xu_ly_modal_da_hien_thi(e) {
        console.log('📱 Modal shown:', e.target.id);
        
        if (kiem_tra_mobile()) {
            // Focus vào input đầu tiên nếu có
            const firstInput = e.target.querySelector('.form-control, .form-select');
            if (firstInput && !firstInput.readOnly && !firstInput.disabled) {
                setTimeout(() => {
                    try {
                        firstInput.focus();
                        console.log('🎯 Focused on first input');
                    } catch (err) {
                        console.log('⚠️ Could not focus on input:', err);
                    }
                }, 300);
            }
            
            // Force modal to top
            const modalElement = e.target;
            modalElement.style.zIndex = '9999';
            
            // Ensure backdrop is behind
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.style.zIndex = '9998';
            }
        }
    }
    
    function xu_ly_modal_an(e) {
        console.log('📱 Modal hiding:', e.target.id);
        // Không cần làm gì đặc biệt khi modal bắt đầu hide
    }
    
    function xu_ly_modal_da_an(e) {
        console.log('📱 Modal hidden:', e.target.id);
        
        if (kiem_tra_mobile()) {
            // Remove modal-open class
            document.body.classList.remove('modal-open-fixed');
            
            // Restore body styles
            document.body.style.position = original_body_position;
            document.body.style.top = original_body_top;
            document.body.style.width = original_body_width;
            document.body.style.overflow = original_body_overflow;
            
            // Restore scroll position
            window.scrollTo(0, scroll_y);
            
            console.log('🔄 Restored scroll position:', scroll_y);
        }
        
        // Clear form if needed
        const form = e.target.querySelector('form');
        if (form) {
            // Reset validation states
            const inputs = form.querySelectorAll('.form-control, .form-select');
            inputs.forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });
        }
    }
    
    function cai_dat_sua_loi_ban_phim_ios() {
        console.log('🍎 Setting up iOS keyboard fixes...');
        
        // Fix cho iOS keyboard
        const inputs = document.querySelectorAll('.modal .form-control, .modal .form-select');
        
        inputs.forEach(function(input) {
            // Prevent zoom on iOS
            if (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
                input.addEventListener('touchstart', function() {
                    // Add temporary style to prevent zoom
                    const meta = document.querySelector('meta[name="viewport"]');
                    if (meta) {
                        const original = meta.getAttribute('content');
                        meta.setAttribute('content', original + ', user-scalable=no');
                        
                        setTimeout(() => {
                            meta.setAttribute('content', original);
                        }, 500);
                    }
                });
            }
            
            // Fix modal position khi keyboard xuất hiện
            input.addEventListener('focus', function() {
                setTimeout(() => {
                    const modal = input.closest('.modal');
                    if (modal) {
                        modal.style.position = 'absolute';
                        modal.style.top = '0';
                        
                        // Scroll to input nếu cần
                        input.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                }, 300);
            });
            
            input.addEventListener('blur', function() {
                setTimeout(() => {
                    const modal = input.closest('.modal');
                    if (modal) {
                        modal.style.position = 'fixed';
                        modal.style.top = '0';
                    }
                }, 300);
            });
        });
    }
    
    // Utility functions
    function kiem_tra_mobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    function kiem_tra_ios() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    // Fix cho form validation
    window.hien_thi_loi_modal = function(inputId, message) {
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.add('is-invalid');
            
            // Tạo hoặc cập nhật error message
            let feedback = input.parentNode.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                input.parentNode.appendChild(feedback);
            }
            feedback.textContent = message;
            
            // Focus vào input lỗi
            setTimeout(() => {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    };
    
    // Clear validation errors
    window.xoa_loi_modal = function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('.form-control, .form-select');
            inputs.forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });
            
            const feedbacks = form.querySelectorAll('.invalid-feedback');
            feedbacks.forEach(feedback => {
                feedback.remove();
            });
        }
    };
    
    // Button loading state
    window.dat_trang_thai_nut = function(buttonElement, loading) {
        if (loading) {
            buttonElement.classList.add('loading');
            buttonElement.disabled = true;
        } else {
            buttonElement.classList.remove('loading');
            buttonElement.disabled = false;
        }
    };
    
    console.log('📱 Modal mobile fix script loaded');
})();
