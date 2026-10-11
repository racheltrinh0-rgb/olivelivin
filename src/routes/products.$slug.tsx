import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { Fragment,  useEffect, useState } from "react";

import { formatVND } from "@/lib/format";

import { useCart } from "@/lib/cart";

import FloatingFlashSaleBadge from "@/components/FloatingFlashSaleBadge";

import { Trees } from "lucide-react";

import {

  Check,

  Minus,

  Plus,

  Truck,

  ShieldCheck,

  RotateCcw,

  ChevronDown,

  Sparkles,

  Lightbulb,

  PackageCheck,

  Leaf,

  BatteryCharging,

  Usb,

  Hand,

  Clock3,

  ArrowUp,

  ArrowDown,

  ShoppingCart

} from "lucide-react";

import { toast } from "sonner";



import { motion, AnimatePresence } from "framer-motion";

import { PaymentMethods } from "@/components/PaymentMethods";



// ============================================================

// HỖ TRỢ KHÁCH HÀNG — thay 2 link này bằng link thật của bạn

// Messenger: https://m.me/TEN_PAGE

// Zalo:      https://zalo.me/SO_DIEN_THOAI

// ============================================================

const MESSENGER_URL = "https://m.me/oliveliving";

const ZALO_URL = "https://zalo.me/0799379179";



const productOptions = (slug: string) =>

  queryOptions({

    queryKey: ["product", slug],



    queryFn: async () => {

      const { data, error } = await supabase

        .from("products")

        .select(`

short_description,

id,

slug,

name,

description,



price,

compare_at_price,



stock,



image_url,



dimensions,

material,

color,

light_source,

power_source,

warranty,



seo_title,

seo_description,



category_id,



product_images(
  id,
  image_url,
  thumbnail_url,
  image_type,
  sort_order,
  color_id,
  is_lifestyle
),



product_colors(

  id,

  name,

  hex,

  material,

  price,

  stock,

  sku,

  image_url

),



product_specifications(

id,

label,

value,

sort_order

),



product_usps(

id,

title,

icon,

sort_order

)







`)

        .eq("slug", slug)

        .maybeSingle();



        console.log("==============");

console.log("URL slug:", slug);

console.log("DB slug:", data?.slug);

console.log("Product:", data?.name);

console.log("==============");



      if (!data) throw notFound();



      const relatedResult = await supabase
        .from("products")
        .select("id,slug,name,price,compare_at_price,image_url,stock,express_available")
        .eq("category_id", data.category_id!)
        .neq("id", data.id)
        .limit(4);

      const relatedProducts = relatedResult.data ?? [];
      const relatedIds = relatedProducts.map((item: any) => item.id);
      let relatedFlashSales: any[] = [];

      if (relatedIds.length) {
        const { data: saleRows, error: saleError } = await supabase
          .from("flash_sale_products")
          .select(`
            product_id,
            flash_sales(
              id,
              discount_percent,
              active,
              start_at,
              end_at
            )
          `)
          .in("product_id", relatedIds);

        if (saleError) {
          console.warn("Related product Flash Sale lookup failed:", saleError);
        } else {
          const now = Date.now();
          relatedFlashSales = (saleRows ?? [])
            .map((row: any) => {
              const sale = Array.isArray(row.flash_sales)
                ? row.flash_sales[0]
                : row.flash_sales;
              if (!sale || !sale.active) return null;

              const startAt = sale.start_at ? new Date(sale.start_at).getTime() : null;
              const endAt = sale.end_at ? new Date(sale.end_at).getTime() : null;
              const hasStarted = startAt === null || now >= startAt;
              const hasNotEnded = endAt === null || now < endAt;
              const discount = Number(sale.discount_percent) || 0;

              if (!hasStarted || !hasNotEnded || discount <= 0) return null;
              return {
                productId: row.product_id,
                discountPercent: discount,
              };
            })
            .filter(Boolean) as any[];
        }
      }

      const relatedWithBadges = relatedProducts.map((item: any) => {
        const activeSale = relatedFlashSales.find((sale) => sale.productId === item.id);
        return {
          ...item,
          relatedFlashDiscount: activeSale?.discountPercent ?? 0,
        };
      });

      return {
        product: data,
        related: relatedWithBadges,
      };

    },

  });



export const Route = createFileRoute(

  "/products/$slug"

)({

  loader: ({ context, params }) =>

    context.queryClient.ensureQueryData(

      productOptions(params.slug)

    ),



  component: ProductPage,

});



function getRelatedProductName(name: string) {

  const cleaned = name

    .replace(/\s*[–—-]\s*.*/g, "")

    .replace(/\s*\([^)]*\)\s*$/g, "")

    .trim();



  if (cleaned.length <= 34) return cleaned;



  return `${cleaned.slice(0, 34).trimEnd()}…`;

}



function ProductPage() {



  const { add, remove } = useCart();



  const { slug } = Route.useParams();



  const { data } =

    useSuspenseQuery(productOptions(slug));



  const { product, related } = data;



  console.log("PRODUCT COLORS:", product.product_colors);





  console.log("DESCRIPTION:", product.description);



  console.log(product.description);



  console.log("URL slug:", slug);

console.log("Product slug:", product.slug);

console.log("Product name:", product.name);



  useEffect(() => {

  window.dataLayer = window.dataLayer || [];



  window.dataLayer.push({

    event: "view_item",

    ecommerce: {

      currency: "VND",

      value: Number(product.price),

      items: [

        {

          item_id: product.slug,

          item_name: product.name,

          item_category: product.category_id,

          price: Number(product.price),

        },

      ],

    },

  });

}, [product]);



  const cart = useCart();



  const navigate = useNavigate();



  const [qty, setQty] = useState(1);



  const allImages =

  product.product_images?.length

    ? product.product_images

    : [

        {

          image_url: product.image_url,
          image_type: "image",
          color_id: null,

        },

      ];



      console.log(allImages);



const [selectedColor, setSelectedColor] = useState(

  product.product_colors?.[0] ?? null

);



const materials = [

  ...new Set(

    (product.product_colors ?? [])

      .map((item: any) => item.material)

      .filter(Boolean)

  ),

];



const [accessories, setAccessories] = useState<any[]>([]);



const [selectedAccessories, setSelectedAccessories] =

  useState<string[]>([]);



useEffect(() => {

  console.log("Selected:", selectedColor);

}, [selectedColor]);



useEffect(() => {

  console.log("Selected Color:", selectedColor);

  console.log("Material:", selectedColor?.material);

}, [selectedColor]);





const [selectedImage, setSelectedImage] = useState(

  product.image_url ||

  product.product_images?.[0]?.image_url ||

  ""

);

const [showAllImages, setShowAllImages] = useState(false);





const [openFaq, setOpenFaq] = useState<number | null>(0);

const [isFaqOpen, setIsFaqOpen] = useState(false);



const [isSpecsOpen, setIsSpecsOpen] = useState(false);



// Mô tả sản phẩm: mặc định thu gọn, bấm + để xổ ra

const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);



const [showStickyBuy, setShowStickyBuy] = useState(false);



const [bestVoucher, setBestVoucher] = useState<any>(null);

