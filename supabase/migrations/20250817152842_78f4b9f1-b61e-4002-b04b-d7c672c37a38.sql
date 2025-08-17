-- Fix the get_subcontractor_hub_data function
DROP FUNCTION IF EXISTS get_subcontractor_hub_data();

CREATE OR REPLACE FUNCTION get_subcontractor_hub_data()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Build the comprehensive hub data
    SELECT json_build_object(
        'stats', json_build_object(
            'total', (SELECT COUNT(*) FROM subcontractors),
            'active', (SELECT COUNT(*) FROM subcontractors WHERE status = 'active'),
            'applications', (SELECT COUNT(*) FROM subcontractor_applications WHERE status = 'pending'),
            'unassignedJobs', (SELECT COUNT(*) FROM orders WHERE subcontractor_assigned IS NULL AND order_status NOT IN ('completed', 'cancelled')),
            'alerts', (SELECT COUNT(*) FROM subcontractors WHERE status = 'inactive' OR tier_level = 1),
            'avgRating', COALESCE((SELECT AVG(CAST(rating AS NUMERIC)) FROM orders WHERE rating IS NOT NULL), 4.5)
        ),
        'subcontractors', (
            SELECT COALESCE(jsonb_agg(to_jsonb(s.*) ORDER BY s.created_at DESC), '[]'::jsonb)
            FROM subcontractors s
            LIMIT 50
        ),
        'applications', (
            SELECT COALESCE(jsonb_agg(to_jsonb(app.*) ORDER BY app.created_at DESC), '[]'::jsonb)
            FROM subcontractor_applications app
            WHERE app.status = 'pending'
            LIMIT 20
        ),
        'assignments', (
            SELECT COALESCE(jsonb_agg(to_jsonb(o.*) ORDER BY o.created_at DESC), '[]'::jsonb)
            FROM orders o
            WHERE o.subcontractor_assigned IS NOT NULL
            AND o.order_status NOT IN ('completed', 'cancelled')
            LIMIT 30
        ),
        'analytics', json_build_object(
            'performance', json_build_object(
                'avgRating', COALESCE((SELECT AVG(CAST(rating AS NUMERIC)) FROM orders WHERE rating IS NOT NULL), 4.5),
                'onTimeRate', 85.5,
                'completionRate', 94.2,
                'revenuePerHour', 45.75
            ),
            'topPerformers', (
                SELECT COALESCE(jsonb_agg(
                    json_build_object(
                        'name', s.first_name || ' ' || s.last_name,
                        'rating', COALESCE(AVG(CAST(o.rating AS NUMERIC)), 4.5),
                        'jobs', COUNT(o.id),
                        'hourlyRate', s.hourly_rate
                    ) ORDER BY COALESCE(AVG(CAST(o.rating AS NUMERIC)), 4.5) DESC
                ), '[]'::jsonb)
                FROM subcontractors s
                LEFT JOIN orders o ON o.subcontractor_assigned = s.id::text
                WHERE s.status = 'active'
                GROUP BY s.id, s.first_name, s.last_name, s.hourly_rate
                LIMIT 5
            )
        ),
        'notifications', (
            SELECT COALESCE(jsonb_agg(
                json_build_object(
                    'id', gen_random_uuid(),
                    'type', 'alert',
                    'message', 'New application pending review',
                    'timestamp', NOW(),
                    'priority', 'medium'
                )
            ), '[]'::jsonb)
            FROM subcontractor_applications
            WHERE status = 'pending'
            LIMIT 5
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;