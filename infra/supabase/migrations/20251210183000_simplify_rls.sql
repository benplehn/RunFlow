-- Simplify RLS policies to avoid recursion
-- We restrict group_members access to "Own Row Only"
-- This breaks recursion loop while allowing `is_group_member` and `group_events` checks to work naturally

-- Update GROUP_MEMBERS Policy (SELECT)
DROP POLICY IF EXISTS "View members based on group visibility" ON group_members;
DROP POLICY IF EXISTS "Members can view other members" ON group_members;
DROP POLICY IF EXISTS "Users can view own membership" ON group_members;

CREATE POLICY "Users can view own membership"
    ON group_members FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Update GROUP_MEMBERS Policy (INSERT)
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
    );

-- Update GROUP_MEMBERS Policy (DELETE)
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    USING (
        user_id = auth.uid()
    );

-- We don't need to change groups or group_events policies.
-- They rely on checking group_members.
-- Since they check `where user_id = auth.uid()`, they will pass the new "Own Row Only" policy.
