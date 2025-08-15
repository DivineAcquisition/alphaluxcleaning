import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRule {
  id: string;
  name: string;
  condition: (subcontractor: any) => boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: (subcontractor: any) => string;
  action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting performance notifications check...');

    // Define notification rules
    const notificationRules: NotificationRule[] = [
      {
        id: 'low_rating_critical',
        name: 'Critical Rating Drop',
        condition: (sub) => sub.rating < 3.0,
        priority: 'critical',
        message: (sub) => `${sub.full_name} has a critical rating of ${sub.rating}. Immediate action required.`,
        action: 'suspend_review'
      },
      {
        id: 'high_complaints',
        name: 'High Complaint Count',
        condition: (sub) => sub.complaint_count >= 3,
        priority: 'high',
        message: (sub) => `${sub.full_name} has ${sub.complaint_count} complaints. Review needed.`,
        action: 'performance_review'
      },
      {
        id: 'tier_upgrade_eligible',
        name: 'Tier Upgrade Eligible',
        condition: (sub) => {
          const tierRequirements = {
            2: { rating: 4.0, jobs: 15, reviews: 10 },
            3: { rating: 4.5, jobs: 25, reviews: 20 }
          };
          const nextTier = sub.tier_level + 1;
          const requirements = tierRequirements[nextTier as keyof typeof tierRequirements];
          return requirements && 
                 sub.rating >= requirements.rating && 
                 sub.completed_jobs_count >= requirements.jobs && 
                 sub.review_count >= requirements.reviews;
        },
        priority: 'medium',
        message: (sub) => `${sub.full_name} is eligible for tier ${sub.tier_level + 1} upgrade!`,
        action: 'tier_upgrade'
      },
      {
        id: 'inactive_subcontractor',
        name: 'Inactive Subcontractor',
        condition: (sub) => !sub.is_available && sub.account_status === 'active',
        priority: 'low',
        message: (sub) => `${sub.full_name} has been inactive. Consider reactivation outreach.`,
        action: 'reactivation_campaign'
      },
      {
        id: 'declining_performance',
        name: 'Performance Declining',
        condition: (sub) => {
          // Simple heuristic: rating dropped and complaints increased
          return sub.rating < 4.0 && sub.complaint_count > 0;
        },
        priority: 'medium',
        message: (sub) => `${sub.full_name}'s performance is declining. Consider additional training.`,
        action: 'training_program'
      }
    ];

    // Get all subcontractors with performance data (including account_status)
    const { data: subcontractors, error: subError } = await supabase
      .from('subcontractors')
      .select(`
        id,
        full_name,
        email,
        rating,
        tier_level,
        completed_jobs_count,
        review_count,
        is_available,
        account_status,
        created_at
      `)
      .eq('account_status', 'active'); // Only process active subcontractors

    if (subError) {
      throw new Error(`Failed to fetch subcontractors: ${subError.message}`);
    }

    console.log(`Found ${subcontractors?.length || 0} subcontractors to analyze`);

    // Get complaint counts for each subcontractor
    const subcontractorsWithComplaints = await Promise.all(
      (subcontractors || []).map(async (sub) => {
        const { count: complaintCount } = await supabase
          .from('customer_feedback')
          .select('*', { count: 'exact', head: true })
          .eq('subcontractor_id', sub.id)
          .eq('category', 'complaint');

        return {
          ...sub,
          complaint_count: complaintCount || 0
        };
      })
    );

    // Apply notification rules and generate alerts
    const notifications = [];
    const recommendations = [];

    for (const subcontractor of subcontractorsWithComplaints) {
      for (const rule of notificationRules) {
        if (rule.condition(subcontractor)) {
          const notification = {
            subcontractor_id: subcontractor.id,
            rule_id: rule.id,
            rule_name: rule.name,
            priority: rule.priority,
            message: rule.message(subcontractor),
            action: rule.action,
            subcontractor_name: subcontractor.full_name,
            subcontractor_email: subcontractor.email,
            metadata: {
              rating: subcontractor.rating,
              complaints: subcontractor.complaint_count,
              tier: subcontractor.tier_level,
              jobs_completed: subcontractor.completed_jobs_count
            }
          };

          notifications.push(notification);

          // Generate recommendations based on the action
          if (rule.action) {
            recommendations.push({
              type: rule.action,
              subcontractor_id: subcontractor.id,
              priority: rule.priority,
              description: rule.message(subcontractor),
              suggested_action: getActionDescription(rule.action, subcontractor)
            });
          }
        }
      }
    }

    console.log(`Generated ${notifications.length} notifications and ${recommendations.length} recommendations`);

    // Store notifications in the database
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('performance_notifications')
        .upsert(
          notifications.map(n => ({
            ...n,
            created_at: new Date().toISOString(),
            is_read: false
          })),
          { 
            onConflict: 'subcontractor_id,rule_id',
            ignoreDuplicates: false 
          }
        );

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
      }
    }

    // Return summary
    const summary = {
      total_subcontractors: subcontractorsWithComplaints.length,
      notifications_generated: notifications.length,
      recommendations_generated: recommendations.length,
      priority_breakdown: {
        critical: notifications.filter(n => n.priority === 'critical').length,
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length
      },
      notifications: notifications.slice(0, 10), // Return first 10 for preview
      recommendations: recommendations.slice(0, 10)
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in performance-notifications function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process performance notifications'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function getActionDescription(action: string, subcontractor: any): string {
  switch (action) {
    case 'suspend_review':
      return `Schedule immediate review meeting with ${subcontractor.full_name}. Consider temporary suspension if issues persist.`;
    case 'performance_review':
      return `Conduct formal performance review with ${subcontractor.full_name}. Document issues and create improvement plan.`;
    case 'tier_upgrade':
      return `Process tier upgrade for ${subcontractor.full_name} to tier ${subcontractor.tier_level + 1}. Update rates and send congratulations.`;
    case 'reactivation_campaign':
      return `Send reactivation email to ${subcontractor.full_name}. Offer incentives or check for availability updates.`;
    case 'training_program':
      return `Enroll ${subcontractor.full_name} in additional training program. Focus on customer service and quality standards.`;
    default:
      return `Review ${subcontractor.full_name}'s account and take appropriate action.`;
  }
}