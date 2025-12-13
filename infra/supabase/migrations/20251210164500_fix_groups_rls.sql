-- Fix recursive RLS policies using Security Definer function

-- Function to check membership bypassing RLS
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_id = group_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update GROUPS Policy
DROP POLICY IF EXISTS "View groups public or member" ON groups;
CREATE POLICY "View groups public or member"
    ON groups FOR SELECT
    USING (
        visibility = 'public' 
        OR 
        is_group_member(id)
    );

-- Update GROUP_MEMBERS Policy
DROP POLICY IF EXISTS "View members based on group visibility" ON group_members;
CREATE POLICY "View members based on group visibility"
    ON group_members FOR SELECT
    USING (
        -- If I am checking my own row, always allow (optional, but good for "leave" checks if select needed)
        user_id = auth.uid()
        OR
        -- If I am a member, I can see all members
        is_group_member(group_id)
        OR
        -- If group is public, I can see members
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.visibility = 'public'
        )
    );

-- Note: The check on `groups` inside group_members policy (Safe?)
-- `groups` policy uses `is_group_member` (Security Definer).
-- `group_members` policy uses `is_group_member` AND queries `groups`.
-- Querying `groups` triggers `groups` policy.
-- `groups` policy calls `is_group_member`.
-- `is_group_member` queries `group_members` (SECURITY DEFINER -> No RLS).
-- Cycle broken!
