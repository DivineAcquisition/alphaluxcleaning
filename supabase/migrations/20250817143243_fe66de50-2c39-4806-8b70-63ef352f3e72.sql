-- Create comprehensive subcontractor hub analytics function
CREATE OR REPLACE FUNCTION public.get_subcontractor_hub_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
  v_stats jsonb;
  v_subcontractors jsonb;
  v_applications jsonb;
  v_assignments jsonb;
BEGIN
  -- Get statistics
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT COUNT(*) FROM subcontractors), 0),
    'active', COALESCE((SELECT COUNT(*) FROM subcontractors WHERE account_status = 'active'), 0),
    'applications', COALESCE((SELECT COUNT(*) FROM subcontractor_applications WHERE status = 'pending'), 0),
    'unassignedJobs', COALESCE((SELECT COUNT(*) FROM bookings WHERE status = 'scheduled' AND assigned_employee_id IS NULL), 0),
    'alerts', 0,
    'avgRating', COALESCE((SELECT AVG(rating) FROM subcontractors WHERE rating > 0), 5.0)
  ) INTO v_stats;

  -- Get subcontractors data
  SELECT jsonb_agg(to_jsonb(s.*)) INTO v_subcontractors
  FROM subcontractors s
  ORDER BY s.created_at DESC;

  -- Get applications data
  SELECT jsonb_agg(to_jsonb(a.*)) INTO v_applications
  FROM subcontractor_applications a
  ORDER BY a.created_at DESC;

  -- Get assignments data (mock for now)
  SELECT jsonb_build_object(
    'unassignedJobs', '[]'::jsonb,
    'availableSubcontractors', COALESCE(v_subcontractors, '[]'::jsonb),
    'activeAssignments', '[]'::jsonb
  ) INTO v_assignments;

  -- Build comprehensive result
  SELECT jsonb_build_object(
    'stats', v_stats,
    'subcontractors', COALESCE(v_subcontractors, '[]'::jsonb),
    'applications', COALESCE(v_applications, '[]'::jsonb),
    'assignments', v_assignments,
    'analytics', jsonb_build_object('performance', jsonb_build_object()),
    'notifications', '[]'::jsonb,
    'recentActivity', '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
END;
$$;