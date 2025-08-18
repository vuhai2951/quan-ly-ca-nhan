// Service Worker cho Quản Lý Cá Nhân PWA
const CACHE_NAME = 'quan-ly-ca-nhan-v1.0.0';
const urlsToCache = [
  '/',
  '/dang-nhap',
  '/chi-tieu',
  '/hoc-tap', 
  '/cong-viec',
  '/ghi-chu',
  '/cai-dat',
  '/static/css/style.css',
  '/static/js/global_settings.js',
  '/static/js/google_calendar.js',
  '/static/js/trang_chu.js',
  '/static/js/tien_te.js',
  '/static/images/logo-vecter.png',
  '/static/images/icon-192x192.png',
  '/static/images/icon-512x512.png',
  '/static/manifest.json',
  // Bootstrap CSS và JS
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Cài đặt Service Worker
self.addEventListener('install', function(event) {
  console.log('[SW] Đang cài đặt Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Đã mở cache');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('[SW] Tất cả file đã được cache');
        return self.skipWaiting();
      })
  );
});

// Kích hoạt Service Worker
self.addEventListener('activate', function(event) {
  console.log('[SW] Đang kích hoạt Service Worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Xóa cache cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] Service Worker đã sẵn sàng');
      return self.clients.claim();
    })
  );
});

// Xử lý fetch requests
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Trả về cache nếu có
        if (response) {
          return response;
        }

        // Nếu không có cache, fetch từ network
        return fetch(event.request).then(function(response) {
          // Kiểm tra response hợp lệ
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response để cache
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function() {
          // Nếu offline và không có cache, trả về trang offline
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Xử lý background sync
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Xử lý đồng bộ dữ liệu khi có kết nối
  return new Promise((resolve) => {
    console.log('[SW] Đồng bộ dữ liệu background...');
    resolve();
  });
}

// Xử lý push notifications (tương lai)
self.addEventListener('push', function(event) {
  console.log('[SW] Push message received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Bạn có thông báo mới!',
    icon: '/static/images/icon-192x192.png',
    badge: '/static/images/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Quản Lý Cá Nhân', options)
  );
});

// Xử lý notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click received:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
