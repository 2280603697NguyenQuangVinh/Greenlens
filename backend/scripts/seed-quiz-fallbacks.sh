#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$BACKEND_DIR/.env"
  set +a
fi

TABLE_NAME="${QUIZ_FALLBACK_TABLE_NAME:-GreenLens-QuizFallbacks}"
REGION="${AWS_REGION:-ap-southeast-1}"

put_questions() {
  local key="$1"
  local questions_json="$2"

  aws dynamodb put-item \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --item "{\"fallbackKey\":{\"S\":\"$key\"},\"questionsJson\":{\"S\":$(printf '%s' "$questions_json" | jq -Rs .)}}"
}

RECYCLABLE='[{"question":"Rác sạch có thể tái chế nên bỏ vào thùng nào?","options":["Thùng xanh","Thùng đỏ","Thùng nâu","Thùng rác thường"],"correct":"Thùng xanh","explanation":"Thùng xanh dành cho nhiều loại rác có thể tái chế."},{"question":"Trước khi tái chế, chai hoặc hộp nên làm gì?","options":["Rửa sạch","Đổ thêm nước bẩn","Ném xuống đất","Trộn với đồ ăn"],"correct":"Rửa sạch","explanation":"Rửa sạch giúp rác dễ được tái chế hơn."},{"question":"Tái chế giúp ích gì?","options":["Tiết kiệm tài nguyên","Làm rác nhiều hơn","Làm cây yếu đi","Làm bẩn giấy sạch"],"correct":"Tiết kiệm tài nguyên","explanation":"Tái chế giúp dùng lại vật liệu và giảm rác."}]'
PAPER='[{"question":"Giấy sạch nên bỏ vào thùng nào?","options":["Thùng xanh","Thùng đỏ","Thùng nâu","Thùng rác thường"],"correct":"Thùng xanh","explanation":"Giấy sạch có thể tái chế nên bỏ vào thùng xanh."},{"question":"Giấy đã dùng một mặt có thể làm gì?","options":["Làm giấy nháp","Bỏ xuống nước","Xé vứt khắp nhà","Trộn với pin cũ"],"correct":"Làm giấy nháp","explanation":"Dùng mặt sau làm giấy nháp giúp tiết kiệm giấy."},{"question":"Con có thể tái sử dụng giấy sạch để làm gì?","options":["Gấp máy bay giấy","Làm pin","Làm thức ăn","Làm chất tẩy rửa"],"correct":"Gấp máy bay giấy","explanation":"Giấy sạch có thể dùng cho thủ công và học tập."}]'
ORGANIC='[{"question":"Vỏ chuối thuộc loại rác nào?","options":["Hữu cơ","Nguy hại","Kim loại","Thủy tinh"],"correct":"Hữu cơ","explanation":"Vỏ chuối phân hủy được và có thể ủ làm phân."},{"question":"Rác hữu cơ có thể biến thành gì?","options":["Phân ủ","Pin mới","Chai nhựa","Lon nhôm"],"correct":"Phân ủ","explanation":"Ủ rác hữu cơ giúp tạo dinh dưỡng cho đất."},{"question":"Thùng màu nâu thường dành cho gì?","options":["Rác hữu cơ","Pin cũ","Giấy sạch","Chai thủy tinh"],"correct":"Rác hữu cơ","explanation":"Màu nâu thường dùng cho rác dễ phân hủy."}]'
HAZARDOUS='[{"question":"Pin cũ nên xử lý thế nào?","options":["Nhờ người lớn mang đến điểm thu gom","Bỏ vào thùng thường","Dùng làm đồ chơi","Cho vào chậu cây"],"correct":"Nhờ người lớn mang đến điểm thu gom","explanation":"Pin có chất nguy hại nên cần xử lý đúng chỗ."},{"question":"Vì sao không nên chơi với pin cũ?","options":["Có thể rò chất độc","Vì pin là bánh","Vì pin biết hát","Vì pin là nước uống"],"correct":"Có thể rò chất độc","explanation":"Pin cũ có thể gây hại cho sức khỏe và môi trường."},{"question":"Rác nguy hại thường dùng màu cảnh báo nào?","options":["Đỏ","Xanh","Nâu","Trắng"],"correct":"Đỏ","explanation":"Màu đỏ nhắc chúng ta cẩn thận với rác nguy hại."}]'
TRASH='[{"question":"Tã đã dùng nên bỏ ở đâu?","options":["Thùng rác thường","Thùng giấy sạch","Chậu cây","Thùng tái chế"],"correct":"Thùng rác thường","explanation":"Tã đã dùng không tái chế được và cần bỏ đúng thùng."},{"question":"Rác bẩn không tái chế được nên làm gì?","options":["Bỏ vào thùng xám","Trộn với giấy sạch","Để trên bàn","Bỏ vào thùng hữu cơ"],"correct":"Bỏ vào thùng xám","explanation":"Phân loại đúng giúp nhà cửa sạch hơn."},{"question":"Khi không chắc vật có an toàn không, con nên làm gì?","options":["Nhờ người lớn kiểm tra","Tự tháo ra","Đưa cho em bé","Ném ra đường"],"correct":"Nhờ người lớn kiểm tra","explanation":"Người lớn giúp xử lý vật không rõ an toàn."}]'

put_questions "paper" "$PAPER"
put_questions "cardboard" "$PAPER"
put_questions "carton" "$PAPER"
put_questions "bottle" "$RECYCLABLE"
put_questions "plastic" "$RECYCLABLE"
put_questions "plastic-bag" "$RECYCLABLE"
put_questions "can" "$RECYCLABLE"
put_questions "aluminium" "$RECYCLABLE"
put_questions "metal" "$RECYCLABLE"
put_questions "glass" "$RECYCLABLE"
put_questions "recyclable" "$RECYCLABLE"
put_questions "banana" "$ORGANIC"
put_questions "food" "$ORGANIC"
put_questions "organic" "$ORGANIC"
put_questions "vegetable" "$ORGANIC"
put_questions "battery" "$HAZARDOUS"
put_questions "pin" "$HAZARDOUS"
put_questions "hazardous" "$HAZARDOUS"
put_questions "trash" "$TRASH"
put_questions "diaper" "$TRASH"

echo "Seeded quiz fallback sets into $TABLE_NAME."
