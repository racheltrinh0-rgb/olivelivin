

import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";



type Product = {

  id: string;

  name: string;

  slug?: string;

  price: number;

  image_url: string | null;

  stock: number | null;

};



type DealProduct = {
  product_id: string;
  discount_percent: number;
  quota: number;
  sold_count?: number;
};



type Deal = {

  id: string;

  title: string;

  description: string | null;

  start_at: string;

  end_at: string;

  active: boolean;

};



function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toISO(value: string) {

  return new Date(value).toISOString();

}



function formatDate(value: string) {

  return new Date(value).toLocaleString("vi-VN", {

    timeZone: "Asia/Ho_Chi_Minh",

  });

}



export default function MysteryJackpotManagement() {

  const [deals, setDeals] = useState<Deal[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [title, setTitle] = useState("Mystery Jackpot Deals");

  const [description, setDescription] = useState(

    "Ưu đãi bí mật với số lượng giới hạn.",

  );

  const [startAt, setStartAt] = useState("");

  const [endAt, setEndAt] = useState("");

  const [active, setActive] = useState(false);

  const [keyword, setKeyword] = useState("");

  const [selected, setSelected] = useState<DealProduct[]>([]);

  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [editingDealId, setEditingDealId] = useState<string | null>(null);



  async function loadData() {

    setLoading(true);

    setErrorMessage("");



    try {

      const [dealResult, productResult] = await Promise.all([

        supabase

          .from("mystery_deals")

          .select("id,title,description,start_at,end_at,active")

          .order("created_at", { ascending: false }),



        supabase

          .from("products")

          .select("id,name,slug,price,image_url,stock")

          .order("created_at", { ascending: false }),

      ]);



      if (dealResult.error) throw dealResult.error;

      if (productResult.error) throw productResult.error;



      setDeals((dealResult.data ?? []) as Deal[]);

      setProducts((productResult.data ?? []) as Product[]);

    } catch (error) {

      console.error("[Mystery Jackpot Admin] Load error:", error);

      setErrorMessage(

        error instanceof Error

          ? error.message

          : "Không thể tải dữ liệu Mystery Jackpot.",

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    void loadData();

  }, []);



  function toggleProduct(productId: string) {

    setSelected((current) => {

      if (current.some((item) => item.product_id === productId)) {

        return current.filter((item) => item.product_id !== productId);

      }



      return [

        ...current,

        {

          product_id: productId,

          discount_percent: 25,

          quota: 10,

        },

      ];

    });

  }



  function updateSelected(

    productId: string,

    field: "discount_percent" | "quota",

    value: number,

  ) {

    setSelected((current) =>

      current.map((item) =>

        item.product_id === productId

          ? { ...item, [field]: value }

          : item,

      ),

    );

  }



  function resetForm() {

    setTitle("Mystery Jackpot Deals");

    setDescription("Ưu đãi bí mật với số lượng giới hạn.");

    setStartAt("");

    setEndAt("");

    setActive(false);

    setSelected([]);

    setKeyword("");

  }



  async function saveDeal() {
    if (saving) return;

    if (!title.trim() || !startAt || !endAt) {
      alert("Vui lòng nhập tên và thời gian chương trình.");
      return;
    }

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      alert("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    if (selected.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }

    const invalidItem = selected.some(
      (item) =>
        !Number.isFinite(item.discount_percent) ||
        item.discount_percent <= 0 ||
        item.discount_percent > 100 ||
        !Number.isInteger(item.quota) ||
        item.quota < 1 ||
        (item.sold_count ?? 0) > item.quota,
    );

    if (invalidItem) {
      alert("Mức giảm phải từ 1–100%, quota là số nguyên dương và không được thấp hơn số đã bán.");
      return;
    }

    setSaving(true);

    try {
      if (editingDealId) {
        const { error: updateDealError } = await supabase
          .from("mystery_deals")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            start_at: toISO(startAt),
            end_at: toISO(endAt),
            active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingDealId);

        if (updateDealError) throw updateDealError;

        const { data: existingRows, error: existingError } = await supabase
          .from("mystery_deal_products")
          .select("id,product_id,discount_percent,quota,sold_count")
          .eq("mystery_deal_id", editingDealId);

        if (existingError) throw existingError;

        const existing = existingRows ?? [];
        const selectedIds = new Set(selected.map((item) => item.product_id));
        const removedIds = existing
          .filter((row) => !selectedIds.has(row.product_id))
          .map((row) => row.id);

        if (removedIds.length) {
          const { error } = await supabase
            .from("mystery_deal_products")
            .delete()
            .in("id", removedIds);
          if (error) throw error;
        }

        for (const item of selected) {
          const oldRow = existing.find((row) => row.product_id === item.product_id);
          if (oldRow) {
            const { error } = await supabase
              .from("mystery_deal_products")
              .update({
                discount_percent: item.discount_percent,
                quota: item.quota,
              })
              .eq("id", oldRow.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("mystery_deal_products")
              .insert({
                mystery_deal_id: editingDealId,
                product_id: item.product_id,
                discount_percent: item.discount_percent,
                quota: item.quota,
                sold_count: 0,
              });
            if (error) throw error;
          }
        }

        alert("Đã cập nhật chương trình Mystery Jackpot.");
      } else {
        const { data: deal, error: dealError } = await supabase
          .from("mystery_deals")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            start_at: toISO(startAt),
            end_at: toISO(endAt),
            active,
          })
          .select("id")
          .single();

        if (dealError) throw dealError;

        const rows = selected.map((item) => ({
          mystery_deal_id: deal.id,
          product_id: item.product_id,
          discount_percent: item.discount_percent,
          quota: item.quota,
          sold_count: 0,
        }));

        const { error: productsError } = await supabase
          .from("mystery_deal_products")
          .insert(rows);

        if (productsError) {
          await supabase.from("mystery_deals").delete().eq("id", deal.id);
          throw productsError;
        }

        alert("Đã tạo chương trình Mystery Jackpot.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("[Mystery Jackpot Admin] Save error:", error);
      const message =
        error instanceof Error ? error.message : "Không thể lưu chương trình.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function editDeal(deal: Deal) {
    setErrorMessage("");
    setLoading(true);

    try {
      const { data: rows, error } = await supabase
        .from("mystery_deal_products")
        .select("product_id,discount_percent,quota,sold_count")
        .eq("mystery_deal_id", deal.id);

      if (error) throw error;

      setEditingDealId(deal.id);
      setTitle(deal.title);
      setDescription(deal.description ?? "");
      setStartAt(toLocalInput(deal.start_at));
      setEndAt(toLocalInput(deal.end_at));
      setActive(deal.active);
      setSelected(
        (rows ?? []).map((row) => ({
          product_id: row.product_id,
          discount_percent: Number(row.discount_percent),
          quota: Number(row.quota),
          sold_count: Number(row.sold_count ?? 0),
        })),
      );
      setKeyword("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("[Mystery Jackpot Admin] Edit load error:", error);
      alert(error instanceof Error ? error.message : "Không thể tải chương trình để sửa.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(deal: Deal) {

    const nextActive = !deal.active;



    const confirmed = window.confirm(

      nextActive

        ? `Kích hoạt chương trình "${deal.title}"?`

        : `Tạm tắt chương trình "${deal.title}"?`,

    );



    if (!confirmed) return;



    const { error } = await supabase

      .from("mystery_deals")

      .update({

        active: nextActive,

        updated_at: new Date().toISOString(),

      })

      .eq("id", deal.id);



    if (error) {

      console.error("[Mystery Jackpot Admin] Toggle error:", error);

      alert(`Không thể cập nhật trạng thái: ${error.message}`);

      return;

    }



    await loadData();

  }



  const filteredProducts = products.filter((product) =>

    product.name.toLowerCase().includes(keyword.trim().toLowerCase()),

  );



  return (

    <div className="container-x space-y-8 py-10">

      <header>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">

          Olive Living · Mystery Deals

        </p>

        <h1 className="mt-2 font-display text-3xl sm:text-4xl">

          Mystery Jackpot

        </h1>

        <p className="mt-2 text-sm text-neutral-500">

          Quản lý ưu đãi bí mật và quota riêng cho từng sản phẩm.

        </p>

      </header>



      {errorMessage && (

        <div

          role="alert"

          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"

        >

          {errorMessage}

        </div>

      )}



      <section className="space-y-5 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-7">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {editingDealId ? "Chỉnh sửa chương trình" : "Tạo chương trình mới"}
          </h2>
          {editingDealId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Hủy sửa
            </button>
          )}
        </div>



        <div className="grid gap-4 md:grid-cols-2">

          <label className="space-y-2">

            <span className="block text-sm font-medium">

              Tên chương trình

            </span>

            <input

              value={title}

              onChange={(e) => setTitle(e.target.value)}

              className="w-full rounded-xl border p-3"

            />

          </label>



          <label className="space-y-2">

            <span className="block text-sm font-medium">Mô tả</span>

            <input

              value={description}

              onChange={(e) => setDescription(e.target.value)}

              className="w-full rounded-xl border p-3"

            />

          </label>



          <label className="space-y-2">

            <span className="block text-sm font-medium">

              Bắt đầu (giờ địa phương)

            </span>

            <input

              type="datetime-local"

              value={startAt}

              onChange={(e) => setStartAt(e.target.value)}

              className="w-full rounded-xl border p-3"

            />

          </label>



          <label className="space-y-2">

            <span className="block text-sm font-medium">

              Kết thúc (giờ địa phương)

            </span>

            <input

              type="datetime-local"

              value={endAt}

              onChange={(e) => setEndAt(e.target.value)}

              className="w-full rounded-xl border p-3"

            />

          </label>

        </div>



        <label className="flex items-start gap-3 rounded-xl border p-4">

          <input

            type="checkbox"

            checked={active}

            onChange={(e) => setActive(e.target.checked)}

            className="mt-1"

          />

          <span>

            <span className="block font-medium">

              Kích hoạt chương trình

            </span>

            <span className="text-sm text-neutral-500">

              Cho phép homepage nhận diện chương trình. Thời gian mở bán vẫn

              được xác định bằng thời điểm bắt đầu và kết thúc.

            </span>

          </span>

        </label>



        <div className="space-y-4">

          <div>

            <h3 className="font-semibold">Chọn sản phẩm và quota</h3>

            <p className="mt-1 text-sm text-neutral-500">

              Thiết lập phần trăm giảm giá và số suất cho từng sản phẩm.

            </p>

          </div>



          <input

            value={keyword}

            onChange={(e) => setKeyword(e.target.value)}

            placeholder="Tìm sản phẩm..."

            className="w-full rounded-xl border p-3"

          />



          <div className="max-h-[500px] space-y-3 overflow-y-auto">

            {filteredProducts.map((product) => {

              const item = selected.find(

                (entry) => entry.product_id === product.id,

              );

              const checked = Boolean(item);



              return (

                <div

                  key={product.id}

                  className={`rounded-2xl border p-4 ${

                    checked ? "border-amber-400 bg-amber-50" : ""

                  }`}

                >

                  <label className="flex cursor-pointer items-center gap-3">

                    <input

                      type="checkbox"

                      checked={checked}

                      onChange={() => toggleProduct(product.id)}

                    />



                    {product.image_url ? (

                      <img

                        src={product.image_url}

                        alt={product.name}

                        className="h-14 w-14 rounded-lg object-cover"

                      />

                    ) : (

                      <div className="h-14 w-14 rounded-lg bg-neutral-100" />

                    )}



                    <span className="min-w-0 flex-1">

                      <span className="block font-medium">

                        {product.name}

                      </span>

                      <span className="text-sm text-neutral-500">

                        Giá gốc:{" "}

                        {Number(product.price).toLocaleString("vi-VN")}đ

                      </span>

                    </span>

                  </label>



                  {checked && item && (

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <label className="space-y-1 text-sm">

                        <span>% giảm</span>

                        <input

                          type="number"

                          min={1}

                          max={100}

                          value={item.discount_percent}

                          onChange={(e) =>

                            updateSelected(

                              product.id,

                              "discount_percent",

                              Number(e.target.value),

                            )

                          }

                          className="w-full rounded-lg border bg-white p-2"

                        />

                      </label>



                      <label className="space-y-1 text-sm">

                        <span>Số suất ưu đãi</span>

                        <input

                          type="number"

                          min={1}

                          step={1}

                          value={item.quota}

                          onChange={(e) =>

                            updateSelected(

                              product.id,

                              "quota",

                              Number(e.target.value),

                            )

                          }

                          className="w-full rounded-lg border bg-white p-2"

                        />

                      </label>

                    </div>

                  )}

                </div>

              );

            })}



            {!loading && filteredProducts.length === 0 && (

              <p className="py-8 text-center text-sm text-neutral-500">

                Không tìm thấy sản phẩm.

              </p>

            )}



            {loading && (

              <p className="py-6 text-center text-sm text-neutral-500">

                Đang tải dữ liệu...

              </p>

            )}

          </div>

        </div>



        <button

          type="button"

          onClick={saveDeal}

          disabled={saving || loading}

          className="w-full rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 sm:w-auto"

        >

          {saving
            ? "Đang lưu..."
            : editingDealId
              ? "Lưu thay đổi"
              : "Tạo Mystery Jackpot"}

        </button>

      </section>



      <section className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <h2 className="text-xl font-semibold">

            Chương trình đã tạo ({deals.length})

          </h2>

          <button

            type="button"

            onClick={() => void loadData()}

            disabled={loading}

            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"

          >

            Làm mới

          </button>

        </div>



        {loading ? (

          <p className="text-sm text-neutral-500">Đang tải dữ liệu...</p>

        ) : deals.length === 0 ? (

          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">

            Chưa có chương trình Mystery Jackpot.

          </p>

        ) : (

          deals.map((deal) => (
            <article
              key={deal.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {deal.title}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        deal.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          deal.active ? "bg-emerald-500" : "bg-neutral-400"
                        }`}
                      />
                      {deal.active ? "Đang kích hoạt" : "Đã tạm tắt"}
                    </span>
                  </div>
                  {deal.description && (
                    <p className="mt-1.5 text-sm leading-5 text-neutral-500">
                      {deal.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-1 text-sm text-neutral-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1">
                    <span>
                      <span className="font-medium text-neutral-700">Bắt đầu:</span>{" "}
                      {formatDate(deal.start_at)}
                    </span>
                    <span>
                      <span className="font-medium text-neutral-700">Kết thúc:</span>{" "}
                      {formatDate(deal.end_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-neutral-400">
                    Quản lý thời gian, sản phẩm và số lượng ưu đãi
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => void editDeal(deal)}
                      disabled={saving || loading}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sửa chương trình
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(deal)}
                      disabled={saving || loading}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        deal.active
                          ? "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {deal.active ? "Tạm tắt" : "Kích hoạt"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))

        )}

      </section>

    </div>

  );

}
