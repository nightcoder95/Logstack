-- ============================================================
-- ADD EMAIL COLUMN TO LOGS TABLE (OPTIONAL)
-- This denormalizes the email for easier querying/exporting
-- ============================================================

-- Add email column to logs table
ALTER TABLE public.logs
ADD COLUMN user_email text;

-- Create index for email searches
CREATE INDEX idx_logs_user_email ON public.logs(user_email);

-- ============================================================
-- TRIGGER: Auto-populate email when creating/updating logs
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_log_user_email()
RETURNS trigger AS $
BEGIN
  -- Get email from profiles table
  SELECT email INTO new.user_email
  FROM public.profiles
  WHERE id = new.user_id;
  
  -- If not found in profiles, get from auth.users
  IF new.user_email IS NULL THEN
    SELECT email INTO new.user_email
    FROM auth.users
    WHERE id = new.user_id;
  END IF;
  
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on INSERT
CREATE TRIGGER set_log_email_on_insert
  BEFORE INSERT ON public.logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_log_user_email();

-- Trigger on UPDATE (in case user_id changes, though unlikely)
CREATE TRIGGER set_log_email_on_update
  BEFORE UPDATE ON public.logs
  FOR EACH ROW
  WHEN (old.user_id IS DISTINCT FROM new.user_id)
  EXECUTE FUNCTION public.set_log_user_email();

-- ============================================================
-- Backfill existing logs with email addresses
-- ============================================================

UPDATE public.logs l
SET user_email = COALESCE(p.email, u.email)
FROM public.profiles p
FULL OUTER JOIN auth.users u ON u.id = l.user_id
WHERE l.user_id = COALESCE(p.id, u.id)
  AND l.user_email IS NULL;