/*
 * ==========================================================
 * FLASH SALE STATE
 * ==========================================================
 *
 * Flash Sale chỉ được giảm giá khi:
 * current time >= start_at
 * và
 * current time < end_at
 *
 * Nếu chưa tới start_at -> chỉ hiện countdown.
 * Nếu đã hết end_at -> quay về giá bình thường.
 */
const [flashSale, setFlashSale] = useState<any>(null);
const [flashNow, setFlashNow] = useState(0);

const comparePrice =
  Number(product.compare_at_price) || 0;

const sellingPrice =
  Number(selectedColor?.price) ||
  Number(product.price);

const flashStartTime =
  flashSale?.start_at
    ? new Date(
        flashSale.start_at
      ).getTime()
    : null;

const flashEndTime =
  flashSale?.end_at
    ? new Date(
        flashSale.end_at
      ).getTime()
    : null;

const flashSaleStatus:
  | "none"
  | "upcoming"
  | "active"
  | "ended" =
  !flashSale
    ? "none"
    : flashNow === 0
      ? "none"
      : flashStartTime !== null &&
          flashNow < flashStartTime
        ? "upcoming"
        : flashEndTime !== null &&
            flashNow >= flashEndTime
          ? "ended"
          : "active";

/*
 * Chỉ ACTIVE mới được phép áp dụng discount.
 */
const flashDiscount =
  flashSaleStatus === "active"
    ? Math.max(
        0,
        Number(
          flashSale?.discount_percent
        ) || 0
      )
    : 0;

const salePrice =
  flashSaleStatus === "active" &&
  flashDiscount > 0
    ? Math.round(
        sellingPrice *
          (1 - flashDiscount / 100)
      )
    : sellingPrice;

/*
 * Giá gốc hiển thị:
 *
 * - Flash Sale đang chạy:
 *   lấy giá niêm yết cao hơn giữa compare_at_price
 *   và sellingPrice.
 *
 * - Bình thường:
 *   dùng compare_at_price.
 */
const originalDisplayPrice =
  flashSaleStatus === "active"
    ? Math.max(
        comparePrice,
        sellingPrice
      )
    : comparePrice;

const displayDiscountPercent =
  flashSaleStatus === "active"
    ? flashDiscount
    : comparePrice > sellingPrice
      ? Math.round(
          (1 - sellingPrice / comparePrice) *
            100
        )
      : 0;

const displaySaving = Math.max(
  0,
  originalDisplayPrice - salePrice
);

/*
 * Countdown:
 * - upcoming -> tới start_at
 * - active   -> tới end_at
 */
const countdownTarget =
  flashSaleStatus === "upcoming"
    ? flashStartTime
    : flashSaleStatus === "active"
      ? flashEndTime
      : null;

const countdownSeconds =
  countdownTarget !== null
    ? Math.max(
        0,
        Math.floor(
          (countdownTarget - flashNow) /
            1000
        )
      )
    : 0;

const flashCountdown = {
  days: Math.floor(
    countdownSeconds / 86400
  ),
  hours: Math.floor(
    (countdownSeconds % 86400) / 3600
  ),
  minutes: Math.floor(
    (countdownSeconds % 3600) / 60
  ),
  seconds:
    countdownSeconds % 60,
};

async function loadBestVoucher() {





  const productPrice =

    Number(selectedColor?.price) ||

    Number(product.price);



  const { data, error } = await supabase

    .from("vouchers")

    .select("*")

    .eq("active", true)

    .lte("min_order", productPrice);



  if (error) {

    console.error(error);

    setBestVoucher(null);

    return;

  }



  if (!data?.length) {

    setBestVoucher(null);

    return;

  }



  const best = data.sort((a: any, b: any) => {

    const valueA =

      a.type === "percent"

        ? Math.min(productPrice * a.value / 100, a.max_discount)

        : a.value;



    const valueB =

      b.type === "percent"

        ? Math.min(productPrice * b.value / 100, b.max_discount)

        : b.value;



    return valueB - valueA;

  })[0];



  console.log("Voucher:", best);



  setBestVoucher(best);

}



useEffect(() => {



  const handleScroll = () => {



    setShowStickyBuy(window.scrollY > 600);



  };



  window.addEventListener("scroll", handleScroll);



  return () =>

    window.removeEventListener("scroll", handleScroll);



}, []);



useEffect(() => {
  loadFlashSale();
}, [product.id]);

/*
 * ==========================================================
 * LOAD FLASH SALE FOR THIS PRODUCT
 * ==========================================================
 *
 * Không dùng riêng `active` để quyết định giảm giá.
 * active chỉ cho biết Flash Sale đang được bật trong admin.
 *
 * start_at / end_at mới quyết định trạng thái thực tế.
 */
