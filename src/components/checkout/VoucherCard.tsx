import { motion } from "framer-motion";
import {
  Check,
  CircleDollarSign,
  Gift,
  Lock,
  Package,
  Percent,
  TicketPercent,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { VoucherDisplay } from "./voucher.types";

interface VoucherCardProps {
  voucher: VoucherDisplay;
  selected: boolean;
  disabled: boolean;
  saving: number;
  remain: number;
  onSelect: (voucher: VoucherDisplay | null) => void;
  bestVoucher?: VoucherDisplay | null;
}

const ICONS = {
  gift: Gift,
  truck: Truck,
  percent: Percent,
  discount: CircleDollarSign,
  voucher: TicketPercent,
  default: Package,
} as const;

function getVoucherIcon(icon?: string) {
  if (!icon) return ICONS.default;

  switch (icon.toLowerCase()) {
    case "gift":
      return ICONS.gift;
    case "truck":
    case "shipping":
      return ICONS.truck;
    case "percent":
      return ICONS.percent;
    case "discount":
      return ICONS.discount;
    case "voucher":
      return ICONS.voucher;
    default:
      return ICONS.default;
  }
}

function formatPrice(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

export default function VoucherCard({
  voucher,
  selected,
  disabled,
  saving,
  remain,
  onSelect,
  bestVoucher,
}: VoucherCardProps) {
  const Icon = getVoucherIcon(voucher.icon);
  const badgeColor = voucher.badgeColor ?? "#5F6F5D";

  // Chỉ hiển thị một badge để giao diện bớt rối.
  const badgeLabel = selected
    ? null
    : voucher.id === bestVoucher?.id
      ? "Tốt nhất"
      : voucher.badge || null;

  const handleClick = () => {
    if (disabled) return;
    onSelect(voucher);
  };

  return (
    <motion.div
      layout
      whileHover={!disabled ? { scale: 1.003 } : undefined}
      whileTap={!disabled ? { scale: 0.998 } : undefined}
      transition={{ duration: 0.12 }}
      className="h-full"
    >
      <Card
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-selected={selected}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (disabled) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          "overflow-hidden rounded-lg border border-[#E2E3DE] bg-white shadow-none transition-colors",
          selected && "border-[#82917D]",
          disabled && "cursor-not-allowed opacity-65",
        )}
      >
        <div className="p-2.5">
          {/* Thông tin voucher */}
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                selected
                  ? "bg-[#5F6F5D] text-white"
                  : "bg-[#F1F3EF] text-[#4F604E]",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.7} />
            </div>

            <div className="min-w-0 flex-1">
              {/* Tên voucher và tối đa một badge */}
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <h3 className="min-w-0 text-[12px] font-semibold leading-4 text-[#222222]">
                  {voucher.title}
                </h3>

                {badgeLabel && (
                  <Badge
                    className={cn(
                      "h-[17px] shrink-0 rounded px-1.5 py-0 text-[9px] font-medium shadow-none",
                      voucher.id === bestVoucher?.id
                        ? "border-0 bg-[#F0F2EE] text-[#4F604E]"
                        : "border-0 !text-white",
                    )}
                    style={
                      voucher.id === bestVoucher?.id
                        ? undefined
                        : { backgroundColor: badgeColor }
                    }
                  >
                    {voucher.id === bestVoucher?.id && (
                      <Percent className="mr-0.5 h-2.5 w-2.5" />
                    )}
                    {badgeLabel}
                  </Badge>
                )}
              </div>

              {/* Mã voucher */}
              <p className="mt-0.5 truncate font-sans text-[10px] leading-3.5 text-[#777777]">
                {voucher.code}
              </p>

              {/* Mô tả tối đa một dòng */}
              {!!voucher.description && (
                <p className="mt-1 line-clamp-1 text-[10px] leading-3.5 text-[#555555]">
                  {voucher.description}
                </p>
              )}

              {/* Điều kiện và số tiền ưu đãi */}
              <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 text-[10px] leading-4 text-[#666666]">
                  <TicketPercent className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Đơn từ {formatPrice(voucher.min_order)}
                  </span>
                </span>

                {disabled ? (
                  <span className="shrink-0 text-[10px] text-[#777777]">
                    Thiếu {formatPrice(remain)}
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-semibold text-[#4F604E]">
                    -{formatPrice(saving)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trạng thái và thao tác: chỉ một nút */}
          <div className="mt-2 flex items-center justify-end border-t border-[#EEEEEA] pt-2">
            {selected ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(null);
                }}
                className="inline-flex min-h-[30px] items-center gap-1.5 rounded-md px-2 text-[10px] font-medium text-[#5F6F5D] transition-colors hover:bg-[#F3F5F1]"
              >
                <Check className="h-3 w-3" strokeWidth={2.2} />
                Đang áp dụng · Bỏ chọn
              </button>
            ) : disabled ? (
              <span className="inline-flex min-h-[30px] items-center gap-1.5 px-2 text-[10px] text-[#888888]">
                <Lock className="h-3 w-3" />
                Chưa đủ điều kiện
              </span>
            ) : (
              <Button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleClick();
                }}
                className="!h-7 min-w-[88px] rounded-md !bg-[#111111] px-3 text-[10px] font-medium !text-white shadow-none hover:!bg-[#333333]"
              >
                Áp dụng
              </Button>
            )}
          </div>

          {/* Thông tin freeship chỉ hiện khi cần */}
          {voucher.type === "shipping" && (
            <div className="mt-1 flex items-center gap-1.5 text-[9px] leading-3.5 text-[#777777]">
              <Truck className="h-3 w-3 shrink-0" strokeWidth={1.7} />
              Miễn phí / hỗ trợ phí vận chuyển
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}