
import { supabase } from "@/integrations/supabase/client";

export type MysteryDeal = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  active: boolean;
};

export type MysteryDealProduct = {
  id: string;
  mystery_deal_id: string;
  product_id: string;
  discount_percent: number;
  quota: number;
  sold_count: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    stock: number | null;
  };
};

export type MysteryDealWithProducts = MysteryDeal & {
  products: MysteryDealProduct[];
};

export async function getMysteryDeals(): Promise<
  MysteryDealWithProducts[]
> {
  const { data, error } = await supabase
    .from("mystery_deals")
    .select(`
      id,
      title,
      description,
      start_at,
      end_at,
      active,
      mystery_deal_products (
        id,
        mystery_deal_id,
        product_id,
        discount_percent,
        quota,
        sold_count,
        product:products (
          id,
          name,
          slug,
          price,
          image_url,
          stock
        )
      )
    `)
    .eq("active", true)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("GET MYSTERY DEALS ERROR:", error);
    throw error;
  }

  return (data ?? []).map((deal: any) => ({
    ...deal,
    products: (deal.mystery_deal_products ?? []).filter(
      (item: any) => item.product
    ),
  }));
}

export function getMysteryDealStatus(
  deal: Pick<MysteryDeal, "start_at" | "end_at" | "active">,
  now = Date.now()
): "inactive" | "upcoming" | "live" | "ended" {
  if (!deal.active) return "inactive";

  const start = new Date(deal.start_at).getTime();
  const end = new Date(deal.end_at).getTime();

  if (now < start) return "upcoming";
  if (now >= end) return "ended";

  return "live";
}

export function getMysteryDealDiscountPrice(
  originalPrice: number,
  discountPercent: number
): number {
  return Math.round(
    originalPrice * (1 - discountPercent / 100)
  );
}

export function getMysteryDealRemaining(
  item: Pick<MysteryDealProduct, "quota" | "sold_count">
): number {
  return Math.max(0, item.quota - item.sold_count);
}
