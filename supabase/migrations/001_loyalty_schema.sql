-- AION Loyalty System - Core Database Schema
-- Version: 1.0
-- Description: Tables for NFC device management, transaction ledger, and user balances

-- ============================================================================
-- 1. NFC Devices Table (Hardware Inventory)
-- ============================================================================
-- Stores both physical NTAG 424 DNA cards and mock QR devices for testing

create table if not exists nfc_devices (
  id uuid default uuid_generate_v4() primary key,
  uid_hex text unique not null,
  device_type text default 'ntag424' check (device_type in ('ntag424', 'qr_mock')),
  enc_key_version int default 1,
  last_counter int default 0,
  assigned_restaurant_id uuid,  -- Will link to restaurants table when it exists
  status text default 'active' check (status in ('active', 'lost', 'revoked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index idx_nfc_devices_uid on nfc_devices(uid_hex);
create index idx_nfc_devices_restaurant on nfc_devices(assigned_restaurant_id);
create index idx_nfc_devices_status on nfc_devices(status) where status = 'active';

-- Comments
comment on table nfc_devices is 'Inventory of physical NFC cards and mock QR devices';
comment on column nfc_devices.uid_hex is 'Unique identifier from NFC chip or mock ID (e.g., PROTO_001)';
comment on column nfc_devices.last_counter is 'Anti-replay protection: tracks last successfully validated counter';
comment on column nfc_devices.enc_key_version is 'Version of AES-128 key used for CMAC validation';

-- ============================================================================
-- 2. Loyalty Transactions Table (Ledger)
-- ============================================================================
-- Immutable log of all point awards

create table if not exists loyalty_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  device_id uuid references nfc_devices(id) on delete set null,
  restaurant_id uuid,  -- Will link to restaurants table when it exists
  amount int default 1 check (amount > 0),
  transaction_type text default 'earn' check (transaction_type in ('earn', 'redeem', 'expired', 'admin_adjust')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index idx_loyalty_tx_user on loyalty_transactions(user_id, created_at desc);
create index idx_loyalty_tx_device on loyalty_transactions(device_id);
create index idx_loyalty_tx_restaurant on loyalty_transactions(restaurant_id);
create index idx_loyalty_tx_type on loyalty_transactions(transaction_type);

-- Comments
comment on table loyalty_transactions is 'Immutable ledger of all loyalty point transactions';
comment on column loyalty_transactions.metadata is 'JSON: {gps_coords?, waiter_id?, ip_address?, tap_duration_ms?}';
comment on column loyalty_transactions.transaction_type is 'earn=tap award, redeem=reward claimed, expired=points lost';

-- ============================================================================
-- 3. User Loyalty Balance Table (Cached Summary)
-- ============================================================================
-- Materialized view of current user balances per restaurant

create table if not exists user_loyalty_balance (
  user_id uuid references auth.users(id) on delete cascade,
  restaurant_id uuid,  -- Will link to restaurants table when it exists
  current_stamps int default 0 check (current_stamps >= 0),
  lifetime_stamps int default 0 check (lifetime_stamps >= 0),
  last_stamp_at timestamptz,
  last_reward_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, restaurant_id)
);

-- Indexes
create index idx_balance_user on user_loyalty_balance(user_id);
create index idx_balance_restaurant on user_loyalty_balance(restaurant_id);

-- Comments
comment on table user_loyalty_balance is 'Cached summary of user points per restaurant';
comment on column user_loyalty_balance.current_stamps is 'Active stamps toward next reward (resets on redemption)';
comment on column user_loyalty_balance.lifetime_stamps is 'Total stamps earned historically';

-- ============================================================================
-- 4. Auto-update timestamp trigger
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_nfc_devices_updated_at
  before update on nfc_devices
  for each row
  execute function update_updated_at_column();

create trigger update_user_loyalty_balance_updated_at
  before update on user_loyalty_balance
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- 5. Function: Award Stamp to User
-- ============================================================================
-- Atomically increments balance and creates transaction record

create or replace function award_loyalty_stamp(
  p_user_id uuid,
  p_device_id uuid,
  p_restaurant_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb as $$
declare
  v_balance record;
  v_tx_id uuid;
begin
  -- Insert transaction
  insert into loyalty_transactions (user_id, device_id, restaurant_id, amount, transaction_type, metadata)
  values (p_user_id, p_device_id, p_restaurant_id, 1, 'earn', p_metadata)
  returning id into v_tx_id;

  -- Upsert balance
  insert into user_loyalty_balance (user_id, restaurant_id, current_stamps, lifetime_stamps, last_stamp_at)
  values (p_user_id, p_restaurant_id, 1, 1, now())
  on conflict (user_id, restaurant_id)
  do update set
    current_stamps = user_loyalty_balance.current_stamps + 1,
    lifetime_stamps = user_loyalty_balance.lifetime_stamps + 1,
    last_stamp_at = now()
  returning * into v_balance;

  return jsonb_build_object(
    'transaction_id', v_tx_id,
    'current_stamps', v_balance.current_stamps,
    'lifetime_stamps', v_balance.lifetime_stamps
  );
end;
$$ language plpgsql security definer;

comment on function award_loyalty_stamp is 'Atomically awards 1 stamp and updates user balance';
