const fs = require("fs");

const file = "src/components/home/FeaturedCollectionShowcase.tsx";

let s = fs.readFileSync(file, "utf8");

// ============================================================
// SOCIAL PROOF HELPER
// ============================================================

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

if (!s.includes("getProductSocialProof")) {
  const marker = "export default function FeaturedCollectionShowcase";

  if (!s.includes(marker)) {
    throw new Error("Khong tim thay component");
  }

  s = s.replace(marker, helper + "\n" + marker);
}

// ============================================================
// PRODUCT CONTENT
// THAY TOAN BO CARD CONTENT BANG BAN SACH
// ============================================================

const startMarker = "      {/* PRODUCT CONTENT */}";
const endMarker = "            {/* ================================================= */}\n            {/* CTA */}";

const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker);

if (start === -1) {
  throw new Error("Khong tim thay PRODUCT CONTENT");
}

if (end === -1) {
  throw new Error("Khong tim thay CTA");
}

const productContent = `      {/* PRODUCT CONTENT */}

      <div
        className="
          flex
          flex-col
          p-3
          sm:p-4
        "
      >

        {/* NAME */}

        <Link
          to="/products/$slug"
          params={{
            slug: product.slug,
          }}
          className="
            block
            min-h-[42px]
            max-h-[46px]
            overflow-hidden
            text-[14px]
            font-semibold
            leading-[1.45]
            tracking-[-0.01em]
            text-[#403C37]

            sm:min-h-[46px]
            sm:max-h-[50px]
            sm:text-[15px]
          "
        >
          {getFeaturedDisplayName(product)}
        </Link>


        {/* RATING + REVIEWS + SOLD */}

        {(() => {
          const socialProof = getProductSocialProof(product);

          return (
            <div
              className="
                mt-1
                min-w-0
                text-[9px]
                leading-4
                text-neutral-500
                sm:text-[10px]
              "
            >

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

                <span>
                  {socialProof.reviews} đánh giá
                </span>

              </div>

              <div className="mt-0.5">
                Đã bán {socialProof.sold}
              </div>

            </div>
          );
        })()}


        {/* PRICE */}

        <div
          className="
            mt-1
            flex
            min-h-[42px]
            flex-col
            justify-center
          "
        >

          {product.compare_at_price &&
            product.compare_at_price > product.price && (
              <span
                className="
                  text-[9px]
                  leading-4
                  text-neutral-400
                  line-through
                  sm:text-[10px]
                "
              >
                {formatFeaturedPrice(product.compare_at_price)}
              </span>
            )}

          <span
            className="
              text-[15px]
              font-bold
              leading-6
              tracking-[-0.01em]
              text-[#3F7658]
              sm:text-[17px]
            "
          >
            {formatFeaturedPrice(product.price)}
          </span>

        </div>


        {/* ACTION */}

        <div
          className="
            mt-2
            flex
            items-center
            gap-2
            sm:mt-3
          "
        >

          <Link
            to="/products/$slug"
            params={{
              slug: product.slug,
            }}
            className="
              flex
              h-9
              min-w-0
              flex-1
              items-center
              justify-center
              rounded-xl
              bg-[#DDF1E6]
              px-2
              text-[10px]
              font-semibold
              text-[#4F8063]
              transition-all
              duration-300
              hover:bg-[#CDE8D9]
              sm:text-[11px]
            "
          >
            Mua ngay
          </Link>


          <Link
            to="/products/$slug"
            params={{
              slug: product.slug,
            }}
            aria-label={\`Xem \${getFeaturedDisplayName(product)}\`}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-[#D7E9DD]
              bg-[#F7FBF8]
              text-[#4F8063]
              transition-all
              duration-300
              hover:bg-[#DDF1E6]
            "
          >
            <ShoppingCart
              size={15}
              strokeWidth={1.6}
            />
          </Link>

        </div>

      </div>


`;

s = s.slice(0, start) + productContent + s.slice(end);

// ============================================================
// CARD IMAGE -> MOBILE FIRST
// ============================================================

s = s.replace(
  'className="aspect-square w-full overflow-hidden bg-[#F5F2ED]"',
  'className="aspect-square w-full overflow-hidden bg-[#F5F2ED]"'
);

// ============================================================
// SAVE UTF8
// ============================================================

fs.writeFileSync(file, s, "utf8");

console.log("");
console.log("========================================");
console.log("CARD DA DUOC TAO LAI THANH CONG");
console.log("========================================");
console.log("Helper:", s.includes("getProductSocialProof"));
console.log("Rating:", s.includes("RATING + REVIEWS + SOLD"));
console.log("Sold:", s.includes("socialProof.sold"));
console.log("========================================");
