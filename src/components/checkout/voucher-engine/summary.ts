
import type {
  VoucherSummary,
  VoucherDisplay,
} from "../voucher.types";

import type {
  VoucherEngineInput,
} from "./types";

import {
  calculateVoucherDiscount,
  calculateShippingDiscount,
  calculateVoucherSaving,
  getVoucherEligibleSubtotal,
} from "./calculator";

import {
  selectBestDiscountVoucher,
  selectBestShippingVoucher,
} from "./selector";

/* ============================================================
   DISCOUNT VOUCHER ELIGIBILITY
============================================================ */

function isDiscountVoucherEligible(
  voucher: VoucherDisplay | null,
  cartItems: any[]
): boolean {
  if (!voucher) {
    return false;
  }

  const applyType = String(
    voucher.applyType ??
      (voucher as any).apply_type ??
      "all"
  ).toLowerCase();

  const applyId =
    voucher.applyId ??
    (voucher as any).apply_id ??
    null;

  /*
   * Voucher áp dụng toàn đơn.
   */
  if (
    applyType !== "product" &&
    applyType !== "specific_product"
  ) {
    return true;
  }

  /*
   * Voucher theo sản phẩm nhưng thiếu applyId.
   */
  if (
    applyId === null ||
    applyId === undefined ||
    String(applyId).trim() === ""
  ) {
    return false;
  }

  /*
   * Kiểm tra sản phẩm có trong giỏ hàng.
   */
  return (cartItems ?? []).some(
    (item: any) =>
      String(item.id) === String(applyId)
  );
}

/* ============================================================
   BUILD VOUCHER SUMMARY
============================================================ */

export function buildVoucherSummary(
  input: VoucherEngineInput
): VoucherSummary {
  /*
   * ==========================================================
   * DISCOUNT VOUCHER
   * ==========================================================
   *
   * Không sử dụng selectedDiscount mù quáng.
   *
   * Voucher đã chọn phải còn phù hợp với giỏ hàng.
   */

  const selectedDiscountIsEligible =
    isDiscountVoucherEligible(
      input.selectedDiscount,
      input.cartItems
    );

  const discountVoucher =
    selectedDiscountIsEligible
      ? input.selectedDiscount
      : selectBestDiscountVoucher(
          input.vouchers,
          input.subtotal,
          input.cartItems
        );

  /*
   * ==========================================================
   * SHIPPING VOUCHER
   * ==========================================================
   *
   * Khi shippingMethod / subtotal thay đổi,
   * phải kiểm tra lại voucher đã chọn.
   */

  let shippingVoucher =
    input.selectedShipping;

  /*
   * Nếu có voucher đang chọn,
   * kiểm tra lại theo shipping method hiện tại.
   */

  if (shippingVoucher) {
    const isShippingVoucher =
      shippingVoucher.type === "shipping";

    const meetsMinOrder =
      input.subtotal >=
      shippingVoucher.min_order;

    const voucherMethod =
      shippingVoucher.shipping_method ?? null;

    let methodCompatible = true;

    /*
     * STANDARD
     */
    if (
      input.shippingMethod === "standard"
    ) {
      /*
       * Express voucher không được dùng
       * cho giao thường.
       */
      if (
        voucherMethod === "express"
      ) {
        methodCompatible = false;
      }
    }

    /*
     * EXPRESS
     */
    if (
      input.shippingMethod === "express"
    ) {
      /*
       * Express:
       *
       * - Express voucher → OK
       * - Standard / generic → fallback OK
       */
      methodCompatible =
        voucherMethod === null ||
        voucherMethod === "standard" ||
        voucherMethod === "express";
    }

    /*
     * Nếu voucher hiện tại không còn hợp lệ
     * → chọn lại voucher tốt nhất.
     */
    if (
      !isShippingVoucher ||
      !meetsMinOrder ||
      !methodCompatible
    ) {
      shippingVoucher =
        selectBestShippingVoucher(
          input.vouchers,
          input.subtotal,
          input.shippingMethod
        );
    }
  }

  /*
   * Không có voucher được chọn
   * → tự động chọn voucher tốt nhất.
   */
  if (!shippingVoucher) {
    shippingVoucher =
      selectBestShippingVoucher(
        input.vouchers,
        input.subtotal,
        input.shippingMethod
      );
  }

  /*
   * ==========================================================
   * DISCOUNT AMOUNT
   * ==========================================================
   *
   * Voucher theo sản phẩm:
   * chỉ tính trên tổng tiền sản phẩm đủ điều kiện.
   *
   * Voucher toàn đơn:
   * tính trên toàn bộ subtotal.
   */

  const eligibleSubtotal =
    getVoucherEligibleSubtotal(
      discountVoucher,
      input.subtotal,
      input.cartItems
    );

  const discountAmount =
    calculateVoucherDiscount(
      discountVoucher,
      eligibleSubtotal
    );

  /*
   * ==========================================================
   * SHIPPING DISCOUNT
   * ==========================================================
   */

  const shippingDiscount =
    calculateShippingDiscount(
      shippingVoucher,
      input.shippingFee,
      input.subtotal
    );

  /*
   * Không để shipping âm.
   */
  const shipping =
    Math.max(
      0,
      input.shippingFee -
        shippingDiscount
    );

  /*
   * ==========================================================
   * SUMMARY
   * ==========================================================
   */

  return {
    discountVoucher,

    shippingVoucher,

    discountAmount,

    shippingDiscount,

    shipping,

    totalDiscount:
      calculateVoucherSaving(
        discountAmount,
        shippingDiscount
      ),
  };
}
