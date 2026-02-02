-- AION Loyalty System - Test Device Seed Data
-- Version: 1.0
-- Description: Creates 5 mock QR devices for MVP testing

-- Insert 5 test devices (PROTO_001 through PROTO_005)
-- These will be used to generate QR codes for restaurant testing

insert into nfc_devices (uid_hex, device_type, status, last_counter) values
  ('PROTO_001', 'qr_mock', 'active', 0), -- Main counter (garzón 1)
  ('PROTO_002', 'qr_mock', 'active', 0), -- Bar area (garzón 2)
  ('PROTO_003', 'qr_mock', 'active', 0), -- Takeout/delivery
  ('PROTO_004', 'qr_mock', 'active', 0), -- Manager device (testing)
  ('PROTO_005', 'qr_mock', 'active', 0)  -- Spare
on conflict (uid_hex) do nothing;

-- Display created devices
select 
  uid_hex,
  device_type,
  status,
  last_counter,
  created_at
from nfc_devices
where uid_hex like 'PROTO_%'
order by uid_hex;
