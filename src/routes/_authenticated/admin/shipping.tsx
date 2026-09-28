import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Edit3,
  Plus,
  Save,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/shipping")({
  component: ShippingAdminPage,
});

type ShippingMethod = {
  id: string;
  name: string;
  code: "STANDARD" | "EXPRESS" | string;
  description?: string | null;
  active: boolean;
  sort_order: number;
};

type ShippingZone = {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  description?: string | null;
  active: boolean;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  category_id: string | null;
};

type ExpressRuleProduct = {
  express_shipping_rule_id: string;
  product_id: string;
};

type ShippingRate = {
  id: string;
  shipping_method_id: string;
  shipping_zone_id: string;
  min_weight: number;
  max_weight: number | null;
  price: number;
  active: boolean;
};

type ExpressRule = {
  id: string;
  shipping_zone_id: string;
  product_category_id: string | null;
  product_id: string | null;
  min_weight: number;
  max_weight: number | null;
  price: number;
  active: boolean;
};

type RuleForm = {
  zoneId: string;
  categoryId: string;
  productIds: string[];
  minWeight: string;
  maxWeight: string;
  price: string;
  active: boolean;
};

const BLUE = {
  primary: "#6F9DBB",
  dark: "#5D8EAC",
  light: "#EAF3F8",
  soft: "#F4F8FA",
  border: "#D7E5ED",
  text: "#4F7894",
};

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
}

function emptyForm(): RuleForm {
  return {
    zoneId: "",
    categoryId: "",
    productIds: [],
    minWeight: "0",
    maxWeight: "",
    price: "",
    active: true,
  };
}

function ShippingAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm());
  const [errorMessage, setErrorMessage] = useState("");

  const methodsQuery = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shipping_methods")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ShippingMethod[];
    },
  });

  const zonesQuery = useQuery({
    queryKey: ["shipping-zones"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shipping_zones")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ShippingZone[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["shipping-categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("categories")
        .select("id,name")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const productsQuery = useQuery({
    queryKey: ["shipping-products"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("id,name,category_id")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const standardMethod = useMemo(
    () => methodsQuery.data?.find((item) => item.code === "STANDARD"),
    [methodsQuery.data],
  );

  const expressMethod = useMemo(
    () => methodsQuery.data?.find((item) => item.code === "EXPRESS"),
    [methodsQuery.data],
  );

  const standardQuery = useQuery({
    queryKey: ["shipping-rates", standardMethod?.id],
    enabled: Boolean(standardMethod?.id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shipping_rates")
        .select("*")
        .eq("shipping_method_id", standardMethod!.id)
        .order("min_weight", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ShippingRate[];
    },
  });

  const expressQuery = useQuery({
    queryKey: ["express-shipping-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("express_shipping_rules")
        .select("*")
        .order("min_weight", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ExpressRule[];
    },
  });

  const expressRuleProductsQuery = useQuery({
    queryKey: ["express-shipping-rule-products"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("express_shipping_rule_products")
        .select("express_shipping_rule_id,product_id");

      if (error) throw error;
      return (data ?? []) as ExpressRuleProduct[];
    },
  });

  const zones = zonesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const standardRates = standardQuery.data ?? [];
  const expressRules = expressQuery.data ?? [];
  const expressRuleProducts = expressRuleProductsQuery.data ?? [];

  const productLinksByRule = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const link of expressRuleProducts) {
      const current = map.get(link.express_shipping_rule_id) ?? [];
      current.push(link.product_id);
      map.set(link.express_shipping_rule_id, current);
    }

    // Backward compatibility with the old single-product column.
    for (const rule of expressRules) {
      if (!map.has(rule.id) && rule.product_id) {
        map.set(rule.id, [rule.product_id]);
      }
    }

    return map;
  }, [expressRuleProducts, expressRules]);

  const formProducts = useMemo(() => {
    if (!form.categoryId) return products;
    return products.filter((product) => product.category_id === form.categoryId);
  }, [products, form.categoryId]);

  const filteredStandard = useMemo(() => {
    return standardRates.filter((rule) => {
      return selectedZone === "all" || rule.shipping_zone_id === selectedZone;
    });
  }, [standardRates, selectedZone]);

  const filteredExpress = useMemo(() => {
    return expressRules.filter((rule) => {
      const zoneOk =
        selectedZone === "all" || rule.shipping_zone_id === selectedZone;
      const categoryOk =
        selectedCategory === "all" ||
        rule.product_category_id === selectedCategory;
      const productOk =
        selectedProduct === "all" ||
        (productLinksByRule.get(rule.id) ?? []).includes(selectedProduct);

      return zoneOk && categoryOk && productOk;
    });
  }, [
    expressRules,
    selectedZone,
    selectedCategory,
    selectedProduct,
    productLinksByRule,
  ]);

  const currentCount =
    mode === "STANDARD" ? filteredStandard.length : filteredExpress.length;

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["shipping-rates"] }),
      queryClient.invalidateQueries({ queryKey: ["express-shipping-rules"] }),
      queryClient.invalidateQueries({
        queryKey: ["express-shipping-rule-products"],
      }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage("");

      const price = Number(form.price);
      const minWeight = Number(form.minWeight);
      const maxWeight = form.maxWeight.trim()
        ? Number(form.maxWeight)
        : null;

      if (!form.zoneId) {
        throw new Error("Vui lòng chọn khu vực giao hàng.");
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Phí vận chuyển không hợp lệ.");
      }

      if (!Number.isFinite(minWeight) || minWeight < 0) {
        throw new Error("Khối lượng tối thiểu không hợp lệ.");
      }

      if (
        maxWeight !== null &&
        (!Number.isFinite(maxWeight) || maxWeight < minWeight)
      ) {
        throw new Error("Khối lượng tối đa phải lớn hơn hoặc bằng tối thiểu.");
      }

      if (mode === "STANDARD") {
        if (!standardMethod?.id) {
          throw new Error("Chưa tìm thấy phương thức Standard.");
        }

        const payload = {
          shipping_method_id: standardMethod.id,
          shipping_zone_id: form.zoneId,
          min_weight: minWeight,
          max_weight: maxWeight,
          price,
          active: form.active,
        };

        if (editingId) {
          const { error } = await (supabase as any)
            .from("shipping_rates")
            .update(payload)
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from("shipping_rates")
            .insert(payload);

          if (error) throw error;
        }
      } else {
        const payload = {
          shipping_zone_id: form.zoneId,
          product_category_id: form.categoryId || null,
          // Kept null for backward compatibility. Multiple products are
          // stored in express_shipping_rule_products.
          product_id: null,
          min_weight: minWeight,
          max_weight: maxWeight,
          price,
          active: form.active,
        };

        let ruleId = editingId;

        if (editingId) {
          const { error } = await (supabase as any)
            .from("express_shipping_rules")
            .update(payload)
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { data, error } = await (supabase as any)
            .from("express_shipping_rules")
            .insert(payload)
            .select("id")
            .single();

          if (error) throw error;
          ruleId = data?.id ?? null;
        }

        if (!ruleId) {
          throw new Error("Không xác định được quy tắc hỏa tốc.");
        }

        // Replace product assignments atomically from the UI perspective.
        const { error: deleteLinksError } = await (supabase as any)
          .from("express_shipping_rule_products")
          .delete()
          .eq("express_shipping_rule_id", ruleId);

        if (deleteLinksError) throw deleteLinksError;

        if (form.productIds.length > 0) {
          const productRows = form.productIds.map((productId) => ({
            express_shipping_rule_id: ruleId,
            product_id: productId,
          }));

          const { error: insertLinksError } = await (supabase as any)
            .from("express_shipping_rule_products")
            .insert(productRows);

          if (insertLinksError) throw insertLinksError;
        }
      }
    },
    onSuccess: async () => {
      setShowForm(false);
      setEditingId(null);
      setProductMenuOpen(false);
      setForm(emptyForm());
      await invalidateAll();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Không thể lưu quy tắc.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const table =
        mode === "STANDARD" ? "shipping_rates" : "express_shipping_rules";

      const { error } = await (supabase as any).from(table).delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: invalidateAll,
    onError: (error: Error) => {
      setErrorMessage(error.message || "Không thể xóa quy tắc.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const table =
        mode === "STANDARD" ? "shipping_rates" : "express_shipping_rules";

      const { error } = await (supabase as any)
        .from(table)
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: invalidateAll,
    onError: (error: Error) => {
      setErrorMessage(error.message || "Không thể cập nhật trạng thái.");
    },
  });

  function openCreate() {
    const firstZone = zones.find((zone) => zone.active)?.id ?? zones[0]?.id ?? "";
    setEditingId(null);
    setProductMenuOpen(false);
    setForm({
      ...emptyForm(),
      zoneId: firstZone,
    });
    setErrorMessage("");
    setShowForm(true);
  }

  function openEdit(
    rule: ShippingRate | ExpressRule,
  ) {
    setEditingId(rule.id);
    setForm({
      zoneId: rule.shipping_zone_id,
      categoryId:
        mode === "EXPRESS"
          ? (rule as ExpressRule).product_category_id ?? ""
          : "",
      productIds:
        mode === "EXPRESS"
          ? (productLinksByRule.get(rule.id) ?? [])
          : [],
      minWeight: String(rule.min_weight ?? 0),
      maxWeight:
        rule.max_weight === null || rule.max_weight === undefined
          ? ""
          : String(rule.max_weight),
      price: String(rule.price ?? 0),
      active: rule.active,
    });
    setErrorMessage("");
    setShowForm(true);
  }

  function switchMode(next: "STANDARD" | "EXPRESS") {
    setMode(next);
    setSelectedZone("all");
    setSelectedCategory("all");
    setSelectedProduct("all");
    setShowForm(false);
    setProductMenuOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setErrorMessage("");
  }

  const selectedMethod = mode === "STANDARD" ? standardMethod : expressMethod;

  return (
    <div className="min-h-screen bg-[#F8F8F5] font-sans text-[#242622]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/account" })}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E2E4E0] bg-white px-3.5 text-xs font-medium text-[#62665F] transition hover:border-[#C9CDD0] hover:bg-[#FAFBFB]"
          >
            <ArrowLeft size={14} />
            Quay lại Dashboard
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6F9DBB] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5D8EAC] hover:-translate-y-0.5"
          >
            <Plus size={15} />
            Thêm quy tắc
          </button>
        </div>

        <header className="mb-7">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F9DBB]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6F9DBB]" />
            Olive Living Admin
          </p>

          <h1 className="text-3xl tracking-tight text-[#20221F] sm:text-4xl">
            Vận chuyển
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#747871]">
            Quản lý phí giao hàng tiêu chuẩn và hỏa tốc theo khu vực, trọng
            lượng và danh mục sản phẩm.
          </p>
        </header>

        {errorMessage ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => switchMode("STANDARD")}
            className={`group relative min-h-[142px] overflow-hidden rounded-2xl border p-5 text-left transition-all sm:p-6 ${
              mode === "STANDARD"
                ? "border-[#6F9DBB] bg-[#6F9DBB] text-white shadow-[0_12px_30px_rgba(111,157,187,0.16)]"
                : "border-[#E0E3E1] bg-white hover:border-[#C7D8E3]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  mode === "STANDARD"
                    ? "bg-white/15 text-white"
                    : "bg-[#F4F8FA] text-[#5D8EAC]"
                }`}
              >
                <Truck size={17} strokeWidth={1.8} />
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                  mode === "STANDARD"
                    ? "bg-white/15 text-white"
                    : "bg-[#F4F8FA] text-[#5D8EAC]"
                }`}
              >
                Standard
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Tiêu chuẩn</h2>
                <p
                  className={`mt-1 text-xs ${
                    mode === "STANDARD" ? "text-white/75" : "text-[#777C76]"
                  }`}
                >
                  Phí giao hàng theo khu vực và trọng lượng.
                </p>
              </div>

              <span
                className={`shrink-0 text-xs ${
                  mode === "STANDARD" ? "text-white/75" : "text-[#777C76]"
                }`}
              >
                {standardRates.length} rules
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchMode("EXPRESS")}
            className={`group relative min-h-[142px] overflow-hidden rounded-2xl border p-5 text-left transition-all sm:p-6 ${
              mode === "EXPRESS"
                ? "border-[#6F9DBB] bg-[#EAF3F8] shadow-[0_12px_30px_rgba(111,157,187,0.10)]"
                : "border-[#E0E3E1] bg-white hover:border-[#C7D8E3]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#5D8EAC]"
              >
                <Zap size={17} strokeWidth={1.8} />
              </span>

              <span className="rounded-full bg-[#EAF3F8] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#527F9B]">
                Express
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#2C302C]">
                  Hỏa tốc
                </h2>
                <p className="mt-1 text-xs text-[#777C76]">
                  Phí giao nhanh theo khu vực và sản phẩm.
                </p>
              </div>

              <span className="shrink-0 text-xs text-[#777C76]">
                {expressRules.length} rules
              </span>
            </div>
          </button>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#E0E3E1] bg-white">
          <div className="border-b border-[#E7E9E7] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="min-w-0 whitespace-nowrap text-[16px] font-medium leading-6 text-[#30332F]">
                    {mode === "STANDARD"
                      ? "Bảng giá tiêu chuẩn"
                      : "Quy tắc giao hỏa tốc"}
                  </h2>

                  <span className="rounded-full bg-[#F4F5F3] px-2 py-1 text-[9px] font-medium text-[#777B74]">
                    {currentCount} rules
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#858A83]">
                  {mode === "STANDARD"
                    ? "Áp dụng theo khu vực và trọng lượng đơn hàng."
                    : "Áp dụng theo khu vực, danh mục, từng sản phẩm và trọng lượng sản phẩm."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:items-center">
                <label className="relative">
                  <span className="sr-only">Khu vực</span>
                  <select
                    value={selectedZone}
                    onChange={(event) => setSelectedZone(event.target.value)}
                    className="h-9 min-w-[170px] appearance-none rounded-lg border border-[#E1E4E1] bg-white pl-3 pr-8 text-xs text-[#555A54] outline-none transition focus:border-[#9AB8CA] focus:ring-2 focus:ring-[#EAF3F8]"
                  >
                    <option value="all">Tất cả khu vực</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#90958E]"
                  />
                </label>

                {mode === "EXPRESS" ? (
                  <label className="relative">
                    <span className="sr-only">Danh mục</span>
                    <select
                      value={selectedCategory}
                      onChange={(event) =>
                        setSelectedCategory(event.target.value)
                      }
                      className="h-9 min-w-[170px] appearance-none rounded-lg border border-[#E1E4E1] bg-white pl-3 pr-8 text-xs text-[#555A54] outline-none transition focus:border-[#9AB8CA] focus:ring-2 focus:ring-[#EAF3F8]"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#90958E]"
                    />
                  </label>
                ) : null}

                {mode === "EXPRESS" ? (
                  <label className="relative">
                    <span className="sr-only">Sản phẩm</span>
                    <select
                      value={selectedProduct}
                      onChange={(event) => setSelectedProduct(event.target.value)}
                      className="h-9 min-w-[170px] appearance-none rounded-lg border border-[#E1E4E1] bg-white pl-3 pr-8 text-xs text-[#555A54] outline-none transition focus:border-[#9AB8CA] focus:ring-2 focus:ring-[#EAF3F8]"
                    >
                      <option value="all">Tất cả sản phẩm</option>
                      {products
                        .filter(
                          (product) =>
                            selectedCategory === "all" ||
                            product.category_id === selectedCategory,
                        )
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#90958E]"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </div>

          {currentCount === 0 ? (
            <div className="flex min-h-[330px] flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F5F4] text-[#9AA09A]">
                {mode === "STANDARD" ? (
                  <Truck size={23} strokeWidth={1.5} />
                ) : (
                  <Zap size={22} strokeWidth={1.5} />
                )}
              </div>

              <h3 className="mt-4 text-base text-[#4A4E49]">
                {mode === "STANDARD"
                  ? "Chưa có bảng giá tiêu chuẩn"
                  : "Chưa có quy tắc hỏa tốc"}
              </h3>

              <p className="mt-1 max-w-md text-xs leading-5 text-[#8A8F88]">
                Thêm quy tắc đầu tiên để checkout có thể tính phí giao hàng.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#6F9DBB] px-4 text-xs font-semibold text-white transition hover:bg-[#5D8EAC]"
              >
                <Plus size={14} />
                Thêm quy tắc
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-left">
                <thead className="border-b border-[#ECEEEC] bg-[#FBFCFB]">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8F88]">
                    <th className="px-5 py-3.5">Khu vực</th>
                    {mode === "EXPRESS" ? (
                      <>
                        <th className="px-5 py-3.5">Danh mục</th>
                        <th className="px-5 py-3.5">Sản phẩm</th>
                      </>
                    ) : null}
                    <th className="px-5 py-3.5">Trọng lượng</th>
                    <th className="px-5 py-3.5">Phí ship</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EEF0EE]">
                  {(mode === "STANDARD"
                    ? filteredStandard
                    : filteredExpress
                  ).map((rule) => {
                    const zone = zones.find(
                      (item) => item.id === rule.shipping_zone_id,
                    );

                    const category =
                      mode === "EXPRESS"
                        ? categories.find(
                            (item) =>
                              item.id ===
                              (rule as ExpressRule).product_category_id,
                          )
                        : null;

                    const ruleProductIds =
                      mode === "EXPRESS"
                        ? productLinksByRule.get(rule.id) ?? []
                        : [];

                    const ruleProducts =
                      mode === "EXPRESS"
                        ? products.filter((product) =>
                            ruleProductIds.includes(product.id),
                          )
                        : [];

                    return (
                      <tr
                        key={rule.id}
                        className="text-xs text-[#50554E] transition hover:bg-[#FAFCFD]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-[#333731]">
                            {zone?.name ?? "—"}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#969B94]">
                            {zone?.code ?? ""}
                          </div>
                        </td>

                        {mode === "EXPRESS" ? (
                          <>
                            <td className="px-5 py-4">
                              {category?.name ?? "Tất cả danh mục"}
                            </td>
                            <td className="max-w-[360px] px-5 py-4">
                              {ruleProducts.length === 0 ? (
                                <span className="text-[#8A8F88]">
                                  Tất cả sản phẩm
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {ruleProducts.slice(0, 3).map((product) => (
                                    <span
                                      key={product.id}
                                      className="rounded-md bg-[#F4F8FA] px-2 py-1 text-[10px] text-[#527F9B]"
                                    >
                                      {product.name}
                                    </span>
                                  ))}
                                  {ruleProducts.length > 3 ? (
                                    <span className="rounded-md bg-[#F1F2F1] px-2 py-1 text-[10px] text-[#737871]">
                                      +{ruleProducts.length - 3} sản phẩm
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </td>
                          </>
                        ) : null}

                        <td className="px-5 py-4">
                          {rule.min_weight} kg
                          {rule.max_weight !== null &&
                          rule.max_weight !== undefined
                            ? ` – ${rule.max_weight} kg`
                            : " trở lên"}
                        </td>

                        <td className="px-5 py-4 font-semibold tabular-nums text-[#3E464A]">
                          {formatVND(rule.price)}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: rule.id,
                                active: !rule.active,
                              })
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium ${
                              rule.active
                                ? "bg-[#EAF3F8] text-[#527F9B]"
                                : "bg-[#F1F2F1] text-[#888D86]"
                            }`}
                          >
                            {rule.active ? <Check size={10} /> : null}
                            {rule.active ? "Đang áp dụng" : "Tạm tắt"}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(rule)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E6E4] text-[#68716A] transition hover:border-[#BFD3DF] hover:bg-[#F4F8FA] hover:text-[#527F9B]"
                              aria-label="Sửa quy tắc"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Bạn có chắc muốn xóa quy tắc này?",
                                  )
                                ) {
                                  deleteMutation.mutate(rule.id);
                                }
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E6E4] text-[#858A84] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              aria-label="Xóa quy tắc"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#182026]/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
          <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-[#DDE2E4] bg-white shadow-[0_24px_80px_rgba(34,48,56,0.16)] sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-[#ECEEEC] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6F9DBB]">
                  {mode === "STANDARD" ? "STANDARD" : "EXPRESS"}
                </p>
                <h2 className="mt-1 text-xl text-[#2C302C]">
                  {editingId ? "Chỉnh sửa quy tắc" : "Thêm quy tắc"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A9089] hover:bg-[#F4F5F4]"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <Field label="Khu vực">
                <select
                  value={form.zoneId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      zoneId: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Chọn khu vực</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </Field>

              {mode === "EXPRESS" ? (
                <>
                  <Field label="Danh mục sản phẩm">
                    <select
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          categoryId: event.target.value,
                          productIds: [],
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Sản phẩm cụ thể">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setProductMenuOpen((open) => !open)}
                        className={`${inputClass} flex items-center justify-between text-left ${
                          form.productIds.length > 0
                            ? "border-[#9AB8CA] bg-[#FAFCFD]"
                            : ""
                        }`}
                      >
                        <span className="min-w-0 truncate">
                          {form.productIds.length === 0
                            ? "Tất cả sản phẩm"
                            : `Đã chọn ${form.productIds.length} sản phẩm`}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-[#858C85] transition ${
                            productMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {productMenuOpen ? (
                        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-[#DDE4E7] bg-white shadow-[0_16px_40px_rgba(35,49,57,0.14)]">
                          <div className="flex items-center justify-between border-b border-[#EEF0EE] px-3 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7C837B]">
                              Chọn nhiều sản phẩm
                            </span>

                            {form.productIds.length > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    productIds: [],
                                  }))
                                }
                                className="text-[10px] font-medium text-[#6F9DBB] hover:underline"
                              >
                                Bỏ chọn
                              </button>
                            ) : null}
                          </div>

                          <div className="max-h-[260px] overflow-y-auto p-1.5">
                            {formProducts.length === 0 ? (
                              <div className="px-3 py-5 text-center text-xs text-[#8A9089]">
                                {form.categoryId
                                  ? "Danh mục này chưa có sản phẩm."
                                  : "Chọn danh mục để lọc sản phẩm."}
                              </div>
                            ) : (
                              formProducts.map((product) => {
                                const checked = form.productIds.includes(
                                  product.id,
                                );

                                return (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() =>
                                      setForm((current) => ({
                                        ...current,
                                        productIds: checked
                                          ? current.productIds.filter(
                                              (id) => id !== product.id,
                                            )
                                          : [
                                              ...current.productIds,
                                              product.id,
                                            ],
                                      }))
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F6F9FA]"
                                  >
                                    <span
                                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                        checked
                                          ? "border-[#6F9DBB] bg-[#6F9DBB] text-white"
                                          : "border-[#CBD2CE] bg-white"
                                      }`}
                                    >
                                      {checked ? <Check size={11} /> : null}
                                    </span>

                                    <span className="min-w-0 flex-1 truncate text-xs text-[#414640]">
                                      {product.name}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {form.productIds.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {form.productIds.map((productId) => {
                          const product = products.find(
                            (item) => item.id === productId,
                          );

                          if (!product) return null;

                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  productIds: current.productIds.filter(
                                    (id) => id !== product.id,
                                  ),
                                }))
                              }
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#EAF3F8] px-2.5 py-1 text-[10px] text-[#527F9B]"
                              title="Bỏ sản phẩm"
                            >
                              <span className="max-w-[220px] truncate">
                                {product.name}
                              </span>
                              <span className="text-[#6F9DBB]">×</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-[#8A9089]">
                        Không chọn sản phẩm = áp dụng cho toàn bộ danh mục.
                      </p>
                    )}
                  </Field>
                </>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Từ kg">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minWeight}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minWeight: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                </Field>

                <Field label="Đến kg">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxWeight}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maxWeight: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Không giới hạn"
                  />
                </Field>
              </div>

              <Field label="Phí vận chuyển">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className={`${inputClass} pr-10`}
                    placeholder="55000"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A9089]">
                    đ
                  </span>
                </div>
              </Field>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E1E5E3] bg-[#FBFCFB] px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-[#444943]">
                    Áp dụng quy tắc
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#8A9089]">
                    Checkout sẽ sử dụng quy tắc này khi tính phí.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      active: !current.active,
                    }))
                  }
                  className={`relative h-6 w-10 rounded-full transition ${
                    form.active ? "bg-[#6F9DBB]" : "bg-[#D8DCD9]"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      form.active ? "left-5" : "left-1"
                    }`}
                  />
                </button>
              </label>

              {errorMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 border-t border-[#ECEEEC] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 flex-1 rounded-xl border border-[#E0E3E1] bg-white text-xs font-medium text-[#666B65] transition hover:bg-[#F7F8F7]"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#6F9DBB] text-xs font-semibold text-white transition hover:bg-[#5D8EAC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {saveMutation.isPending ? "Đang lưu..." : "Lưu quy tắc"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-[#E0E4E2] bg-white px-3 text-sm text-[#414640] outline-none transition placeholder:text-[#A0A59F] focus:border-[#9AB8CA] focus:ring-2 focus:ring-[#EAF3F8]";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#777D76]">
        {label}
      </span>
      {children}
    </label>
  );
}
