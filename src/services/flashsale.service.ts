import { supabase } from "@/integrations/supabase/client";

/**
 * ============================================================
 * GET THE RELEVANT FLASH SALE
 *
 * Logic:
 *
 * 1. active = true
 * 2. Chưa kết thúc
 * 3. Nếu đang chạy -> ưu tiên Sale đang chạy
 * 4. Nếu chưa bắt đầu -> lấy Sale sắp diễn ra gần nhất
 * 5. Sale đã kết thúc -> bỏ qua
 * ============================================================
 */
export async function getActiveFlashSale() {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("flash_sales")
    .select("*")
    .eq("active", true)
    .gte("end_at", now)
    .order("start_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "GET ACTIVE FLASH SALE ERROR:",
      error
    );

    return null;
  }

  return data ?? null;
}


/**
 * ============================================================
 * GET FLASH SALE PRODUCTS
 *
 * Lấy sản phẩm của Flash Sale gần nhất / đang chạy.
 * Không lấy sản phẩm của Sale đã kết thúc.
 * ============================================================
 */
export async function getFlashSaleProducts() {
  const now = new Date().toISOString();

  /*
   * Tìm Flash Sale phù hợp trước
   */
  const { data: flashSale, error: saleError } =
    await supabase
      .from("flash_sales")
      .select("*")
      .eq("active", true)
      .gte("end_at", now)
      .order("start_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

  if (saleError) {
    console.error(
      "GET FLASH SALE ERROR:",
      saleError
    );

    return [];
  }

  if (!flashSale) {
    return [];
  }

  /*
   * Lấy sản phẩm thuộc Flash Sale đó
   */
  const {
    data,
    error,
  } = await supabase
    .from("flash_sale_products")
    .select(`
      *,
      product:products(*),
      flash_sale:flash_sales(*)
    `)
    .eq(
      "flash_sale_id",
      flashSale.id
    );

  if (error) {
    console.error(
      "GET FLASH SALE PRODUCTS ERROR:",
      error
    );

    return [];
  }

  return data ?? [];
}