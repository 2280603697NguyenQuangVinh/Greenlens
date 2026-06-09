import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { AvatarPreview } from "./AvatarPreview";

type Gender = "male" | "female";

interface AvatarData {
  gender: Gender | null;
  skinColor: string | null;
  hairStyle: number | null;
  hairColor: string | null;
  clothingStyle: number | null;
  clothingColor: string | null;
  accessories: { [key: string]: { style: number | null; color: string | null } };
}

const COLORS = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#9400D3", // Violet
  "#FFFFFF", // White
  "#000000", // Black
];

const SKIN_COLORS = [
  "#FFDBB4", // Light
  "#F1C27D", // Medium-Light
  "#E0AC69", // Medium
  "#C68642", // Medium-Dark
  "#8D5524", // Dark
];

const HAIR_STYLES = [1, 2, 3, 4, 5, 6];
const CLOTHING_STYLES = [1, 2, 3];
const ACCESSORIES = [
  { id: "hat", name: "Nón", styles: [1, 2, 3] },
  { id: "glasses", name: "Kính", styles: [1, 2, 3] },
  { id: "sunglasses", name: "Kính râm", styles: [1, 2, 3] },
  { id: "bag", name: "Túi xách", styles: [1, 2, 3] },
  { id: "watch", name: "Đồng hồ", styles: [1, 2, 3] },
  { id: "necklace", name: "Dây chuyền", styles: [1, 2, 3] },
  { id: "earrings", name: "Khuyên tai", styles: [1, 2, 3] },
  { id: "bracelet", name: "Vòng tay", styles: [1, 2, 3] },
  { id: "scarf", name: "Khăn quàng", styles: [1, 2, 3] },
];

interface AvatarCustomizerProps {
  onSave: (avatar: AvatarData) => void;
  onCancel: () => void;
  onSkip?: () => void;
  initialAvatar?: AvatarData;
  showSkip?: boolean;
}

