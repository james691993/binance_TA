# Binance TA — Trend Desk Hub

Web app phân tích Binance Spot với ba kiểu xem trong một dự án:

- **Tổng quan xu hướng:** danh sách coin tùy chỉnh, phân loại theo Histogram W1/MN1, biểu đồ MACD tuần và tháng.
- **Biểu đồ D1 / W / MN:** chọn ngày, tuần hoặc tháng; nến, SMA10/SMA20, EMA50/EMA100 và MACD cùng khung.
- **D1 cạnh W:** ngày ở bên trái, tuần ở bên phải; mỗi cột có nến và MACD riêng.

Menu nằm trên cùng. Danh sách coin và coin đang chọn được dùng chung giữa ba kiểu xem, lưu tại trình duyệt. Bố cục phù hợp MacBook; trên iPhone có thể vuốt menu và chuyển giữa hai cột.

## Chạy trên Mac

1. Tải hoặc clone repository này về máy.
2. Bấm đúp **Mo-Trend-Desk.command** để chạy ứng dụng và mở Google Chrome.
3. Cần Python 3 và kết nối Internet để lấy dữ liệu Binance; không cần API key hoặc cài thêm thư viện.

Nếu file mở nhanh chưa có quyền chạy, tại thư mục dự án dùng:

```sh
chmod +x Mo-Trend-Desk.command
```

## Chạy bằng máy chủ tĩnh

Ứng dụng không cần bước build. Trên Mac, Linux hoặc Windows có Python 3, chạy trong thư mục dự án:

```sh
python3 -m http.server 8000
```

Trên Windows có thể dùng `py -m http.server 8000`. Sau đó mở http://localhost:8000 trong trình duyệt.

File `launcher.py` là tiện ích mở Chrome trên macOS. Địa chỉ 127.0.0.1/localhost chỉ chạy trên máy đang mở ứng dụng; repository này chưa triển khai một website cố định cho iPhone.

## Dữ liệu và chỉ báo

Binance Spot public REST API: `data-api.binance.vision`, dự phòng `api.binance.com`. Khung D1/W/MN dùng interval `1d`/`1w`/`1M`, UTC. Ứng dụng tải toàn bộ lịch sử nến có sẵn cho coin và khung đang xem. Nếu kết nối Binance bị chặn, giao diện hiển thị lỗi và không thay bằng dữ liệu giả.

- SMA10/SMA20 tính từ giá Close của 10/20 nến trong khung đang xem.
- EMA50/EMA100 tính từ Close, hiển thị nét đậm hơn SMA.
- MACD = EMA12(Close) − EMA26(Close).
- Signal = EMA9(MACD); Histogram = MACD − Signal.
- EMA khởi tạo từ giá trị đầu tiên của lịch sử Binance; SMA chỉ có giá trị khi đủ nến.
- Mặc định dùng nến đã đóng; có tùy chọn nến đang chạy. Cập nhật bằng nút trong từng kiểu xem; chưa có streaming.

Phân loại tổng quan: Histogram tuần và tháng cùng dương → đồng thuận tăng; cùng âm → đồng thuận giảm; trường hợp khác → chưa đồng thuận. Đây là quy tắc của ứng dụng.

**Chưa xác nhận khớp TradingView thực tế.** Khi đối chiếu chọn đúng Binance Spot USDT, cùng khung và ngày mở nến, nguồn Close, MACD EMA/EMA 12/26/9. BTC.D và TOTAL3 chưa được bổ sung.

## Cấu trúc

- `index.html`, `app.js`, `style.css`: menu và khung ứng dụng chung.
- `views/overview/`: bảng xu hướng và MACD W1/MN1.
- `views/chart/`: biểu đồ một khung D1/W/MN.
- `views/duo/`: D1 và W cạnh nhau.
- `shared-state.mjs`: coin đang chọn giữa các kiểu xem.
- `vendor/`: thư viện biểu đồ đi kèm.
- `launcher.py`, `Mo-Trend-Desk.command`: mở ứng dụng trên Mac.

## Thư viện biểu đồ

TradingView Lightweight Charts™ 5.0.0, Apache 2.0. Các thông báo bản quyền và giấy phép đi kèm tại `vendor/LICENSE` và `vendor/NOTICE`. [TradingView](https://www.tradingview.com/).
