-- ============================================================
-- CREATE SOFT DELETE FUNCTION
-- This function runs with SECURITY DEFINER to bypass RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.soft_delete_log(log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the function owner
SET search_path = public
AS $$
BEGIN
  -- Verify the user owns this log
  IF NOT EXISTS (
    SELECT 1 FROM public.logs 
    WHERE id = log_id 
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Log not found or already deleted';
  END IF;

  -- Perform the soft delete
  UPDATE public.logs
  SET deleted_at = now()
  WHERE id = log_id
  AND user_id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_log(uuid) TO authenticated;
