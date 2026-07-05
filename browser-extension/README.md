# X Media Collector

Tiện ích mở rộng Chrome để thu thập các ảnh và video đang hiển thị trên X (Twitter) và lưu vào ứng dụng Next.js.

## Mục đích

X Media Collector đọc nội dung ảnh và video đang được hiển thị trong trình duyệt của người dùng đã đăng nhập X, cho phép chọn và lưu vào kho media của ứng dụng web.

## Cấu trúc file

```
browser-extension/
├── manifest.json        # Manifest V3 configuration
├── config.js           # Extension configuration
├── content-script.js   # DOM scanning and message handling
├── page-script.js      # Network observation in page context
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

### Thu thập video

1. Đăng nhập X (Twitter) trong Chrome thủ công
2. Mở một bài viết chứa video trên X
3. **Phát video vài giây** để X tải nguồn MP4 trực tiếp
4. Mở extension và nhấn **Thu thập ảnh**
5. Video sẽ hiển thị với nhãn "Video" và có thể chọn
6. Chọn video muốn lưu và nhấn **Lưu vào kho media**

**Lưu ý:** Nếu video hiển thị "Không hỗ trợ", hãy phát video thêm vài giây rồi nhấn **Thu thập ảnh** lại.

## Cách chuyển đổi giữa localhost và production

**Mặc định:** Production (`https://lich-su-chi-tien.vercel.app`)

### Local development

1. Mở `browser-extension/config.js`
2. Thay đổi `APP_BASE_URL` thành `"http://localhost:3000"`
3. Tải lại extension tại `chrome://extensions`
4. Tạo mã kết nối mới từ trang local

### Production

1. Mở `browser-extension/config.js`
2. Đảm bảo `APP_BASE_URL` là `"https://lich-su-chi-tien.vercel.app"`
3. Tải lại extension tại `chrome://extensions`
4. Tạo mã kết nối mới từ trang production

## Cách tải lại sau khi thay đổi code

1. Lưu các thay đổi trong `config.js`
2. Truy cập `chrome://extensions`
3. Tìm "X Media Collector"
4. Nhấn nút tải lại (biểu tượng làm mới)
5. Đóng popup cũ nếu đang mở
6. Tải lại trang X
7. Tạo mã kết nối mới từ trang kết nối

**Quan trọng:** Mỗi khi thay đổi `config.js`, bạn cần tải lại extension và tạo mã kết nối mới. Mã kết nối từ localhost không thể dùng với production và ngược lại.

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

## Quan sát network trong page context

Extension sử dụng `page-script.js` để quan sát các phản hồi network đã được X gửi đến trình duyệt. Script này:

- Chỉ đọc các phản hồi JSON từ X và Twitter domains
- Không đọc cookies, authorization headers, hoặc dữ liệu người dùng
- Tìm các cấu trúc video metadata trong phản hồi
- Trích xuất các URL MP4 trực tiếp từ `video.twimg.com`
- Chọn variant có bitrate cao nhất
- Chỉ hoạt động với nội dung mà X đã gửi đến trình duyệt

Định dạng video X có thể thay đổi. Extension phụ thuộc vào cấu trúc phản hồi JSON nội bộ của X.

## Bảo mật

Extension này:

- **KHÔNG** đọc mật khẩu X
- **KHÔNG** yêu cầu quyền cookies của X
- **KHÔNG** gửi cookies hoặc dữ liệu đăng nhập X đến bất kỳ server nào
- **KHÔNG** truy cập network traffic riêng tư
- **KHÔNG** tự động đăng nhập hoặc bỏ qua xác thực
- Chỉ đọc nội dung đã được X render trong DOM của trình duyệt
- Chỉ quan sát các phản hồi JSON đã được X gửi đến trình duyệt

Token kết nối được mã hóa và lưu trữ cục bộ trong trình duyệt.

## Giới hạn hiện tại

- Chỉ quét các bài viết đang được hiển thị trên DOM
- X sử dụng infinite scrolling - người dùng phải cuộn để tải thêm bài viết
- Không có khả năng truy cập các bài viết đã xóa
- Nội dung riêng tư hoặc bị giới hạn độ tuổi chỉ có thể truy cập khi tài khoản hiện tại được phép xem
- Chỉ hỗ trợ video MP4 trực tiếp từ `video.twimg.com`
- Video HLS (.m3u8) không được hỗ trợ
- Video blob: URLs không được hỗ trợ trực tiếp - cần phát video để X tải nguồn MP4
- Định dạng response JSON của X có thể thay đổi bất cứ lúc nào

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
