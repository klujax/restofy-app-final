-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT, -- Simple hash for demo (in prod use auth.users)
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer_cards table
CREATE TABLE IF NOT EXISTS customer_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    card_alias TEXT NOT NULL, -- e.g. "Garanti Bonus"
    card_user_key TEXT NOT NULL, -- Iyzico cardUserKey
    card_token TEXT, -- Iyzico cardToken
    last_four_digits TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customer_cards_customer_id ON customers(id);
