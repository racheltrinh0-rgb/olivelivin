const fs = require("fs");

const file = "src/components/home/FeaturedCollectionShowcase.tsx";
let s = fs.readFileSync(file, "utf8");

// ================================
// 1. ADD SOCIAL PROOF FUNCTION
// ================================

const collectionBlock = const collectionProducts = [
  cordlessProduct,
  pantonProduct,
].filter(Boolean);;

const helper = 

function getProductSocialProof(product) {
  const seed = String(product.id || product.slug || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    rating: (4.7 + (seed % 4) * 0.1).toFixed(1),
    reviews: 12 + (seed % 76),
    sold: 35 + ((seed * 7) % 210),
  };
}
;

if (!s.includes("function getProductSocialProof")) {
  s = s.replace(collectionBlock, collectionBlock + helper);
}

// ================================
// 2. ADD RATING + SOLD
// ================================

const priceMarker = "  {/* PRICE */}";

const ratingBlock =   {/* RATING + SOLD */}

  {(() => {
    const socialProof = getProductSocialProof(product);

    return (
      <div
        className="
          mt-1
          flex
          flex-wrap
          items-center
          gap-x-1
          gap-y-0
          text-[8px]
          leading-4
          text-neutral-500
          sm:text-[10px]
        "
      >
        <span className="font-medium tracking-[0.02em] text-[#D9905C]">
          {"\u2605\u2605\u2605\u2605\u2605"}
        </span>

        <span className="font-medium text-[#5A554F]">
          {socialProof.rating}
        </span>

        <span className="text-neutral-300">|</span>

        <span>
          {socialProof.reviews} {"\u0111\u00e1nh gi\u00e1"}
        </span>

        <span className="text-neutral-300">|</span>

        <span>
          {"\u0110\u00e3 b\u00e1n"} {socialProof.sold}
        </span>
      </div>
    );
  })()}

;

if (!s.includes("RATING + SOLD")) {
  s = s.replace(priceMarker, ratingBlock + priceMarker);
}

// ================================
// 3. PRODUCT NAME
// ================================

s = s.replace(
  h-[60px]
      overflow-hidden
      text-[12px]
      leading-5
      text-[#403C37]

      sm:h-[62px]
      sm:text-[13px],
  min-h-[44px]
      overflow-hidden
      text-[13px]
      font-semibold
      leading-[1.45]
      text-[#403C37]

      sm:min-h-[48px]
      sm:text-[14px]
);

// ================================
// 4. PRICE BIGGER
// ================================

s = s.replace(
  	ext-[11px]
        font-semibold
        leading-5
        text-[#4F8063]
        sm:text-[12px],
  	ext-[14px]
        font-bold
        leading-6
        text-[#3F7658]
        sm:text-[16px]
);

// ================================
// 5. CARD HEIGHT
// ================================

s = s.replace(
  min-h-[128px]
    flex-col
    p-3
    sm:min-h-[140px],
  min-h-[162px]
    flex-col
    p-3
    sm:min-h-[170px]
);

fs.writeFileSync(file, s, "utf8");

console.log("====================================");
console.log("RATING + SOLD ADDED");
console.log("PRODUCT NAME UPDATED");
console.log("PRICE UPDATED");
console.log("MOBILE CARD UPDATED");
console.log("UTF8 PRESERVED");
console.log("====================================");
