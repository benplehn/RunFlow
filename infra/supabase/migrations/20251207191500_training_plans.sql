-- Create Enums
CREATE TYPE training_plan_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE session_type AS ENUM ('run', 'strength', 'rest', 'cross_training');

-- 1. User Training Plans Table
CREATE TABLE user_training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status training_plan_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for user_training_plans
ALTER TABLE user_training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
    ON user_training_plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans"
    ON user_training_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
    ON user_training_plans
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
    ON user_training_plans
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Planned Weeks Table
CREATE TABLE planned_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES user_training_plans(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number > 0),
    volume_distance DOUBLE PRECISION DEFAULT 0, -- km
    volume_duration INTEGER DEFAULT 0, -- minutes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(plan_id, week_number)
);

-- RLS for planned_weeks
ALTER TABLE planned_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view weeks of their plans"
    ON planned_weeks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_training_plans
            WHERE user_training_plans.id = planned_weeks.plan_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert weeks to their plans"
    ON planned_weeks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_training_plans
            WHERE user_training_plans.id = planned_weeks.plan_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update weeks of their plans"
    ON planned_weeks
    FOR UPDATE
    USING (
         EXISTS (
            SELECT 1 FROM user_training_plans
            WHERE user_training_plans.id = planned_weeks.plan_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete weeks of their plans"
    ON planned_weeks
    FOR DELETE
    USING (
         EXISTS (
            SELECT 1 FROM user_training_plans
            WHERE user_training_plans.id = planned_weeks.plan_id
            AND user_training_plans.user_id = auth.uid()
        )
    );


-- 3. Planned Sessions Table
CREATE TABLE planned_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID NOT NULL REFERENCES planned_weeks(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    session_type session_type NOT NULL,
    target_duration INTEGER, -- minutes
    target_distance DOUBLE PRECISION, -- km
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for planned_sessions
ALTER TABLE planned_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions of their plans"
    ON planned_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM planned_weeks
            JOIN user_training_plans ON user_training_plans.id = planned_weeks.plan_id
            WHERE planned_weeks.id = planned_sessions.week_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sessions to their plans"
    ON planned_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM planned_weeks
            JOIN user_training_plans ON user_training_plans.id = planned_weeks.plan_id
            WHERE planned_weeks.id = planned_sessions.week_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sessions of their plans"
    ON planned_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM planned_weeks
            JOIN user_training_plans ON user_training_plans.id = planned_weeks.plan_id
            WHERE planned_weeks.id = planned_sessions.week_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sessions of their plans"
    ON planned_sessions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM planned_weeks
            JOIN user_training_plans ON user_training_plans.id = planned_weeks.plan_id
            WHERE planned_weeks.id = planned_sessions.week_id
            AND user_training_plans.user_id = auth.uid()
        )
    );

-- Triggers for updated_at
CREATE TRIGGER update_user_training_plans_modtime
    BEFORE UPDATE ON user_training_plans
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_planned_weeks_modtime
    BEFORE UPDATE ON planned_weeks
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_planned_sessions_modtime
    BEFORE UPDATE ON planned_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
