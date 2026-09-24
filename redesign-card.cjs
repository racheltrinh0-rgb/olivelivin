const fs = require("fs");

const file = "src/components/home/FeaturedCollectionShowcase.tsx";
let s = fs.readFileSync(file, "utf8");

// ============================================================
// PRODUCT CONTENT - MOBILE FIRST
// ============================================================

s = s.replace(
`    min-h-[128px]
    flex-col
    p-3
    sm:min-h-[140px]
    sm:p-4`,
`    flex
    min-h-[180px]
    flex-col
    p-3

    sm:min-h-[190px]
    sm:p-4`
);

// ============================================================
// PRODUCT NAME
// LON HON + DAM HON
// ============================================================

s = s.replace(
`      h-[60px]
      overflow-hidden
      text-[12px]
      leading-5
      text-[#403C37]

      sm:h-[62px]
      sm:text-[13px]`,
`      block
      min-h-[40px]
      max-h-[44px]
      overflow-hidden
      text-[14px]
      font-semibold
      leading-[1.45]
      tracking-[-0.01em]
      text-[#403C37]

      sm:min-h-[44px]
      sm:max-h-[48px]
      sm:text-[15px]`
);

// ============================================================
// RATING + SOLD
// NEU CHUA CO THI THEM
// ============================================================

if (!s.includes("RATING + SOLD")) {

const ratingBlock = `

  {/* RATING + SOLD */}

  {(() => {
    const socialProof = getProductSocialProof(product);

    return (
      <div className="mt-0.5 min-w-0 text-[9px] leading-4 text-neutral-500 sm:text-[10px]">

        <div className="flex min-w-0 flex-wrap items-center gap-x-1">

          <span className="shrink-0 font-semibold tracking-[0.01em] text-[#D9905C]">
            ★★★★★
          </span>

          <span className="shrink-0 font-medium text-[#5A554F]">
            {socialProof.rating}
          </span>

          <span className="text-neutral-300">
            |
          </span>

          <span className="min-w-0">
            {socialProof.reviews} đánh giá
          </span>

        </div>

        <div className="mt-0.5 text-neutral-500">
          Đã bán {socialProof.sold}
        </div>

      </div>
    );
  })()}
`;

s = s.replace(
`  {/* PRICE */}`,
ratingBlock + `

  {/* PRICE */}`
);

}

// ============================================================
// PRICE BLOCK
// ============================================================

s = s.replace(
`  <div className="mt-1 flex min-h-[36px] flex-col justify-center">`,
`  <div className="mt-1 flex min-h-[42px] flex-col justify-center">`
);

s = s.replace(
`        text-[11px]
        font-semibold
        leading-5
        text-[#4F8063]
        sm:text-[12px]`,
`        text-[15px]
        font-bold
        leading-6
        tracking-[-0.01em]
        text-[#3F7658]

        sm:text-[17px]`
);

// ============================================================
// BUTTON
// MOBILE: KHONG DE BUTTON BI EP
// ============================================================

s = s.replace(
`        h-9
        min-w-0
        flex-1
        items-center`,
`        h-9
        min-w-0
        flex-1
        items-center`
);

// ============================================================
// SAVE UTF-8
// ============================================================

fs.writeFileSync(file, s, "utf8");

console.log("");
console.log("============================================");
console.log(" MOBILE-FIRST PRODUCT CARD DA FIX");
console.log("============================================");
console.log("Rating/Sold:", s.includes("RATING + SOLD"));
console.log("Social proof:", s.includes("getProductSocialProof"));
console.log("============================================");
