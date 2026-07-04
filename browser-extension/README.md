# X Media Collector

Tiện ích mở rộng Chrome để thu thập các ảnh đang hiển thị trên X (Twitter) và lưu vào ứng dụng Next.js.

## Mục đích

X Media Collector đọc nội dung ảnh đang được hiển thị trong trình duyệt của người dùng đã đăng nhập X, cho phép chọn và lưu ảnh vào kho media của ứng dụng web.

## Cấu trúc file

```
browser-extension/
├── manifest.json        # Manifest V3 configuration
├── config.js           # Extension configuration
├── content-script.js   # DOM scanning script
├── popup.html          # Popup UI structure
├── popup.css           # Popup styling
├── popup.js            # Popup logic
└── README.md           # This file
```

## Cách cài đặt

1. Mở Chrome và truy cập `chrome://extensions`
2. Bật **Developer mode** (Chế độ nhà phát triển) ở góc phải trên
3. Nhấn **Load unpacked**
4. Chọn thư mục `browser-extension`

## Cách sử dụng

### Kết nối với ứng dụng

1. Đăng nhập vào ứng dụng Next.js
2. Mở extension X Media Collector
3. Nhấn **Kết nối**
4. Nhấn **Mở trang kết nối** để mở trang kết nối
5. Nhấn **Tạo mã kết nối** và sao chép mã
6. Dán mã vào extension và nhấn **Xác nhận**

### Thu thập và lưu ảnh

1. Đăng nhập X (Twitter) trong Chrome thủ công
2. Mở một bài viết hoặc trang hồ sơ chứa ảnh trên X
3. Mở extension và nhấn **Thu thập ảnh**
4. Chọn các ảnh muốn lưu bằng cách tick checkbox
5. Nhấn **Lưu vào kho media**
6. Xem kết quả: đã lưu, trùng lặp, hoặc thất bại
7. Mở trang X Media Archive để xem các ảnh đã lưu

## Cách chuyển đổi giữa localhost và production

### Local development

1. Mở `browser-extension/config.js`
2. Đảm bảo `APP_BASE_URL` là `"http://localhost:3000"`
3. Tải lại extension tại `chrome://extensions`

### Production

1. Mở `browser-extension/config.js`
2. Thay đổi `APP_BASE_URL` thành `"https://lich-su-chi-tien.vercel.app"`
3. Tải lại extension tại `chrome://extensions`
4. Tạo mã kết nối mới từ trang production

**Lưu ý:** Mỗi khi thay đổi config.js, bạn cần tải lại extension và tạo mã kết nối mới.

## Cách tải lại sau khi thay đổi code

1. Truy cập `chrome://extensions`
2. Tìm "X Media Collector"
3. Nhấn nút tải lại (biểu tượng làm mới)

## Quyền được yêu cầu

- `activeTab`: Chỉ truy cập tab hiện tại khi người dùng kích hoạt
- `storage`: Lưu kết quả thu thập và token kết nối
- `http://localhost:3000/*`: Giao tiếp với ứng dụng local
- `https://lich-su-chi-tien.vercel.app/*`: Giao tiếp với ứng dụng production

Extension **KHÔNG** yêu cầu:
- cookies
- debugger
- webRequest
- declarativeNetRequest

## Bảo mật

Extension này:

- **KHÔNG** đọc mật khẩu X
- **KHÔNG** yêu cầu quyền cookies của X
- **KHÔNG** gửi cookies hoặc dữ liệu đăng nhập X đến bất kỳ server nào
- **KHÔNG** truy cập network traffic riêng tư
- **KHÔNG** tự động đăng nhập hoặc bỏ qua xác thực
- Chỉ đọc nội dung ảnh đã được X render trong DOM của trình duyệt

Token kết nối được mã hóa và lưu trữ cục bộ trong trình duyệt.

## Giới hạn hiện tại

- Chỉ quét các bài viết đang được hiển thị trên DOM
- X sử dụng infinite scrolling - người dùng phải cuộn để tải thêm bài viết
- Không có khả năng truy cập các bài viết đã xóa
- Nội dung riêng tư hoặc bị giới hạn độ tuổi chỉ có thể truy cập khi tài khoản hiện tại được phép xem
- Chỉ hỗ trợ ảnh, không hỗ trợ video trong phiên bản này

## Cấu hình

File `config.js` chứa các URL API:

```javascript
const X_MEDIA_CONFIG = {
  APP_BASE_URL: "http://localhost:3000",  // hoặc "https://lich-su-chi-tien.vercel.app"
  API_SESSION: "/api/x-media/extension/session",
  API_CONNECT: "/api/x-media/extension/connect",
  API_TOKEN: "/api/x-media/extension/token",
  API_IMPORT: "/api/x-media/extension/import"
};
```

Thay đổi `APP_BASE_URL` giữa localhost và production. Sau khi thay đổi, tải lại extension.

## Hỗ trợ trang

- x.com
- www.x.com
- twitter.com
- www.twitter.com
