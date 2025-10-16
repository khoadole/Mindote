-- =============================================
-- AUTO-SYNC USER FROM SUPABASE AUTH
-- Chạy script này trong Supabase SQL Editor
-- =============================================

-- 1. FUNCTION ĐỂ TẠO USER VÀ SETTINGS MẶC ĐỊNH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user vào public.users
    INSERT INTO public.users (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'display_name'
    );
    
    -- Tạo settings mặc định cho user
    INSERT INTO public.settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER KHI CÓ USER MỚI ĐĂNG KÝ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES CHO USERS
CREATE POLICY "Users can view own data" 
    ON public.users 
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
    ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id);

-- 5. RLS POLICIES CHO COLLECTIONS
CREATE POLICY "Users can view own collections" 
    ON public.collections 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections" 
    ON public.collections 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" 
    ON public.collections 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" 
    ON public.collections 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. RLS POLICIES CHO WORDS
CREATE POLICY "Users can view words in own collections" 
    ON public.words 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = words.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create words in own collections" 
    ON public.words 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = words.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update words in own collections" 
    ON public.words 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = words.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete words in own collections" 
    ON public.words 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.collections 
            WHERE collections.id = words.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

-- 7. RLS POLICIES CHO SETTINGS
CREATE POLICY "Users can view own settings" 
    ON public.settings 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
    ON public.settings 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
    ON public.settings 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- XONG! Bây giờ test bằng cách đăng ký account mới
-- =============================================
