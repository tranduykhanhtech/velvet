-- =============================================
-- VELVET: Premium Subscriptions System
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- 1. Tạo bảng premium_subscriptions
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT DEFAULT 'monthly' NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ
);

-- 2. Bật Row Level Security
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: User đọc được subscription của chính mình
CREATE POLICY "Users can read own subscription"
  ON premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: User tạo subscription cho chính mình (giả lập mua)
CREATE POLICY "Users can insert own subscription"
  ON premium_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: User cập nhật subscription của mình (gia hạn/hủy)
CREATE POLICY "Users can update own subscription"
  ON premium_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Reload schema cache để PostgREST nhận bảng mới
NOTIFY pgrst, 'reload schema';
