import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { Fragment,  useEffect, useState } from "react";

import { formatVND } from "@/lib/format";

import { useCart } from "@/lib/cart";

import FloatingFlashSaleBadge from "@/components/FloatingFlashSaleBadge";
import ProductReviews from "@/components/ProductReviews";

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

  Gift,
  Layers3,

  ArrowUp,

  ArrowDown,

  ShoppingCart,
  CreditCard,
  MessageCircle

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





const [selectedImage, setSelectedImage] = useState(() => {
  const firstVideo = (product.product_images ?? []).find(
    (item: any) =>
      item?.image_type === "video" ||
      /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(item?.image_url || ""),
  );

  return firstVideo?.image_url || product.image_url || product.product_images?.[0]?.image_url || "";
});

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
const [mysteryDealProduct, setMysteryDealProduct] = useState<any>(null);
const [mysteryDeal, setMysteryDeal] = useState<any>(null);

useEffect(() => {
  let cancelled = false;
  async function loadMysteryDeal() {
    const now = Date.now();
    const { data: rows, error } = await supabase
      .from("mystery_deal_products")
      .select("id,mystery_deal_id,product_id,discount_percent,quota,sold_count")
      .eq("product_id", product.id);

    if (error) {
      console.warn("[Mystery Jackpot] Could not load product deal:", error);
      if (!cancelled) {
        setMysteryDealProduct(null);
        setMysteryDeal(null);
      }
      return;
    }

    const dealIds = [...new Set((rows ?? []).map((row: any) => row.mystery_deal_id).filter(Boolean))];
    if (!dealIds.length) {
      if (!cancelled) {
        setMysteryDealProduct(null);
        setMysteryDeal(null);
      }
      return;
    }

    const { data: deals, error: dealsError } = await supabase
      .from("mystery_deals")
      .select("id,title,description,start_at,end_at,active")
      .in("id", dealIds)
      .eq("active", true);

    if (dealsError) {
      console.warn("[Mystery Jackpot] Could not load deals:", dealsError);
      return;
    }

    const valid = (rows ?? [])
      .map((row: any) => {
        const deal = (deals ?? []).find((item: any) => item.id === row.mystery_deal_id);
        if (!deal) return null;
        const start = deal.start_at ? new Date(deal.start_at).getTime() : null;
        const end = deal.end_at ? new Date(deal.end_at).getTime() : null;
        const remaining = Math.max(0, Number(row.quota || 0) - Number(row.sold_count || 0));
        const inWindow = (start === null || now >= start) && (end === null || now < end);
        if (!inWindow || remaining <= 0 || Number(row.discount_percent) <= 0) return null;
        return { productDeal: row, deal, start, end, remaining };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.start ?? 0) - (a.start ?? 0));

    if (!cancelled) {
      setMysteryDealProduct(valid[0]?.productDeal ?? null);
      setMysteryDeal(valid[0]?.deal ?? null);
      setFlashNow(now);
    }
  }

  void loadMysteryDeal();
  return () => { cancelled = true; };
}, [product.id]);

useEffect(() => {
  const timer = window.setInterval(() => setFlashNow(Date.now()), 1000);
  return () => window.clearInterval(timer);
}, []);

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

const mysteryStartTime = mysteryDeal?.start_at ? new Date(mysteryDeal.start_at).getTime() : null;
const mysteryEndTime = mysteryDeal?.end_at ? new Date(mysteryDeal.end_at).getTime() : null;
const mysteryRemaining = mysteryDealProduct
  ? Math.max(0, Number(mysteryDealProduct.quota || 0) - Number(mysteryDealProduct.sold_count || 0))
  : 0;
const mysteryDiscount = mysteryDeal && mysteryDealProduct && mysteryDeal.active &&
  (mysteryStartTime === null || flashNow >= mysteryStartTime) &&
  (mysteryEndTime === null || flashNow < mysteryEndTime) &&
  mysteryRemaining > 0
    ? Math.max(0, Number(mysteryDealProduct.discount_percent) || 0)
    : 0;
const hasMysteryDeal = mysteryDiscount > 0;

// Countdown Mystery Jackpot: cập nhật theo flashNow mỗi giây.
const mysteryCountdownSeconds = mysteryEndTime !== null
  ? Math.max(0, Math.floor((mysteryEndTime - flashNow) / 1000))
  : 0;
