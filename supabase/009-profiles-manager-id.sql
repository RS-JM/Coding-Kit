-- 009: Add manager_id to profiles for team hierarchy
-- Allows managers to have team members assigned to them
-- Future-proof: Can be migrated to separate teams table later

-- Add manager_id column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for efficient team member lookups
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);

-- Comments
COMMENT ON COLUMN public.profiles.manager_id IS 'ID des direkten Vorgesetzten (Manager). NULL fuer Manager/Admin ohne Vorgesetzten.';

-- Helper function: Get all team members for a manager (including nested teams)
CREATE OR REPLACE FUNCTION public.get_team_members(manager_user_id uuid)
RETURNS TABLE(user_id uuid) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_hierarchy AS (
    -- Direct reports
    SELECT id FROM public.profiles WHERE manager_id = manager_user_id
    UNION
    -- Indirect reports (nested teams)
    SELECT p.id
    FROM public.profiles p
    INNER JOIN team_hierarchy th ON p.manager_id = th.id
  )
  SELECT th.id FROM team_hierarchy th;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_team_members IS 'Gibt alle Team-Mitglieder eines Managers zurueck (inkl. verschachtelter Teams)';

-- Note: RLS policies are NOT updated in this migration
-- Current behavior: Managers can still see ALL sick leaves (via is_manager_or_admin)
-- This is intentional for now - team-based filtering will be done at application level
-- Future migration can update RLS policies once team structure is fully established
