/**
 * Emoji Picker cho danh muc chi tieu
 */

// Danh sach emoji theo danh muc
const DANH_MUC_EMOJI = {
    'an-uong': {
        title: '🍽️ Ăn uống',
        emojis: ['🍽️', '🍕', '🍔', '🍜', '🍱', '🍙', '🍰', '☕', '🥤', '🍻', '🥘', '🍳', '🥗', '🍎', '🥖']
    },
    'di-chuyen': {
        title: '🚗 Di chuyển',
        emojis: ['🚗', '🏍️', '🚌', '🚇', '✈️', '🚢', '🚁', '⛽', '🅿️', '🛣️', '🚕', '🚙', '🚐', '🛺', '🚲']
    },
    'giai-tri': {
        title: '🎮 Giải trí',
        emojis: ['🎮', '🎬', '🎵', '🎪', '🎨', '🎯', '🎲', '🃏', '🎧', '📺', '🎤', '🎸', '🎹', '🎻', '🎭']
    },
    'hoc-tap': {
        title: '📚 Học tập & Làm việc',
        emojis: ['📚', '📖', '✏️', '📝', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📊', '📋', '📌', '📎', '🗂️', '📁']
    },
    'suc-khoe': {
        title: '💊 Sức khỏe & Làm đẹp',
        emojis: ['💊', '🏥', '⚕️', '🩺', '💄', '💅', '🧴', '🧼', '🪒', '💇', '🦷', '👁️', '💉', '🩹', '🧘']
    },
    'mua-sam': {
        title: '🛒 Mua sắm & Quần áo',
        emojis: ['🛒', '🛍️', '👕', '👔', '👗', '👠', '👟', '👜', '🎒', '👓', '⌚', '💍', '👑', '🧥', '🧦']
    },
    'nha-o': {
        title: '🏠 Nhà ở & Tiện ích',
        emojis: ['🏠', '🏢', '🏨', '⚡', '💧', '🔥', '🛏️', '🛋️', '🚿', '🧹', '🔧', '🔨', '🪚', '🔩', '🚰']
    },
    'cong-nghe': {
        title: '📱 Điện tử & Công nghệ',
        emojis: ['📱', '📞', '💻', '🖥️', '⌚', '🎧', '📷', '📹', '🔌', '🔋', '📺', '📻', '🖨️', '💾', '💿']
    },
    'khac': {
        title: '🔧 Sửa chữa & Khác',
        emojis: ['🔧', '🔨', '🪚', '🔩', '📦', '📮', '💝', '🎁', '❓', '💭', '⭐', '🌟', '💫', '✨', '🎉']
    }
};

/**
 * Tạo emoji picker
 */
function tao_emoji_picker(container_id, selected_emoji_id, hidden_input_id, default_emoji = '🍽️') {
    const container = document.getElementById(container_id);
    if (!container) return;

    let html = `
        <div class="emoji-picker p-3 border rounded bg-light" style="max-height: 300px; overflow-y: auto;">
            <div class="emoji-grid">
    `;

    // Tạo từng danh mục
    Object.keys(DANH_MUC_EMOJI).forEach(category_key => {
        const category = DANH_MUC_EMOJI[category_key];
        html += `
            <div class="emoji-category mb-3">
                <h6 class="small text-muted mb-2">${category.title}</h6>
                <div class="emoji-row d-flex flex-wrap gap-1">
        `;
        
        category.emojis.forEach(emoji => {
            html += `
                <button type="button" class="emoji-btn btn btn-light border-0 p-2" 
                        data-emoji="${emoji}" 
                        style="width: 40px; height: 40px; font-size: 18px;"
                        onclick="chon_emoji_danh_muc('${emoji}', '${selected_emoji_id}', '${hidden_input_id}')">
                    ${emoji}
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
            </div>
            
            <!-- Emoji đã chọn -->
            <div class="mt-3 p-2 bg-white rounded border">
                <small class="text-muted">Emoji đã chọn:</small>
                <span id="${selected_emoji_id}" class="fs-4 ms-2">${default_emoji}</span>
            </div>
        </div>
        <input type="hidden" id="${hidden_input_id}" value="${default_emoji}">
    `;

    container.innerHTML = html;
}

/**
 * Xu ly khi chon emoji
 */
function chon_emoji_danh_muc(emoji, selected_emoji_id, hidden_input_id) {
    // Cập nhật hiển thị
    const selected_element = document.getElementById(selected_emoji_id);
    if (selected_element) {
        selected_element.textContent = emoji;
    }

    // Cập nhật hidden input
    const hidden_input = document.getElementById(hidden_input_id);
    if (hidden_input) {
        hidden_input.value = emoji;
    }

    // Xóa active từ tất cả buttons
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-primary', 'text-white');
        btn.classList.add('btn-light');
    });

    // Thêm active cho button được chọn
    const clicked_btn = document.querySelector(`[data-emoji="${emoji}"]`);
    if (clicked_btn) {
        clicked_btn.classList.remove('btn-light');
        clicked_btn.classList.add('active', 'bg-primary', 'text-white');
    }

    console.log(`🎯 Đã chọn emoji: ${emoji}`);
}

/**
 * Khoi tao emoji picker khi trang load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Kiem tra xem co container emoji picker khong
    if (document.getElementById('emoji-picker-chi-container')) {
        tao_emoji_picker('emoji-picker-chi-container', 'emoji-chi-selected', 'emoji-chi');
    }
    
    if (document.getElementById('emoji-picker-thu-container')) {
        tao_emoji_picker('emoji-picker-thu-container', 'emoji-thu-selected', 'emoji-thu', '💰');
    }
});
