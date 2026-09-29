/* ============================================================
   OLIVE LIVING
   Voucher Types
============================================================ */

export type VoucherType =
  | "fixed"
  | "percent"
  | "shipping";

export type ShippingMethod =
  | "standard"
  | "express";

export interface MarketingVoucher {
  id: string;

  code: string;

  title: string;

  description: string | null;

  type: VoucherType;

  value: number;

  min_order: number;

  max_discount: number;

  quantity: number;

  used: number;

  start_at: string;

  end_at: string;

  active: boolean;

  badge: string | null;

  badge_color: string | null;

  icon: string | null;

  created_at: string;

  apply_type: string | null;

  apply_id: string | null;

  shipping_method:
    | ShippingMethod
    | null;
}

export interface WelcomeVoucher {
  id: string;

  full_name: string;

  phone: string;

  interest: string | null;

  voucher_code: string;

  discount: number;

  min_order: number;

  is_used: boolean;

  created_at: string;
}

export interface VoucherDisplay {
  id: string;

  code: string;

  title: string;

  description?: string;

  type: VoucherType;

  value: number;

  min_order: number;

  max_discount: number | null;

  isWelcome: boolean;

  isReached: boolean;

  isSelected: boolean;

  badge?: string;

  badgeColor?: string;

  icon?: string;

  applyType?: string | null;

  applyId?: string | null;

  /*
   * SHIPPING METHOD
   *
   * null     = voucher cũ / generic
   * standard = giao thường
   * express  = hỏa tốc
   */
  shipping_method:
    | ShippingMethod
    | null;

  /*
   * Giữ lại các field runtime
   * đang được Checkout sử dụng.
   */
  quantity?: number | null;

  used?: number;

  usage_per_customer?: number | null;

  active?: boolean;

  manual_apply?: boolean;

  auto_apply?: boolean;

  is_personal?: boolean;

  personal?: boolean;

  customer_voucher?: boolean;

  voucher_group?: string | null;

  category?: string | null;
}

export interface VoucherSummary {
  discountVoucher: VoucherDisplay | null;

  shippingVoucher: VoucherDisplay | null;

  discountAmount: number;

  shippingDiscount: number;

  shipping: number;

  totalDiscount: number;

  customerVoucher?: VoucherDisplay | null;

  customerDiscount?: number;
}

export interface CheckoutVoucherProps {
  subtotal: number;

  shippingFee: number;

  shippingMethod: ShippingMethod;

  phone: string;

  cartItems: any[];

  onChange: (
    summary: VoucherSummary
  ) => void;
}