import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartItem as StoreCartItem } from "@/lib/cart";
import { formatVND } from "@/lib/format";
import NextVoucherSuggestion from "@/components/cart/NextVoucherSuggestion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

type CartVoucher = {
  id: string;
  code: string;
  title: string | null;
  type: "discount_percent" | "discount_fixed" | "free_shipping";
  value: number;
  min_order: number;
  max_discount: number | null;
  quantity: number | null;
  used: number;
  usage_per_customer: number | null;
  start_at: string;
  end_at: string;
  active: boolean;
  manual_apply: boolean;
  auto_apply: boolean;
};

const SELECTED_VOUCHER_KEY = "selected-voucher-code";
const CHECKOUT_CART_KEY = "checkout-cart-items";

type PageCartItem = StoreCartItem & {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
    image_url: string | null;
    sku?: string | null;
  };
};

function toPageCartItem(item: StoreCartItem): PageCartItem {
  return {
    ...item,
    product: {
      id: item.id,
      slug: item.slug,
      name: item.name,
      price: Number(item.price || 0),
      image: item.image ?? null,
      image_url: item.image ?? null,
    },
  };
}


function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();

  const [items, setItems] = useState<PageCartItem[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  const [vouchers, setVouchers] = useState<CartVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + Number(item.product.price || 0) * item.quantity;
    }, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }, [items]);

  // Load cart.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setItems(cart.items.map(toPageCartItem));
  }, [cart.items]);

  // Load the voucher currently saved by the customer.
  useEffect(() => {
    if (!mounted) return;

    const savedCode = localStorage.getItem(SELECTED_VOUCHER_KEY) ?? "";
    setSelectedVoucherCode(savedCode);
  }, [mounted]);

  // Load vouchers that are actually valid for the current cart subtotal.
  useEffect(() => {
    if (!mounted || subtotal <= 0) {
      setVouchers([]);
      setLoadingVouchers(false);
      return;
    }

    let cancelled = false;

    async function loadVouchers() {
      try {
        setLoadingVouchers(true);

        // Dùng đúng điều kiện lấy voucher ở trang chủ để giỏ hàng
        // chỉ hiển thị cùng nhóm voucher đang được giới thiệu tại đó.
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from("vouchers")
          .select("*")
          .eq("active", true)
          .eq("is_personal", false)
          .lte("start_at", nowIso)
          .gte("end_at", nowIso)
          .order("min_order", { ascending: true });

        if (error) {
          console.error("GET CART VOUCHERS ERROR:", error);

          if (!cancelled) {
            setVouchers([]);
          }

          return;
        }

        const now = new Date();

        const validVouchers = (data ?? [])
          .filter((voucher) => {
            if (!voucher.start_at || !voucher.end_at) {
              return false;
            }

            const startAt = new Date(voucher.start_at);
            const endAt = new Date(voucher.end_at);

            // Chỉ giữ voucher đang trong thời gian hiệu lực.
            // end_at là mốc hết hạn: tới đúng thời điểm này thì không còn hợp lệ.
            if (
              Number.isNaN(startAt.getTime()) ||
              Number.isNaN(endAt.getTime()) ||
              now < startAt ||
              now >= endAt
            ) {
              return false;
            }

            // Khớp với trang chủ: chỉ giữ voucher còn lượt sử dụng.
            // Trang chủ dùng max_uses / used_count để xác định lượt còn lại.
            if (
              voucher.max_uses != null &&
              Number(voucher.used_count ?? 0) >= Number(voucher.max_uses)
            ) {
              return false;
            }

            return true;
          })
          .map((voucher) => voucher as CartVoucher);

        if (!cancelled) {
          setVouchers(validVouchers);
        }
      } catch (error) {
        console.error("GET CART VOUCHERS ERROR:", error);

        if (!cancelled) {
          setVouchers([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingVouchers(false);
        }
      }
    }

    void loadVouchers();

    return () => {
      cancelled = true;
    };
  }, [mounted, subtotal]);

  const updateQuantity = (productId: string, quantity: number) => {
    const nextQuantity = Math.max(1, quantity);

    cart.setQuantity(productId, nextQuantity);
  };

  const removeItem = (productId: string, productName: string) => {
    cart.remove(productId);

    toast.success("Đã xóa sản phẩm", {
      description: productName,
    });
  };

  const handleClearCart = () => {
    cart.clear();
    setItems([]);

    localStorage.removeItem(CHECKOUT_CART_KEY);
    localStorage.removeItem(SELECTED_VOUCHER_KEY);
    setSelectedVoucherCode("");

    toast.success("Đã xóa toàn bộ giỏ hàng");
  };

  const handleClaimVoucher = (voucher: CartVoucher) => {
    localStorage.setItem(SELECTED_VOUCHER_KEY, voucher.code);
    setSelectedVoucherCode(voucher.code);

    toast.success("Đã nhận voucher", {
      description: `${voucher.code} - ${voucher.title ?? "Ưu đãi"}`,
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống");
      return;
    }

    /*
     * Lưu TOÀN BỘ giỏ hàng trước khi sang checkout.
     *
     * checkout.tsx hiện vẫn cần đọc CHECKOUT_CART_KEY để hiển thị
     * toàn bộ sản phẩm. Không còn chỉ truyền firstItem như code cũ.
     */
    localStorage.setItem(
      CHECKOUT_CART_KEY,
      JSON.stringify(items),
    );

    /*
     * Voucher đã nhận cũng được giữ lại để checkout tự kiểm tra
     * và áp dụng lại điều kiện trước khi tạo đơn.
     */
    if (selectedVoucherCode) {
      localStorage.setItem(
        SELECTED_VOUCHER_KEY,
        selectedVoucherCode,
      );
    }

    const firstItem = items[0];

    navigate({
      to: "/checkout",
      search: {
        productId: firstItem.product.id,
        qty: firstItem.quantity,
      },
    });
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#FAF9F6] text-[#34352F]" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(226,232,214,0.26),_transparent_42%),#FAF9F6] text-[#34352F]">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8">
        <div className="mb-7 border-b border-[#E7E2D9] pb-6 sm:mb-9 sm:pb-7">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-[#77766E] transition-colors hover:bg-white hover:text-[#5F6B50]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tiếp tục mua sắm
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl font-normal tracking-[-0.04em] text-[#34352F] sm:text-5xl">
                Giỏ hàng
              </h1>

              <p className="mt-2 text-sm text-[#88877F]">
                {totalQuantity > 0
                  ? `${totalQuantity} sản phẩm trong giỏ hàng`
                  : "Kiểm tra sản phẩm trước khi tiến hành thanh toán."}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="inline-flex items-center gap-2 rounded-full border border-[#E7DCD5] bg-white/70 px-4 py-2.5 text-xs font-medium text-[#8A6D62] transition-colors hover:border-[#E7B5A1] hover:bg-[#FFF4EF] hover:text-[#C45A24]"
              >
                <Trash2 className="h-4 w-4" />
                Xóa giỏ hàng
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[28px] border border-[#EEE8DF] bg-white px-6 py-16 text-center shadow-[0_10px_35px_rgba(60,50,35,0.04)]">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#EEF0E8]">
              <ShoppingBag className="h-9 w-9 text-[#657253]" />
            </div>

            <h2 className="mt-6 font-serif text-2xl font-normal text-[#34352F]">
              Giỏ hàng của bạn đang trống
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#85847C]">
              Hãy khám phá các sản phẩm công nghệ và thêm sản phẩm bạn yêu thích
              vào giỏ hàng.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#626E53] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#515D44]"
            >
              Khám phá sản phẩm
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:gap-7">
            {/* LEFT: PRODUCTS */}
            <section className="space-y-3 sm:space-y-4">
              {items.map((item) => {
                const product = item.product;

                const itemSubtotal =
                  Number(product.price || 0) * item.quantity;

                return (
                  <article
                    key={product.id}
                    className="group relative overflow-hidden rounded-[22px] border border-[#E9E4D9] bg-white p-3.5 shadow-[0_8px_26px_rgba(60,50,35,0.045)] transition-all duration-300 hover:border-[#D8DCCB] hover:shadow-[0_12px_32px_rgba(60,70,45,0.09)] sm:p-5"
                  >
                    <div className="flex gap-4">
                      <Link
                        to="/product/$id"
                        params={{ id: product.id }}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[16px] bg-[linear-gradient(145deg,#E9EDE2_0%,#F5E7D9_52%,#F8F4ED_100%)] ring-1 ring-inset ring-[#D9DFD0] transition-transform duration-300 group-hover:scale-[1.015] sm:h-32 sm:w-32"
                      >
                        {product.image && !failedImages[product.id] ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            onError={() =>
                              setFailedImages((current) => ({
                                ...current,
                                [product.id]: true,
                              }))
                            }
                            className="h-full w-full object-contain p-1.5 mix-blend-multiply drop-shadow-[0_5px_7px_rgba(54,50,40,0.12)] sm:p-2"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#E9EDE2_0%,#F5E7D9_52%,#F8F4ED_100%)] text-[#7B806D]"
                            role="img"
                            aria-label={`Ảnh sản phẩm ${product.name} chưa khả dụng`}
                          >
                            <ShoppingBag className="h-7 w-7 opacity-70" strokeWidth={1.3} />
                            <span className="px-2 text-center text-[9px] font-medium leading-4 text-[#77766E]">
                              Ảnh sản phẩm
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to="/product/$id"
                              params={{ id: product.id }}
                              className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#343A30] transition-colors hover:text-[#657253] sm:text-[15px]"
                            >
                              {product.name}
                            </Link>

                            {(item.colorName || item.colorHex || item.productColorId) && (
                              <div className="mt-2.5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#E6E7DC] bg-[#F6F7F0] px-2.5 py-1.5">
                                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#858777]">
                                  Màu sắc
                                </span>
                                <span
                                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
                                  style={{ backgroundColor: item.colorHex || "#E7E1D6" }}
                                  aria-label={item.colorName || "Màu đã chọn"}
                                  title={item.colorName || "Màu đã chọn"}
                                />
                                <span className="truncate text-[11px] font-semibold text-[#4F5945]">
                                  {item.colorName || "Đã chọn"}
                                </span>
                              </div>
                            )}

                            {product.sku && (
                              <p className="mt-1 truncate text-[9px] tracking-wide text-[#9A968D] sm:text-[10px]">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(product.id, product.name)
                            }
                            className="shrink-0 rounded-full p-2 text-[#A09C93] transition-colors hover:bg-[#FFF0EA] hover:text-[#C45A24]"
                            aria-label={`Xóa ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex min-h-8 flex-nowrap items-start justify-between gap-2">
                          <div className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#E7E2D9] bg-[#FAF9F6]">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  product.id,
                                  item.quantity - 1,
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="grid h-7 w-7 place-items-center rounded-full text-[#77766E] transition-colors hover:bg-white hover:text-[#5F6B50] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Giảm số lượng"
                            >
                              <Minus className="h-3 w-3" />
                            </button>

                            <span className="min-w-5 px-0.5 text-center text-[11px] font-semibold tabular-nums text-[#34352F]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  product.id,
                                  item.quantity + 1,
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full text-[#77766E] transition-colors hover:bg-white hover:text-[#5F6B50]"
                              aria-label="Tăng số lượng"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col items-end text-right">
                            <p className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-[#F0F2E9] px-2.5 text-[12px] font-bold tracking-[-0.03em] text-[#536346] ring-1 ring-inset ring-[#E0E5D8] sm:px-3 sm:text-base">
                              {formatVND(itemSubtotal)}
                            </p>

                            {item.quantity > 1 && (
                              <p className="mt-1 truncate text-[9px] tracking-wide text-[#9A968D] sm:text-[10px]">
                                {formatVND(Number(product.price || 0))} / sản phẩm
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              {/* GỢI Ý VOUCHER: giữ lại khối tăng giá trị đơn hàng */}
              <div className="pt-2 sm:pt-3">
                <NextVoucherSuggestion subtotal={subtotal} />
              </div>
            </section>

            {/* RIGHT: VOUCHER + ORDER SUMMARY */}
            <aside className="h-fit min-w-0 space-y-4 lg:sticky lg:top-5">
              <section className="relative isolate overflow-hidden rounded-[24px] border border-[#E1E4D8] bg-[linear-gradient(155deg,#F2F3EB_0%,#F8F7F1_100%)] p-5 shadow-[0_10px_32px_rgba(60,65,45,0.06)] before:absolute before:left-0 before:top-0 before:z-20 before:h-1 before:w-full before:bg-gradient-to-r before:from-[#7C8B68] before:via-[#C9A783] before:to-[#E9D9C5] sm:p-6">
                <svg aria-hidden="true" className="pointer-events-none absolute -right-8 -top-5 z-0 h-44 w-44 text-[#7C8B68] opacity-[0.10]" viewBox="0 0 180 180" fill="none">
                  <circle cx="90" cy="90" r="35" stroke="currentColor" strokeWidth="1" />
                  <circle cx="90" cy="90" r="52" stroke="currentColor" strokeWidth="1" />
                  <circle cx="90" cy="90" r="69" stroke="currentColor" strokeWidth="1" />
                  <circle cx="90" cy="90" r="86" stroke="currentColor" strokeWidth="1" />
                </svg>
                <svg aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-8 z-0 h-36 w-36 rotate-12 text-[#B99A78] opacity-[0.10]" viewBox="0 0 160 160" fill="none">
                  <path d="M0 40 C35 0 75 80 160 25 M0 65 C45 25 85 105 160 50 M0 90 C55 50 95 130 160 75 M0 115 C65 75 105 155 160 100 M0 140 C75 100 115 180 160 125" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <h2 className="relative z-10 font-sans text-xl font-semibold leading-tight tracking-[-0.015em] text-[#34352F] sm:text-[22px]">
                  Tóm tắt thanh toán
                </h2>

                <div className="relative z-10 mt-5 space-y-4 border-b border-[#D8D9CF] pb-5">
                  <div className="flex items-center justify-between gap-4 text-[13px]">
                    <span className="text-[#828379]">
                      Tạm tính ({totalQuantity} sản phẩm)
                    </span>

                    <span className="font-medium tabular-nums text-[#45463F]">
                      {formatVND(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-[13px]">
                    <span className="text-[#828379]">
                      Phí vận chuyển
                    </span>

                    <span className="font-medium tabular-nums text-[#45463F]">
                      Tính ở bước thanh toán
                    </span>
                  </div>

                  {selectedVoucherCode && (
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-[#828379]">
                        Voucher
                      </span>

                      <span className="max-w-[170px] truncate font-semibold text-[#657253]">
                        {selectedVoucherCode}
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex items-center justify-between gap-4 py-5">
                  <span className="text-sm font-semibold text-[#686A5E]">
                    Tổng cộng
                  </span>

                  <span className="font-serif text-2xl font-normal tracking-[-0.03em] text-[#34352F]">
                    {formatVND(subtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-[#626E53] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_5px_14px_rgba(77,91,61,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#515D44] hover:shadow-[0_8px_20px_rgba(77,91,61,0.2)] active:translate-y-0"
                >
                  Tiến hành thanh toán
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="relative z-10 mt-3 whitespace-nowrap text-center text-[8px] leading-4 tracking-[-0.025em] text-[#85867C] sm:text-[10px] sm:tracking-normal">
                  Phí vận chuyển và mã giảm giá sẽ được áp dụng ở bước thanh toán.
                </p>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