async function loadFlashSale() {
  setFlashSale(null);

  const now = Date.now();

  setFlashNow(now);

  const {
    data,
    error,
  } = await supabase
    .from("flash_sale_products")
    .select(`
      id,
      flash_sale_id,
      created_at,
      flash_sales(
        id,
        title,
        description,
        discount_percent,
        banner_color,
        active,
        start_at,
        end_at
      )
    `)
    .eq(
      "product_id",
      product.id
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(20);

  console.log(
    "FLASH SALE PRODUCT:",
    data
  );

  console.log(
    "FLASH SALE ERROR:",
    error
  );

  if (error) {
    console.error(
      "FLASH SALE LOAD ERROR:",
      error
    );

    return;
  }

  const sales = (data ?? [])
    .map((row: any) =>
      Array.isArray(row.flash_sales)
        ? row.flash_sales[0]
        : row.flash_sales
    )
    .filter(Boolean);

  /*
   * Chỉ giữ Flash Sale active trong admin
   * và chưa hết hạn.
   */
  const validSales =
    sales.filter(
      (sale: any) => {
        if (!sale.active) {
          return false;
        }

        const endTime =
          sale.end_at
            ? new Date(
                sale.end_at
              ).getTime()
            : null;

        if (
          endTime !== null &&
          !Number.isNaN(
            endTime
          ) &&
          now >= endTime
        ) {
          return false;
        }

        return true;
      }
    );

  if (!validSales.length) {
    setFlashSale(null);
    return;
  }

  /*
   * Ưu tiên:
   * 1. Flash Sale đang chạy.
   * 2. Nếu chưa có sale đang chạy,
   *    lấy sale sắp bắt đầu gần nhất.
   */
  const selectedSale =
    validSales.sort(
      (
        a: any,
        b: any
      ) => {
        const aStart =
          a.start_at
            ? new Date(
                a.start_at
              ).getTime()
            : 0;

        const bStart =
          b.start_at
            ? new Date(
                b.start_at
              ).getTime()
            : 0;

        const aIsRunning =
          a.start_at
            ? aStart <= now
            : true;

        const bIsRunning =
          b.start_at
            ? bStart <= now
            : true;

        if (
          aIsRunning &&
          !bIsRunning
        ) {
          return -1;
        }

        if (
          !aIsRunning &&
          bIsRunning
        ) {
          return 1;
        }

        if (
          aIsRunning &&
          bIsRunning
        ) {
          return bStart - aStart;
        }

        return aStart - bStart;
      }
    )[0];

  setFlashSale(
    selectedSale
  );

  setFlashNow(
    Date.now()
  );
}

/*
 * ==========================================================
 * FLASH SALE CLOCK
 * ==========================================================
 *
 * Không cần refresh trang.
 *
 * upcoming -> active
 * active   -> ended
 *
 * sẽ tự động đổi theo thời gian thực.
 */
useEffect(() => {
  if (!flashSale) {
    return;
  }

  const updateNow = () => {
    setFlashNow(
      Date.now()
    );
  };

  updateNow();

  const timer =
    window.setInterval(
      updateNow,
      1000
    );

  return () => {
    window.clearInterval(
      timer
    );
  };
}, [
  flashSale?.id,
  flashSale?.start_at,
  flashSale?.end_at,
]);

useEffect(() => {

  setSelectedColor(product.product_colors?.[0] ?? null);



  setSelectedImage(

    product.image_url ||

    product.product_images?.[0]?.image_url ||

    ""

  );

}, [product.id]);



useEffect(() => {

  loadBestVoucher();

}, [

  selectedColor,

  product.price,

]);



useEffect(() => {

  loadAccessories();

}, []);



async function loadAccessories() {

  const { data, error } = await supabase

    .from("accessories")

    .select("*")

    .eq("active", true)

    .order("created_at");



  if (error) {

    console.error(error);

    return;

  }



  console.log("ACCESSORIES", data);



  setAccessories(data ?? []);

}



const gallery = Array.from(
  new Map(
    (
      selectedColor
        ? [
            ...allImages.filter(
              (img: any) =>
                img.image_type === "video" ||
                img.color_id === selectedColor.id
            ),
            ...allImages.filter(
              (img: any) =>
                img.is_lifestyle === true &&
                img.image_type !== "video"
            ),
          ]
        : allImages
    ).map((img: any, index: number) => [
      img.id ?? `${img.image_url}-${index}`,
      img,
    ])
  ).values()
);

  const selectedMedia = gallery.find(
    (img: any) => img.image_url === selectedImage
  );

  const isVideoMedia = (item: any) =>
    item?.image_type === "video" ||
    /\\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(item?.image_url || "");

  const visibleGallery = showAllImages

  ? gallery

  : gallery.slice(0, 6);



  // Lifestyle section supports both lifestyle images and videos.
  const lifestyleGallery = allImages.filter(
    (img: any) => img.is_lifestyle === true
  );



useEffect(() => {

  if (

    gallery.length &&

    !gallery.find(

      (img) => img.image_url === selectedImage

    )

  ) {

    setSelectedImage(gallery[0].image_url);

  }

}, [selectedColor, product.id, gallery]);



  const inStock = product.stock > 0;



  const USP_ICONS = {

  sparkles: Sparkles,

  lightbulb: Lightbulb,

  shield: ShieldCheck,

  truck: Truck,

  package: PackageCheck,

  leaf: Leaf,

  battery: BatteryCharging,

  usb: Usb,

  touch: Hand,

  clock: Clock3,

};



function addToCart() {



const image =

  selectedImage ||

  selectedColor?.image_url ||

  product.image_url ||

  product.product_images?.[0]?.image_url ||

  null;



const originalPrice =

  Number(product.compare_at_price) ||

  Number(selectedColor?.price) ||

  Number(product.price);







const cartItem = {

  id: product.id,

  slug: product.slug,

  name: product.name,

  price: salePrice,

  image,

  productColorId: selectedColor?.id,

  colorName: selectedColor?.name,

  colorHex: selectedColor?.hex,

};



  console.log("CART ITEM:", cartItem);



  cart.add(cartItem, qty);



  window.dataLayer = window.dataLayer || [];



  window.dataLayer.push({

    event: "add_to_cart",

    ecommerce: {

      currency: "VND",

      value: salePrice,

      items: [

  {

    item_id: product.slug,

    item_name: product.name,

    item_category: product.category_id,

    price: salePrice,

    quantity: qty,

  },

],

    },

  });



  toast.success("Đã thêm vào giỏ");

}



  function buyNow() {

    addToCart();



    navigate({

      to: "/cart",

    });

  }



  const faqs = [

  {

    question: "Sản phẩm có bảo hành và đổi trả không?",

    answer:

      "Có. Tất cả sản phẩm của Olive Living đều được đổi trả trong vòng 15 ngày theo chính sách áp dụng cho từng dòng sản phẩm.",

  },

  {

    question: "Có được kiểm tra hàng trước khi thanh toán?",

    answer:

      "Có. Bạn có thể kiểm tra ngoại quan sản phẩm trước khi nhận hàng theo chính sách của đơn vị vận chuyển.",

  },

  {

    question: "Olive Living có giao hàng toàn quốc không?",

    answer:

      "Có. Olive Living hỗ trợ giao hàng trên toàn quốc.",

  },

  {

    question: "Nếu sản phẩm bị lỗi thì sao?",

    answer:

      "Đội ngũ Olive Living sẽ hỗ trợ đổi trả nếu lỗi từ nhà sản xuất.",

  },

];



  return (



    <div>



  <div className="container-x py-8">



    <nav className="text-xs text-muted-foreground">



      <Link

        to="/"

        className="hover:text-foreground"

      >

        Trang chủ

      </Link>



      {" / "}



      <Link

        to="/shop"

        className="hover:text-foreground"

      >

        Cửa hàng

      </Link>



      {" / "}



      <span className="text-foreground">

        {product.name}

      </span>



    </nav>



  </div>



  <section className="container-x border-t pt-4 pb-16">

    <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">



      {/* =========================================================

          LEFT — PRODUCT GALLERY

         ========================================================= */}

      <div className="min-w-0">

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[72px_minmax(0,1fr)]">



          {/* Thumbnails */}

          <div className="order-2 flex max-h-none flex-row gap-2 overflow-x-auto overflow-y-hidden pb-1 pr-0 lg:order-1 lg:max-h-[640px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1">

            {visibleGallery.map((img: any, index: number) => (

              <button

                type="button"

                key={`${img.id ?? index}-${img.image_url}`}

                onClick={() => setSelectedImage(img.image_url)}

                aria-label={`Xem ảnh ${index + 1}`}

                className={`relative aspect-square w-[64px] shrink-0 overflow-hidden rounded-lg border bg-white shadow-[0_5px_14px_rgba(0,0,0,0.14)] transition lg:w-full ${

                  selectedImage === img.image_url

                    ? "border-neutral-900"

                    : "border-neutral-200 hover:border-neutral-500"

                }`}

              >

                {isVideoMedia(img) ? (
                  <div className="relative h-full w-full bg-neutral-900">
                    <video
                      src={img.image_url}
                      poster={img.thumbnail_url || undefined}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-xs">▶</span>
                    </span>
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[8px] font-semibold uppercase text-white">
                      Video
                    </span>
                  </div>
                ) : (
                  <img
                    src={img.image_url}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                )}

              </button>

            ))}



            {gallery.length > 6 && (

              <button

                type="button"

                onClick={() => setShowAllImages(!showAllImages)}

                className="flex min-h-9 shrink-0 items-center justify-center border border-neutral-200 bg-white text-[9px] uppercase tracking-[0.08em] text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"

              >

                {showAllImages ? "Thu gọn" : `+${gallery.length - 6}`}

              </button>

            )}

          </div>



          {/* Main product image */}

          {/* Outer wrapper: shadow must be outside the overflow-hidden image frame */}

          <div className="order-1 aspect-square w-full min-h-0 rounded-2xl bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] lg:order-2 lg:h-[600px] xl:h-[620px]">

            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F5F4F1]">

              {selectedImage ? (
                isVideoMedia(selectedMedia) ? (
                  <video
                    key={selectedImage}
                    src={selectedImage}
                    controls
                    autoPlay={false}
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                    aria-label={`${product.name} video`}
                  >
                    Trình duyệt của bạn không hỗ trợ phát video.
                  </video>
                ) : (
                  <img
                    key={selectedImage}
                    src={selectedImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (

                <div className="text-xs text-neutral-400">

                  Đang tải hình ảnh...

                </div>

              )}

            </div>

          </div>

        </div>



        <div className="mt-2 hidden justify-between px-1 text-[9px] uppercase tracking-[0.12em] text-neutral-400 lg:flex">

          <span>{gallery.length} hình ảnh</span>

          <span>Olive Living</span>

        </div>

      </div>



      {/* =========================================================

          RIGHT — PRODUCT INFORMATION

         ========================================================= */}

      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start lg:h-full">

        <div className="flex h-full flex-col bg-white p-4 sm:p-5 lg:p-0">



          {/* Brand / stock */}

          <div className="flex items-center justify-between gap-4">

            <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-400">

              Olive Living

            </span>



            <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-neutral-500">

              <span

                className={`h-1.5 w-1.5 rounded-full ${

                  inStock ? "bg-green-600" : "bg-red-500"

                }`}

              />

              {inStock ? "Sẵn hàng" : "Hết hàng"}

            </span>

          </div>



          {/* Product title */}

          <h1 className="mt-2.5 font-display text-[25px] font-normal leading-[1.12] tracking-[-0.025em] text-neutral-900 sm:text-[29px] xl:text-[32px]">

            {product.name}

          </h1>



          {selectedColor?.sku && (

            <div className="mt-2 text-[9px] uppercase tracking-[0.12em] text-neutral-400">

              SKU {selectedColor.sku}

            </div>

          )}



          {/* Rating */}

          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-neutral-500">

            <span className="tracking-[0.08em] text-neutral-900">

              ★★★★★

            </span>

            <span>Đánh giá sản phẩm</span>

          </div>



          {/* Price */}
          <div className="mt-3 border-y border-neutral-200 py-3">

            {originalDisplayPrice > salePrice && (
              <div className="text-[11px] text-neutral-400 line-through">
                {formatVND(
                  originalDisplayPrice
                )}
              </div>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-3">

              <span className="text-[27px] font-medium leading-none tracking-[-0.03em] sm:text-[31px]">
                {formatVND(
                  salePrice
                )}
              </span>

              {displayDiscountPercent > 0 && (
                <span className="bg-neutral-100 px-2 py-1 text-[8px] font-semibold text-neutral-700">
                  -{displayDiscountPercent}%
                </span>
              )}

            </div>

            {flashSaleStatus === "upcoming" && (
              <div className="mt-3 rounded-lg bg-[#FFF6F0] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#D94A1E]">
                      <Clock3 size={12} strokeWidth={1.8} />
                      <span>Flash Sale sắp bắt đầu</span>
                    </div>
                    <p className="mt-1 text-[9px] text-neutral-500">Đừng bỏ lỡ ưu đãi</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-baseline justify-end gap-1 font-semibold tabular-nums text-[#D94A1E]">
                      <span className="text-base">{String(flashCountdown.days).padStart(2, "0")}</span>
                      <span className="text-[8px] font-medium text-neutral-500">NGÀY</span>
                      <span className="px-0.5 text-xs text-orange-300">:</span>
                      <span className="text-sm">{String(flashCountdown.hours).padStart(2, "0")}</span>
                      <span className="text-[8px] font-medium text-neutral-500">:</span>
                      <span className="text-sm">{String(flashCountdown.minutes).padStart(2, "0")}</span>
                      <span className="text-[8px] font-medium text-neutral-500">:</span>
                      <span className="text-sm">{String(flashCountdown.seconds).padStart(2, "0")}</span>
                    </div>
                    <div className="mt-0.5 text-[8px] tracking-wide text-neutral-400">GIỜ · PHÚT · GIÂY</div>
                  </div>
                </div>
              </div>
            )}

            {flashSaleStatus === "active" && (
              <div className="mt-3 rounded-lg bg-[#FFF4EF] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#D94A1E]">
                      <span aria-hidden="true">🔥</span>
                      <span>Flash Sale</span>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-neutral-600">
                      Tiết kiệm {formatVND(displaySaving)}
                    </p>
                  </div>
                  {flashEndTime !== null && (
                    <div className="shrink-0 text-right">
                      <div className="flex items-baseline justify-end gap-1 font-semibold tabular-nums text-[#D94A1E]">
                        <span className="text-base">{String(flashCountdown.days).padStart(2, "0")}</span>
                        <span className="text-[8px] font-medium text-neutral-500">NGÀY</span>
                        <span className="px-0.5 text-xs text-orange-300">:</span>
                        <span className="text-sm">{String(flashCountdown.hours).padStart(2, "0")}</span>
                        <span className="text-[8px] font-medium text-neutral-500">:</span>
                        <span className="text-sm">{String(flashCountdown.minutes).padStart(2, "0")}</span>
                        <span className="text-[8px] font-medium text-neutral-500">:</span>
                        <span className="text-sm">{String(flashCountdown.seconds).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-0.5 text-[8px] tracking-wide text-neutral-400">GIỜ · PHÚT · GIÂY</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {flashSaleStatus !== "active" &&
              flashSaleStatus !== "upcoming" &&
              displaySaving > 0 && (
                <p className="mt-2 text-[10px] font-medium text-[#6B7F4A]">
                  Tiết kiệm{" "}
                  {formatVND(
                    displaySaving
                  )}
                </p>
              )}

          </div>

          {/* Short description */}

          {product.short_description && (

            <p className="mt-2.5 line-clamp-2 text-[11px] leading-[1.55] text-neutral-600">

              {product.short_description}

            </p>

          )}

          {/* Color — understated premium swatch selector */}
          {product.product_colors?.length > 0 && (
            <div className="mt-3 border-y border-neutral-200 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-600">
                  Màu sắc
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.product_colors.map((color: any) => {
                  const isSelected = selectedColor?.id === color.id;
                  return (
                    <button
                      type="button"
                      key={color.id}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedImage("");
                      }}
                      title={color.name}
                      aria-label={`Chọn màu ${color.name}`}
                      aria-pressed={isSelected}
                      className={`group inline-flex min-h-10 items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-neutral-800 bg-white"
                          : "border-transparent bg-transparent hover:border-neutral-300"
                      }`}
                    >
                      {color.image_url ? (
                        <img
                          src={color.image_url}
                          alt=""
                          className={`h-8 w-8 shrink-0 rounded-md border object-cover ${
                            isSelected ? "border-neutral-500" : "border-neutral-200"
                          }`}
                        />
                      ) : (
                        <span
                          className={`h-8 w-8 shrink-0 rounded-md border ${
                            isSelected ? "border-neutral-500" : "border-neutral-200"
                          }`}
                          style={{ background: color.hex || "#ddd" }}
                        />
                      )}
                      <span className="text-[10px] font-semibold text-neutral-900">
                        {color.name}
                      </span>
                      {isSelected && (
                        <Check size={12} className="ml-0.5 text-neutral-800" strokeWidth={2} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {/* Material — compact highlighted specification */}
          {materials.length > 0 && (
            <div className="mt-2.5 flex items-center justify-between gap-3 rounded-md border border-[#E9D8C8] bg-[#FBF6F0] px-3 py-2">
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8A654A]">
                Chất liệu
              </span>
              <span className="text-right text-[11px] font-medium leading-4 text-neutral-800">
                {selectedColor?.material || materials.join(" • ")}
              </span>
            </div>
          )}



          {/* Accessories */}

          {accessories.length > 0 && (

            <div className="mt-3">

              <div className="mb-2 flex items-center justify-between">

                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em]">

                  Mua kèm

                </h3>

                <span className="text-[9px] text-neutral-400">

                  Tùy chọn

                </span>

              </div>



              <div className="divide-y border-y border-neutral-200">

                {accessories.map((item: any) => {

                  const checked =

                    selectedAccessories.includes(item.id);



                  return (

                    <label

                      key={item.id}

                      onClick={() => {

                        if (checked) {

                          remove(item.id);

                          setSelectedAccessories(

                            selectedAccessories.filter(

                              (id) => id !== item.id

                            )

                          );

                        } else {

                          add({

                            id: item.id,

                            slug: "accessory",

                            name: item.name,

                            image: item.image_url,

                            price: Math.round(

                              Number(item.price) * 0.9

                            ),

                            productColorId: undefined,

                            colorName: "Phụ kiện",

                            colorHex: undefined,

                          });



                          setSelectedAccessories([

                            ...selectedAccessories,

                            item.id,

                          ]);

                        }

                      }}

                      className={`flex cursor-pointer items-center justify-between gap-3 py-2.5 ${

                        checked ? "bg-neutral-50" : ""

                      }`}

                    >

                      <div className="flex min-w-0 items-center gap-2.5">

                        <span

                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${

                            checked

                              ? "border-neutral-900 bg-neutral-900"

                              : "border-neutral-300"

                          }`}

                        >

                          {checked && (

                            <Check

                              size={9}

                              className="text-white"

                            />

                          )}

                        </span>



                        <img

                          src={item.image_url}

                          alt={item.name}

                          className="h-9 w-9 shrink-0 object-cover"

                        />



                        <span className="min-w-0 truncate text-[10px] font-medium text-neutral-700">

                          {item.name}

                        </span>

                      </div>



                      <span className="shrink-0 text-[10px] font-medium">

                        {formatVND(

                          Math.round(

                            Number(item.price) * 0.9

                          )

                        )}

                      </span>

                    </label>

                  );

                })}

              </div>

            </div>

          )}



          {/* Quantity / cart */}

          <div className="mt-3">

            <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-neutral-500">

              <span>Số lượng</span>

              <span>

                {inStock

                  ? `Còn ${product.stock}`

                  : "Tạm hết"}

              </span>

            </div>



            <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-2">

              <div className="flex h-11 items-center justify-between overflow-hidden rounded-lg border border-neutral-300 bg-white">

                <motion.button

                  type="button"

                  whileTap={{ scale: 0.9 }}

                  onClick={() =>

                    setQty((q) => Math.max(1, q - 1))

                  }

                  className="flex h-full w-9 items-center justify-center"

                >

                  <Minus size={14} />

                </motion.button>



                <span className="text-sm font-medium">

                  {qty}

                </span>



                <motion.button

                  type="button"

                  whileTap={{ scale: 0.9 }}

                  onClick={() => setQty((q) => q + 1)}

                  className="flex h-full w-9 items-center justify-center"

                >

                  <Plus size={14} />

                </motion.button>

              </div>



              <button

                type="button"

                onClick={addToCart}

                disabled={!inStock}

                className="h-11 rounded-lg bg-[#1F2A1F] px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-[#344334] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300"

              >

                {inStock

                  ? "Thêm vào giỏ"

                  : "Hết hàng"}

              </button>

            </div>



            <button

              type="button"

              onClick={buyNow}

              disabled={!inStock}

              className="mt-2 h-10 w-full rounded-lg border border-[#0878E8] bg-[#0878E8] text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:border-[#0668CC] hover:bg-[#0668CC] active:scale-[0.99] disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300 disabled:text-white"

            >

              Mua ngay

            </button>



            <PaymentMethods />

          </div>



          {/* Shipping / returns / warranty */}

          <div className="mt-auto border-t border-neutral-200">

            <div className="flex items-center gap-3 border-b border-neutral-100 py-2.5">

              <Truck

                size={15}

                strokeWidth={1.5}

                className="shrink-0 text-neutral-600"

              />

              <div className="flex w-full items-center justify-between gap-4">

                <span className="text-[10px] font-medium">

                  Miễn phí giao hàng

                </span>

                <span className="text-[9px] text-neutral-400">

                  Toàn quốc

                </span>

              </div>

            </div>



            <Link
              to="/chinh-sach-doi-hang"
              className="group flex items-center gap-3 border-b border-neutral-100 py-2.5 transition-colors hover:text-[#0878E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0878E8] focus-visible:ring-offset-2 rounded-sm"
              aria-label="Đọc chính sách đổi trả 15 ngày"
            >
              <RotateCcw
                size={15}
                strokeWidth={1.5}
                className="shrink-0 text-neutral-600 transition-colors group-hover:text-[#0878E8]"
              />
              <span className="flex w-full items-center justify-between gap-4">
                <span className="text-[10px] font-semibold text-neutral-800 group-hover:text-[#0878E8]">
                  Đổi trả 15 ngày
                </span>
                <span className="text-[9px] text-neutral-400 transition-colors group-hover:text-[#0878E8]">
                  Xem chính sách ↗
                </span>
              </span>
            </Link>



            <div className="flex items-center gap-3 py-2.5">

              <ShieldCheck

                size={15}

                strokeWidth={1.5}

                className="shrink-0 text-neutral-600"

              />

              <div className="flex w-full items-center justify-between gap-4">

                <span className="text-[10px] font-medium">

                  Bảo hành

                </span>

                <span className="max-w-[190px] text-right text-[9px] text-neutral-400">

                  {product.warranty ||

                    "Theo chính sách sản phẩm"}

                </span>

              </div>

            </div>

          </div>



        </div>

      </aside>

    </div>

  </section>



        <section className="container-x py-4">

          {/* =========================================================

              PRODUCT DETAILS CARD

              Thông số kỹ thuật + Mô tả

             ========================================================= */}

          <div className="max-w-5xl overflow-hidden rounded-xl border border-neutral-200 bg-white">



            {/* =========================

                THÔNG SỐ KỸ THUẬT

                ========================= */}

            <div className="border-b border-neutral-200">

              <button

                type="button"

                onClick={() => setIsSpecsOpen((prev) => !prev)}

                aria-expanded={isSpecsOpen}

                className="

                  flex

                  w-full

                  items-center

                  justify-between

                  gap-4

                  px-5

                  py-5

                  text-left

                  transition-colors

                  hover:bg-neutral-50

                  sm:px-6

                "

              >

                <span className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-900 sm:text-2xl">

                  Thông số kỹ thuật

                </span>



                <span

                  className="

                    flex

                    h-9

                    w-9

                    shrink-0

                    items-center

                    justify-center

                    rounded-full

                    border

                    border-neutral-200

                    text-neutral-600

                    transition-all

                    duration-300

                  "

                >

                  {isSpecsOpen ? (

                    <Minus

                      className="h-4 w-4"

                      strokeWidth={1.5}

                    />

                  ) : (

                    <Plus

                      className="h-4 w-4"

                      strokeWidth={1.5}

                    />

                  )}

                </span>

              </button>



              <div

                className={`

                  grid

                  transition-[grid-template-rows,opacity]

                  duration-300

                  ease-in-out

                  ${

                    isSpecsOpen

                      ? "grid-rows-[1fr] opacity-100"

                      : "grid-rows-[0fr] opacity-0"

                  }

                `}

              >

                <div className="min-h-0 overflow-hidden">

                  <div className="border-t border-neutral-100">

                    {product.product_specifications?.length ? (

                      product.product_specifications

                        .slice()

                        .sort(

                          (a: any, b: any) =>

                            a.sort_order - b.sort_order

                        )

                        .map((item: any) => (

                          <div

                            key={item.id}

                            className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 text-sm last:border-b-0 sm:px-6"

                          >

                            <div className="font-bold text-neutral-900">

                              {item.label}

                            </div>



                            <div className="font-bold text-neutral-700">

                              {item.value}

                            </div>

                          </div>

                        ))

                    ) : (

                      <>

                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 text-sm sm:px-6">

                          <div className="font-bold text-neutral-900">

                            Kích thước

                          </div>

                          <div className="font-bold text-neutral-700">

                            {product.dimensions || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 text-sm sm:px-6">

                          <div className="font-bold text-neutral-900">

                            Chất liệu

                          </div>

                          <div className="font-bold text-neutral-700">

                            {product.material || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 text-sm sm:px-6">

                          <div className="font-bold text-neutral-900">

                            Màu sắc

                          </div>

                          <div className="font-bold text-neutral-700">

                            {product.color || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 text-sm sm:px-6">

                          <div className="font-bold text-neutral-900">

                            Nguồn sáng

                          </div>

                          <div className="font-bold text-neutral-700">

                            {product.light_source || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 text-sm sm:px-6">

                          <div className="font-bold text-neutral-900">

                            Nguồn điện

                          </div>

                          <div className="font-bold text-neutral-700">

                            {product.power_source || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:px-6">

                          <div className="font-bold text-neutral-900">

                            Bảo hành

                          </div>

                          <div className="font-bold text-neutral-700">

                            {product.warranty || "—"}

                          </div>

                        </div>

                      </>

                    )}

                  </div>

                </div>

              </div>

            </div>



            {/* =========================

                MÔ TẢ

                ========================= */}

            <div>

              <button

                type="button"

                onClick={() =>

                  setIsDescriptionOpen((prev) => !prev)

                }

                aria-expanded={isDescriptionOpen}

                className="

                  flex

                  w-full

                  items-center

                  justify-between

                  gap-4

                  px-5

                  py-5

                  text-left

                  transition-colors

                  hover:bg-neutral-50

                  sm:px-6

                "

              >

                <span className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-900 sm:text-2xl">

                  Mô tả

                </span>



                <span

                  className="

                    flex

                    h-9

                    w-9

                    shrink-0

                    items-center

                    justify-center

                    rounded-full

                    border

                    border-neutral-200

                    text-neutral-600

                    transition-all

                    duration-300

                  "

                >

                  {isDescriptionOpen ? (

                    <Minus

                      className="h-4 w-4"

                      strokeWidth={1.5}

                    />

                  ) : (

                    <Plus

                      className="h-4 w-4"

                      strokeWidth={1.5}

                    />

                  )}

                </span>

              </button>



              <div

                className={`

                  grid

                  transition-[grid-template-rows,opacity]

                  duration-300

                  ease-in-out

                  ${

                    isDescriptionOpen

                      ? "grid-rows-[1fr] opacity-100"

                      : "grid-rows-[0fr] opacity-0"

                  }

                `}

              >

                <div className="min-h-0 overflow-hidden">

                  <div className="border-t border-neutral-100 px-5 pb-7 pt-5 sm:px-6">

                    <div

                      className="product-content font-bold leading-7 text-neutral-700"

                      dangerouslySetInnerHTML={{

                        __html: product.description || "",

                      }}

                    />

                  </div>

                </div>

              </div>

            </div>



          {/* =========================

              CÂU HỎI THƯỜNG GẶP

              ========================= */}

          <div className="border-t border-neutral-200">

            <button

              type="button"

              onClick={() => setIsFaqOpen((prev) => !prev)}

              aria-expanded={isFaqOpen}

              className="

                flex

                w-full

                items-center

                justify-between

                gap-4

                px-5

                py-5

                text-left

                transition-colors

                hover:bg-neutral-50

                sm:px-6

              "

            >

              <span className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-900 sm:text-2xl">

                Câu hỏi thường gặp

              </span>



              <span

                className="

                  flex

                  h-9

                  w-9

                  shrink-0

                  items-center

                  justify-center

                  rounded-full

                  border

                  border-neutral-200

                  text-neutral-600

                  transition-all

                  duration-300

                "

              >

                {isFaqOpen ? (

                  <Minus className="h-4 w-4" strokeWidth={1.5} />

                ) : (

                  <Plus className="h-4 w-4" strokeWidth={1.5} />

                )}

              </span>

            </button>



            <div

              className={`

                grid

                transition-[grid-template-rows,opacity]

                duration-300

                ease-in-out

                ${

                  isFaqOpen

                    ? "grid-rows-[1fr] opacity-100"

                    : "grid-rows-[0fr] opacity-0"

                }

              `}

            >

              <div className="min-h-0 overflow-hidden">

                <div className="border-t border-neutral-100 px-5 pb-5 pt-4 sm:px-6">

                  <div className="space-y-2">

                    {faqs.map((faq, index) => (

                      <div

                        key={index}

                        className="overflow-hidden rounded-xl border border-neutral-200 bg-white"

                      >

                        <button

                          type="button"

                          onClick={() =>

                            setOpenFaq(

                              openFaq === index ? null : index

                            )

                          }

                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"

                        >

                          <span className="text-sm font-medium text-neutral-900">

                            {faq.question}

                          </span>



                          <ChevronDown

                            className={`h-4 w-4 shrink-0 transition ${

                              openFaq === index ? "rotate-180" : ""

                            }`}

                          />

                        </button>



                        {openFaq === index && (

                          <div className="border-t border-neutral-100 px-4 py-4 text-sm leading-6 text-neutral-600">

                            {faq.answer}

                          </div>

                        )}

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>



          </div>



        {/* ===========================================

        LIFESTYLE GALLERY

\=========================================== */}



{lifestyleGallery.length > 0 && (



<section className="mt-8">



<div className="mb-10 text-center">



<p className="text-xs uppercase tracking-[0.35em] text-neutral-500">



OLIVE LIVING



</p>



<h2 className="mt-3 text-3xl font-light lg:text-5xl">



Không gian thực tế



</h2>



<p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-500">



Khám phá cách sản phẩm hòa vào không gian sống

theo phong cách Scandinavian hiện đại.



</p>



</div>



<div className="grid gap-4 md:grid-cols-2">



{lifestyleGallery.map((img: any, index: number) => (



<div

key={img.id}

className={`overflow-hidden rounded-[28px] bg-white shadow-[0_16px_36px_-10px_rgba(0,0,0,0.20)]

${

index % 3 === 0

? "md:col-span-2"

: ""

}`}

>



{isVideoMedia(img) ? (
  <div className="relative overflow-hidden bg-black">
    <video
      key={img.id ?? img.image_url}
      src={img.image_url}
      poster={img.thumbnail_url || undefined}
      controls
      playsInline
      preload="metadata"
      aria-label={`${product.name} video`}
      className="block max-h-[720px] w-full object-contain"
    >
      Trình duyệt của bạn không hỗ trợ phát video.
    </video>
    {img.thumbnail_url && (
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        Video
      </span>
    )}
  </div>
) : (
  <img
    src={img.image_url}
    alt={product.name}
    loading="lazy"
    className="block w-full object-cover transition-all duration-700 hover:scale-[1.03]"
  />
)}



</div>



))}



</div>



</section>



)}



{/* ========================= HỖ TRỢ 24/7 ========================= */}

<section className="mt-8">

  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.14)] sm:p-6">

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <div className="flex items-center gap-2">

          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.10)]" />

          <h3 className="text-sm font-semibold text-neutral-900">

            Hỗ trợ 24/7

          </h3>

        </div>



        <p className="mt-1 text-xs leading-5 text-neutral-500">

          Cần tư vấn trước khi mua? Nhắn cho Olive Living, chúng tôi sẽ hỗ trợ bạn.

        </p>

      </div>



      <div className="grid grid-cols-2 gap-2 sm:min-w-[300px]">

        <a

          href={MESSENGER_URL}

          target="_blank"

          rel="noopener noreferrer"

          aria-label="Chat với Olive Living qua Messenger"

          className="group flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-900 hover:shadow-md"

        >

          <svg

            viewBox="0 0 24 24"

            className="h-5 w-5 shrink-0"

            aria-hidden="true"

          >

            <path

              fill="currentColor"

              d="M12 2C6.48 2 2 6.13 2 11.22c0 2.9 1.43 5.48 3.67 7.18V22l3.38-1.86c.94.26 1.93.4 2.95.4 5.52 0 10-4.13 10-9.32S17.52 2 12 2Zm1.02 12.45-2.55-2.72-4.98 2.72 5.49-5.83 2.5 2.72 4.94-2.72-5.4 5.83Z"

            />

          </svg>

          <span>Messenger</span>

        </a>



        <a

          href={ZALO_URL}

          target="_blank"

          rel="noopener noreferrer"

          aria-label="Chat với Olive Living qua Zalo"

          className="group flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-900 hover:shadow-md"

        >

          <span

            className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-neutral-800 text-[8px] font-bold leading-none"

            aria-hidden="true"

          >

            Z

          </span>

          <span>Zalo</span>

        </a>

      </div>

    </div>

  </div>

</section>



      </section>



      {/* ===========================

          QUICK SCROLL BUTTONS

          iPHONE LIQUID GLASS

          =========================== */}

      <div

        className="

          fixed

          right-3

          top-1/2

          z-[55]

          flex

          -translate-y-1/2

          flex-col

          items-center

          gap-1.5

          opacity-60

          sm:right-4

          lg:right-5

        "

        aria-label="Điều hướng trang"

      >

        {/* UP */}

        <button

          type="button"

          onClick={() =>

            window.scrollTo({

              top: 0,

              behavior: "smooth",

            })

          }

          aria-label="Cuộn lên đầu trang"

          title="Lên đầu trang"

          className="

            group

            relative

            flex

            h-9

            w-9

            items-center

            justify-center

            overflow-hidden

            rounded-full



            border border-white/55



            bg-gradient-to-br

            from-white/38

            via-white/18

            to-neutral-300/12



            backdrop-blur-[18px]

            backdrop-saturate-[170%]



            text-neutral-500/75



            shadow-[0_5px_16px_rgba(0,0,0,0.10),inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_1px_rgba(0,0,0,0.04)]



            transition-all

            duration-300

            ease-out



            hover:scale-105

            hover:opacity-90

            hover:text-neutral-800

            hover:shadow-[0_8px_20px_rgba(0,0,0,0.14),inset_0_1px_1px_rgba(255,255,255,0.8)]



            active:scale-90



            before:pointer-events-none

            before:absolute

            before:inset-[2px]

            before:rounded-full

            before:border

            before:border-white/45

            before:content-['']



            after:pointer-events-none

            after:absolute

            after:-left-8

            after:top-[-35%]

            after:h-[170%]

            after:w-5

            after:rotate-[28deg]

            after:bg-gradient-to-b

            after:from-transparent

            after:via-white/70

            after:to-transparent

            after:blur-[5px]

            after:opacity-45

            after:translate-x-[-20px]

            after:transition-transform

            after:duration-700

            group-hover:after:translate-x-[75px]

          "

        >

          <ArrowUp

            size={15}

            strokeWidth={1.6}

            className="

              relative

              z-10

              animate-[quickScrollUp_2.4s_ease-in-out_infinite]

              transition-transform

              duration-300

              group-hover:scale-110

            "

          />

        </button>



        {/* DOWN */}

        <button

          type="button"

          onClick={() =>

            window.scrollTo({

              top: document.documentElement.scrollHeight,

              behavior: "smooth",

            })

          }

          aria-label="Cuộn xuống cuối trang"

          title="Xuống cuối trang"

          className="

            group

            relative

            flex

            h-9

            w-9

            items-center

            justify-center

            overflow-hidden

            rounded-full



            border border-white/55



            bg-gradient-to-br

            from-white/38

            via-white/18

            to-neutral-300/12



            backdrop-blur-[18px]

            backdrop-saturate-[170%]



            text-neutral-500/75



            shadow-[0_5px_16px_rgba(0,0,0,0.10),inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_1px_rgba(0,0,0,0.04)]



            transition-all

            duration-300

            ease-out



            hover:scale-105

            hover:opacity-90

            hover:text-neutral-800

            hover:shadow-[0_8px_20px_rgba(0,0,0,0.14),inset_0_1px_1px_rgba(255,255,255,0.8)]



            active:scale-90



            before:pointer-events-none

            before:absolute

            before:inset-[2px]

            before:rounded-full

            before:border

            before:border-white/45

            before:content-['']



            after:pointer-events-none

            after:absolute

            after:-left-8

            after:top-[-35%]

            after:h-[170%]

            after:w-5

            after:rotate-[28deg]

            after:bg-gradient-to-b

            after:from-transparent

            after:via-white/70

            after:to-transparent

            after:blur-[5px]

            after:opacity-45

            after:translate-x-[-20px]

            after:transition-transform

            after:duration-700

            group-hover:after:translate-x-[75px]

          "

        >

          <ArrowDown

            size={15}

            strokeWidth={1.6}

            className="

              relative

              z-10

              animate-[quickScrollDown_2.4s_ease-in-out_infinite]

              transition-transform

              duration-300

              group-hover:scale-110

            "

          />

        </button>



        <style>{`

          @keyframes quickScrollUp {

            0%, 100% {

              transform: translateY(0);

              opacity: .72;

            }

            50% {

              transform: translateY(-1.5px);

              opacity: 1;

            }

          }



          @keyframes quickScrollDown {

            0%, 100% {

              transform: translateY(0);

              opacity: .72;

            }

            50% {

              transform: translateY(1.5px);

              opacity: 1;

            }

          }

        `}</style>

      </div>





      {related.length > 0 && (
        <section className="container-x py-9 sm:py-12">
          <div className="mb-5 sm:mb-7">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
              Olive Living · Curated Selection
            </p>
            <h2 className="font-display text-[23px] font-normal leading-tight tracking-[-0.025em] text-neutral-900 sm:text-3xl">
              Có thể bạn cũng thích
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:grid-cols-4">
            {related.map((p: any) => {
              const price = Number(p.price) || 0;
              const comparePrice = Number(p.compare_at_price) || 0;
              const flashDiscount = Number(p.relatedFlashDiscount) || 0;
              const hasFlashSale = flashDiscount > 0;
              const salePrice = hasFlashSale
                ? Math.round(price * (1 - flashDiscount / 100))
                : price;
              const originalPrice = hasFlashSale
                ? Math.max(comparePrice, price)
                : comparePrice;
              const hasDiscount = hasFlashSale
                ? originalPrice > salePrice
                : comparePrice > price;
              const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 5;
              const hasExpress = p.express_available === true;

              return (
                <article key={p.id} className="group min-w-0 bg-transparent">
                  <Link
                    to="/products/$slug"
                    params={{ slug: p.slug }}
                    className="relative block aspect-square overflow-hidden rounded-[10px] bg-[#F5F4F1]"
                    aria-label={`Xem ${p.name}`}
                  >
                    <img
                      src={p.image_url || ""}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                    />

                    <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
                      {hasFlashSale && (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-[#D94724] px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-white shadow-sm">
                          <span aria-hidden="true">🔥</span> Flash Sale
                        </span>
                      )}
                      {hasExpress && (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-white/95 px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-[#315B3D] shadow-sm backdrop-blur-sm">
                          <Truck size={10} strokeWidth={2} /> Hỏa tốc
                        </span>
                      )}
                      {!hasFlashSale && isLowStock && (
                        <span className="rounded-sm bg-white/95 px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-neutral-800 shadow-sm backdrop-blur-sm">
                          Sắp hết
                        </span>
                      )}
                    </div>

                    {hasDiscount && (
                      <span className="absolute right-2 top-2 rounded-sm bg-neutral-950/90 px-1.5 py-1 text-[8px] font-semibold text-white">
                        -{hasFlashSale ? flashDiscount : Math.round((1 - price / comparePrice) * 100)}%
                      </span>
                    )}
                  </Link>

                  <div className="pt-3">
                    <Link to="/products/$slug" params={{ slug: p.slug }} className="block">
                      <h3 className="line-clamp-2 min-h-[34px] text-[11px] font-medium leading-[1.5] tracking-[0.01em] text-neutral-800 transition-colors group-hover:text-neutral-950 sm:min-h-[42px] sm:text-[13px]">
                        {getRelatedProductName(p.name)}
                      </h3>
                    </Link>

                    <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[9px]">
                      <span className="inline-flex shrink-0 items-center gap-1 text-neutral-700">
                        <span className="text-[#C9952E]">★</span>
                        <span className="font-medium">4.8</span>
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="truncate text-neutral-400">
                        {isLowStock ? `Còn ${p.stock}` : "Olive Living"}
                      </span>
                    </div>

                    <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                      <span className={`text-[16px] font-semibold leading-5 tracking-[-0.035em] sm:text-[19px] ${hasFlashSale ? "text-[#D94724]" : "text-neutral-900"}`}>
                        {formatVND(salePrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] leading-4 text-neutral-400 line-through sm:text-[11px]">
                          {formatVND(originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_34px] gap-1.5 sm:grid-cols-[minmax(0,1fr)_38px] sm:gap-2">
                      <Link
                        to="/products/$slug"
                        params={{ slug: p.slug }}
                        className="flex h-9 min-w-0 items-center justify-center rounded-md bg-[#0878E8] px-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#0668CC] active:scale-[0.98] sm:h-10 sm:text-[11px]"
                      >
                        Mua ngay
                      </Link>

                      <button
                        type="button"
                        aria-label={`Thêm ${p.name} vào giỏ hàng`}
                        onClick={() => {
                          if (!p.stock || Number(p.stock) <= 0) {
                            toast.error("Sản phẩm hiện đã hết hàng");
                            return;
                          }

                          cart.add(
                            {
                              id: p.id,
                              slug: p.slug,
                              name: p.name,
                              price: salePrice,
                              image: p.image_url || null,
                            },
                            1
                          );

                          toast.success("Đã thêm vào giỏ");
                        }}
                        className="flex h-9 w-[34px] shrink-0 items-center justify-center rounded-md bg-[#F4F5F2] text-neutral-700 transition-colors hover:bg-[#E8EBE4] active:scale-[0.98] sm:h-10 sm:w-[38px]"
                      >
                        <ShoppingCart size={15} strokeWidth={1.7} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* FLOATING FLASH SALE — stays above the mobile sticky buy bar */}
      <FloatingFlashSaleBadge />

      {/* MOBILE STICKY BUY — compact premium bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-transform duration-300 ${
          showStickyBuy ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="border-t border-neutral-200/80 bg-white/95 px-4 pt-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] shadow-[0_-8px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
                <span className="text-[21px] font-bold leading-none tracking-[-0.04em] text-neutral-950">
                  {formatVND(salePrice)}
                </span>
                {originalDisplayPrice > salePrice && (
                  <span className="text-[11px] leading-none text-neutral-400 line-through">
                    {formatVND(originalDisplayPrice)}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                {(flashSaleStatus === "active" || flashSaleStatus === "upcoming") && (
                  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-[9px] font-semibold tabular-nums ${
                    flashSaleStatus === "active"
                      ? "bg-red-50 text-red-600"
                      : "bg-orange-50 text-orange-700"
                  }`}>
                    <Clock3 size={10} strokeWidth={2} />
                    {String(flashCountdown.days).padStart(2, "0")}:{String(flashCountdown.hours).padStart(2, "0")}:{String(flashCountdown.minutes).padStart(2, "0")}:{String(flashCountdown.seconds).padStart(2, "0")}
                  </span>
                )}

                {originalDisplayPrice > salePrice && displaySaving > 0 && (
                  <span className={`whitespace-nowrap text-[9px] font-medium ${
                    flashSaleStatus === "active" ? "text-red-600" : "text-neutral-500"
                  }`}>
                    Tiết kiệm {formatVND(displaySaving)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={buyNow}
              className="h-11 min-w-[116px] shrink-0 rounded-xl bg-[#0878E8] px-5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0668CC] active:scale-[0.98] sm:min-w-[132px] sm:px-7"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

    </div>

  );



}