-- =============================================
-- VELVET: Recipe Views & Stats (Unique per User)
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- 0. Xóa function cũ (nếu có)
DROP FUNCTION IF EXISTS increment_view_count(UUID);

-- 1. Thêm cột view_count và favorite_count vào bảng recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- 2. Tạo bảng recipe_views (unique per user per recipe)
CREATE TABLE IF NOT EXISTS recipe_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, recipe_id)
);

-- 3. Bật RLS
ALTER TABLE recipe_views ENABLE ROW LEVEL SECURITY;

-- 4. Policy: user có thể đọc views
CREATE POLICY "Anyone can read recipe views"
  ON recipe_views FOR SELECT
  USING (true);

-- 5. Policy: user có thể insert view của mình
CREATE POLICY "Users can insert own views"
  ON recipe_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Function: ghi nhận view unique + cập nhật count trên recipes
CREATE OR REPLACE FUNCTION record_recipe_view(p_recipe_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert view (ignore if already exists = unique per user)
  INSERT INTO recipe_views (user_id, recipe_id)
  VALUES (p_user_id, p_recipe_id)
  ON CONFLICT (user_id, recipe_id) DO NOTHING;

  -- Update the cached view_count on recipes table
  UPDATE recipes
  SET view_count = (
    SELECT COUNT(*) FROM recipe_views WHERE recipe_id = p_recipe_id
  )
  WHERE id = p_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: tự động cập nhật favorite_count khi favorites thay đổi
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
DECLARE
  target_recipe_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_recipe_id := OLD.recipe_id;
  ELSE
    target_recipe_id := NEW.recipe_id;
  END IF;

  UPDATE recipes
  SET favorite_count = (SELECT COUNT(*) FROM favorites WHERE recipe_id = target_recipe_id)
  WHERE id = target_recipe_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: chạy function khi insert hoặc delete favorites
DROP TRIGGER IF EXISTS on_favorite_change ON favorites;
CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_count();

-- 9. Khởi tạo favorite_count cho tất cả recipes hiện có
UPDATE recipes SET favorite_count = (
  SELECT COUNT(*) FROM favorites WHERE favorites.recipe_id = recipes.id
);

-- 10. Reload schema
NOTIFY pgrst, 'reload schema';
