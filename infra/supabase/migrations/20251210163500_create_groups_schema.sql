-- Create ENUM for visibility and role
CREATE TYPE group_visibility AS ENUM ('public', 'private');
CREATE TYPE group_role AS ENUM ('admin', 'member');

-- Create GROUPS table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visibility group_visibility NOT NULL DEFAULT 'public',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for groups
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_groups_visibility ON groups(visibility);

-- Create GROUP_MEMBERS table
CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role group_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- Indexes for group_members
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);

-- Create GROUP_EVENTS table
CREATE TABLE group_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for group_events
CREATE INDEX idx_group_events_group_id ON group_events(group_id);
CREATE INDEX idx_group_events_start_time ON group_events(start_time);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GROUPS

-- Everyone can view public groups
-- Users can view private groups ONLY IF they are a member
CREATE POLICY "View groups public or member"
    ON groups FOR SELECT
    USING (
        visibility = 'public' 
        OR 
        EXISTS (
            SELECT 1 FROM group_members gm 
            WHERE gm.group_id = id 
            AND gm.user_id = auth.uid()
        )
    );

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Only Owner or Admin can update groups
CREATE POLICY "Owner or Admin can update groups"
    ON groups FOR UPDATE
    USING (
        auth.uid() = owner_id
        OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

-- Only Owner can delete groups
CREATE POLICY "Owner can delete groups"
    ON groups FOR DELETE
    USING (auth.uid() = owner_id);


-- RLS Policies for GROUP_MEMBERS

-- Visibility of members follows group visibility: 
-- If you can see the group, can you see members?
-- Let's say: Public groups -> everyone sees members. Private groups -> only members see members.
-- Optimized: join with groups to check visibility logic.
CREATE POLICY "View members based on group visibility"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND (
                g.visibility = 'public'
                OR
                EXISTS (
                    SELECT 1 FROM group_members my_gm
                    WHERE my_gm.group_id = g.id
                    AND my_gm.user_id = auth.uid()
                )
            )
        )
    );

-- Users can join public groups (INSERT self as member)
CREATE POLICY "Join public groups"
    ON group_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id -- Can only add self
        AND
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.visibility = 'public'
        )
    );
-- Note: Joining private groups usually requires invite/request which creates separate flow. 
-- For "Social Minimal", we only allow public join via API for now, or owner adds them?
-- Let's allow Owner/Admin to add ANYONE (simplified invite)
CREATE POLICY "Admins can add members"
    ON group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

-- Users can leave (DELETE self)
CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    USING (auth.uid() = user_id);

-- Admins/Owner can remove others
CREATE POLICY "Admins can remove members"
    ON group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );


-- RLS Policies for GROUP_EVENTS

-- Only group members can view events (regardless of group visibility? usually yes for clans)
CREATE POLICY "Members view events"
    ON group_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Only members can create events (or maybe just admins? User said "Flux : user crée groupe -> un autre rejoint -> event créé", implies members can create)
CREATE POLICY "Members create events"
    ON group_events FOR INSERT
    WITH CHECK (
        auth.uid() = creator_id
        AND
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Creator or Admin can delete events
CREATE POLICY "Creator or Admin delete events"
    ON group_events FOR DELETE
    USING (
        auth.uid() = creator_id
        OR
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );
