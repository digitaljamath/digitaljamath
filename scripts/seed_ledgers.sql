-- Manual SQL to seed essential ledgers for demo tenant
-- Run this in your PostgreSQL console: psql -d digitaljamath_db

SET search_path TO demo;

-- Insert essential ledgers if they don't exist
INSERT INTO jamath_ledger (code, name, account_type, fund_type, balance, is_active, is_system, created_at, updated_at)
VALUES 
    ('1001', 'Cash in Hand', 'ASSET', NULL, 0.00, true, true, NOW(), NOW()),
    ('1002', 'Bank Account - Primary', 'ASSET', NULL, 0.00, true, true, NOW(), NOW()),
    ('3001', 'Donation - General', 'INCOME', 'UNRESTRICTED_GENERAL', 0.00, true, true, NOW(), NOW()),
    ('3002', 'Donation - Zakat', 'INCOME', 'RESTRICTED_ZAKAT', 0.00, true, true, NOW(), NOW()),
    ('3005', 'Membership Fees', 'INCOME', 'UNRESTRICTED_GENERAL', 0.00, true, true, NOW(), NOW()),
    ('4001', 'Electricity', 'EXPENSE', 'UNRESTRICTED_GENERAL', 0.00, true, true, NOW(), NOW()),
    ('4002', 'Water & Sewage', 'EXPENSE', 'UNRESTRICTED_GENERAL', 0.00, true, true, NOW(), NOW()),
    ('4003', 'Repairs & Maintenance', 'EXPENSE', 'UNRESTRICTED_GENERAL', 0.00, true, true, NOW(), NOW()),
    ('4006', 'Zakat Distribution', 'EXPENSE', 'RESTRICTED_ZAKAT', 0.00, true, true, NOW(), NOW()),
    ('4010', 'Miscellaneous', 'EXPENSE', 'UNRESTRICTED_GENERAL', 0.00, true, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Verify
SELECT code, name, account_type, fund_type FROM jamath_ledger ORDER BY code;
