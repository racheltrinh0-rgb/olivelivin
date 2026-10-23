import type {
  VoucherDisplay,
  ShippingMethod,
} from "../voucher.types";

import {
  calculateVoucherDiscount,
  getVoucherEligibleSubtotal,
} from "./calculator";

/* ============================================================
   PUBLIC DISCOUNT
   - Chỉ chọn voucher giảm giá công khai
   - Không tự động chọn voucher cá nhân
============================================================ */

export function selectBestDiscountVoucher(
  vouchers: VoucherDisplay[],
  subtotal: number,
  cartItems: any[]
): VoucherDisplay | null {
  let best: VoucherDisplay | null = null;
  let bestSaving = 0;

  for (const voucher of vouchers) {
    /*
     * Bỏ voucher freeship
     */
    if (voucher.type === "shipping") {
      continue;
    }

    /*
     * Voucher cá nhân
     * Không được auto apply
     */
    if (voucher.isWelcome === true) {
      continue;
    }

    /*
     * Tính subtotal đủ điều kiện.
     *
     * Voucher theo sản phẩm:
     * chỉ tính sản phẩm có id trùng applyId.
     *
     * Voucher toàn đơn:
     * dùng toàn bộ subtotal.
     */
    const eligibleSubtotal =
      getVoucherEligibleSubtotal(
        voucher,
        subtotal,
        cartItems
      );

    /*
     * Không có giá trị đơn hàng
     * đủ điều kiện thì bỏ qua.
     */
    if (eligibleSubtotal <= 0) {
      continue;
    }

    /*
     * Tính mức giảm trên subtotal đủ điều kiện.
     */
    const saving =
      calculateVoucherDiscount(
        voucher,
        eligibleSubtotal
      );

    /*
     * Chỉ chọn voucher có mức giảm
     * cao hơn voucher hiện tại.
     */
    if (saving > bestSaving) {
      bestSaving = saving;
      best = voucher;
    }
  }

  return best;
}

/* ============================================================
   SHIPPING HELPERS
============================================================ */

function isShippingVoucherEligible(
  voucher: VoucherDisplay,
  subtotal: number
): boolean {
  if (voucher.type !== "shipping") {
    return false;
  }

  if (subtotal < voucher.min_order) {
    return false;
  }

  return true;
}

/*
 * Voucher STANDARD:
 *
 * - Dùng được cho STANDARD
 * - Cũng được dùng làm fallback cho EXPRESS
 *
 * Voucher EXPRESS:
 *
 * - Chỉ dùng cho EXPRESS
 */
function isShippingMethodCompatible(
  voucher: VoucherDisplay,
  shippingMethod: ShippingMethod
): boolean {
  const method =
    voucher.shipping_method ?? null;

  /*
   * Voucher cũ không có shipping_method:
   * coi như STANDARD / generic.
   */
  if (!method) {
    return true;
  }

  /*
   * Đang giao thường:
   * chỉ nhận STANDARD.
   */
  if (shippingMethod === "standard") {
    return method === "standard";
  }

  /*
   * Đang hỏa tốc:
   *
   * EXPRESS được ưu tiên.
   * STANDARD được phép fallback.
   */
  if (shippingMethod === "express") {
    return (
      method === "express" ||
      method === "standard"
    );
  }

  return false;
}

/* ============================================================
   SHIPPING
============================================================ */

/*
 * Business rule:
 *
 * STANDARD
 *   → STANDARD voucher
 *
 * EXPRESS + subtotal >= min EXPRESS
 *   → EXPRESS voucher
 *
 * EXPRESS + EXPRESS không đủ điều kiện
 *   → STANDARD voucher fallback
 *
 * Không bao giờ trả về 2 voucher.
 */

export function selectBestShippingVoucher(
  vouchers: VoucherDisplay[],
  subtotal: number,
  shippingMethod: ShippingMethod
): VoucherDisplay | null {
  const shippingVouchers =
    vouchers.filter((voucher) =>
      isShippingVoucherEligible(
        voucher,
        subtotal
      )
    );

  /*
   * STANDARD:
   * Không được dùng EXPRESS.
   */
  if (shippingMethod === "standard") {
    const standardVouchers =
      shippingVouchers.filter(
        (voucher) => {
          const method =
            voucher.shipping_method;

          return (
            method === "standard" ||
            method == null
          );
        }
      );

    /*
     * Chọn voucher STANDARD
     * có giá trị cao nhất.
     *
     * Nếu value bằng nhau,
     * ưu tiên min_order cao hơn.
     */
    return (
      standardVouchers.sort(
        (a, b) =>
          b.value - a.value ||
          b.min_order - a.min_order
      )[0] ?? null
    );
  }

  /*
   * ==========================================================
   * EXPRESS
   * ==========================================================
   */

  const expressVouchers =
    shippingVouchers.filter(
      (voucher) =>
        voucher.shipping_method ===
        "express"
    );

  /*
   * EXPRESS luôn được ưu tiên.
   */
  if (expressVouchers.length > 0) {
    return (
      expressVouchers.sort(
        (a, b) =>
          b.value - a.value ||
          b.min_order - a.min_order
      )[0] ?? null
    );
  }

  /*
   * Không có EXPRESS đủ điều kiện.
   *
   * Fallback sang STANDARD.
   */
  const standardVouchers =
    shippingVouchers.filter(
      (voucher) => {
        const method =
          voucher.shipping_method;

        return (
          method === "standard" ||
          method == null
        );
      }
    );

  return (
    standardVouchers.sort(
      (a, b) =>
        b.value - a.value ||
        b.min_order - a.min_order
    )[0] ?? null
  );
}