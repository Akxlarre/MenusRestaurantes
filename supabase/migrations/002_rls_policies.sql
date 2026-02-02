-- AION Loyalty System - Row Level Security Policies
-- Version: 1.0
-- Description: Security policies to protect user data and prevent unauthorized access

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

alter table nfc_devices enable row level security;
alter table loyalty_transactions enable row level security;
alter table user_loyalty_balance enable row level security;

-- ============================================================================
-- NFC Devices Policies
-- ============================================================================

-- Public can read active devices (for validation)
create policy "Anyone can read active devices"
  on nfc_devices for select
  using (status = 'active');

-- Only service role can modify devices
create policy "Service role can manage devices"
  on nfc_devices for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Loyalty Transactions Policies
-- ============================================================================

-- Users can read their own transactions
create policy "Users can view own transactions"
  on loyalty_transactions for select
  using (auth.uid() = user_id);

-- Service role can insert transactions (via Edge Function)
create policy "Service role can insert transactions"
  on loyalty_transactions for insert
  with check (auth.jwt() ->> 'role' = 'service_role');

-- Prevent updates/deletes (immutable ledger)
create policy "Transactions are immutable"
  on loyalty_transactions for update
  using (false);

create policy "Transactions cannot be deleted"
  on loyalty_transactions for delete
  using (false);

-- ============================================================================
-- User Loyalty Balance Policies
-- ============================================================================

-- Users can read their own balance
create policy "Users can view own balance"
  on user_loyalty_balance for select
  using (auth.uid() = user_id);

-- Service role can update balances (via stored function)
create policy "Service role can manage balances"
  on user_loyalty_balance for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Grant execute permissions on functions
-- ============================================================================

grant execute on function award_loyalty_stamp to service_role;
grant execute on function award_loyalty_stamp to authenticated;
