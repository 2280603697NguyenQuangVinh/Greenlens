#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/.env"
  set +a
fi

REGION="${AWS_REGION:-ap-southeast-1}"
BUCKET="${MINI_GAME_ASSET_BUCKET_NAME:-${AI_CAMERA_BUCKET_NAME:-}}"
TABLE_NAME="${MINI_GAME_ITEMS_TABLE_NAME:-GreenLens-MiniGameItems}"
PREFIX="${MINI_GAME_ASSET_PREFIX:-mini-games/trash-sort/icons}"
OPENMOJI_BASE_URL="${OPENMOJI_BASE_URL:-https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg}"

if [ -z "$BUCKET" ]; then
  echo "MINI_GAME_ASSET_BUCKET_NAME or AI_CAMERA_BUCKET_NAME is required." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to seed mini game items." >&2
  exit 1
fi

aws dynamodb describe-table \
  --table-name "$TABLE_NAME" \
  --region "$REGION" >/dev/null 2>&1 || \
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions AttributeName=itemId,AttributeType=S \
  --key-schema AttributeName=itemId,KeyType=HASH \
  --region "$REGION" >/dev/null

aws dynamodb wait table-exists \
  --table-name "$TABLE_NAME" \
  --region "$REGION"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

items=(
  "banana_peel|Vỏ chuối|Organic|Brown|easy|1F34C|banana.svg"
  "fallen_leaf|Lá rụng|Organic|Brown|easy|1F342|fallen-leaf.svg"
  "red_apple|Táo thừa|Organic|Brown|easy|1F34E|red-apple.svg"
  "green_apple|Táo xanh thừa|Organic|Brown|easy|1F34F|green-apple.svg"
  "carrot|Cà rốt thừa|Organic|Brown|easy|1F955|carrot.svg"
  "corn|Lõi bắp|Organic|Brown|easy|1F33D|corn.svg"
  "bread|Bánh mì thừa|Organic|Brown|easy|1F35E|bread.svg"
  "pizza_slice|Miếng pizza thừa|Organic|Brown|medium|1F355|pizza-slice.svg"
  "egg_shell|Vỏ trứng|Organic|Brown|medium|1F95A|egg.svg"
  "leafy_green|Rau thừa|Organic|Brown|medium|1F96C|leafy-green.svg"
  "potato|Khoai tây thừa|Organic|Brown|medium|1F954|potato.svg"
  "mushroom|Nấm thừa|Organic|Brown|medium|1F344|mushroom.svg"
  "newspaper|Báo giấy|Recyclable|Green|easy|1F4F0|newspaper.svg"
  "paper_sheet|Tờ giấy|Recyclable|Green|easy|1F4C4|paper-sheet.svg"
  "envelope|Phong bì giấy|Recyclable|Green|easy|2709|envelope.svg"
  "package_box|Thùng carton|Recyclable|Green|easy|1F4E6|package-box.svg"
  "file_folder|Bìa hồ sơ giấy|Recyclable|Green|easy|1F4C1|file-folder.svg"
  "books|Sách cũ|Recyclable|Green|medium|1F4DA|books.svg"
  "beverage_box|Hộp sữa giấy|Recyclable|Green|medium|1F9C3|beverage-box.svg"
  "cup_with_straw|Ly nhựa|Recyclable|Green|medium|1F964|cup-with-straw.svg"
  "canned_food|Lon đồ hộp|Recyclable|Green|medium|1F96B|canned-food.svg"
  "takeout_box|Hộp giấy đựng đồ ăn sạch|Recyclable|Green|medium|1F961|takeout-box.svg"
  "bottle_with_cork|Chai thủy tinh|Recyclable|Green|medium|1F37E|bottle-with-cork.svg"
  "shopping_bags|Túi nhựa sạch|Recyclable|Green|hard|1F6CD|shopping-bags.svg"
  "battery|Pin|Hazardous|Red|hard|1F50B|battery.svg"
  "pill|Viên thuốc|Hazardous|Red|hard|1F48A|pill.svg"
  "mobile_phone|Điện thoại cũ|Hazardous|Red|hard|1F4F1|mobile-phone.svg"
  "laptop|Laptop cũ|Hazardous|Red|hard|1F4BB|laptop.svg"
  "light_bulb|Bóng đèn hỏng|Hazardous|Red|hard|1F4A1|light-bulb.svg"
  "test_tube|Ống hóa chất|Hazardous|Red|hard|1F9EA|test-tube.svg"
  "petri_dish|Đĩa thí nghiệm|Hazardous|Red|hard|1F9EB|petri-dish.svg"
  "syringe|Kim tiêm|Hazardous|Red|hard|1F489|syringe.svg"
  "thermometer|Nhiệt kế hỏng|Hazardous|Red|hard|1F321|thermometer.svg"
  "fire_extinguisher|Bình chữa cháy cũ|Hazardous|Red|hard|1F9EF|fire-extinguisher.svg"
  "oil_drum|Thùng dầu cũ|Hazardous|Red|hard|1F6E2|oil-drum.svg"
  "soap_chemical|Chai hóa chất tẩy rửa|Hazardous|Red|hard|1F9FC|soap-chemical.svg"
)

for item in "${items[@]}"; do
  IFS='|' read -r item_id name category bin_color difficulty emoji_hex file_name <<< "$item"
  icon_key="$PREFIX/$file_name"
  local_file="$TMP_DIR/$file_name"

  curl -fsSL "$OPENMOJI_BASE_URL/$emoji_hex.svg" -o "$local_file"

  aws s3 cp "$local_file" "s3://$BUCKET/$icon_key" \
    --region "$REGION" \
    --content-type "image/svg+xml" \
    --cache-control "public, max-age=31536000, immutable" >/dev/null

  dynamo_item="$(jq -n \
    --arg itemId "$item_id" \
    --arg gameType "trash_sort" \
    --arg name "$name" \
    --arg category "$category" \
    --arg binColor "$bin_color" \
    --arg iconKey "$icon_key" \
    --arg difficulty "$difficulty" \
    '{
      itemId: {S: $itemId},
      gameType: {S: $gameType},
      name: {S: $name},
      category: {S: $category},
      binColor: {S: $binColor},
      iconKey: {S: $iconKey},
      difficulty: {S: $difficulty},
      isActive: {BOOL: true}
    }')"

  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "$dynamo_item" \
    --region "$REGION" >/dev/null

  echo "Seeded $item_id -> s3://$BUCKET/$icon_key"
done

echo "Seeded ${#items[@]} trash sort items into $TABLE_NAME."
