# Từ vựng — Ôn tập và Học từ mới

## Mục tiêu

- Chỉ có hai mục chính: **Ôn tập** và **Học từ mới**.
- Ôn tập gom từ đã học trên toàn bộ BOYA 1 theo lịch ngắt quãng, không lọc theo bài.
- Học từ mới hiển thị danh sách bài, tiến độ từng bài và các từ chưa học.
- Mô hình ghi nhớ có 5 mức: Mới, Đang nhớ, Gần chắc, Nhớ tốt, Bền vững.
- Từ ở mức thấp xuất hiện thường xuyên; từ ở mức cao có khoảng nghỉ dài hơn.

## Luồng chính

1. Dashboard hiển thị phân bố **từ đã học** trên 5 mức, số từ đến hạn, tổng từ đã học và streak. Từ chưa học không được tính vào biểu đồ hoặc hàng đợi ôn.
2. Nút “Ôn tập ngay” tạo phiên tối đa 20 từ đã học, ưu tiên hạn ôn sớm nhất trên tất cả bài. Khi hết từ đến hạn, cho ôn sớm tối đa 5 từ đã học. Tài khoản chưa học từ nào được dẫn sang Học từ mới.
3. Phiên ôn trộn bốn dạng: chọn nghĩa, chọn chữ Hán, nghe chọn nghĩa và điền chữ Hán.
4. Hệ thống phản hồi đúng/sai ngay. Câu sai được đưa lại vào cuối phiên; câu đúng tăng mức tự động, không bắt người học tự chấm trí nhớ.
5. Điền chữ có hai cách: ngân hàng chữ cho giai đoạn làm quen và tự gõ để luyện nhớ chủ động. Có thể mở gợi ý pinyin nhưng lịch ôn sẽ thận trọng hơn.
6. Kết quả cập nhật lịch riêng cho từng từ, hiển thị thời điểm gặp lại và được lưu cục bộ trên thiết bị.
7. Học từ mới: chọn bài → xem danh sách từ → học tối đa 10 từ chưa học mỗi lượt. Mỗi từ được giới thiệu chữ Hán, pinyin, nghĩa, phát âm trước câu luyện tập.
8. Từ đã luyện được đưa vào kho ôn chung; lần học tiếp bỏ qua các từ đã học. Giữ nguyên khóa lưu tiến độ và chuyển tiếp dữ liệu cũ.

## Giao diện và khả dụng

- Bố cục theo ảnh tham chiếu MochiMochi: hai tab phía trên, biểu đồ lớn ở giữa, hai thẻ thống kê bên phải, nút ôn màu xanh. Danh sách bài dùng thẻ vàng/xám, bài gợi ý được làm nổi bật.
- Giữ font, sidebar và chế độ sáng/tối của planner; không thêm các mục quảng cáo hay điều hướng khác từ ảnh tham chiếu.
- Biểu đồ 5 mức là CSS nhẹ, có mô tả `aria-label`; không tải thư viện chart.
- Khi bắt đầu phiên, ẩn tab và danh sách bài để chỉ còn nội dung học/ôn cùng một hành động chính.
- Phím tắt trong phiên: 1–4 chọn đáp án, A nghe, Enter tiếp tục, Escape về dashboard.
- Tất cả nút chính tối thiểu 44px; đáp án dùng lưới 2 cột trên desktop và 1 cột trên mobile để không tràn ngang.
