import { Link, useNavigate } from "@tanstack/react-router";



import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart";

import { toast } from "sonner";



import {



  X,



  Zap,



  ShoppingCart,



} from "lucide-react";



import { supabase } from "@/integrations/supabase/client";



/* ============================================================



   TYPES



\============================================================ */



type CountdownState = {



  days: number;



  hours: number;



  minutes: number;



  seconds: number;



};



type ProductItem = {



  product_id: string;



  products?: {



    id: string;



    name: string;



    price: number;



    slug?: string | null;



    image_url?: string | null;



    express_available?: boolean | null;



  } | null;



};



/* ============================================================



   HELPERS



\============================================================ */



/**



 * Rút gọn tên sản phẩm.



 *



 * Ví dụ:



 *



 * ĐÈN CAO ĐỨNG HALF ROUND SINGLE



 * – THIẾT KẾ TỐI GIẢN



 *



 * =>



 *



 * ĐÈN CAO ĐỨNG HALF ROUND SINGLE



 */



function getShortProductName(name?: string | null) {



  if (!name) return "";



  return name



    .trim()



    .split(/[–—]/)[0]



    .replace(/\s*-\s*(THIẾT KẾ|PHONG CÁCH|VÂN GỖ|NGHỆ THUẬT).*$/i, "")



    .replace(/\s*\([^)]*\)\s*$/, "")



    .replace(/\s+/g, " ")



    .trim();



}



function formatPrice(



  value: number



) {



  return (



    value.toLocaleString("vi-VN") +



    "đ"



  );



}



/* ============================================================



   FORMAT DATE



\============================================================ */



function formatFlashSaleDate(



  date?: string | null



) {



  if (!date) {



    return "";



  }



  return new Date(



    date



  ).toLocaleString(



    "vi-VN",



    {



      day: "2-digit",



      month: "2-digit",



      year: "numeric",



      hour: "2-digit",



      minute: "2-digit",



    }



  );



}



/* ============================================================



   COUNTDOWN CALCULATOR



\============================================================ */



function calculateCountdown(



  target?: string | null



): CountdownState {



  if (!target) {



    return {



      days: 0,



      hours: 0,



      minutes: 0,



      seconds: 0,



    };



  }



  const diff =



    new Date(target).getTime() -



    Date.now();



  if (diff <= 0) {



    return {



      days: 0,



      hours: 0,



      minutes: 0,



      seconds: 0,



    };



  }



  const totalSeconds =



    Math.floor(



      diff / 1000



    );



  return {



    days: Math.floor(



      totalSeconds / 86400



    ),



    hours: Math.floor(



      (totalSeconds % 86400) /



        3600



    ),



    minutes: Math.floor(



      (totalSeconds % 3600) /



        60



    ),



    seconds:



      totalSeconds % 60,



  };



}



/* ============================================================



   COMPONENT



\============================================================ */