export function AvatarCustomizer({ onSave, onCancel, onSkip, initialAvatar, showSkip }: AvatarCustomizerProps) {
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<AvatarData>(
    initialAvatar || {
      gender: null,
      skinColor: null,
      hairStyle: null,
      hairColor: null,
      clothingStyle: null,
      clothingColor: null,
      accessories: {},
    }
  );

  const steps = [
    { title: "Giới tính", key: "gender" as const },
    { title: "Màu da", key: "skinColor" as const },
    { title: "Kiểu tóc", key: "hairStyle" as const },
    { title: "Màu tóc", key: "hairColor" as const },
    { title: "Quần áo", key: "clothingStyle" as const },
    { title: "Màu quần áo", key: "clothingColor" as const },
    { title: "Phụ kiện", key: "accessories" as const },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSave = () => {
    onSave(avatar);
  };

  const updateAvatar = (key: keyof AvatarData, value: any) => {
    setAvatar({ ...avatar, [key]: value });
  };

  const updateAccessory = (accessoryId: string, field: "style" | "color", value: number | string | null) => {
    setAvatar({
      ...avatar,
      accessories: {
        ...avatar.accessories,
        [accessoryId]: {
          ...avatar.accessories[accessoryId],
          [field]: value,
        },
      },
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Gender
        return (
          <div className="grid grid-cols-2 gap-4">
            {["male", "female"].map((gender) => (
              <button
                key={gender}
                onClick={() => updateAvatar("gender", gender as Gender)}
                className={`p-8 rounded-3xl border-4 transition-all ${
                  avatar.gender === gender
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="text-6xl mb-2">{gender === "male" ? "👦" : "👧"}</div>
                <p className="font-bold text-gray-800">{gender === "male" ? "Nam" : "Nữ"}</p>
              </button>
            ))}
          </div>
        );

      case 1: // Skin Color
        return (
          <div className="grid grid-cols-5 gap-3">
            {SKIN_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateAvatar("skinColor", color)}
                className={`w-16 h-16 rounded-full border-4 transition-all ${
                  avatar.skinColor === color
                    ? "border-green-500 scale-110"
                    : "border-gray-300 hover:border-green-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        );

      case 2: // Hair Style
        return (
          <div className="grid grid-cols-3 gap-4">
            {HAIR_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => updateAvatar("hairStyle", style)}
                className={`p-4 rounded-2xl border-4 transition-all ${
                  avatar.hairStyle === style
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <svg width="60" height="60" viewBox="0 0 100 100">
                  <ellipse cx="50" cy="50" rx="20" ry="24" fill={avatar.skinColor || "#FFDBB4"} />
                  <path
                    d={
                      style === 1 ? "M30 28 C30 15 40 8 50 8 C60 8 70 15 70 28 C70 32 65 35 50 35 C35 35 30 32 30 28" :
                      style === 2 ? "M25 28 C25 12 38 5 50 5 C62 5 75 12 75 28 C75 45 72 65 68 80 C65 90 55 95 50 95 C45 95 35 90 32 80 C28 65 25 45 25 28" :
                      style === 3 ? "M30 28 C30 15 40 8 50 8 C60 8 70 15 70 28 C70 35 65 38 50 38 C35 38 30 35 30 28" :
                      style === 4 ? "M28 28 C28 15 38 8 50 8 C62 8 72 15 72 28 C72 35 68 38 50 38 C32 38 28 35 28 28" :
                      style === 5 ? "M32 28 C32 15 40 8 50 8 C60 8 68 15 68 28 C68 33 64 36 50 36 C36 36 32 33 32 28" :
                      ""
                    }
                    fill={avatar.hairColor || "#333"}
                  />
                </svg>
                <p className="font-bold text-gray-800 text-sm mt-2">
                  {style === 1 ? "Ngắn" :
                   style === 2 ? "Dài" :
                   style === 3 ? "Tóc xù" :
                   style === 4 ? "Uốn sóng" :
                   style === 5 ? "Tóc gọn" :
                   "Không tóc"}
                </p>
              </button>
            ))}
          </div>
        );

      case 3: // Hair Color
        return (
          <div className="grid grid-cols-5 gap-3">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateAvatar("hairColor", color)}
                className={`w-16 h-16 rounded-full border-4 transition-all ${
                  avatar.hairColor === color
                    ? "border-green-500 scale-110"
                    : "border-gray-300 hover:border-green-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        );

      case 4: // Clothing Style
        return (
          <div className="grid grid-cols-3 gap-4">
            {CLOTHING_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => updateAvatar("clothingStyle", style)}
                className={`p-4 rounded-2xl border-4 transition-all ${
                  avatar.clothingStyle === style
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <svg width="60" height="60" viewBox="0 0 100 100">
                  <ellipse cx="50" cy="35" rx="20" ry="24" fill={avatar.skinColor || "#FFDBB4"} />
                  <path
                    d={
                      style === 1 ? "M20 55 L30 40 L70 40 L80 55 L80 90 L20 90 Z" :
                      style === 2 ? "M20 55 L30 40 L50 55 L70 40 L80 55 L80 90 L20 90 Z" :
                      style === 3 ? "M15 55 L25 35 L50 45 L75 35 L85 55 L85 90 L15 90 Z" :
                      style === 4 ? "M20 55 L30 40 L35 45 L50 40 L65 45 L70 40 L80 55 L80 90 L20 90 Z" :
                      style === 5 ? "M25 55 L35 40 L50 45 L65 40 L75 55 L75 90 L25 90 Z" :
                      "M20 55 L30 40 L50 50 L70 40 L80 55 L80 90 L20 90 Z"
                    }
                    fill={avatar.clothingColor || "#4ade80"}
                  />
                  <text x="50" y="75" textAnchor="middle" fontSize="12">
                    {style === 1 ? "⭐" :
                     style === 2 ? "🐉" :
                     style === 3 ? "🦋" :
                     style === 4 ? "🌸" :
                     style === 5 ? "⚡" :
                     "🌟"}
                  </text>
                </svg>
                <p className="font-bold text-gray-800 text-sm mt-2">
                  {style === 1 ? "Áo thun" :
                   style === 2 ? "Áo V-neck" :
                   style === 3 ? "Hoodie" :
                   style === 4 ? "Áo Polo" :
                   style === 5 ? "Áo hai dây" :
                   "Áo cổ"}
                </p>
              </button>
            ))}
          </div>
        );

      case 5: // Clothing Color
        return (
          <div className="grid grid-cols-5 gap-3">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateAvatar("clothingColor", color)}
                className={`w-16 h-16 rounded-full border-4 transition-all ${
                  avatar.clothingColor === color
                    ? "border-green-500 scale-110"
                    : "border-gray-300 hover:border-green-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        );

      case 6: // Accessories
        return (
          <div className="space-y-4">
            {ACCESSORIES.map((accessory) => (
              <div key={accessory.id} className="bg-white rounded-2xl p-4 border-2 border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">{accessory.name}</h4>
                <div className="flex gap-3">
                  {accessory.styles.map((style) => (
                    <button
                      key={style}
                      onClick={() => updateAccessory(accessory.id, "style", style)}
                      className={`w-12 h-12 rounded-xl border-2 transition-all ${
                        avatar.accessories[accessory.id]?.style === style
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <span className="text-2xl">✨</span>
                    </button>
                  ))}
                  <button
                    onClick={() => updateAccessory(accessory.id, "style", null)}
                    className={`w-12 h-12 rounded-xl border-2 transition-all ${
                      avatar.accessories[accessory.id]?.style === null
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                  >
                    <X size={20} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 text-white">
          <h2 className="text-2xl font-black">Thiết Kế Avatar</h2>
          <p className="text-green-100 font-semibold mt-1">Bước {step + 1}/{steps.length}: {steps[step].title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          {/* Avatar Preview */}
          <div className="w-1/2 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Xem trước</h3>
            <AvatarPreview avatar={avatar} size={250} />
          </div>

          {/* Selection Options */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <div className="flex gap-3">
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="px-6 py-3 rounded-2xl border-2 border-gray-400 text-gray-600 font-bold hover:bg-gray-100 transition-colors"
              >
                Bỏ qua
              </button>
            )}
            {step > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 rounded-2xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={20} /> Quay lại
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 0 && !avatar.gender) ||
                  (step === 1 && !avatar.skinColor) ||
                  (step === 2 && !avatar.hairStyle) ||
                  (step === 3 && !avatar.hairColor) ||
                  (step === 4 && !avatar.clothingStyle) ||
                  (step === 5 && !avatar.clothingColor)
                }
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-green-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Tiếp theo <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-green-600 text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Check size={20} /> Lưu
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export type { AvatarData, Gender };
