import { Instagram, Facebook, Mail, ArrowRight } from "lucide-react";
export function SiteFooter() {
  const paymentMethods = [
    { name: "Visa", src: "/images/visa.png", className: "h-[22px] w-[38px]" },
    { name: "Mastercard", src: "/images/mastercard.png", className: "h-[22px] w-[38px]" },
    { name: "PayPal", src: "/images/PayPal%20(1).png", className: "h-[23px] w-[38px]" },
    { name: "Diners Club", src: "/images/Diners%20Club.png", className: "h-[23px] w-[38px]" },
    { name: "Discover", src: "/images/discover.png", className: "h-[23px] w-[38px]" },
  ];
  const linkClass =
    "w-fit text-[14px] leading-6 text-neutral-700 transition-colors duration-200 hover:text-neutral-950";
  const headingClass =
    "mb-4 text-[13px] font-semibold tracking-[-0.01em] text-neutral-950";
  return (
    <footer className="relative mt-12 overflow-hidden border-t border-neutral-200 bg-[#F7F7F5] sm:mt-20">
      {/* =========================================================
          SOFT TOPOGRAPHIC BACKGROUND
          Kept decorative only — content always sits above it.
          ========================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.48]"
      >
        <svg
          className="absolute inset-0 h-full w-full min-w-[900px]"
          viewBox="0 0 1600 760"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="none" stroke="#DAD9D5" strokeWidth="1.05">
            <path d="M-120 90C40 20 125 150 280 82S510 30 650 108s210 98 350 18 250-108 410-4 270 96 430 8" />
            <path d="M-130 113C35 42 135 174 292 104S522 54 662 130s215 104 358 25 258-112 420-7 280 99 440 11" />
            <path d="M-140 136C30 64 145 198 304 126S535 78 674 152s220 110 366 32 265-116 430-10 290 102 450 14" />
            <path d="M-145 159C24 86 154 222 316 149S548 102 686 175s224 115 373 39 272-120 438-14 298 105 458 17" />
            <path d="M-100 286C75 205 175 344 340 270s260-108 400-8 230 126 372 36 270-114 438-8 285 108 465 7" />
            <path d="M-110 311C65 225 182 369 351 295s267-112 408-9 236 131 380 40 277-119 448-12 295 112 475 9" />
            <path d="M-120 336C55 245 190 394 362 320s274-116 416-10 242 136 388 44 284-124 458-16 305 116 485 12" />
            <path d="M-130 361C45 265 198 419 374 345s281-120 424-11 248 141 396 48 291-129 468-20 315 120 495 15" />
            <path d="M-90 515C85 432 185 555 342 488s263-98 400-8 230 118 370 33 268-103 432-6 288 103 472 9" />
            <path d="M-105 540C75 455 192 582 354 513s271-101 410-10 237 123 380 39 276-108 446-10 299 108 484 14" />
            <path d="M-120 565C65 478 200 609 366 538s279-105 420-12 244 128 390 44 285-113 460-15 310 112 496 19" />
            <path d="M-135 590C55 501 208 637 378 563s287-109 430-14 251 133 400 49 294-118 474-20 321 116 508 24" />
          </g>
          <g fill="none" stroke="#E5E3DF" strokeWidth="0.8">
            <path d="M175 -10C225 62 305 30 350 96s27 126 108 146 155-10 183 69 20 128 104 154 158-10 214 64 38 126 123 154 163-5 240 66 37 103 118 128" />
            <path d="M205 -18C258 57 332 35 372 101s31 130 112 151 159-7 188 71 21 131 107 158 160-7 217 68 40 130 126 159 165-2 244 69 40 106 122 131" />
            <path d="M1240 -20C1165 62 1218 130 1140 181s-156 17-176 102 42 136-43 189-152 3-179 92 34 144-43 198" />
            <path d="M1270 -30C1190 55 1244 126 1162 178s-161 19-181 108 43 141-45 196-156 4-183 96 35 148-46 204" />
            <path d="M25 410C112 370 172 410 225 460s92 84 157 53 89-93 153-73 85 85 149 67 95-93 160-63 92 102 160 78 92-84 159-57 87 84 154 62 94-76 169-40" />
            <path d="M5 435C98 392 166 433 218 485s98 88 165 57 93-97 160-76 88 88 153 69 99-98 165-66 95 107 165 82 96-88 165-60 91 88 161 65 99-80 176-42" />
          </g>
        </svg>
      </div>
      <div className="relative z-10">
        <div className="container-x">
          {/* =====================================================
              DESKTOP-FIRST VISUAL STRUCTURE, MOBILE-FIRST CSS
              4 navigation columns + newsletter, like the reference.
             ===================================================== */}
          <div
            className="
              py-7
              sm:py-10
              lg:grid
              lg:grid-cols-[0.95fr_0.95fr_0.95fr_1.65fr]
              lg:gap-x-10
              lg:gap-y-0
              lg:py-[64px]
              xl:gap-x-14
            "
          >
            {/* ================= MOBILE NAV =================
                Compact accordion rows to avoid a very tall footer.
                Desktop keeps the full editorial column layout.
            */}
            <div className="lg:hidden">
              <div className="divide-y divide-neutral-300 border-y border-neutral-300">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[14px] font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
                    Support
                    <span className="text-[17px] font-light text-neutral-500 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <nav className="flex flex-col gap-2 pb-4 pt-1">
                    <a href="/lien-he" className={linkClass}>Liên hệ</a>
                    <a href="/shipping" className={linkClass}>Chính sách giao hàng</a>
                    <a href="/chinh-sach-doi-hang" className={linkClass}>Chính sách mua hàng</a>
                    <a href="/thanh-toan" className={linkClass}>Chính sách thanh toán</a>
                  </nav>
                </details>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[14px] font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
                    About
                    <span className="text-[17px] font-light text-neutral-500 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <nav className="flex flex-col gap-2 pb-4 pt-1">
                    <a href="/" className={linkClass}>About Olive Living</a>
                    <a href="/shop" className={linkClass}>Our Collection</a>
                    <a href="/lien-he" className={linkClass}>Contact Us</a>
                  </nav>
                </details>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[14px] font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
                    Sales
                    <span className="text-[17px] font-light text-neutral-500 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <nav className="flex flex-col gap-2 pb-4 pt-1">
                    <a href="/shop" className={linkClass}>Tất cả sản phẩm</a>
                    <a href="/shop?category=den-ban" className={linkClass}>Đèn bàn</a>
                    <a href="/shop?category=den-tha" className={linkClass}>Đèn thả</a>
                    <a href="/shop?category=den-dung" className={linkClass}>Đèn đứng</a>
                  </nav>
                </details>
              </div>
            </div>
            {/* ================= DESKTOP NAV ================= */}
            <div className="hidden lg:contents">
              {/* SUPPORT */}
              <div>
                <p className={headingClass}>Support</p>
                <nav className="flex flex-col gap-2.5">
                  <a href="/lien-he" className={linkClass}>Liên hệ</a>
                  <a href="/shipping" className={linkClass}>Chính sách giao hàng</a>
                  <a href="/chinh-sach-doi-hang" className={linkClass}>Chính sách mua hàng</a>
                  <a href="/thanh-toan" className={linkClass}>Chính sách thanh toán</a>
                </nav>
              </div>
              {/* ABOUT */}
              <div>
                <p className={headingClass}>About</p>
                <nav className="flex flex-col gap-2.5">
                  <a href="/" className={linkClass}>About Olive Living</a>
                  <a href="/shop" className={linkClass}>Our Collection</a>
                  <a href="/lien-he" className={linkClass}>Contact Us</a>
                </nav>
              </div>
              {/* SALES */}
              <div>
                <p className={headingClass}>Sales</p>
                <nav className="flex flex-col gap-2.5">
                  <a href="/shop" className={linkClass}>Tất cả sản phẩm</a>
                  <a href="/shop?category=den-ban" className={linkClass}>Đèn bàn</a>
                  <a href="/shop?category=den-tha" className={linkClass}>Đèn thả</a>
                  <a href="/shop?category=den-dung" className={linkClass}>Đèn đứng</a>
                </nav>
              </div>
            </div>
            {/* NEWSLETTER */}
            <div className="mt-7 lg:mt-0 lg:pl-2 xl:pl-5">
              <p className="max-w-[430px] text-[13px] leading-5 text-neutral-800 sm:text-[14px]">
                Explore with us! Sign up to receive exclusive access to
                product drops, new collections, and more.
              </p>
              <form className="mt-4 flex h-10 max-w-[390px] gap-2 sm:h-11">
                <label className="sr-only" htmlFor="footer-email">
                  Email
                </label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  className="
                    min-w-0
                    flex-1
                    rounded-full
                    border
                    border-neutral-200
                    bg-white/95
                    px-4
                    text-[12px]
                    text-neutral-900
                    shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                    outline-none
                    placeholder:text-neutral-400
                    focus:border-neutral-400
                  "
                />
                <button
                  type="submit"
                  className="
                    flex
                    h-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-neutral-200
                    bg-white
                    px-5
                    text-[12px]
                    font-semibold
                    text-neutral-900
                    shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                    transition
                    hover:bg-neutral-950
                    hover:text-white
                    sm:h-11
                    sm:px-6
                  "
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
          {/* =====================================================
              BRAND + SOCIALS
              Reference places brand on bottom-left and socials
              on bottom-right. On mobile they stack naturally.
             ===================================================== */}
          <div className="flex flex-col gap-3 border-t border-neutral-300 pt-4 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-7">
            <div>
              <a
                href="/"
                aria-label="Olive Living"
                className="
                  hidden
                  sm:inline-block
                  text-[25px]
                  font-medium
                  tracking-[0.16em]
                  text-neutral-950
                  sm:text-[29px]
                "
              >
                OLIVE LIVING
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.instagram.com/olivelivingvn/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-neutral-950
                  transition
                  hover:bg-neutral-950
                  hover:text-white
                "
              >
                <Instagram size={18} strokeWidth={1.8} />
              </a>
              <a
                href="https://www.facebook.com/oliveliving/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-neutral-950
                  transition
                  hover:bg-neutral-950
                  hover:text-white
                "
              >
                <Facebook size={18} strokeWidth={1.8} />
              </a>
              <a
                href="mailto:hello@olivelivingvn.com"
                aria-label="Email"
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-neutral-950
                  transition
                  hover:bg-neutral-950
                  hover:text-white
                "
              >
                <Mail size={18} strokeWidth={1.8} />
              </a>
              {/* Payment methods are kept from the existing footer data. */}
              <div className="ml-1 hidden h-7 items-center gap-2 border-l border-neutral-300 pl-4 sm:flex">
                {paymentMethods.slice(0, 4).map((payment) => (
                  <img
                    key={payment.name}
                    src={payment.src}
                    alt={payment.name}
                    title={payment.name}
                    className={`${payment.className} object-contain opacity-80`}
                    loading="lazy"
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* MOBILE PAYMENT METHODS — card images only, one row */}
          <div className="flex items-center justify-center gap-3 border-t border-neutral-300 py-3 sm:hidden">
            {paymentMethods.map((payment) => (
              <img
                key={payment.name}
                src={payment.src}
                alt={payment.name}
                title={payment.name}
                className="h-8 w-[48px] shrink-0 object-contain"
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>

                </div>
        {/* =====================================================
            BOTTOM LEGAL BAR
            Uses only real routes/data already present in the footer.
           ===================================================== */}
        <div className="hidden border-t border-neutral-200/90 sm:block">
          <div
            className="
              container-x
              flex
              flex-col
              gap-4
              py-5
              text-[10px]
              leading-5
              text-neutral-500
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:gap-8
            "
          >
            <p>
              © {new Date().getFullYear()} Olive Living. All rights reserved.
            </p>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <a
                href="/chinh-sach-doi-hang"
                className="transition hover:text-neutral-950"
              >
                Mua hàng
              </a>
              <span aria-hidden="true" className="text-neutral-300">
                |
              </span>
              <a
                href="/shipping"
                className="transition hover:text-neutral-950"
              >
                Giao hàng
              </a>
              <span aria-hidden="true" className="text-neutral-300">
                |
              </span>
              <a
                href="/thanh-toan"
                className="transition hover:text-neutral-950"
              >
                Thanh toán
              </a>
              <span aria-hidden="true" className="text-neutral-300">
                |
              </span>
              <a
                href="/lien-he"
                className="transition hover:text-neutral-950"
              >
                Liên hệ
              </a>
              <span aria-hidden="true" className="text-neutral-300">
                |
              </span>
              <span>Vietnam</span>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
