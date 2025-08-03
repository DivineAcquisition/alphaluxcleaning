import {
  Button,
  Section,
  Text,
  Heading,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { BaseEmailTemplate } from './base-template.tsx'

interface MonthlyPerformanceSummaryProps {
  subcontractorName: string;
  month: string;
  year: string;
  stats: {
    jobsCompleted: number;
    totalEarnings: string;
    averageRating: number;
    onTimePercentage: number;
    customerSatisfaction: number;
  };
  achievements: string[];
  improvementAreas?: string[];
  dashboardUrl?: string;
}

export const MonthlyPerformanceSummary = ({
  subcontractorName,
  month,
  year,
  stats,
  achievements,
  improvementAreas,
  dashboardUrl,
}: MonthlyPerformanceSummaryProps) => (
  <BaseEmailTemplate previewText={`Your ${month} ${year} performance summary - ${stats.jobsCompleted} jobs completed`}>
    
    <Heading style={heading}>Your {month} {year} Performance Summary 📊</Heading>
    
    <Text style={text}>
      Hi {subcontractorName}, here's how you performed this month. Great job being part of our team!
    </Text>

    <Section style={statsSection}>
      <Heading style={subHeading}>Monthly Stats</Heading>
      
      <div style={statsGrid}>
        <div style={statCard}>
          <Text style={statNumber}>{stats.jobsCompleted}</Text>
          <Text style={statLabel}>Jobs Completed</Text>
        </div>
        
        <div style={statCard}>
          <Text style={statNumber}>{stats.totalEarnings}</Text>
          <Text style={statLabel}>Total Earnings</Text>
        </div>
        
        <div style={statCard}>
          <Text style={statNumber}>{stats.averageRating.toFixed(1)}/5</Text>
          <Text style={statLabel}>Average Rating</Text>
          <div style={starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  ...starStyle,
                  color: star <= Math.round(stats.averageRating) ? '#fbbf24' : '#d1d5db',
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        
        <div style={statCard}>
          <Text style={statNumber}>{stats.onTimePercentage}%</Text>
          <Text style={statLabel}>On-Time Services</Text>
        </div>
      </div>
    </Section>

    {achievements.length > 0 && (
      <Section style={achievementsSection}>
        <Heading style={subHeading}>🎉 This Month's Achievements</Heading>
        {achievements.map((achievement, index) => (
          <Text key={index} style={achievementText}>✅ {achievement}</Text>
        ))}
      </Section>
    )}

    {improvementAreas && improvementAreas.length > 0 && (
      <Section style={improvementSection}>
        <Heading style={subHeading}>💡 Areas for Growth</Heading>
        {improvementAreas.map((area, index) => (
          <Text key={index} style={improvementText}>🎯 {area}</Text>
        ))}
      </Section>
    )}

    <Section style={motivationSection}>
      <Text style={motivationText}>
        {stats.averageRating >= 4.5 
          ? "🌟 Outstanding performance! You're setting the standard for excellence."
          : stats.averageRating >= 4.0
          ? "👏 Great work this month! Keep building on this momentum."
          : "💪 Every month is a new opportunity to excel. We believe in your potential!"
        }
      </Text>
    </Section>

    {dashboardUrl && (
      <Section style={buttonSection}>
        <Button href={dashboardUrl} style={button}>
          View Detailed Analytics
        </Button>
      </Section>
    )}

    <Text style={text}>
      Thank you for your continued dedication. Here's to an even better month ahead!
    </Text>

  </BaseEmailTemplate>
)

// Styles
const heading = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
}

const subHeading = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 15px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 15px 0',
}

const statsSection = {
  backgroundColor: '#f0fdf4',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '15px',
  margin: '15px 0',
}

const statCard = {
  backgroundColor: '#ffffff',
  padding: '15px',
  borderRadius: '6px',
  textAlign: 'center' as const,
  border: '1px solid #e5e7eb',
}

const statNumber = {
  color: '#10b981',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 5px 0',
}

const statLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

const starsContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '2px',
  marginTop: '5px',
}

const starStyle = {
  fontSize: '16px',
}

const achievementsSection = {
  backgroundColor: '#dcfce7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const achievementText = {
  color: '#15803d',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '8px 0',
}

const improvementSection = {
  backgroundColor: '#fef3c7',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
}

const improvementText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '8px 0',
}

const motivationSection = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const motivationText = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
}

export default MonthlyPerformanceSummary