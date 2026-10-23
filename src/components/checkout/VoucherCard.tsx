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
          "overflow-hidden rounded-[11px] border border-[#E5E8E1] bg-white shadow-[0_2px_7px_rgba(28,36,20,0.055)] transition-all duration-200 hover:shadow-[0_3px_9px_rgba(28,36,20,0.08)]",
          selected && "border-[#82917D] bg-[#FEFFFD] shadow-[0_2px_8px_rgba(95,111,93,0.10)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="px-2.5 py-2">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                selected
                  ? "bg-[#5F6F5D] text-white"
                  : "bg-[#F1F3EF] text-[#4F604E]",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <h3 className="min-w-0 truncate text-[11px] font-semibold leading-[15px] text-[#222222]">
                  {voucher.title}
                </h3>

                {badgeLabel && (
                  <Badge
                    className={cn(
                      "h-4 shrink-0 rounded px-1 py-0 text-[8px] font-medium shadow-none",
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
                      <Percent className="mr-0.5 h-2 w-2" />
                    )}
                    {badgeLabel}
                  </Badge>
                )}
              </div>

              <p className="truncate text-[9px] leading-[13px] text-[#858585]">
                {voucher.code}
              </p>

              {!!voucher.description && (
                <p className="mt-1 line-clamp-1 text-[9px] leading-[13px] text-[#626262]">
                  {voucher.description}
                </p>
              )}

              <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 text-[9px] leading-[13px] text-[#777777]">
                  <TicketPercent className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">
                    Đơn từ {formatPrice(voucher.min_order)}
                  </span>
                </span>

                {disabled ? (
                  <span className="shrink-0 text-[9px] text-[#888888]">
                    Thiếu {formatPrice(remain)}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-semibold text-[#4F604E]">
                    -{formatPrice(saving)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={cn(
            "mt-1.5 flex min-h-7 items-center justify-between gap-2 border-t pt-1",
            selected
              ? "border-[#DCE6D7]"
              : "border-[#EEEEEA]",
          )}>
            {voucher.type === "shipping" && (
              <span className="inline-flex min-w-0 items-center gap-1 text-[8px] leading-3 text-[#777777]">
                <Truck className="h-2.5 w-2.5 shrink-0" strokeWidth={1.7} />
                <span className="truncate">Miễn phí / hỗ trợ phí vận chuyển</span>
              </span>
            )}
            {selected ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(null);
                }}
                className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-[#D5E2CF] bg-[#EEF5E9] px-2.5 text-[9px] font-semibold text-[#42613C] shadow-[0_1px_3px_rgba(66,97,60,0.07)] transition-all hover:border-[#BFCFB7] hover:bg-[#E4EFDE] active:scale-[0.98]"
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5F7C55] text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                </span>
                Đang áp dụng
                <span className="mx-0.5 h-3 w-px bg-[#C9D8C1]" />
                <span className="underline decoration-[#9DB394] underline-offset-1">
                  Bỏ chọn
                </span>
              </button>
            ) : disabled ? (
              <span className="inline-flex min-h-6 items-center gap-1 px-1.5 text-[9px] text-[#888888]">
                <Lock className="h-2.5 w-2.5" />
                Chưa đủ điều kiện
              </span>
            ) : (
              <Button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleClick();
                }}
                className="!h-7 min-w-[80px] rounded-md !bg-[#111111] px-3 text-[9px] font-medium !text-white shadow-none hover:!bg-[#333333]"
              >
                Áp dụng
              </Button>
            )}
          </div>

        </div>
      </Card>
    </motion.div>
  );
}
