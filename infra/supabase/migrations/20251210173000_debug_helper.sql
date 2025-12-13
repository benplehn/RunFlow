-- Debug helper and Policy Update

-- 1. Helper to debug auth context
CREATE OR REPLACE FUNCTION get_auth_debug()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'jwt', auth.jwt()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Groups INSERT Policy to allow service_role (Admin override)
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id
        OR
        (auth.jwt() ->> 'role') = 'service_role'
    );
