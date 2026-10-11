
import { Link } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  Zap,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

interface FlashSaleProduct {
  id: string;
  slug?: string | null;
  name: string;
  price: number;
  image_url?: string | null;
  stock?: number | null;
  express_available?: boolean | null;
  discount_percent?: number | null;
  flash_sale_start_at?: string | null;
  flash_sale_end_at?: string | null;
}

interface Props {
  product: FlashSaleProduct;
}

function formatVND(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShortProductName(name: string) {
  return name
    .replace(
      /\s*[-–—|]\s*(phong cách|minimalist|thiết kế tối giản|nghệ thuật nhật bản|nghệ thuật).*$/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) return `Còn ${days} ngày`;

  return `Còn ${[hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")}`;
}

export function FlashSaleCard({ product }: Props) {
  const cart = useCart();

  const [now, setNow] = useState(() => Date.now());
  const [showPopup, setShowPopup] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startTime = product.flash_sale_start_at
    ? new Date(product.flash_sale_start_at).getTime()
    : null;

  const endTime = product.flash_sale_end_at
    ? new Date(product.flash_sale_end_at).getTime()
    : null;

  const saleHasStarted = startTime === null || now >= startTime;
  const saleHasEnded = endTime !== null && now >= endTime;

  const discount = Math.max(
    0,
    Math.min(100, Number(product.discount_percent ?? 0))
  );

  const originalPrice = Number(product.price ?? 0);
  const salePrice = Math.round(originalPrice * (1 - discount / 100));
  const saving = originalPrice - salePrice;

  const remainingLabel =
    endTime !== null && now < endTime
      ? formatRemaining(endTime - now)
      : "";

  const shortName = getShortProductName(product.name);

  function handleProductClick(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    if (saleHasStarted && !saleHasEnded) return;

    event.preventDefault();

    if (saleHasEnded) {
      toast.error("Flash Sale đã kết thúc");
      return;
    }

    setShowPopup(true);
  }

  function handleAddToCart(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!saleHasStarted) {
      setShowPopup(true);
      return;
    }

    if (saleHasEnded) {
      toast.error("Flash Sale đã kết thúc");
      return;
    }

    if (product.stock !== undefined && Number(product.stock) <= 0) {
      toast.error("Sản phẩm hiện đã hết hàng");
      return;
    }

    cart.add(
      {
        id: product.id,
        slug: product.slug ?? "",
        name: product.name,
        price: salePrice,
        image: product.image_url ?? null,
      },
      1
    );

    toast.success("Đã thêm vào giỏ hàng");
  }

  return (
    <>
      <article className="group flex min-w-0 flex-col pb-3">
        {/* PRODUCT IMAGE */}
        <div className="relative aspect-[0.92/1] overflow-hidden rounded-xl bg-[#F5F3EF] sm:aspect-square sm:rounded-2xl">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug ?? "" }}
            onClick={handleProductClick}
            aria-label={`Xem ${product.name}`}
            className="absolute inset-0"
          >
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
          </Link>

          {/* DISCOUNT + COUNTDOWN */}
          <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-2.75rem)] flex-wrap items-center gap-1 sm:left-2.5 sm:top-2.5 sm:gap-1.5">
            {discount > 0 && (
              <span className="rounded-md bg-[#FF4438] px-1.5 py-1 text-[9px] font-semibold leading-none text-white sm:px-2 sm:py-1.5 sm:text-xs">
                -{discount}%
              </span>
            )}

            {remainingLabel && (
              <span className="rounded-md bg-white/95 px-1.5 py-1 text-[8px] font-semibold leading-none text-[#B94D23] shadow-sm sm:px-2 sm:py-1.5 sm:text-[10px]">
                {remainingLabel}
              </span>
            )}
          </div>

          {/* FAVORITE */}
          <button
            type="button"
            aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            aria-pressed={isFavorite}
            onClick={() => setIsFavorite((value) => !value)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8"
          >
            <Heart
              size={14}
              strokeWidth={1.7}
              fill={isFavorite ? "#E8753C" : "none"}
              color={isFavorite ? "#E8753C" : "currentColor"}
            />
          </button>

          {/* EXPRESS HCM */}
          {product.express_available === true && (
            <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-1 text-[8px] font-semibold leading-none text-[#B94D23] shadow-sm sm:bottom-2.5 sm:left-2.5 sm:px-2 sm:py-1.5 sm:text-[10px]">
              <Zap size={9} strokeWidth={2.3} fill="currentColor" />
              Hỏa tốc HCM
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="flex min-w-0 flex-1 flex-col pt-2 sm:pt-3">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug ?? "" }}
            onClick={handleProductClick}
            className="block"
          >
            <h3
              title={product.name}
              className="line-clamp-2 min-h-[30px] text-[10px] font-medium leading-[1.45] text-[#37332F] sm:min-h-[38px] sm:text-sm"
            >
              {shortName}
            </h3>
          </Link>

          {/* PRICE */}
          <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 sm:mt-2 sm:gap-x-2">
            <span className="text-[15px] font-semibold leading-none tracking-tight text-[#E8753C] sm:text-lg">
              {formatVND(salePrice)}
            </span>

            {saving > 0 && (
              <span className="text-[9px] text-neutral-400 line-through sm:text-[10px]">
                {formatVND(originalPrice)}
              </span>
            )}
          </div>

          {saving > 0 && (
            <p className="mt-1 text-[9px] leading-tight text-neutral-400 sm:mt-1.5 sm:text-[10px]">
              Tiết kiệm{" "}
              <span className="font-medium text-[#E8753C]">
                {formatVND(saving)}
              </span>
            </p>
          )}

          {/* BOTH BUTTONS: SAME TOP, BOTTOM AND HEIGHT */}
          <div
            className="mt-2 flex w-full items-stretch gap-1.5 sm:mt-3 sm:gap-2"
            style={{ height: 27, minHeight: 27 }}
          >
            <Link
              to="/products/$slug"
              params={{ slug: product.slug ?? "" }}
              onClick={handleProductClick}
              className="!m-0 !box-border !flex !h-full !min-h-0 !min-w-0 !flex-1 !items-center !justify-center !self-stretch !rounded-md !border-0 !px-1.5 !py-0 !text-[9px] !font-medium !leading-none !no-underline bg-[#E8753C] text-white transition-colors hover:bg-[#DF6A32] sm:!text-[11px]"
            >
              Mua ngay
            </Link>

            <button
              type="button"
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
              title="Thêm vào giỏ hàng"
              onClick={handleAddToCart}
              disabled={saleHasEnded}
              className="!m-0 !box-border !flex !h-full !w-[28px] !min-h-0 !min-w-[28px] !shrink-0 !grow-0 !items-center !justify-center !self-stretch !rounded-md !border-0 !p-0 !leading-none bg-[#F7E8DD] text-[#A95C35] transition-colors hover:bg-[#F2DDCD] disabled:cursor-not-allowed disabled:opacity-50 sm:!w-8 sm:!min-w-8"
            >
              <ShoppingBag
                size={12}
                strokeWidth={1.7}
                className="block shrink-0"
              />
            </button>
          </div>
        </div>
      </article>

      {/* SALE STATUS POPUP */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-5 backdrop-blur-[3px]"
          onClick={() => setShowPopup(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[390px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
            >
              <X size={16} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF3EC] text-xl">
              🔥
            </div>

            <h3 className="mt-4 pr-8 font-display text-2xl leading-tight text-neutral-900">
              {saleHasEnded
                ? "Flash Sale đã kết thúc"
                : "Flash Sale chưa bắt đầu"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {saleHasEnded
                ? "Ưu đãi cho sản phẩm này đã kết thúc."
                : "Sản phẩm sẽ được áp dụng giá Flash Sale khi chương trình chính thức bắt đầu."}
            </p>

            {!saleHasEnded && product.flash_sale_start_at && (
              <div className="mt-5 rounded-xl bg-[#FAF9F6] px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Bắt đầu lúc
                </p>
                <p className="mt-1 text-sm font-semibold text-[#E8753C]">
                  {formatDate(product.flash_sale_start_at)}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#E8753C] text-sm font-semibold text-white transition hover:bg-[#DF6A32]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FlashSaleCard;