const mysteryCountdown = {
  days: Math.floor(mysteryCountdownSeconds / 86400),
  hours: Math.floor((mysteryCountdownSeconds % 86400) / 3600),
  minutes: Math.floor((mysteryCountdownSeconds % 3600) / 60),
  seconds: mysteryCountdownSeconds % 60,
};

/* Mystery Jackpot card uses products.price as its base price.
   Do not use selectedColor.price here or the detail page can show a different deal price. */
const salePrice = hasMysteryDeal
  ? Math.round((Number(product.price) || 0) * (1 - mysteryDiscount / 100))
  : flashSaleStatus === "active" && flashDiscount > 0
    ? Math.round(sellingPrice * (1 - flashDiscount / 100))
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
const originalDisplayPrice = hasMysteryDeal
  ? (Number(product.price) || 0)
  : flashSaleStatus === "active"
    ? Math.max(comparePrice, sellingPrice)
    : comparePrice;

const displayDiscountPercent = hasMysteryDeal
  ? mysteryDiscount
  : flashSaleStatus === "active"
    ? flashDiscount
    : comparePrice > sellingPrice
      ? Math.round((1 - sellingPrice / comparePrice) * 100)
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
    Number(product.price) ||
    0;

  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("active", true)
    .lte("min_order", productPrice);

  if (error) {
    console.error("Could not load product vouchers:", error);
    setBestVoucher(null);
    return;
  }

  if (!data?.length) {
    setBestVoucher(null);
    return;
  }

  /*
   * Voucher applicability:
   * - all / general / empty scope: applies to every product
   * - product: applies only to the product whose ID matches apply_id
   * - category: applies only to products whose category_id matches apply_id
   *
   * Keep this display-side eligibility check aligned with the voucher
   * validation used in cart/checkout.
   */
  const eligibleVouchers = data.filter((voucher: any) => {
    const applyType = String(
      voucher.apply_type ?? voucher.apply_scope ?? "all",
    )
      .trim()
      .toLowerCase();

    const applyId = voucher.apply_id ?? voucher.target_id ?? null;

    if (
      !applyType ||
      ["all", "general", "everyone", "all_products", "global"].includes(applyType)
    ) {
      return true;
    }

    if (
      ["product", "specific_product", "products"].includes(applyType)
    ) {
      return applyId != null && String(applyId) === String(product.id);
    }

    if (
      ["category", "specific_category", "categories"].includes(applyType)
    ) {
      return applyId != null && String(applyId) === String(product.category_id);
    }

    // Unknown targeting values should not accidentally be shown on every PDP.
    return false;
  });

  if (!eligibleVouchers.length) {
    setBestVoucher(null);
    return;
  }

  const getDiscountValue = (voucher: any) => {
    const value = Number(voucher.value) || 0;

    if (String(voucher.type).toLowerCase() === "percent") {
      const rawDiscount = (productPrice * value) / 100;
      const maxDiscount = Number(voucher.max_discount);

      return Number.isFinite(maxDiscount) && maxDiscount > 0
        ? Math.min(rawDiscount, maxDiscount)
        : rawDiscount;
    }

    return value;
  };

  const best = [...eligibleVouchers].sort(
    (a: any, b: any) => getDiscountValue(b) - getDiscountValue(a),
  )[0];

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
  const now = Date.now();
  setFlashNow(now);
  setFlashSale(null);

  // Query the product-to-sale mapping first. This avoids losing the
  // Flash Sale when Supabase cannot resolve the nested relation.
  const { data: productSaleRows, error: productSaleError } = await supabase
    .from("flash_sale_products")
    .select("flash_sale_id, created_at")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (productSaleError) {
    console.error("FLASH SALE PRODUCT LOOKUP ERROR:", productSaleError);
    return;
  }

  const saleIds = [
    ...new Set(
      (productSaleRows ?? [])
        .map((row: any) => row.flash_sale_id)
        .filter(Boolean)
    ),
  ];

  if (!saleIds.length) {
    console.info("No Flash Sale linked to product:", product.id);
    return;
  }

  const { data: saleRows, error: saleError } = await supabase
    .from("flash_sales")
    .select("id, title, description, discount_percent, banner_color, active, start_at, end_at")
    .in("id", saleIds)
    .eq("active", true);

  if (saleError) {
    console.error("FLASH SALE DETAILS LOOKUP ERROR:", saleError);
    return;
  }

  const validSales = (saleRows ?? []).filter((sale: any) => {
    const discount = Number(sale.discount_percent);
    if (!sale.active || !Number.isFinite(discount) || discount <= 0 || discount >= 100) {
      return false;
    }

    const startTime = sale.start_at ? new Date(sale.start_at).getTime() : null;
    const endTime = sale.end_at ? new Date(sale.end_at).getTime() : null;

    if (startTime !== null && Number.isNaN(startTime)) return false;
    if (endTime !== null && Number.isNaN(endTime)) return false;
    if (endTime !== null && now >= endTime) return false;

    return true;
  });

  if (!validSales.length) {
    console.info("No valid active/upcoming Flash Sale for product:", product.id);
    return;
  }

  // Prefer a sale currently running. If none is running, show the nearest upcoming sale.
  validSales.sort((a: any, b: any) => {
    const aStart = a.start_at ? new Date(a.start_at).getTime() : 0;
    const bStart = b.start_at ? new Date(b.start_at).getTime() : 0;
    const aRunning = a.start_at ? aStart <= now : true;
    const bRunning = b.start_at ? bStart <= now : true;

    if (aRunning !== bRunning) return aRunning ? -1 : 1;
    return aRunning ? bStart - aStart : aStart - bStart;
  });

  setFlashSale(validSales[0]);
  setFlashNow(Date.now());
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



  const firstVideo = (product.product_images ?? []).find(
    (item: any) =>
      item?.image_type === "video" ||
      /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(item?.image_url || ""),
  );

  setSelectedImage(
    firstVideo?.image_url || product.image_url || product.product_images?.[0]?.image_url || ""
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
  // Cart thumbnails must use a still image, never the currently selected video.
  const selectedImageIsVideo =
    Boolean(selectedImage) &&
    (
      selectedMedia?.image_type === "video" ||
      /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(selectedImage)
    );

  const firstProductStillImage = (product.product_images ?? []).find(
    (item: any) =>
      item?.image_url &&
      item?.image_type !== "video" &&
      !/\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(item.image_url),
  )?.image_url;

  const image =
    (selectedImage && !selectedImageIsVideo ? selectedImage : null) ||
    selectedColor?.image_url ||
    product.image_url ||
    firstProductStillImage ||
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



  <section className="container-x border-t pt-4 pb-5 lg:pb-16">

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

          <div
            className={`order-1 w-full min-h-0 aspect-[4/5] overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] lg:order-2`}
          >

            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F5F4F1]">

              {selectedImage ? (
                isVideoMedia(selectedMedia) ? (
                  <video
                    key={selectedImage}
                    src={selectedImage}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    controls={false}
                    className="h-full w-full object-cover"
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



          {/* Rating — jump to the full review section */}
          <a
            href="#product-reviews"
            className="mt-2.5 inline-flex w-fit items-center gap-2 text-[10px] text-neutral-500 transition-colors hover:text-neutral-900"
            aria-label="Xem phần đánh giá sản phẩm"
          >
            <span className="tracking-[0.08em] text-neutral-900" aria-hidden="true">★★★★★</span>
            <span>Đánh giá sản phẩm</span>
          </a>



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
                <span className="inline-flex items-center rounded-sm bg-[#E53935] px-2 py-1 text-[10px] font-bold text-white">
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

            {hasMysteryDeal ? (
              <div className="mt-3 rounded-lg bg-[#FFF4EF] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#D94A1E]">
                      <Gift size={12} strokeWidth={1.8} aria-hidden="true" />
                      <span>Mystery Jackpot Deals</span>
                    </div>
                    <p className="mt-1 text-[9px] text-neutral-600">Tiết kiệm {formatVND(displaySaving)}</p>
                  </div>
                  {mysteryEndTime !== null && (
                    <div className="shrink-0 text-right text-[#D94A1E]">
                      <div className="flex items-center justify-end gap-1 text-[10px] font-semibold tabular-nums">
                        <Clock3 size={12} strokeWidth={1.8} aria-hidden="true" />
                        <span>{mysteryCountdown.days} ngày</span>
                        <span>·</span>
                        <span>{String(mysteryCountdown.hours).padStart(2, "0")}:{String(mysteryCountdown.minutes).padStart(2, "0")}:{String(mysteryCountdown.seconds).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-0.5 text-[8px] font-medium text-neutral-500">CÒN LẠI</div>
                    </div>
                  )}
                </div>
              </div>
            ) : flashSaleStatus === "active" && (
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

            {!hasMysteryDeal &&
              flashSaleStatus !== "active" &&
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



          {/* Product voucher — responsive green card with live countdown */}
          {bestVoucher && (
            <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-800">
                      {bestVoucher.title || bestVoucher.code}
                    </span>
                    <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                      {String(bestVoucher.type).toLowerCase() === "percent"
                        ? `-${Number(bestVoucher.value)}%`
                        : `-${formatVND(Number(bestVoucher.value) || 0)}`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-700">
                    {bestVoucher.description || "Ưu đãi dành riêng cho sản phẩm này."}
                  </p>
                </div>
                <button
  type="button"
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(String(bestVoucher.code || ""));
      toast.success("Đã sao chép mã voucher");
    } catch {
      toast.error("Không thể sao chép mã. Vui lòng sao chép thủ công.");
    }
  }}
  className="
    group relative isolate inline-flex min-h-10 w-full shrink-0
    items-center justify-center overflow-hidden rounded-full
    border border-emerald-600 bg-white/70 px-4 py-2
    text-[10px] font-bold uppercase tracking-[0.08em]
    text-emerald-700
    shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]
    backdrop-blur transition-all duration-300
    hover:bg-emerald-600 hover:text-white
    active:scale-[0.98]
    sm:w-auto
  "
>
  {/* Mirror shine effect */}
  <span
    aria-hidden="true"
    className="
      pointer-events-none absolute inset-0 z-0
      -translate-x-[150%] skew-x-[-20deg]
      bg-gradient-to-r from-transparent
      via-white/80 to-transparent
      transition-transform duration-700
      group-hover:translate-x-[150%]
    "
  />

  <span className="relative z-10">
    Sao chép mã
  </span>
</button>

              </div>
              {bestVoucher.end_at && (() => {
                const remaining = Math.max(
                  0,
                  Math.floor((new Date(bestVoucher.end_at).getTime() - (flashNow || Date.now())) / 1000),
                );
                const days = Math.floor(remaining / 86400);
                const hours = Math.floor((remaining % 86400) / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                const seconds = remaining % 60;
                const expired = remaining <= 0;
                return (
                  <div className="mt-3 flex flex-col items-center gap-2 border-t border-emerald-100 pt-3">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-emerald-800">
                      <Clock3 size={13} aria-hidden="true" />
                      <span>{expired ? "Voucher đã hết hạn" : "Ưu đãi kết thúc sau"}</span>
                    </div>
                    {!expired && (
                      <div className="flex w-full items-center justify-center gap-1.5 tabular-nums">
                        {[
                          ["Ngày", days],
                          ["Giờ", hours],
                          ["Phút", minutes],
                          ["Giây", seconds],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-[42px] rounded-md bg-emerald-700 px-2 py-1.5 text-center text-white">
                            <div className="text-sm font-semibold leading-4">
                              {String(value).padStart(2, "0")}
                            </div>
                            <div className="mt-0.5 text-[8px] uppercase tracking-wide text-emerald-100">
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

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


          {/* Material — understated, premium US/UK editorial style */}
          {(selectedColor?.material || materials.length > 0 || product.material) && (
            <div className="mt-3 flex min-h-[48px] items-center justify-between gap-4 border-y border-neutral-200 bg-white px-1 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Layers3 size={15} strokeWidth={1.6} className="shrink-0 text-neutral-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                    Material
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium leading-4 text-neutral-900">
                    {selectedColor?.material || materials.join(" · ") || product.material}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-neutral-400">Details</span>
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



            <div className="grid grid-cols-2 items-center gap-2">

              <div className="flex h-10 w-full items-center justify-between overflow-hidden rounded-lg border border-neutral-300 bg-white">

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

                className="h-10 w-full rounded-lg border border-neutral-300 bg-neutral-100 px-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-neutral-700 transition-colors duration-200 hover:border-neutral-400 hover:bg-neutral-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"

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



          {/* Compact trust benefits — 2 × 2 grid */}
          <div className="mt-3 border-t border-neutral-200 pt-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex min-w-0 items-start gap-2 rounded-md border border-neutral-200 px-2 py-2">
                <Truck size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium leading-4 text-neutral-800">Giao hàng toàn quốc</p>
                  <p className="text-[9px] leading-3 text-neutral-400">Theo chính sách vận chuyển</p>
                </div>
              </div>

              <Link
                to="/chinh-sach-doi-hang"
                aria-label="Xem chính sách đổi trả 15 ngày"
                className="flex min-w-0 items-start gap-2 rounded-md border border-neutral-200 px-2 py-2 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0878E8]"
              >
                <RotateCcw size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium leading-4 text-neutral-800">Đổi trả 15 ngày</p>
                  <p className="text-[9px] leading-3 text-neutral-400">Xem điều kiện áp dụng</p>
                </div>
              </Link>

              <div className="flex min-w-0 items-start gap-2 rounded-md border border-neutral-200 px-2 py-2">
                <CreditCard size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium leading-4 text-neutral-800">Thanh toán an toàn</p>
                  <p className="text-[9px] leading-3 text-neutral-400">Nhiều phương thức</p>
                </div>
              </div>

              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Liên hệ tư vấn sản phẩm qua Messenger"
                className="flex min-w-0 items-start gap-2 rounded-md border border-neutral-200 px-2 py-2 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0878E8]"
              >
                <MessageCircle size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium leading-4 text-neutral-800">Tư vấn sản phẩm</p>
                  <p className="text-[9px] leading-3 text-neutral-400">Hỗ trợ qua Messenger</p>
                </div>
              </a>
            </div>
          </div>


        </div>

      </aside>

    </div>

  </section>



        <section className="container-x pt-1 pb-3 sm:pt-3 sm:pb-4">

          {/* =========================================================

              PRODUCT DETAILS CARD

              Thông số kỹ thuật + Mô tả

             ========================================================= */}

          <div className="max-w-5xl overflow-hidden rounded-lg border border-[#E8E8E6] bg-white">



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

                  px-4

                  py-2.5 sm:py-3.5

                  text-left

                  transition-colors

                  hover:bg-neutral-50

                  sm:px-6

                "

              >

                <span className="font-display text-[14px] font-normal tracking-[-0.01em] text-neutral-800 sm:text-[15px]">

                  Thông số kỹ thuật

                </span>



                <span

                  className="

                    flex

                    h-6

                    w-6

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

                      className="h-3.5 w-3.5"

                      strokeWidth={1.5}

                    />

                  ) : (

                    <Plus

                      className="h-3.5 w-3.5"

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

                        .map((item: any, index: number) => (

                          <div

                            key={item.id}

                            className={`grid grid-cols-2 gap-4 border-b border-neutral-100 px-4 py-2.5 text-[12px] leading-5 last:border-b-0 sm:px-5 sm:py-3 ${index % 2 === 0 ? "bg-neutral-50" : "bg-white"}`}

                          >

                            <div className="font-medium text-neutral-800">

                              {item.label}

                            </div>



                            <div className="font-medium text-neutral-600">

                              {item.value}

                            </div>

                          </div>

                        ))

                    ) : (

                      <>

                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-[12px] leading-5 sm:px-5 sm:py-3">

                          <div className="font-medium text-neutral-800">

                            Kích thước

                          </div>

                          <div className="font-medium text-neutral-600">

                            {product.dimensions || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 bg-white px-4 py-2.5 text-[12px] leading-5 sm:px-5 sm:py-3">

                          <div className="font-medium text-neutral-800">

                            Chất liệu

                          </div>

                          <div className="font-medium text-neutral-600">

                            {product.material || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-[12px] leading-5 sm:px-5 sm:py-3">

                          <div className="font-medium text-neutral-800">

                            Màu sắc

                          </div>

                          <div className="font-medium text-neutral-600">

                            {product.color || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 bg-white px-4 py-2.5 text-[12px] leading-5 sm:px-5 sm:py-3">

                          <div className="font-medium text-neutral-800">

                            Nguồn sáng

                          </div>

                          <div className="font-medium text-neutral-600">

                            {product.light_source || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-[12px] leading-5 sm:px-5 sm:py-3">

                          <div className="font-medium text-neutral-800">

                            Nguồn điện

                          </div>

                          <div className="font-medium text-neutral-600">

                            {product.power_source || "—"}

                          </div>

                        </div>



                        <div className="grid grid-cols-2 gap-4 bg-white px-4 py-2.5 text-[12px] leading-5 sm:px-5 sm:py-3">

                          <div className="font-medium text-neutral-800">

                            Bảo hành

                          </div>

                          <div className="font-medium text-neutral-600">

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

                  px-4

                  py-2.5 sm:py-3.5

                  text-left

                  transition-colors

                  hover:bg-neutral-50

                  sm:px-6

                "

              >

                <span className="font-display text-[14px] font-normal tracking-[-0.01em] text-neutral-800 sm:text-[15px]">

                  Mô tả

                </span>



                <span

                  className="

                    flex

                    h-6

                    w-6

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

                      className="h-3.5 w-3.5"

                      strokeWidth={1.5}

                    />

                  ) : (

                    <Plus

                      className="h-3.5 w-3.5"

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

                  <div className="border-t border-neutral-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-3.5">

                    <div

                      className="product-content text-[13px] leading-6 text-neutral-600"

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

                px-4

                py-2.5 sm:py-3.5

                text-left

                transition-colors

                hover:bg-neutral-50

                sm:px-6

              "

            >

              <span className="font-display text-[14px] font-normal tracking-[-0.01em] text-neutral-800 sm:text-[15px]">

                Câu hỏi thường gặp

              </span>



              <span

                className="

                  flex

                  h-6

                  w-6

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

                  <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />

                ) : (

                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />

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

                <div className="border-t border-neutral-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">

                  <div className="divide-y divide-neutral-100">

                    {faqs.map((faq, index) => (

                      <div

                        key={index}

                        className="overflow-hidden bg-white"

                      >

                        <button

                          type="button"

                          onClick={() =>

                            setOpenFaq(

                              openFaq === index ? null : index

                            )

                          }

                          className="flex w-full items-center justify-between gap-4 py-3 text-left"

                        >

                          <span className="text-[13px] font-medium text-neutral-800">

                            {faq.question}

                          </span>



                          <ChevronDown

                            className={`h-4 w-4 shrink-0 transition ${

                              openFaq === index ? "rotate-180" : ""

                            }`}

                          />

                        </button>



                        {openFaq === index && (

                          <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-3 text-[13px] leading-5 text-neutral-600">

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
        LIFESTYLE GALLERY / PRODUCT VIDEOS
        Videos first; lifestyle images underneath.
        =========================================== */}

{lifestyleGallery.length > 0 && (
  <section className="mx-auto mt-12 w-full max-w-[1240px]">
    <div className="mb-7 border-b border-neutral-200 pb-5 md:mb-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
        WATCH
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Product videos
      </h2>
      <p className="mt-2 text-sm text-neutral-500">
        See the details in motion.
      </p>
    </div>

    {/* VIDEO CARDS FIRST — centered, with a balanced 4:5 ratio */}
    <div className="flex w-full justify-center">
      {lifestyleGallery
        .filter((img: any) => isVideoMedia(img))
        .map((img: any, index: number) => (
          <article
            key={img.id ?? img.image_url}
            className="w-full min-w-0 max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
              <video
                key={img.id ?? img.image_url}
                src={img.image_url}
                poster={img.thumbnail_url || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                controls={false}
                disablePictureInPicture
                aria-label={`${product.name} product video ${index + 1}`}
                className="absolute inset-0 block h-full w-full object-cover"
              >
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            </div>
            <div className="bg-[#F5F5F7] px-4 py-4 lg:px-4 lg:py-4">
              <h3 className="text-sm font-semibold text-[#292929]">
                {product.name} — Video {index + 1}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Discover the product from every angle.
              </p>
            </div>
          </article>
        ))}
    </div>

    {/* LIFESTYLE IMAGES BELOW — preserve their natural aspect ratio */}
    {lifestyleGallery.some((img: any) => !isVideoMedia(img)) && (
      <div className="mt-10">
        <div className="mb-6 border-b border-neutral-200 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            LIFESTYLE
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            See it in real life
          </h2>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6">
        {lifestyleGallery
          .filter((img: any) => !isVideoMedia(img))
          .map((img: any) => (
            <div
              key={img.id ?? img.image_url}
              className="w-full min-w-0 overflow-hidden rounded-xl bg-neutral-50"
            >
              <img
                src={img.image_url}
                alt={product.name}
                loading="lazy"
                className="block h-auto w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      </div>
    )}
  </section>
)}



{/* ========================= PRODUCT REVIEWS ========================= */}
<section id="product-reviews" className="container-x mx-auto mt-10 w-full max-w-[1240px] scroll-mt-24 px-0 sm:mt-14">
  <ProductReviews productId={product.id} productName={product.name} />
</section>

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
                <span className="text-[21px] font-bold leading-none tracking-[-0.04em] text-[#0878E8]">
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