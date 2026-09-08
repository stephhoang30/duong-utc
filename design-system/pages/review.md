# Ôn bài — page override

## Mục tiêu

- Tập trung vào ôn từ vựng BOYA theo lịch ngắt quãng, không ép Dương xử lý toàn bộ 687 từ trong một lượt.
- Mô hình ghi nhớ có 5 mức: Mới, Đang nhớ, Gần chắc, Nhớ tốt, Bền vững.
- Từ ở mức thấp xuất hiện thường xuyên; từ ở mức cao có khoảng nghỉ dài hơn.

## Luồng chính

1. Dashboard hiển thị phân bố từ của bài đang chọn, số từ đến hạn và thời điểm ôn tiếp theo.
2. Nút “Ôn tập ngay” tạo phiên tối đa 20 từ, ưu tiên từ cũ đã đến hạn trước từ mới.
3. Người học tự trả lời, lật thẻ, nghe phát âm và đánh giá bằng Quên / Khó / Nhớ / Rất nhớ.
4. Từ mức 3 trở lên thỉnh thoảng đổi chiều nghĩa → chữ Hán để luyện nhớ chủ động.
5. Kết quả cập nhật lịch riêng cho từng từ và được lưu cục bộ trên thiết bị.

## Giao diện và khả dụng

- Giữ palette pastel và typography của `MASTER.md`; không sao chép nhận diện thương hiệu của MochiMochi.
- Biểu đồ 5 mức là CSS nhẹ, có mô tả `aria-label`; không tải thư viện chart.
- Phím tắt trong phiên: Space lật thẻ, A nghe, 1–4 đánh giá, Escape về dashboard.
- Tất cả nút chính tối thiểu 44px; mobile dùng lưới đánh giá 2 cột và không tràn ngang.
