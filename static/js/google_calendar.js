/**
 * Tích hợp Google Calendar API cho ứng dụng quản lý công việc
 * Hỗ trợ tạo, sửa, xóa events trực tiếp trên Google Calendar
 */

class GoogleCalendarManager {
    constructor() {
        this.gapi = null;
        this.tokenClient = null; // Thay vì auth2, sử dụng tokenClient
        this.accessToken = null;
        this.refreshToken = null; // Lưu refresh token để dùng lâu dài
        this.tokenExpiry = null; // Thời gian hết hạn token
        this.isSignedIn = false;
        this.da_xac_thuc = false;
        this.calendarId = 'primary';
        this.CLIENT_ID = '';
        this.API_KEY = '';
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar'; // Mở rộng quyền
        this.isInitializing = false;
        this.isInitialized = false;
        this.autoRefreshTimer = null; // Timer tự động làm mới token
        
        // Callbacks cho UI
        this.on_auth_change = (da_xac_thuc) => {
            // Cập nhật UI nếu hàm tồn tại
            if (typeof cap_nhat_trang_thai_google === 'function') {
                cap_nhat_trang_thai_google(da_xac_thuc);
            }
        };
    }

    /**
     * Khởi tạo Google API và xác thực
     */
    async khoi_tao() {
        // Tránh multiple initialization
        if (this.isInitializing) {
            return;
        }
        
        if (this.isInitialized) {
            return;
        }
        
        this.isInitializing = true;
        
        try {
            // Load config từ server
            await this.tai_config();
            console.log('📋 Đã load config:', { CLIENT_ID: this.CLIENT_ID.substring(0, 20) + '...', API_KEY: this.API_KEY.substring(0, 10) + '...' });
            
            // Load Google API
            await this.tai_google_api();
            // Khởi tạo Google API Client
            await new Promise((resolve, reject) => {
                gapi.load('client', async () => {
                    try {
                        await this.khoi_tao_gapi();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            // Kiểm tra và khôi phục session đã lưu
            await this.khoi_phuc_session();
            
            this.isInitialized = true;
            } catch (error) {
            console.error('❌ Lỗi khởi tạo Google Calendar:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Tải config từ server
     */
    async tai_config() {
        try {
            const response = await fetch('/api/google-calendar/config');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const config = await response.json();
            if (config.thanh_cong) {
                this.CLIENT_ID = config.cau_hinh.client_id;
                this.API_KEY = config.cau_hinh.api_key;
                
                if (!this.CLIENT_ID || !this.API_KEY) {
                    throw new Error('Thiếu CLIENT_ID hoặc API_KEY trong config');
                }
                
                } else {
                throw new Error(config.loi || 'Không thể tải config Google Calendar');
            }
        } catch (error) {
            console.error('Lỗi tải config Google Calendar:', error);
            throw new Error(`Không thể tải cấu hình Google Calendar: ${error.message || error}`);
        }
    }

    /**
     * Tải Google API script và Google Identity Services
     */
    async tai_google_api() {
        try {
            // Tải Google API script
            if (!window.gapi) {
                await this.tai_script('https://apis.google.com/js/api.js', 'gapi');
                }
            
            // Tải Google Identity Services
            if (!window.google?.accounts) {
                await this.tai_script('https://accounts.google.com/gsi/client', 'google');
                }
            
        } catch (error) {
            console.error('❌ Lỗi tải Google scripts:', error);
            throw error;
        }
    }

    /**
     * Helper function để tải script
     */
    tai_script(src, globalVar) {
        return new Promise((resolve, reject) => {
            if (window[globalVar]) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                // Đợi một chút để đảm bảo script được khởi tạo
                setTimeout(() => {
                    if (window[globalVar]) {
                        resolve();
                    } else {
                        reject(new Error(`${globalVar} không có sẵn sau khi tải script`));
                    }
                }, 100);
            };
            
            script.onerror = (error) => {
                console.error(`Lỗi tải script ${src}:`, error);
                reject(new Error(`Không thể tải script ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Khởi tạo Google API Client với Google Identity Services mới
     */
    async khoi_tao_gapi() {
        try {
            console.log('Config sử dụng:', {
                apiKey: this.API_KEY.substring(0, 10) + '...',
                clientId: this.CLIENT_ID.substring(0, 20) + '...',
                discoveryDocs: this.DISCOVERY_DOC,
                scope: this.SCOPES
            });
            
            // Kiểm tra các script đã load chưa
            if (!window.gapi) {
                throw new Error('Google API (gapi) chưa được load');
            }
            
            if (!window.google?.accounts) {
                throw new Error('Google Identity Services chưa được load');
            }
            
            // Khởi tạo gapi client (không có auth2)
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: [this.DISCOVERY_DOC]
            });

            this.gapi = gapi;
            // Khởi tạo Google Identity Services Token Client
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        
                        // Tính thời gian hết hạn (Google thường cấp token 1 giờ)
                        const expiryTime = new Date(Date.now() + (response.expires_in || 3600) * 1000);
                        this.tokenExpiry = expiryTime;
                        
                        gapi.client.setToken({access_token: response.access_token});
                        this.luu_session_local();
                        this.cap_nhat_trang_thai_dang_nhap(true);
                        this.bat_dau_auto_refresh();
                        
                        console.log('✅ Token mới đã được lưu, hết hạn vào:', expiryTime.toLocaleString());
                    } else if (response.error) {
                        console.error('❌ Token error:', response.error);
                        this.cap_nhat_trang_thai_dang_nhap(false);
                    }
                }
            });
            
            // Cập nhật trạng thái ban đầu
            this.cap_nhat_trang_thai_dang_nhap(false);
            
            } catch (error) {
            console.error('❌ Lỗi khởi tạo GAPI:', error);
            console.error('Chi tiết lỗi:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                error: error,
                gapi_available: !!window.gapi,
                google_accounts_available: !!window.google?.accounts
            });
            throw error;
        }
    }

    /**
     * Lưu session vào localStorage để dùng lâu dài
     */
    luu_session_local() {
        try {
            const sessionData = {
                accessToken: this.accessToken,
                tokenExpiry: this.tokenExpiry?.toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem('google_calendar_session', JSON.stringify(sessionData));
            } catch (error) {
            console.warn('⚠️ Không thể lưu session:', error);
        }
    }

    /**
     * Khôi phục session từ localStorage
     */
    async khoi_phuc_session() {
        try {
            const sessionStr = localStorage.getItem('google_calendar_session');
            if (!sessionStr) {
                return false;
            }

            const sessionData = JSON.parse(sessionStr);
            const tokenExpiry = new Date(sessionData.tokenExpiry);
            const now = new Date();

            // Kiểm tra token còn hạn không (trừ 5 phút để an toàn)
            if (tokenExpiry > new Date(now.getTime() + 5 * 60 * 1000)) {
                this.accessToken = sessionData.accessToken;
                this.tokenExpiry = tokenExpiry;
                
                // Thiết lập token cho gapi
                gapi.client.setToken({access_token: this.accessToken});
                
                // Kiểm tra token có hoạt động không
                const isValid = await this.kiem_tra_token_hop_le();
                if (isValid) {
                    this.cap_nhat_trang_thai_dang_nhap(true);
                    this.bat_dau_auto_refresh();
                    return true;
                }
            }
            
            // Token hết hạn hoặc không hợp lệ
            this.xoa_session_local();
            return false;

        } catch (error) {
            console.warn('⚠️ Lỗi khôi phục session:', error);
            this.xoa_session_local();
            return false;
        }
    }

    /**
     * Xóa session đã lưu
     */
    xoa_session_local() {
        localStorage.removeItem('google_calendar_session');
        }

    /**
     * Kiểm tra token có hợp lệ không
     */
    async kiem_tra_token_hop_le() {
        try {
                        const response = await gapi.client.calendar.calendarList.list({maxResults: 1});
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Bắt đầu timer tự động làm mới token
     */
    bat_dau_auto_refresh() {
        // Xóa timer cũ nếu có
        if (this.autoRefreshTimer) {
            clearTimeout(this.autoRefreshTimer);
        }

        if (!this.tokenExpiry) return;

        // Tính thời gian còn lại đến khi hết hạn (làm mới trước 10 phút)
        const now = new Date();
        const timeUntilRefresh = this.tokenExpiry.getTime() - now.getTime() - (10 * 60 * 1000);

        if (timeUntilRefresh > 0) {
            console.log(`⏰ Sẽ tự động làm mới token sau ${Math.round(timeUntilRefresh / (60 * 1000))} phút`);
            
            this.autoRefreshTimer = setTimeout(async () => {
                try {
                    await this.lam_moi_token_tu_dong();
                } catch (error) {
                    console.error('❌ Lỗi tự động làm mới token:', error);
                    this.cap_nhat_trang_thai_dang_nhap(false);
                }
            }, timeUntilRefresh);
        }
    }

    /**
     * Tự động làm mới token mà không cần user consent
     */
    async lam_moi_token_tu_dong() {
        try {
            // Sử dụng tokenClient để yêu cầu token mới
            return new Promise((resolve, reject) => {
                this.tokenClient.callback = (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        const expiryTime = new Date(Date.now() + (response.expires_in || 3600) * 1000);
                        this.tokenExpiry = expiryTime;
                        
                        gapi.client.setToken({access_token: response.access_token});
                        this.luu_session_local();
                        this.bat_dau_auto_refresh(); // Đặt timer cho lần làm mới tiếp theo
                        
                        resolve(true);
                    } else {
                        reject(new Error(response.error || 'Không thể làm mới token'));
                    }
                };
                
                // Yêu cầu token mới mà không cần prompt
                this.tokenClient.requestAccessToken({prompt: ''});
            });
        } catch (error) {
            console.error('❌ Lỗi làm mới token tự động:', error);
            throw error;
        }
    }
    cap_nhat_trang_thai_dang_nhap(isSignedIn) {
        this.isSignedIn = isSignedIn;
        this.da_xac_thuc = isSignedIn; // Đồng bộ cả 2 property
        
        // Gọi callback
        if (this.on_auth_change) {
            this.on_auth_change(isSignedIn);
        }
        
        // Nếu đăng nhập thành công và đang ở tab Google Calendar, tải thông tin
        if (isSignedIn && typeof tai_thong_tin_google_calendar === 'function') {
            // Kiểm tra xem có đang ở tab Google Calendar không
            const googleTab = document.getElementById('google-calendar');
            if (googleTab && googleTab.classList.contains('active')) {
                setTimeout(() => {
                    tai_thong_tin_google_calendar();
                }, 1000);
            }
        }
    }

    /**
     * Đăng nhập Google với Google Identity Services
     */
    async dang_nhap() {
        try {
            if (!this.gapi) {
                throw new Error('Google API chưa được khởi tạo. Vui lòng refresh trang và thử lại.');
            }
            
            if (!this.tokenClient) {
                throw new Error('Google Identity Services chưa được khởi tạo.');
            }
            
            // Kiểm tra xem đã có token chưa
            if (gapi.client.getToken()) {
                this.cap_nhat_trang_thai_dang_nhap(true);
                return;
            }
            
            // Yêu cầu access token mới
            this.tokenClient.requestAccessToken({prompt: 'consent'});
            
        } catch (error) {
            console.error('❌ Lỗi đăng nhập Google:', error);
            console.error('Chi tiết lỗi:', {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                error: error
            });
            throw error;
        }
    }

    /**
     * Đăng xuất Google
     */
    async dang_xuat() {
        try {
            // Dừng auto refresh timer
            if (this.autoRefreshTimer) {
                clearTimeout(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
            }
            
            if (this.accessToken) {
                // Revoke token
                google.accounts.oauth2.revoke(this.accessToken, () => {
                    });
                this.accessToken = null;
                this.tokenExpiry = null;
            }
            
            // Clear gapi token
            if (gapi.client.getToken()) {
                gapi.client.setToken(null);
            }
            
            // Xóa session đã lưu
            this.xoa_session_local();
            
            this.cap_nhat_trang_thai_dang_nhap(false);
            } catch (error) {
            console.error('❌ Lỗi đăng xuất Google:', error);
            throw error;
        }
    }

    /**
     * Tạo event mới trên Google Calendar
     */
    async tao_event(thong_tin_lich) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Vui lòng đăng nhập Google Calendar trước');
            }

            const event = this.chuyen_doi_sang_google_event(thong_tin_lich);
            
                        console.log('🎨 Event object gửi lên Google:', JSON.stringify(event, null, 2));
            const response = await gapi.client.calendar.events.insert({
                'calendarId': this.calendarId,
                'resource': event
            });

            if (response.status === 200) {
                // Thử update colorId ngay sau khi tạo event
                const eventId = response.result.id;
                const colorId = this.chon_mau_google_calendar(thong_tin_lich.mau_sac);
                
                try {
                    const updateResponse = await gapi.client.calendar.events.patch({
                        'calendarId': this.calendarId,
                        'eventId': eventId,
                        'resource': {
                            'colorId': colorId
                        }
                    });
                    
                    if (updateResponse.status === 200) {
                        } else {
                        }
                } catch (colorError) {
                    console.error('❌ Lỗi cập nhật màu sắc:', colorError);
                }
                
                return {
                    thanh_cong: true,
                    google_event_id: response.result.id,
                    google_event_link: response.result.htmlLink
                };
            } else {
                throw new Error('Không thể tạo event');
            }
            
        } catch (error) {
            console.error('Lỗi tạo Google Calendar event:', error);
            return {
                thanh_cong: false,
                loi: error.message
            };
        }
    }

    /**
     * Cập nhật event trên Google Calendar
     */
    async cap_nhat_event(google_event_id, thong_tin_lich) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Vui lòng đăng nhập Google Calendar trước');
            }

            const event = this.chuyen_doi_sang_google_event(thong_tin_lich);
            
            const response = await gapi.client.calendar.events.update({
                'calendarId': this.calendarId,
                'eventId': google_event_id,
                'resource': event
            });

            if (response.status === 200) {
                return {
                    thanh_cong: true,
                    google_event_id: response.result.id,
                    link: response.result.htmlLink
                };
            } else {
                throw new Error('Không thể cập nhật event');
            }
            
        } catch (error) {
            console.error('Lỗi cập nhật Google Calendar event:', error);
            return {
                thanh_cong: false,
                loi: error.message
            };
        }
    }

    /**
     * Xóa event trên Google Calendar
     */
    async xoa_event(google_event_id) {
        try {
            if (!this.isSignedIn) {
                throw new Error('Vui lòng đăng nhập Google Calendar trước');
            }

            const response = await gapi.client.calendar.events.delete({
                'calendarId': this.calendarId,
                'eventId': google_event_id
            });

            if (response.status === 204) {
                return {
                    thanh_cong: true
                };
            } else {
                throw new Error('Không thể xóa event');
            }
            
        } catch (error) {
            console.error('Lỗi xóa Google Calendar event:', error);
            return {
                thanh_cong: false,
                loi: error.message
            };
        }
    }

    /**
     * Lấy timezone offset của user
     */
    lay_timezone_offset() {
        const offset = new Date().getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset <= 0 ? '+' : '-';
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Lấy timezone name của user
     */
    lay_timezone_name() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Chuyển đổi thông tin lịch sang format Google Calendar
     */
    chuyen_doi_sang_google_event(thong_tin_lich) {
        // Sử dụng timezone của user thay vì hardcode
        const timezone_offset = this.lay_timezone_offset();
        const timezone_name = this.lay_timezone_name();
        
        // Tạo datetime với timezone của user
        const ngay_gio_bat_dau = `${thong_tin_lich.ngay_lam}T${thong_tin_lich.gio_bat_dau}:00${timezone_offset}`;
        const ngay_gio_ket_thuc = `${thong_tin_lich.ngay_lam}T${thong_tin_lich.gio_ket_thuc}:00${timezone_offset}`;
        
        console.log(`🕐 Timezone detected: ${timezone_name} (${timezone_offset})`);
        // Xử lý nhắc nhở dựa trên lựa chọn của người dùng
        let reminders = { 'useDefault': false, 'overrides': [] };
        
        if (thong_tin_lich.nhac_nho && thong_tin_lich.nhac_nho !== '0') {
            const nhac_nho_values = thong_tin_lich.nhac_nho.split(',');
            nhac_nho_values.forEach(phut => {
                if (phut && parseInt(phut) > 0) {
                    reminders.overrides.push({
                        'method': 'popup', 
                        'minutes': parseInt(phut)
                    });
                }
            });
        }
        
        // Nếu không có nhắc nhở nào được chọn, sử dụng mặc định
        if (reminders.overrides.length === 0 && thong_tin_lich.nhac_nho !== '0') {
            reminders.overrides = [
                {'method': 'popup', 'minutes': 30},
                {'method': 'popup', 'minutes': 10}
            ];
        }
        
        return {
            'summary': `${thong_tin_lich.ten_cong_viec}`,
            'description': thong_tin_lich.ghi_chu || `Lịch làm việc: ${thong_tin_lich.ten_cong_viec}`,
            'start': {
                'dateTime': ngay_gio_bat_dau,
                'timeZone': this.lay_timezone_name()
            },
            'end': {
                'dateTime': ngay_gio_ket_thuc,
                'timeZone': this.lay_timezone_name()
            },
            'location': thong_tin_lich.dia_diem || '',
            'colorId': this.chon_mau_google_calendar(thong_tin_lich.mau_sac),
            'reminders': reminders
        };
    }

    /**
     * Chọn màu phù hợp cho Google Calendar
     */
    /**
     * Tìm màu Google Calendar gần nhất với màu hex được chọn
     */
    tim_mau_gan_nhat(hex_color) {
        const google_colors = {
            '1': { hex: '#a4bdfc', name: 'Lavender' },
            '2': { hex: '#7ae7bf', name: 'Sage' },
            '3': { hex: '#dbadff', name: 'Grape' },
            '4': { hex: '#ff887c', name: 'Flamingo' },
            '5': { hex: '#fbd75b', name: 'Banana' },
            '6': { hex: '#ffb878', name: 'Tangerine' },
            '7': { hex: '#46d6db', name: 'Peacock' },
            '8': { hex: '#e1e1e1', name: 'Graphite' },
            '9': { hex: '#5484ed', name: 'Blueberry' },
            '10': { hex: '#51b749', name: 'Basil' },
            '11': { hex: '#dc2127', name: 'Tomato' }
        };

        // Convert hex to RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        // Calculate color distance
        function colorDistance(color1, color2) {
            return Math.sqrt(
                Math.pow(color1.r - color2.r, 2) +
                Math.pow(color1.g - color2.g, 2) +
                Math.pow(color1.b - color2.b, 2)
            );
        }

        const target_rgb = hexToRgb(hex_color);
        if (!target_rgb) return { colorId: '1', info: google_colors['1'] };

        let closest_color = '1';
        let min_distance = Infinity;

        for (const [colorId, colorInfo] of Object.entries(google_colors)) {
            const color_rgb = hexToRgb(colorInfo.hex);
            if (color_rgb) {
                const distance = colorDistance(target_rgb, color_rgb);
                if (distance < min_distance) {
                    min_distance = distance;
                    closest_color = colorId;
                }
            }
        }

        return {
            colorId: closest_color,
            info: google_colors[closest_color],
            original_color: hex_color
        };
    }

    chon_mau_google_calendar(mau_sac) {
        // Mapping trực tiếp cho các màu phổ biến
        const mau_map = {
            '#007bff': '9', // Xanh dương → Blueberry
            '#28a745': '10', // Xanh lá → Basil  
            '#6f42c1': '3', // Tím → Grape
            '#dc3545': '11', // Đỏ → Tomato
            '#ffc107': '5', // Vàng → Banana
            '#fd7e14': '6', // Cam → Tangerine
            '#20c997': '7', // Xanh ngọc → Peacock
            '#6c757d': '8', // Xám → Graphite
            '#e83e8c': '4', // Hồng → Flamingo
            '#17a2b8': '7', // Xanh nhạt → Peacock
            '#343a40': '8'  // Đen → Graphite
        };
        
        // Nếu có mapping trực tiếp, dùng luôn
        if (mau_map[mau_sac]) {
            const colorId = mau_map[mau_sac];
            return colorId;
        }
        
        // Nếu không, tìm màu gần nhất
        const closest = this.tim_mau_gan_nhat(mau_sac);
        return closest.colorId;
    }

    /**
     * Kiểm tra kết nối Google Calendar
     */
    kiem_tra_ket_noi() {
        return this.isSignedIn;
    }

    /**
     * Lấy thông tin session hiện tại
     */
    lay_thong_tin_session() {
        return {
            da_dang_nhap: this.isSignedIn,
            access_token: this.accessToken ? this.accessToken.substring(0, 10) + '...' : null,
            token_expiry: this.tokenExpiry ? this.tokenExpiry.toLocaleString() : null,
            thoi_gian_con_lai: this.tokenExpiry ? Math.max(0, Math.round((this.tokenExpiry.getTime() - Date.now()) / (60 * 1000))) : null
        };
    }

    /**
     * Làm mới token nếu cần thiết
     */
    async lam_moi_token_neu_can() {
        try {
            // Kiểm tra token có tồn tại và còn hạn không
            if (this.accessToken && this.tokenExpiry) {
                const now = new Date();
                const timeUntilExpiry = this.tokenExpiry.getTime() - now.getTime();
                
                // Nếu còn hơn 5 phút thì kiểm tra xem token có hoạt động không
                if (timeUntilExpiry > 5 * 60 * 1000) {
                    const isValid = await this.kiem_tra_token_hop_le();
                    if (isValid) {
                        return true; // Token còn tốt
                    }
                }
                
                // Token sắp hết hạn hoặc không hợp lệ -> làm mới
                await this.lam_moi_token_tu_dong();
                return true;
            } else {
                // Chưa có token -> cần đăng nhập lại
                return false;
            }
        } catch(e) {
            console.error('❌ Lỗi làm mới token:', e);
            // Xóa session cũ và yêu cầu đăng nhập lại
            this.xoa_session_local();
            this.cap_nhat_trang_thai_dang_nhap(false);
            return false;
        }
    }

    /**
     * Yêu cầu token mới từ Google
     */
    async yeu_cau_token_moi() {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) return reject(new Error('Token client chưa khởi tạo'));
            this.tokenClient.callback = (resp) => {
                if (resp.error) {
                    reject(resp);
                } else {
                    this.accessToken = resp.access_token;
                    gapi.client.setToken({access_token: resp.access_token});
                    this.cap_nhat_trang_thai_dang_nhap(true);
                    resolve(true);
                }
            };
            this.tokenClient.requestAccessToken({prompt: ''});
        });
    }

    /**
     * Lấy danh sách sự kiện trong khoảng thời gian
     */
    async lay_su_kien_trong_khoang(timeMinISO, timeMaxISO) {
        try {
            const ok = await this.lam_moi_token_neu_can();
            if (!ok) throw new Error('Không thể xác thực Google');
            const resp = await gapi.client.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: timeMinISO,
                timeMax: timeMaxISO,
                singleEvents: true,
                orderBy: 'startTime'
            });
            if (resp.status === 200) {
                return {thanh_cong: true, du_lieu: resp.result.items || []};
            }
            throw new Error('Không thể tải sự kiện');
        } catch(e) {
            console.error('Lỗi lấy sự kiện:', e);
            return {thanh_cong: false, loi: e.message};
        }
    }

    /**
     * Mapping màu từ Google Calendar về hệ thống
     */
    mapping_mau_tu_google_color(googleColorId) {
        // Màu Google Calendar thực tế
        const mau_map = {
            '1': '#a4bdfc', // Lavender
            '2': '#7ae7bf', // Sage
            '3': '#dbadff', // Grape
            '4': '#ff887c', // Flamingo
            '5': '#fbd75b', // Banana
            '6': '#ffb878', // Tangerine
            '7': '#46d6db', // Peacock
            '8': '#e1e1e1', // Graphite
            '9': '#5484ed', // Blueberry
            '10': '#51b749', // Basil
            '11': '#dc2127'  // Tomato
        };
        
        return mau_map[googleColorId] || '#a4bdfc'; // Mặc định Lavender
    }
}

// Khởi tạo instance global
window.googleCalendarManager = new GoogleCalendarManager();

// Các hàm helper để sử dụng trong HTML
window.dang_nhap_google = async function() {
    try {
        // Kiểm tra xem đã khởi tạo chưa
        if (!window.googleCalendarManager.isInitialized && !window.googleCalendarManager.gapi) {
            await window.googleCalendarManager.khoi_tao();
        }
        
        // Kiểm tra lại sau khi khởi tạo
        if (!window.googleCalendarManager.gapi) {
            throw new Error('Không thể khởi tạo Google API. Vui lòng kiểm tra kết nối internet và thử lại.');
        }
        
        await window.googleCalendarManager.dang_nhap();
        
        // Kiểm tra hàm hien_thi_thong_bao có tồn tại không
        if (typeof hien_thi_thong_bao === 'function') {
            hien_thi_thong_bao('Đã kết nối Google Calendar thành công!', 'success');
        } else {
            }
    } catch (error) {
        console.error('❌ Lỗi kết nối Google Calendar:', error);
        
        // Xử lý error message an toàn
        let errorMessage = 'Có lỗi không xác định';
        if (error) {
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.error) {
                // Trường hợp Google API error
                if (typeof error.error === 'string') {
                    errorMessage = error.error;
                } else if (error.error.message) {
                    errorMessage = error.error.message;
                } else {
                    errorMessage = JSON.stringify(error.error);
                }
            } else {
                // Fallback: convert object to string
                try {
                    errorMessage = JSON.stringify(error);
                } catch (e) {
                    errorMessage = error.toString ? error.toString() : 'Lỗi không thể hiển thị';
                }
            }
        }
        
        console.error('Error message processed:', errorMessage);
        
        if (typeof hien_thi_thong_bao === 'function') {
            hien_thi_thong_bao('Lỗi kết nối Google Calendar: ' + errorMessage, 'error');
        } else {
            console.error('Lỗi kết nối Google Calendar: ' + errorMessage);
        }
    }
};

window.dang_xuat_google = async function() {
    try {
        await window.googleCalendarManager.dang_xuat();
        hien_thi_thong_bao('Đã ngắt kết nối Google Calendar', 'info');
    } catch (error) {
        console.error('Lỗi ngắt kết nối:', error);
        hien_thi_thong_bao('Lỗi ngắt kết nối: ' + error.message, 'error');
    }
};

// Hàm khởi tạo Google Calendar khi trang load
window.khoi_tao_google_calendar = async function() {
    try {
        await window.googleCalendarManager.khoi_tao();
        } catch (error) {
        console.warn('⚠️ Không thể khởi tạo Google Calendar:', error);
        console.warn('Chi tiết lỗi:', {
            message: error?.message,
            stack: error?.stack,
            type: typeof error,
            error: error
        });
        // Không throw error để trang vẫn hoạt động bình thường
    }
};

// Hàm hiển thị thông tin session
window.hien_thi_thong_tin_session = function() {
    if (window.googleCalendarManager) {
        const thongTin = window.googleCalendarManager.lay_thong_tin_session();
        if (thongTin.da_dang_nhap) {
            } else {
            }
        
        return thongTin;
    } else {
        return null;
    }
};

// Hàm làm mới token thủ công
window.lam_moi_token_thu_cong = async function() {
    if (window.googleCalendarManager) {
        try {
            const result = await window.googleCalendarManager.lam_moi_token_tu_dong();
            if (result) {
                if (typeof hien_thi_thong_bao === 'function') {
                    hien_thi_thong_bao('Đã làm mới kết nối Google Calendar!', 'success');
                }
            }
            return result;
        } catch (error) {
            console.error('❌ Lỗi làm mới token:', error);
            if (typeof hien_thi_thong_bao === 'function') {
                hien_thi_thong_bao('Lỗi làm mới token: ' + error.message, 'error');
            }
            return false;
        }
    } else {
        return false;
    }
};

