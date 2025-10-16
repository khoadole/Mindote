-- =============================================
-- FIX SIGNUP TRIGGER - Cho phép tạo user mới
-- Chạy script này trong Supabase SQL Editor
-- =============================================

-- 1. DROP VÀ TẠO LẠI FUNCTION ĐỂ TẠO USER
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- Chạy với quyền của owner
SET search_path = public
AS $$
BEGIN
    -- Insert user vào public.users
    INSERT INTO public.users (id, email, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    )
    ON CONFLICT (id) DO NOTHING; -- Tránh lỗi nếu user đã tồn tại
    
    -- Tạo settings mặc định cho user
    INSERT INTO public.settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING; -- Tránh lỗi nếu settings đã tồn tại
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error nhưng không block việc tạo user
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TẠO LẠI TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. THÊM RLS POLICY CHO VIỆC TẠO USER (nếu chưa có)
-- Policy này cho phép service role (trigger) tạo user mới
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" 
    ON public.users 
    FOR INSERT 
    WITH CHECK (true); -- Cho phép tất cả insert (trigger sẽ xử lý)

-- 4. GRANT PERMISSIONS
-- Đảm bảo trigger có quyền truy cập các bảng
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- 5. KIỂM TRA XEM CÓ USER NÀO TRONG AUTH NHƯNG CHƯA CÓ TRONG PUBLIC.USERS KHÔNG
-- Nếu có, tạo cho họ
INSERT INTO public.users (id, email, display_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. TẠO SETTINGS CHO CÁC USER CHƯA CÓ
INSERT INTO public.settings (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.settings s ON u.id = s.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- XONG! Bây giờ thử đăng ký account mới
-- =============================================
