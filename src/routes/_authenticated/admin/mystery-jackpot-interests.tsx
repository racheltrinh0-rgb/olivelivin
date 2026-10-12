import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, RefreshCw, Search, Users, Phone, CalendarDays, Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/mystery-jackpot-interests")({
  component: MysteryJackpotInterestsPage,
});

type Interest = {
  id: string;
  customer_name: string;
  phone: string;
  mystery_deal_id: string;
  mystery_deal_product_id: string;
  created_at: string;
};

type Deal = { id: string; title: string | null };
type DealProduct = { id: string; product_id: string; mystery_deal_id: string; products?: { name?: string | null } | null };

const PAGE_SIZE = 20;
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function MysteryJackpotInterestsPage() {
  const [rows, setRows] = useState<Interest[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [search, setSearch] = useState("");
  const [dealFilter, setDealFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [interestResult, dealResult, productResult] = await Promise.all([
        supabase
          .from("mystery_deal_interests")
          .select("id, customer_name, phone, mystery_deal_id, mystery_deal_product_id, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("mystery_deals").select("id, title").order("created_at", { ascending: false }),
        supabase.from("mystery_deal_products").select("id, product_id, mystery_deal_id, products(name)"),
      ]);
      if (interestResult.error) throw interestResult.error;
      if (dealResult.error) throw dealResult.error;
      if (productResult.error) throw productResult.error;
      setRows((interestResult.data ?? []) as Interest[]);
      setDeals((dealResult.data ?? []) as Deal[]);
      setDealProducts((productResult.data ?? []) as unknown as DealProduct[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách khách quan tâm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const dealMap = useMemo(() => new Map(deals.map((item) => [item.id, item.title || "Mystery Jackpot"])), [deals]);
  const productMap = useMemo(() => new Map(dealProducts.map((item) => [item.id, item.products?.name || "Sản phẩm bí mật"])), [dealProducts]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi-VN");
    return rows.filter((row) => {
      const matchesSearch = !term || row.customer_name.toLocaleLowerCase("vi-VN").includes(term) || row.phone.toLowerCase().includes(term);
      const matchesDeal = dealFilter === "all" || row.mystery_deal_id === dealFilter;
      return matchesSearch && matchesDeal;
    });
  }, [rows, search, dealFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const todayCount = rows.filter((row) => {
    const date = new Date(row.created_at);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }).length;

  useEffect(() => { setPage(1); }, [search, dealFilter]);

  const exportCsv = () => {
    const header = ["Tên khách hàng", "Số điện thoại", "Chương trình", "Sản phẩm", "Thời gian đăng ký"];
    const lines = filteredRows.map((row) => [
      row.customer_name,
      row.phone,
      dealMap.get(row.mystery_deal_id) || "Mystery Jackpot",
      productMap.get(row.mystery_deal_product_id) || "Sản phẩm bí mật",
      dateFormatter.format(new Date(row.created_at)),
    ]);
    const csv = "\uFEFF" + [header, ...lines].map((line) => line.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mystery-jackpot-interests-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#f8f8f7] p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold tracking-wide text-[#f4510b]">
              <Gift size={14} /> MYSTERY JACKPOT
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">Khách hàng quan tâm</h1>
            <p className="mt-1 text-sm text-neutral-500">Quản lý thông tin khách đăng ký nhận thông báo về sản phẩm bí mật.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadData()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
            </button>
            <button onClick={exportCsv} disabled={!filteredRows.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#ff4d00] px-4 text-sm font-semibold text-white transition hover:bg-[#e94700] disabled:cursor-not-allowed disabled:opacity-50">
              <Download size={16} /> Xuất CSV
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-neutral-200/30">
            <div className="flex items-center justify-between text-sm text-neutral-500"><span>Tổng lượt quan tâm</span><Users size={18} className="text-[#ff4d00]" /></div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">{rows.length.toLocaleString("vi-VN")}</div>
            <p className="mt-1 text-xs text-neutral-400">Tất cả chương trình</p>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-neutral-200/30">
            <div className="flex items-center justify-between text-sm text-neutral-500"><span>Đăng ký hôm nay</span><CalendarDays size={18} className="text-[#ff4d00]" /></div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">{todayCount.toLocaleString("vi-VN")}</div>
            <p className="mt-1 text-xs text-neutral-400">Theo ngày trên máy chủ</p>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-neutral-200/30">
            <div className="flex items-center justify-between text-sm text-neutral-500"><span>Kết quả đang hiển thị</span><Phone size={18} className="text-[#ff4d00]" /></div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">{filteredRows.length.toLocaleString("vi-VN")}</div>
            <p className="mt-1 text-xs text-neutral-400">Sau khi tìm kiếm và lọc</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm shadow-neutral-200/30">
          <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 md:flex-row md:items-center">
            <label className="relative block flex-1">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc số điện thoại..." className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50" />
            </label>
            <select value={dealFilter} onChange={(event) => setDealFilter(event.target.value)} className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50 md:min-w-64">
              <option value="all">Tất cả chương trình</option>
              {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title || "Mystery Jackpot"}</option>)}
            </select>
          </div>

          {error ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Không tải được dữ liệu</p><p className="mt-1 break-words">{error}</p>
              <p className="mt-2 text-xs">Kiểm tra bảng <code>mystery_deal_interests</code> và quyền SELECT dành riêng cho admin trong Supabase RLS.</p>
            </div>
          ) : loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-neutral-500"><Loader2 size={18} className="animate-spin" /> Đang tải danh sách...</div>
          ) : visibleRows.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#ff4d00]"><Users size={22} /></div>
              <p className="mt-3 text-sm font-semibold text-neutral-800">Chưa có khách hàng phù hợp</p>
              <p className="mt-1 text-sm text-neutral-500">Thử đổi từ khóa tìm kiếm hoặc bộ lọc chương trình.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead><tr className="bg-neutral-50/80 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-5 py-3.5">Khách hàng</th><th className="px-5 py-3.5">Số điện thoại</th><th className="px-5 py-3.5">Sản phẩm quan tâm</th><th className="px-5 py-3.5">Chương trình</th><th className="px-5 py-3.5">Thời gian đăng ký</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-100">
                    {visibleRows.map((row) => <tr key={row.id} className="transition hover:bg-orange-50/30">
                      <td className="px-5 py-4"><div className="font-medium text-neutral-900">{row.customer_name}</div><div className="mt-1 text-[11px] text-neutral-400">ID: {row.id.slice(0, 8)}</div></td>
                      <td className="px-5 py-4"><a href={`tel:${row.phone}`} className="font-medium text-neutral-700 hover:text-[#ff4d00]">{row.phone}</a></td>
                      <td className="px-5 py-4"><span className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-700">{productMap.get(row.mystery_deal_product_id) || "Sản phẩm bí mật"}</span></td>
                      <td className="px-5 py-4 text-sm text-neutral-600">{dealMap.get(row.mystery_deal_id) || "Mystery Jackpot"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-500">{dateFormatter.format(new Date(row.created_at))}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">Hiển thị {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} trong {filteredRows.length.toLocaleString("vi-VN")} khách hàng</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="h-9 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40">Trước</button>
                  <span className="min-w-16 text-center text-sm text-neutral-600">{page} / {totalPages}</span>
                  <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="h-9 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40">Tiếp</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