export default function FlashSale() {



  const navigate = useNavigate();

  const { add } = useCart();



  const [sale, setSale] =



    useState<any>(null);



  const [products, setProducts] =



    useState<ProductItem[]>([]);



  const [timeLeft, setTimeLeft] =



    useState<CountdownState>({



      days: 0,



      hours: 0,



      minutes: 0,



      seconds: 0,



    });



  /* ==========================================================



     POPUP STATE



  ========================================================== */



  const [



    showStartPopup,



    setShowStartPopup,



  ] = useState(false);



  const [



    selectedProductName,



    setSelectedProductName,



  ] = useState("");



  /* ==========================================================



     LOAD FLASH SALE



  ========================================================== */



  useEffect(() => {



    loadFlashSale();



  }, []);



  /* ==========================================================



     COUNTDOWN



  ========================================================== */



  useEffect(() => {



    if (



      !sale?.start_at &&



      !sale?.end_at



    ) {



      return;



    }



    const updateCountdown = () => {



      const now =



        Date.now();



      const startTime =



        sale?.start_at



          ? new Date(



              sale.start_at



            ).getTime()



          : null;



      const endTime =



        sale?.end_at



          ? new Date(



              sale.end_at



            ).getTime()



          : null;



      /*



       * ==========================================



       * CHƯA BẮT ĐẦU



       * ==========================================



       */



      if (



        startTime !== null &&



        now < startTime



      ) {



        setTimeLeft(



          calculateCountdown(



            sale.start_at



          )



        );



        return;



      }



      /*



       * ==========================================



       * ĐANG FLASH SALE



       * ==========================================



       */



      if (



        endTime !== null &&



        now < endTime



      ) {



        setTimeLeft(



          calculateCountdown(



            sale.end_at



          )



        );



        return;



      }



      /*



       * ==========================================



       * ĐÃ KẾT THÚC



       * ==========================================



       */



      setTimeLeft({



        days: 0,



        hours: 0,



        minutes: 0,



        seconds: 0,



      });



    };



    updateCountdown();



    const timer =



      window.setInterval(



        updateCountdown,



        1000



      );



    return () => {



      window.clearInterval(



        timer



      );



    };



  }, [



    sale?.start_at,



    sale?.end_at,



  ]);



  /* ==========================================================



     LOAD SALE + PRODUCTS



  ========================================================== */



  async function loadFlashSale() {



    const now =



      new Date().toISOString();



    console.log(



      "FLASH SALE NOW:",



      now



    );



    const {



      data: flashSale,



      error,



    } = await supabase



      .from("flash_sales")



      .select("*")



      .eq("active", true)



      .order("created_at", {



        ascending: false,



      })



      .limit(1)



      .maybeSingle();



    console.log(



      "FLASH SALE:",



      flashSale



    );



    if (error) {



      console.error(



        "FLASH SALE ERROR:",



        error



      );



    }



    if (!flashSale) {



      return;



    }



    /* ========================================================



       CHECK EXPIRED



    ======================================================== */



    const endTime =



      new Date(



        flashSale.end_at



      ).getTime();



    if (



      !Number.isNaN(endTime) &&



      Date.now() > endTime



    ) {



      return;



    }



    setSale(



      flashSale



    );



    /* ========================================================



       LOAD PRODUCTS



    ======================================================== */



    const {



      data: saleProducts,



      error:



        productsError,



    } = await supabase



      .from(



        "flash_sale_products"



      )



      .select(`



        product_id,



        products(



          id,



          name,



          price,



          slug,



          image_url,



          express_available



        )



      `)



      .eq(



        "flash_sale_id",



        flashSale.id



      );



    if (productsError) {



      console.error(



        "FLASH SALE PRODUCTS ERROR:",



        productsError



      );



    }



    console.log(



      "FLASH SALE PRODUCTS:",



      saleProducts



    );



    setProducts(



      (saleProducts ??



        []) as ProductItem[]



    );



  }



  /* ==========================================================



     NO SALE



  ========================================================== */



  if (!sale) {



    return null;



  }



  /* ==========================================================



     SALE STATUS



  ========================================================== */



  const now =



    Date.now();



  const startTime =



    sale?.start_at



      ? new Date(



          sale.start_at



        ).getTime()



      : null;



  const endTime =



    sale?.end_at



      ? new Date(



          sale.end_at



        ).getTime()



      : null;



  const saleHasStarted =



    startTime === null ||



    now >= startTime;



  const saleHasEnded =



    endTime !== null &&



    now >= endTime;



  const countdownLabel =



    saleHasEnded



      ? "Flash Sale đã kết thúc"



      : saleHasStarted



        ? "Kết thúc sau"



        : "Bắt đầu sau";



  /* ==========================================================



     COLORS



  ========================================================== */



  const accentColor =



    sale?.banner_color ||



    "#D97745";



  const discount =



    Number(



      sale?.discount_percent ??



        0



    );



  /* ==========================================================



     BUY NOW



  ========================================================== */



  const handleBuyNow = (product: ProductItem["products"]) => {



    if (!product) return;



    // Flash Sale chưa bắt đầu: giữ nguyên popup thông báo.



    if (!saleHasStarted) {



      setSelectedProductName(getShortProductName(product.name));



      setShowStartPopup(true);



      return;



    }



    // Đã tới thời gian Flash Sale: mở trang chi tiết đúng sản phẩm.



    if (product.slug) {



      navigate({



        to: "/products/$slug",



        params: { slug: product.slug },



      });



    }



  };



  const handleAddToCart = (product: ProductItem["products"], salePrice: number) => {

    if (!product) return;



    if (!saleHasStarted) {

      setSelectedProductName(getShortProductName(product.name));

      setShowStartPopup(true);

      return;

    }



    if (saleHasEnded) {

      toast.error("Flash Sale đã kết thúc.");

      return;

    }



    if (!product.slug) {

      toast.error("Không tìm thấy đường dẫn sản phẩm.");

      return;

    }



    add({

      id: product.id,

      slug: product.slug,

      name: product.name,

      price: salePrice,

      image: product.image_url ?? null,

    }, 1);

    toast.success("Đã thêm vào giỏ hàng");

  };



  return (



    <>

      <style>{`
        .countdown-shimmer {
          background: linear-gradient(110deg, transparent 15%, rgba(255, 224, 204, .7) 45%, rgba(255,255,255,.9) 50%, rgba(255, 224, 204, .55) 55%, transparent 85%);
          transform: translateX(-110%);
          animation: countdown-shimmer-sweep 3.2s ease-in-out infinite;
        }
        @keyframes countdown-shimmer-sweep {
          0%, 15% { transform: translateX(-110%); }
          70%, 100% { transform: translateX(110%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .countdown-shimmer { animation: none; }
        }
      `}</style>



      <style>{`@keyframes flashSaleShimmer{0%{transform:translateX(-160%) skewX(-18deg);opacity:0}12%{opacity:.85}38%{transform:translateX(340%) skewX(-18deg);opacity:0}100%{transform:translateX(340%) skewX(-18deg);opacity:0}}@media(prefers-reduced-motion:reduce){.flash-sale-shimmer{animation:none!important}}`}</style>

      <section



        className="



          w-full



          py-7



          sm:py-9



          lg:py-12



        "



      >



        <div



          className="



            mx-auto



            w-full



            max-w-[1440px]



            px-4



            sm:px-6



            lg:px-8



          "



        >



          {/* ==================================================



              MAIN CONTAINER



          ================================================== */}



          <div



            className="



              relative



              overflow-hidden



              rounded-[20px]



              bg-[#FAF9F6]



              px-4



              py-5



              sm:rounded-[24px]



              sm:px-6



              sm:py-6



              lg:px-8



              lg:py-7



            "



            style={{

              backgroundImage: [

                "radial-gradient(circle at 8% 16%, rgba(255, 106, 0, 0.09) 0 2px, transparent 2.5px)",

                "radial-gradient(circle at 92% 22%, rgba(220, 140, 88, 0.12) 0 2px, transparent 2.5px)",

                "radial-gradient(circle at 15% 58%, rgba(255, 106, 0, 0.06) 0 3px, transparent 3.5px)",

                "radial-gradient(circle at 87% 72%, rgba(220, 140, 88, 0.08) 0 3px, transparent 3.5px)",

                "repeating-linear-gradient(135deg, transparent 0 34px, rgba(220, 140, 88, 0.035) 34px 35px, transparent 35px 68px)",

              ].join(", "),

            }}



          >



            {/* Voucher-style decorations spread across the whole Flash Sale panel */}

            <div

              aria-hidden="true"

              className="pointer-events-none absolute inset-0 overflow-hidden"

            >

              <span className="absolute left-[2%] top-[15%] -rotate-12 select-none text-[30px] font-black uppercase tracking-tight text-[#FF6A00] opacity-[0.13] sm:text-4xl lg:text-5xl">

                Discount!

              </span>

              <span className="absolute right-[3%] top-[34%] rotate-12 select-none text-[26px] font-black uppercase tracking-tight text-[#FF6A00] opacity-[0.12] sm:text-3xl lg:text-4xl">

                Discount!

              </span>

              <span className="absolute bottom-[22%] left-[4%] rotate-6 select-none text-[25px] font-black uppercase tracking-tight text-[#C8794A] opacity-[0.12] sm:text-3xl lg:text-4xl">

                Discount!

              </span>

              <span className="absolute bottom-[8%] right-[8%] -rotate-12 select-none text-[30px] font-black uppercase tracking-tight text-[#C8794A] opacity-[0.13] sm:text-4xl lg:text-5xl">

                Discount!

              </span>

              <svg className="absolute right-[7%] top-[12%] h-14 w-14 text-[#FF6A00] opacity-[0.15] sm:h-20 sm:w-20 lg:h-24 lg:w-24" viewBox="0 0 48 48" fill="none">

                <path d="M24 4a20 20 0 1 1-14.2 5.9M4 4v12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.5" />

                <circle cx="30" cy="30" r="3" stroke="currentColor" strokeWidth="2.5" />

                <path d="M31 17 17 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

              </svg>

              <svg className="absolute bottom-[31%] right-[5%] h-12 w-12 text-[#C8794A] opacity-[0.14] sm:h-16 sm:w-16 lg:h-20 lg:w-20" viewBox="0 0 48 48" fill="none">

                <path d="M24 4a20 20 0 1 1-14.2 5.9M4 4v12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.5" />

                <circle cx="30" cy="30" r="3" stroke="currentColor" strokeWidth="2.5" />

                <path d="M31 17 17 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

              </svg>

            </div>



            {/* ==================================================



                HEADER



            ================================================== */}



            <div



              className="



                flex



                items-center



                justify-between



                gap-4



              "



            >



              {/* LABEL */}



              <div



                className="



                  flex



                  min-w-0



                  items-center



                  gap-2



                "



              >



                <span



                  className="



                    h-1.5



                    w-1.5



                    shrink-0



                    rounded-full



                  "



                  style={{



                    backgroundColor:



                      accentColor,



                  }}



                />



                <span



                  className="



                    truncate



                    text-[10px]



                    font-semibold



                    uppercase



                    tracking-[0.2em]



                    text-neutral-700



                    sm:text-xs



                  "



                >



                  Flash Sale · 10.10



                </span>



              </div>



            </div>



            {/* ==================================================



                TITLE



            ================================================== */}



            <div



              className="



                mt-4



                flex



                flex-col



                gap-4



                lg:flex-row



                lg:items-end



                lg:justify-between



              "



            >



              <div



                className="



                  min-w-0



                  flex-1



                "



              >



                <h2



                  className="



                    font-display



                    text-[25px]



                    font-normal



                    leading-[1.08]



                    tracking-[-0.025em]



                    text-neutral-900



                    sm:text-3xl



                    lg:text-[40px]



                  "



                >



                  {sale?.title ||



                    "10.10 Olive Flash Sale"}



                  <span



                    className="



                      ml-1.5



                    "



                    style={{



                      color:



                        accentColor,



                    }}



                  >



                    {discount}%



                  </span>



                </h2>



                <p



                  className="



                    mt-2



                    max-w-[760px]



                    text-[11px]



                    leading-[1.55]



                    text-neutral-500



                    sm:text-sm



                  "



                >



                  {sale?.description}



                </p>



                {/* Premium urgency countdown: large days + compact clock */}
                {!saleHasEnded && (
                  <div className="relative mt-4 w-full max-w-[440px] overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-white via-[#FFFAF6] to-[#FFF0E5] p-3 shadow-[0_12px_30px_rgba(217,105,55,0.18)] ring-1 ring-white sm:mt-5 sm:p-4">
                    <div aria-hidden="true" className="countdown-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                      <div className="relative flex w-[84px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#F28A50] via-[#E8753C] to-[#C95028] px-2 py-3 text-white shadow-[0_6px_16px_rgba(217,105,55,0.28)] sm:w-[104px] sm:py-4">
                        <span className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/80 sm:text-[9px]">Còn lại</span>
                        <span className="text-[30px] font-black leading-none tracking-[-0.05em] tabular-nums sm:text-[38px]">{String(timeLeft.days).padStart(2, "0")}</span>
                        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white sm:text-[10px]">Ngày</span>
                        <span aria-hidden="true" className="absolute -right-4 -top-4 h-12 w-12 rounded-full border border-white/20" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8753C] opacity-50" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8753C]" />
                          </span>
                          <span className="truncate text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#B9572C] sm:text-[10px]">{countdownLabel}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                          <CountdownBox value={timeLeft.hours} label="Giờ" />
                          <CountdownBox value={timeLeft.minutes} label="Phút" />
                          <CountdownBox value={timeLeft.seconds} label="Giây" accent />
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#F6DCCB]">
                          <div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#F6A06B] via-[#E8753C] to-[#C95028]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                            {/* MAIN CTA */}



              <Link



                to="/flashsale"



                className="



                  relative



                  isolate



                  overflow-hidden



                  flex



                  h-9



                  w-full



                  shrink-0



                  items-center



                  justify-center



                  rounded-full



                  px-5



                  text-[11px]



                  font-semibold



                  text-white



                  transition



                  hover:opacity-90



                  active:scale-[0.98]



                  sm:h-10



                  sm:w-fit



                  sm:px-6



                  sm:text-xs



                  lg:min-w-[140px]



                "



                style={{



                  backgroundColor:



                    accentColor,



                }}



              >



                <span
                  aria-hidden="true"
                  className="flash-sale-shimmer pointer-events-none absolute inset-y-0 left-0 z-0 w-[38%]"
                  style={{
                    background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.82) 50%, rgba(255,255,255,0.12) 72%, transparent 100%)",
                    animation: "flashSaleShimmer 2.8s ease-in-out infinite",
                  }}
                />
                <span className="relative z-10 inline-flex items-center">
                  Xem Tất Cả



                  <span className="ml-1">



                  →



                  </span>
                </span>



              </Link>



            </div>



            {/* ==================================================



                PRODUCTS



            ================================================== */}



            <div



              className="



                mt-5



                grid



                grid-cols-2



                gap-x-2.5



                gap-y-5



                sm:mt-6



                sm:gap-4



                lg:grid-cols-4



              "



            >



              {products



                .slice(0, 4)



                .map(



                  (



                    item: ProductItem



                  ) => {



                    const product =



                      item.products;



                    if (!product) {



                      return null;



                    }



                    /* ==========================================



                       PRICE



                    ========================================== */



                    const oldPrice =



                      Number(



                        product.price ??



                          0



                      );



                    const salePrice =



                      Math.round(



                        oldPrice *



                          (100 -



                            discount) /



                          100



                      );



                    const saving =



                      oldPrice -



                      salePrice;



                    const percent =



                      oldPrice > 0



                        ? Math.round(



                            ((oldPrice -



                              salePrice) /



                              oldPrice) *



                              100



                          )



                        : 0;



                    /* ==========================================



                       NAME



                    ========================================== */



                    const displayName =



                      getShortProductName(



                        product.name



                      );



                    /* ==========================================



                       EXPRESS



                    ========================================== */



                    const isExpress =



                      product.express_available ===



                      true;



                    return (



                      <div



                        key={



                          product.id



                        }



                        className="



                          group



                          min-w-0



                        "



                      >



                        {/* ====================================



                            IMAGE



                        ==================================== */}



                        <div



                          className="



                            relative



                            aspect-square



                            overflow-hidden



                            rounded-xl



                            bg-[#F1EFEB]



                            sm:rounded-2xl



                          "



                        >



                          <img



                            src={



                              product.image_url ||



                              "/placeholder.svg"



                            }



                            alt={



                              product.name



                            }



                            loading="lazy"



                            className="



                              h-full



                              w-full



                              object-cover



                              transition-transform



                              duration-500



                              group-hover:scale-[1.02]



                            "



                          />



                          {/* DISCOUNT */}



                          {percent >



                            0 && (



                            <span



                              className="



                                absolute



                                left-2



                                top-2



                                rounded-md



                                bg-[#FF3B30]



                                px-1.5



                                py-1



                                text-[9px]



                                font-semibold



                                leading-none



                                text-white



                                sm:left-3



                                sm:top-3



                                sm:px-2



                                sm:text-[10px]



                              "



                            >



                              -{percent}%



                            </span>



                          )}



                          {/* EXPRESS */}



                          {isExpress && (



                            <span



                              className="



                                absolute



                                bottom-2



                                left-2



                                inline-flex



                                items-center



                                gap-1



                                rounded-md



                                bg-white/95



                                px-1.5



                                py-1



                                text-[8px]



                                font-semibold



                                leading-none



                                text-[#E8753C]



                                shadow-sm



                                backdrop-blur-sm



                                sm:bottom-3



                                sm:left-3



                                sm:px-2



                                sm:text-[9px]



                              "



                            >



                              <Zap



                                size={9}



                                strokeWidth={



                                  2.2



                                }



                                fill="currentColor"



                              />



                              Hỏa tốc



                            </span>



                          )}



                        </div>



                        {/* ====================================



                            PRODUCT INFO



                        ==================================== */}



                        <div



                          className="



                            pt-2



                            sm:pt-2.5



                          "



                        >



                          {/* NAME */}



                          <h3



                            className="



                              line-clamp-2



                              min-h-[30px]



                              text-[10px]



                              font-medium



                              leading-[1.4]



                              tracking-[-0.01em]



                              text-neutral-700



                              sm:min-h-[34px]



                              sm:text-xs



                            "



                            title={



                              product.name



                            }



                          >



                            {displayName}



                          </h3>



                          {/* PRICE */}



                          <div



                            className="



                              mt-1



                              flex



                              items-baseline



                              gap-1.5



                              whitespace-nowrap



                            "



                          >



                            <span



                              className="



                                text-[15px]



                                font-semibold



                                leading-none



                                tracking-tight



                                sm:text-base



                              "



                              style={{



                                color:



                                  accentColor,



                              }}



                            >



                              {formatPrice(



                                salePrice



                              )}



                            </span>



                            {oldPrice >



                              salePrice && (



                              <span



                                className="



                                  text-[8px]



                                  text-neutral-400



                                  line-through



                                  sm:text-[10px]



                                "



                              >



                                {formatPrice(



                                  oldPrice



                                )}



                              </span>



                            )}



                          </div>



                          {/* SAVING */}



                          {saving > 0 && (



                            <p



                              className="



                                mt-1



                                text-[8px]



                                leading-none



                                text-neutral-400



                                sm:text-[10px]



                              "



                            >



                              Tiết kiệm{" "}



                              <span



                                className="



                                  font-medium



                                "



                                style={{



                                  color:



                                    accentColor,



                                }}



                              >



                                {formatPrice(



                                  saving



                                )}



                              </span>



                            </p>



                          )}



                          <div className="mt-2 grid w-full grid-cols-[7fr_3fr] items-stretch gap-1">

                            <button

                              type="button"

                              onClick={() => handleBuyNow(product)}

                              className="relative isolate flex h-8 min-w-0 items-center justify-center gap-1 overflow-hidden rounded-full px-1 text-[10px] font-semibold leading-none text-white shadow-sm transition hover:brightness-105 active:scale-[0.98] sm:h-9 sm:px-2 sm:text-xs"

                              style={{ backgroundColor: accentColor }}

                            >

                              <span aria-hidden="true" className="flash-sale-shimmer pointer-events-none absolute inset-y-0 left-0 z-0 w-[38%]" style={{ background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.78) 50%, rgba(255,255,255,0.12) 72%, transparent 100%)", animation: "flashSaleShimmer 2.8s ease-in-out infinite" }} />

                              <Zap size={11} className="relative z-10 shrink-0" aria-hidden="true" />

                              <span className="relative z-10 truncate">Mua ngay</span>

                            </button>

                            <button

                              type="button"

                              onClick={() => handleAddToCart(product, salePrice)}

                              aria-label={`Thêm ${product.name} vào giỏ hàng`}

                              title="Thêm vào giỏ hàng"

                              className="flex h-8 min-w-0 items-center justify-center gap-0.5 overflow-hidden rounded-full border border-neutral-300 bg-white px-0.5 text-[10px] font-semibold leading-none text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50 active:scale-[0.98] sm:h-9 sm:gap-1 sm:px-2 sm:text-xs"

                            >

                              <ShoppingCart size={12} className="shrink-0" aria-hidden="true" />

                              <span className="hidden truncate sm:inline">Thêm giỏ</span>

                            </button>

                          </div>



                        </div>



                      </div>



                    );



                  }



                )}



            </div>



            {/* Subtle decorative footer under the Flash Sale products */}

            <div

              aria-hidden="true"

              className="relative mt-5 h-7 overflow-hidden sm:mt-6 sm:h-9"

            >

              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#E9D8C9] to-transparent" />

              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 bg-[#FAF9F6] px-3">

                <span className="h-1.5 w-1.5 rounded-full bg-[#E9B79A]" />

                <span className="h-2 w-2 rotate-45 border border-[#E5B69A]" />

                <span className="h-1.5 w-1.5 rounded-full bg-[#E9B79A]" />

              </div>

              <div className="absolute bottom-0 left-[12%] h-3 w-16 rounded-t-full border-t border-x border-[#EEDFD4] opacity-70 sm:left-[18%] sm:w-24" />

              <div className="absolute bottom-0 right-[12%] h-3 w-16 rounded-t-full border-t border-x border-[#EEDFD4] opacity-70 sm:right-[18%] sm:w-24" />

            </div>



          </div>



        </div>



      </section>



      {/* ========================================================



          FLASH SALE NOT STARTED POPUP



      ======================================================== */}



      {showStartPopup && (



        <div



          className="



            fixed



            inset-0



            z-[9999]



            flex



            items-center



            justify-center



            bg-black/40



            px-5



            backdrop-blur-[3px]



          "



          onClick={() =>



            setShowStartPopup(



              false



            )



          }



        >



          <div



            className="



              relative



              w-full



              max-w-[390px]



              overflow-hidden



              rounded-2xl



              bg-white



              p-6



              shadow-2xl



            "



            onClick={(event) =>



              event.stopPropagation()



            }



          >



            {/* CLOSE */}



            <button



              type="button"



              aria-label="Đóng"



              onClick={() =>



                setShowStartPopup(



                  false



                )



              }



              className="



                absolute



                right-4



                top-4



                flex



                h-8



                w-8



                items-center



                justify-center



                rounded-full



                bg-neutral-100



                text-neutral-500



                transition



                hover:bg-neutral-200



              "



            >



              <X size={16} />



            </button>



            {/* ICON */}



            <div



              className="



                flex



                h-11



                w-11



                items-center



                justify-center



                rounded-full



                bg-[#FFF3EC]



                text-xl



              "



            >



              🔥



            </div>



            {/* TITLE */}



            <h3



              className="



                mt-4



                pr-8



                font-display



                text-2xl



                leading-tight



                text-neutral-900



              "



            >



              Flash Sale



              chưa bắt đầu



            </h3>



            {/* PRODUCT */}



            {selectedProductName && (



              <p



                className="



                  mt-2



                  text-sm



                  font-medium



                  text-neutral-800



                "



              >



                {selectedProductName}



              </p>



            )}



            {/* DESCRIPTION */}



            <p



              className="



                mt-2



                text-sm



                leading-6



                text-neutral-500



              "



            >



              Sản phẩm này sẽ được



              áp dụng mức giá Flash



              Sale khi chương trình



              chính thức bắt đầu.



            </p>



            {/* START DATE */}



            {sale?.start_at && (



              <div



                className="



                  mt-5



                  rounded-xl



                  bg-[#FAF9F6]



                  px-4



                  py-3



                "



              >



                <p



                  className="



                    text-[10px]



                    font-medium



                    uppercase



                    tracking-[0.12em]



                    text-neutral-400



                  "



                >



                  Bắt đầu lúc



                </p>



                <p



                  className="



                    mt-1



                    text-sm



                    font-semibold



                    text-[#E8753C]



                  "



                >



                  {formatFlashSaleDate(



                    sale.start_at



                  )}



                </p>



              </div>



            )}



            {/* COUNTDOWN */}



            {!saleHasStarted && (



              <div



                className="



                  mt-4



                  flex



                  items-center



                  justify-center



                  gap-1.5



                "



              >



                <MiniTime



                  value={



                    timeLeft.days



                  }



                  label="ngày"



                />



                <span className="text-neutral-300">



                  :



                </span>



                <MiniTime



                  value={



                    timeLeft.hours



                  }



                  label="giờ"



                />



                <span className="text-neutral-300">



                  :



                </span>



                <MiniTime



                  value={



                    timeLeft.minutes



                  }



                  label="phút"



                />



                <span className="text-neutral-300">



                  :



                </span>



                <MiniTime



                  value={



                    timeLeft.seconds



                  }



                  label="giây"



                />



              </div>



            )}



            {/* CLOSE */}



            <button



              type="button"



              onClick={() =>



                setShowStartPopup(



                  false



                )



              }



              className="



                mt-5



                flex



                h-11



                w-full



                items-center



                justify-center



                rounded-full



                bg-[#E8753C]



                text-sm



                font-semibold



                text-white



                transition



                hover:bg-[#DF6A32]



              "



            >



              Đã hiểu



            </button>



          </div>



        </div>



      )}



    </>



  );



}



/* ============================================================



   COUNTDOWN BOX



\============================================================ */



function CountdownBox({



  value,



  label,



  accent = false,



}: {



  value: number;



  label: string;



  accent?: boolean;



}) {



  return (



    <div



      className="



        flex



        min-w-0



        flex-col



        items-center



        rounded-md



        border



        border-neutral-200



        bg-white



        px-1.5



        py-1



        sm:min-w-[44px]



        sm:px-2



        sm:py-1.5



      "



    >



      <span



        className={`



          text-[15px]



          font-bold



          leading-none



          sm:text-sm



          ${



            accent



              ? "text-[#D97745]"



              : "text-neutral-800"



          }



        `}



      >



        {String(



          value



        ).padStart(



          2,



          "0"



        )}



      </span>



      <span



        className="



          mt-1



          text-[8px]



          uppercase



          tracking-wide



          text-neutral-400



          sm:text-[8px]



        "



      >



        {label}



      </span>



    </div>



  );



}



/* ============================================================



   POPUP MINI TIME



\============================================================ */



function MiniTime({



  value,



  label,



}: {



  value: number;



  label: string;



}) {



  return (



    <div



      className="



        flex



        min-w-[45px]



        flex-col



        items-center



        rounded-lg



        border



        border-neutral-200



        bg-white



        px-2



        py-1.5



      "



    >



      <span



        className="



          text-sm



          font-semibold



          leading-none



          text-neutral-900



        "



      >



        {String(



          value



        ).padStart(



          2,



          "0"



        )}



      </span>



      <span



        className="



          mt-1



          text-[7px]



          uppercase



          tracking-wide



          text-neutral-400



        "



      >



        {label}



      </span>



    </div>



  );



}