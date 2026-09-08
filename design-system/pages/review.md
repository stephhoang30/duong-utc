# Ôn bài — page override

## Mục tiêu

- Tập trung vào ôn từ vựng BOYA theo lịch ngắt quãng, không ép Dương xử lý toàn bộ 687 từ trong một lượt.
- Mô hình ghi nhớ có 5 mức: Mới, Đang nhớ, Gần chắc, Nhớ tốt, Bền vững.
- Từ ở mức thấp xuất hiện thường xuyên; từ ở mức cao có khoảng nghỉ dài hơn.

## Luồng chính

1. Dashboard hiển thị phân bố từ của bài đang chọn, số từ đến hạn và thời điểm ôn tiếp theo.
2. Nút “Ôn tập ngay” tạo phiên tối đa 20 từ, ưu tiên từ cũ đã đến hạn trước từ mới.
3. Phiên ôn trộn bốn dạng: chọn nghĩa, chọn chữ Hán, nghe chọn nghĩa và điền chữ Hán.
4. Hệ thống phản hồi đúng/sai ngay. Câu sai được đưa lại vào cuối phiên; câu đúng tăng mức tự động, không bắt người học tự chấm trí nhớ.
5. Điền chữ có hai cách: ngân hàng chữ cho giai đoạn làm quen và tự gõ để luyện nhớ chủ động. Có thể mở gợi ý pinyin nhưng lịch ôn sẽ thận trọng hơn.
6. Kết quả cập nhật lịch riêng cho từng từ, hiển thị thời điểm gặp lại và được lưu cục bộ trên thiết bị.

## Giao diện và khả dụng

- Giữ palette pastel và typography của `MASTER.md`; không sao chép nhận diện thương hiệu của MochiMochi.
- Biểu đồ 5 mức là CSS nhẹ, có mô tả `aria-label`; không tải thư viện chart.
- Khi bắt đầu phiên, ẩn bộ chọn bài, tab và tài liệu để chỉ còn một câu hỏi cùng một hành động chính.
- Phím tắt trong phiên: 1–4 chọn đáp án, A nghe, Enter tiếp tục, Escape về dashboard.
- Tất cả nút chính tối thiểu 44px; đáp án dùng lưới 2 cột trên desktop và 1 cột trên mobile để không tràn ngang.
