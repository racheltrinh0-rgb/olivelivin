import {
  ArrowUpRight,
  Circle,
  Home,
  LampDesk,
  Lightbulb,
  Package,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const COLLECTIONS = [
  {
    slug: "den-ban",
    name: "Đèn bàn",
    eyebrow: "01",
    description: "Ánh sáng cho những góc nhỏ.",
    count: "24 sản phẩm",
    icon: LampDesk,
    tone: "bg-[#F2ECE4]",
    iconTone: "text-[#9C8067]",
    image: "/images/hero_post.png"
  },
  {
    slug: "den-tha",
    name: "Đèn thả",
    eyebrow: "02",
    description: "Một điểm nhấn trên cao.",
    count: "18 sản phẩm",
    icon: Lightbulb,
    tone: "bg-[#EEEAE2]",
    iconTone: "text-[#8C887D]",
    image: "/images/category-pendant.png",
  },
  {
    slug: "den-tuong",
    name: "Đèn tường",
    eyebrow: "03",
    description: "Ánh sáng vừa đủ, vừa vặn.",
    count: "15 sản phẩm",
    icon: Circle,
    tone: "bg-[#F1E9E3]",
    iconTone: "text-[#A17E6D]",
    image: "/images/category-wall-lamp.png",
  },
  {
    slug: "den-dung",
    name: "Đèn đứng",
    eyebrow: "04",
    description: "Định hình những khoảng trống.",
    count: "12 sản phẩm",
    icon: Home,
    tone: "bg-[#E9EDE7]",
    iconTone: "text-[#7E8C78]",
    image: "/images/category-floor-lamp.png",
  },
  {
    slug: "do-noi-that",
    name: "Đồ nội thất",
    eyebrow: "05",
    description: "Những món đồ có cá tính.",
    count: "20 sản phẩm",
    icon: Package,
    tone: "bg-[#ECE8E1]",
    iconTone: "text-[#8D8376]",
    image: "/images/category-decor.png",
  },
];

export default function Collections() {
  const featured = COLLECTIONS[0];

  return (
    <section className="bg-[#F8F6F1] py-12 sm:py-14 lg:py-20">
      <div className="container-x">
        {/* EDITORIAL INTRO */}
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[650px]">
            <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-[#A49382]">
              THE OLIVE EDIT
            </p>

            <h2 className="mt-2 font-display text-[29px] font-normal leading-[1.12] tracking-[-0.025em] text-[#37332D] sm:text-[35px] lg:text-[40px]">
              Đồ đẹp. Không gian có gu.
            </h2>

            <p className="mt-3 max-w-[470px] text-[12px] leading-5 text-[#817A72] sm:text-[13px]">
              Những lựa chọn dành cho cuộc sống hàng ngày.
            </p>
          </div>

          <Link
            to="/shop"
            className="group hidden items-center gap-2 pb-1 text-[9px] font-medium uppercase tracking-[0.14em] text-[#635C54] lg:inline-flex"
          >
            Xem tất cả
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* MOBILE / 2-COLUMN GRID */}
        <div className="lg:hidden">
          {/* Featured collection */}
          <Link
            to={`/shop?category=${featured.slug === "do-noi-that" ? "do-decor" : featured.slug}`}
            className="group relative flex min-h-[190px] overflow-hidden rounded-[22px] bg-[#EDE6DC] p-4 shadow-[0_3px_18px_rgba(60,50,40,0.045)] sm:min-h-[215px] sm:p-5"
          >
            <img
              src={featured.image}
              alt={featured.name}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            {/* Keep the left copy readable without hiding the photo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F1E9DF]/82 via-[#F1E9DF]/34 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#241E19]/20 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-gradient-to-l from-[#211B16]/18 via-transparent to-transparent" />

            <div className="relative z-10 flex w-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] tracking-[0.14em] text-[#625A51]">
                    {featured.eyebrow}
                  </span>
                  <span className="h-px w-6 bg-[#CFC5B8]" />
                  <span className="text-[7px] uppercase tracking-[0.12em] text-[#625A51]">
                    Featured
                  </span>
                </div>

                <p className="mt-3 max-w-[215px] text-[9px] leading-4 text-white/95 drop-shadow-[0_1px_5px_rgba(0,0,0,0.55)] sm:max-w-[260px] sm:text-[10px]">
                  {featured.description}
                </p>
              </div>

              <div className="flex items-end justify-between gap-2">
                <span className="text-[8px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                  {featured.count}
                </span>

                <span className="inline-flex min-w-[112px] items-center justify-between gap-2 rounded-full border border-white/75 bg-black/45 px-3 py-2 text-[8px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur-[5px] sm:min-w-[130px] sm:px-3.5 sm:text-[9px]">
                  <span>{featured.name}</span>
                  <ArrowUpRight size={11} strokeWidth={1.7} />
                </span>
              </div>
            </div>
          </Link>

          {/* All remaining collections — 2 columns, no horizontal overflow */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {COLLECTIONS.slice(1).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.slug}
                  to={`/shop?category=${item.slug === "do-noi-that" ? "do-decor" : item.slug}`}
                  className={`group relative flex min-h-[145px] flex-col overflow-hidden rounded-[20px] ${item.tone} p-3.5 sm:min-h-[165px] sm:rounded-[22px] sm:p-4`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-b from-[#F2ECE3]/40 via-transparent to-[#241E19]/58" />

                  <div className="relative z-10 flex items-start justify-between">
                    <span className="text-[7px] tracking-[0.14em] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                      {item.eyebrow}
                    </span>

                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/60 bg-black/20 text-white/90 backdrop-blur-[3px]">
                      <Icon size={13} strokeWidth={1.1} />
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto pt-8">
                    <span className="flex w-full items-center justify-between rounded-full border border-white/75 bg-black/45 px-3 py-2 text-[8px] font-medium text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] backdrop-blur-[5px] sm:px-3.5 sm:py-2.5 sm:text-[9px]">
                      <span className="truncate">{item.name}</span>
                      <ArrowUpRight
                        size={11}
                        strokeWidth={1.6}
                        className="ml-2 shrink-0"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            to="/shop"
            className="mt-5 flex items-center justify-center gap-2 text-[8px] font-medium uppercase tracking-[0.14em] text-[#696158] sm:text-[9px]"
          >
            Xem tất cả bộ sưu tập
            <span>→</span>
          </Link>
        </div>

        {/* DESKTOP / 16-INCH LAPTOP */}
        <div className="hidden lg:grid lg:grid-cols-[1.32fr_0.68fr] lg:gap-4">
          <Link
            to={`/shop?category=${featured.slug === "do-noi-that" ? "do-decor" : featured.slug}`}
            className="group relative min-h-[365px] overflow-hidden rounded-[28px] bg-[#EDE6DC] p-8 xl:min-h-[390px] xl:p-10"
          >
            {/* REAL PRODUCT / LIFESTYLE IMAGE */}
            <img
              src={featured.image}
              alt={featured.name}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.025]"
            />

            {/* Soft warm overlay — keeps the editorial typography readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F1E9DF]/88 via-[#F1E9DF]/42 to-[#1E1813]/8" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4B4035]/10 via-transparent to-transparent" />

            <div className="relative z-10 flex h-full max-w-[430px] flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] tracking-[0.16em] text-[#958A7E]">
                    {featured.eyebrow}
                  </span>
                  <span className="h-px w-8 bg-[#CFC5B8]" />
                  <span className="text-[8px] uppercase tracking-[0.14em] text-[#958A7E]">
                    Featured collection
                  </span>
                </div>

                <p className="max-w-[310px] text-[11px] leading-5 text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                  {featured.description} Những thiết kế nhỏ, đủ để thay đổi
                  cảm giác của cả một góc phòng.
                </p>
              </div>

              <div className="flex items-end justify-between gap-4">
                <span className="text-[9px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                  {featured.count}
                </span>

                <span className="inline-flex min-w-[150px] items-center justify-between gap-4 rounded-full border border-white/75 bg-black/48 px-4 py-2.5 text-[10px] font-medium tracking-[0.01em] text-white shadow-[0_4px_18px_rgba(0,0,0,0.20)] backdrop-blur-[6px] transition-all duration-300 group-hover:bg-black/60">
                  <span>{featured.name}</span>
                  <ArrowUpRight size={13} strokeWidth={1.7} />
                </span>
              </div>
            </div>


          </Link>

          <div className="grid grid-cols-2 gap-4">
            {COLLECTIONS.slice(1).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.slug}
                  to={`/shop?category=${item.slug === "do-noi-that" ? "do-decor" : item.slug}`}
                  className={`group relative flex min-h-[175px] flex-col justify-between overflow-hidden rounded-[24px] ${item.tone} p-5 transition-transform duration-300 hover:-translate-y-0.5 xl:min-h-[187px]`}
                >
                  
                    <img
                      src={item.image}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#F2ECE3]/48 via-transparent to-[#241E19]/58" />
<div className="relative z-10 flex items-start justify-between">
                    <span className="text-[8px] tracking-[0.15em] text-[#4F4942]">
                      {item.eyebrow}
                    </span>

                    <Icon
                      size={25}
                      strokeWidth={0.95}
                      className={`${item.iconTone} opacity-55`}
                    />
                  </div>

                  <div className="relative z-10 flex flex-1 items-end">
                    <span className="flex w-full items-center justify-between rounded-full border border-white/75 bg-black/40 px-3.5 py-2 text-[9px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur-[5px] transition-all duration-300 group-hover:bg-black/55">
                      <span>{item.name}</span>
                      <ArrowUpRight size={12} strokeWidth={1.6} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
