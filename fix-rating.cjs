const fs = require("fs");

const file = "src/components/home/FeaturedCollectionShowcase.tsx";

let s = fs.readFileSync(file, "utf8");

const helper = `
const getProductSocialProof = (product: any) => {
  const seed = String(product.id || product.slug || product.name || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const rating = (4.7 + (seed % 3) * 0.1).toFixed(1);
  const reviews = 13 + (seed % 73);
  const sold = 128 + (seed % 197);

  return {
    rating,
    reviews,
    sold,
  };
};

`;

// Them helper neu chua co
if (!s.includes("getProductSocialProof")) {
  const marker = "export default function FeaturedCollectionShowcase";

  if (!s.includes(marker)) {
    throw new Error("Khong tim thay component FeaturedCollectionShowcase");
  }

  s = s.replace(marker, helper + marker);
}

// Them rating + sold ngay sau ten san pham
if (!s.includes("RATING + SOLD")) {
  const marker = "  {/* PRICE */}";

  const ratingBlock = `
  {/* RATING + SOLD */}

  {(() => {
    const socialProof = getProductSocialProof(product);

    return (
      <div
        className="
          mt-0
          flex
          min-w-0
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
        <span className="font-semibold tracking-[0.02em] text-[#D9905C]">
          ★★★★★
        </span>

        <span className="font-medium text-[#5A554F]">
          {socialProof.rating}
        </span>

        <span className="text-neutral-300">|</span>

        <span>
          {socialProof.reviews} đánh giá
        </span>

        <span className="text-neutral-300">|</span>

        <span>
          Đã bán {socialProof.sold}
        </span>
      </div>
    );
  })()}

`;

  if (!s.includes(marker)) {
    throw new Error("Khong tim thay PRICE marker");
  }

  s = s.replace(marker, ratingBlock + marker);
}

// Ten san pham
s = s.replace(
  `      h-[60px]
      overflow-hidden
      text-[12px]
      leading-5
      text-[#403C37]

      sm:h-[62px]
      sm:text-[13px]`,
  `      min-h-[42px]
      overflow-hidden
      text-[13px]
      font-semibold
      leading-5
      text-[#403C37]

      sm:min-h-[46px]
      sm:text-[14px]`
);

// Gia ban
s = s.replace(
  `        text-[11px]
        font-semibold
        leading-5
        text-[#4F8063]
        sm:text-[12px]`,
  `        text-[14px]
        font-bold
        leading-6
        text-[#3F7658]
        sm:text-[16px]`
);

// Card cao hon tren mobile
s = s.replace(
  `    min-h-[128px]
    flex-col
    p-3
    sm:min-h-[140px]`,
  `    min-h-[158px]
    flex-col
    p-3
    sm:min-h-[168px]`
);

fs.writeFileSync(file, s, "utf8");

console.log("");
console.log("========================================");
console.log("FIX THANH CONG");
console.log("========================================");
console.log("Helper:", s.includes("getProductSocialProof"));
console.log("Rating:", s.includes("RATING + SOLD"));
console.log("Sold:", s.includes("socialProof.sold"));
console.log("========================================");
