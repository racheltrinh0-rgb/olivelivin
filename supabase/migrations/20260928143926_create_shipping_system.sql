-- =========================================================
-- OLIVE LIVING — SHIPPING SYSTEM
-- Step 7.2
-- =========================================================

-- =========================================================
-- 1. SHIPPING METHODS
-- =========================================================

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,
  description text,

  active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 2. SHIPPING ZONES
-- =========================================================

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,

  city text,
  description text,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 3. STANDARD SHIPPING RATES
-- =========================================================

create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),

  shipping_method_id uuid not null
    references public.shipping_methods(id)
    on delete cascade,

  shipping_zone_id uuid not null
    references public.shipping_zones(id)
    on delete cascade,

  min_weight numeric(10,2) not null default 0,
  max_weight numeric(10,2),

  price numeric(12,0) not null default 0,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shipping_rates_weight_check
    check (
      min_weight >= 0
      and (
        max_weight is null
        or max_weight >= min_weight
      )
    ),

  constraint shipping_rates_price_check
    check (price >= 0)
);


-- =========================================================
-- 4. EXPRESS SHIPPING RULES
-- =========================================================

create table if not exists public.express_shipping_rules (
  id uuid primary key default gen_random_uuid(),

  shipping_zone_id uuid not null
    references public.shipping_zones(id)
    on delete cascade,

  product_category_id uuid
    references public.categories(id)
    on delete cascade,

  min_weight numeric(10,2) not null default 0,
  max_weight numeric(10,2),

  price numeric(12,0) not null default 0,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint express_shipping_weight_check
    check (
      min_weight >= 0
      and (
        max_weight is null
        or max_weight >= min_weight
      )
    ),

  constraint express_shipping_price_check
    check (price >= 0)
);


-- =========================================================
-- 5. INDEXES
-- =========================================================

create index if not exists idx_shipping_rates_method
  on public.shipping_rates(shipping_method_id);

create index if not exists idx_shipping_rates_zone
  on public.shipping_rates(shipping_zone_id);

create index if not exists idx_shipping_rates_weight
  on public.shipping_rates(min_weight, max_weight);

create index if not exists idx_express_rules_zone
  on public.express_shipping_rules(shipping_zone_id);

create index if not exists idx_express_rules_category
  on public.express_shipping_rules(product_category_id);

create index if not exists idx_express_rules_weight
  on public.express_shipping_rules(min_weight, max_weight);


-- =========================================================
-- 6. SEED SHIPPING METHODS
-- =========================================================

insert into public.shipping_methods
  (name, code, description, active, sort_order)
values
  (
    'Giao hàng tiêu chuẩn',
    'STANDARD',
    'Giao hàng tiêu chuẩn',
    true,
    1
  ),
  (
    'Giao hàng nhanh',
    'EXPRESS',
    'Giao hàng nhanh trong khu vực hỗ trợ',
    true,
    2
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();


-- =========================================================
-- 7. SEED SHIPPING ZONES
-- =========================================================

insert into public.shipping_zones
  (name, code, city, description, active)
values
  (
    'HCM nội thành',
    'HCM_CENTRAL',
    'Ho Chi Minh City',
    'Khu vực nội thành TP.HCM',
    true
  ),
  (
    'HCM ngoại thành',
    'HCM_OUTER',
    'Ho Chi Minh City',
    'Khu vực ngoại thành TP.HCM',
    true
  ),
  (
    'Hà Nội',
    'HANOI',
    'Ha Noi',
    'Khu vực Hà Nội',
    true
  ),
  (
    'Miền Nam',
    'SOUTH',
    null,
    'Các tỉnh miền Nam',
    true
  ),
  (
    'Miền Trung',
    'CENTRAL',
    null,
    'Các tỉnh miền Trung',
    true
  ),
  (
    'Miền Bắc',
    'NORTH',
    null,
    'Các tỉnh miền Bắc',
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  city = excluded.city,
  description = excluded.description,
  active = excluded.active,
  updated_at = now();


-- =========================================================
-- 8. COMMENTS
-- =========================================================

comment on table public.shipping_methods is
  'Phương thức giao hàng của Olive Living';

comment on table public.shipping_zones is
  'Khu vực tính phí giao hàng';

comment on table public.shipping_rates is
  'Bảng phí Standard theo khu vực và trọng lượng';

comment on table public.express_shipping_rules is
  'Quy tắc phí Express theo khu vực, danh mục và trọng lượng';
