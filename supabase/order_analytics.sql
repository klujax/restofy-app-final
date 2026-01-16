-- =============================================
-- Order Analytics View
-- =============================================

-- Create a view for order analytics
create or replace view public.order_analytics as
select 
  o.id as order_id,
  o.profile_id,
  o.table_number,
  o.status,
  o.total_amount,
  o.created_at,
  date(o.created_at at time zone 'Europe/Istanbul') as order_date,
  extract(hour from o.created_at at time zone 'Europe/Istanbul') as order_hour,
  oi.id as order_item_id,
  oi.menu_item_id,
  oi.menu_item_name,
  oi.quantity,
  oi.unit_price,
  oi.total_price as item_total
from public.orders o
left join public.order_items oi on o.id = oi.order_id
where o.status not in ('rejected');

-- Grant access to authenticated users
grant select on public.order_analytics to authenticated;

-- RLS is inherited from the base tables, but we can add explicit policies
-- The view will respect the RLS policies of the underlying tables
