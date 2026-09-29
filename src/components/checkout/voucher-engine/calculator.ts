import type {
  VoucherDisplay,
} from "../voucher.types";

/* ============================================================
   Discount
============================================================ */

export function calculateVoucherDiscount(
  voucher: VoucherDisplay | null,
  subtotal: number
): number {
  if (!voucher) return 0;

  if (subtotal < voucher.min_order) {
    return 0;
  }

  switch (voucher.type) {
    case "fixed":
      return Math.min(
        voucher.value,
        subtotal
      );

    case "percent": {
      let discount =
        subtotal *
        voucher.value /
        100;

      if (
        voucher.max_discount != null &&
        voucher.max_discount > 0
      ) {
        discount = Math.min(
          discount,
          voucher.max_discount
        );
      }

      return Math.round(
        discount
      );
    }

    default:
      return 0;
  }
}

/* ============================================================
   Shipping
============================================================ */

export function calculateShippingDiscount(
  voucher: VoucherDisplay | null,
  shippingFee: number,
  subtotal: number
): number {
  if (!voucher) return 0;

  if (voucher.type !== "shipping") {
    return 0;
  }

  if (subtotal < voucher.min_order) {
    return 0;
  }

  /*
   * Không bao giờ giảm vượt phí ship thực tế.
   */
  return Math.min(
    Math.max(0, shippingFee),
    Math.max(0, voucher.value)
  );
}

/* ============================================================
   Total Saving
============================================================ */

export function calculateVoucherSaving(
  discount: number,
  shipping: number
): number {
  return (
    Math.max(0, discount) +
    Math.max(0, shipping)
  );
}