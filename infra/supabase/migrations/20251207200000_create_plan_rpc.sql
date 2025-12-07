-- RPC to insert a full training plan (Plan -> Weeks -> Sessions) atomically
-- This ensures we don't end up with partial plans if insertion fails halfway.

CREATE OR REPLACE FUNCTION create_full_training_plan(plan_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_plan_id UUID;
    week_record RECORD;
    new_week_id UUID;
BEGIN
    -- 1. Insert Plan
    INSERT INTO user_training_plans (
        user_id,
        name,
        description,
        status,
        start_date,
        duration_weeks
    ) VALUES (
        auth.uid(),
        (plan_data->>'name'),
        (plan_data->>'description'),
        (plan_data->>'status')::training_plan_status,
        (plan_data->>'startDate')::date,
        (plan_data->>'durationWeeks')::int
    ) RETURNING id INTO new_plan_id;

    -- 2. Insert Weeks
    FOR week_record IN SELECT * FROM jsonb_to_recordset(plan_data->'weeks') AS x(
        "weekNumber" int,
        "volumeDistance" float,
        "volumeDuration" int,
        "sessions" jsonb
    )
    LOOP
        INSERT INTO planned_weeks (
            plan_id,
            week_number,
            volume_distance,
            volume_duration
        ) VALUES (
            new_plan_id,
            week_record."weekNumber",
            week_record."volumeDistance",
            week_record."volumeDuration"
        ) RETURNING id INTO new_week_id;

        -- 3. Insert Sessions for this Week
        IF week_record.sessions IS NOT NULL THEN
            INSERT INTO planned_sessions (
                week_id,
                day_of_week,
                session_type,
                target_duration,
                target_distance,
                description
            )
            SELECT
                new_week_id,
                (s->>'dayOfWeek')::int,
                (s->>'sessionType')::session_type,
                (s->>'targetDuration')::int,
                (s->>'targetDistance')::float,
                (s->>'description')
            FROM jsonb_array_elements(week_record.sessions) AS s;
        END IF;
    END LOOP;

    -- Return the created plan ID to the client
    RETURN jsonb_build_object('id', new_plan_id);
END;
$$;
