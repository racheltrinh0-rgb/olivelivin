import type {
  VoucherSummary,
} from "../voucher.types";

import type {
  VoucherEngineInput,
} from "./types";

import {
  calculateVoucherDiscount,
  calculateShippingDiscount,
  calculateVoucherSaving,
} from "./calculator";

import {
  selectBestDiscountVoucher,
  selectBestShippingVoucher,
} from "./selector";

export function buildVoucherSummary(
  input: VoucherEngineInput
): VoucherSummary {

  /*
   * ==========================================================
   * DISCOUNT VOUCHER
   * ==========================================================
   */

  const discountVoucher =
    input.selectedDiscount ??
    selectBestDiscountVoucher(
      input.vouchers,
      input.subtotal,
      input.cartItems
    );

  /*
   * ==========================================================
   * SHIPPING VOUCHER
   * ==========================================================
   *
   * IMPORTANT:
   *
   * Không dùng selectedShipping mù quáng.
   *
   * Khi shippingMethod / subtotal thay đổi,
   * phải kiểm tra lại voucher đã chọn có còn hợp lệ hay không.
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
     * → bỏ nó và chọn lại voucher tốt nhất.
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
   * DISCOUNT
   * ==========================================================
   */

  const discountAmount =
    calculateVoucherDiscount(
      discountVoucher,
      input.subtotal
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