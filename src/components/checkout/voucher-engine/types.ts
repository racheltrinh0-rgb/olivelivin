import type {
  VoucherDisplay,
  ShippingMethod,
} from "../voucher.types";

export interface VoucherEngineInput {

  vouchers: VoucherDisplay[];

  subtotal: number;

  shippingFee: number;

  shippingMethod: ShippingMethod;

  cartItems: any[];

  selectedDiscount:
    | VoucherDisplay
    | null;

  selectedShipping:
    | VoucherDisplay
    | null;
}

export interface VoucherEngineResult {
  discountVoucher:
    | VoucherDisplay
    | null;

  shippingVoucher:
    | VoucherDisplay
    | null;

  discountAmount: number;

  shippingDiscount: number;

  shipping: number;

  totalDiscount: number;
}

export interface VoucherMatchContext {
  subtotal: number;

  shippingFee: number;

  shippingMethod: ShippingMethod;

  cartItems: any[];
}