
import type {
  VoucherDisplay,
} from "../voucher.types";

/* ============================================================
   DISCOUNT
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

      return Math.round(discount);
    }

    default:
      return 0;
  }
}

/* ============================================================
   SHIPPING
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
   TOTAL SAVING
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

/* ============================================================
   ELIGIBLE SUBTOTAL
============================================================ */

/**
 * Tính tổng tiền sản phẩm đủ điều kiện áp dụng voucher.
 *
 * Voucher applyType = "product":
 *   Chỉ tính sản phẩm khớp applyId.
 *
 * Voucher applyType = "all":
 *   Tính toàn bộ subtotal.
 *
 * Voucher product không có applyId:
 *   Không được áp dụng.
 *
 * Hỗ trợ cả camelCase và snake_case:
 *   applyType / apply_type
 *   applyId   / apply_id
 */
export function getVoucherEligibleSubtotal(
  voucher: VoucherDisplay | null,
  subtotal: number,
  cartItems: any[] = []
): number {
  if (!voucher) return 0;

  const applyType = String(
    voucher.applyType ??
      (voucher as any).apply_type ??
      "all"
  )
    .trim()
    .toLowerCase();

  const applyId =
    voucher.applyId ??
    (voucher as any).apply_id ??
    null;

  /*
   * Voucher toàn đơn.
   */
  if (
    applyType === "all" ||
    applyType === "cart" ||
    applyType === "order"
  ) {
    return Math.max(
      0,
      Number(subtotal) || 0
    );
  }

  /*
   * Voucher dành riêng cho sản phẩm.
   *
   * Không có applyId thì không được fallback
   * sang toàn bộ subtotal.
   */
  if (
    applyType === "product" ||
    applyType === "products"
  ) {
    if (
      applyId == null ||
      String(applyId).trim() === ""
    ) {
      return 0;
    }

    const targetId = String(
      applyId
    ).trim();

    return cartItems.reduce(
      (sum, item) => {
        /*
         * Hỗ trợ nhiều kiểu cấu trúc cart item.
         */
        const productId = String(
          item.product_id ??
            item.productId ??
            item.id ??
            ""
        ).trim();

        const variantId = String(
          item.variant_id ??
            item.variantId ??
            ""
        ).trim();

        /*
         * Chỉ lấy sản phẩm khớp applyId.
         */
        if (
          productId !== targetId &&
          variantId !== targetId
        ) {
          return sum;
        }

        const price = Math.max(
          0,
          Number(item.price) || 0
        );

        const quantity = Math.max(
          0,
          Number(item.quantity) || 0
        );

        return (
          sum +
          price * quantity
        );
      },
      0
    );
  }

  /*
   * Các loại applyType không xác định:
   * Không tự động coi là voucher toàn đơn.
   */
  return 0;
}
