/**
 * Priority Scoring Engine
 * Computes urgency score (0-100%) server-side:
 * - 40% Severity of situation type
 * - 25% People affected (scaled up to 50+ individuals)
 * - 20% Vulnerable groups (Children, Elderly, Pregnant, Disabled: 5% each)
 * - 15% Waiting time (grows dynamically every hour elapsed since submission)
 */

export interface PriorityFactors {
  situation_type: 'Flood' | 'Fire' | 'Earthquake' | 'Medical' | 'Other' | string;
  people_affected: number;
  special_groups: string[] | string;
  created_at: string | Date;
}

export interface PriorityResult {
  score: number; // 0 to 100
  label: 'Critical' | 'High' | 'Medium' | 'Low';
  breakdown: {
    severityScore: number; // max 40
    peopleScore: number;   // max 25
    vulnerableScore: number; // max 20
    waitingScore: number;  // max 15
    elapsedHours: number;
  };
}

export function computePriorityScore(factors: PriorityFactors, referenceDate: Date = new Date()): PriorityResult {
  // 1. Severity of situation (40% weight)
  let severityScore = 15;
  const sit = (factors.situation_type || '').toLowerCase();
  if (sit === 'earthquake') severityScore = 40;
  else if (sit === 'flood') severityScore = 38;
  else if (sit === 'fire') severityScore = 35;
  else if (sit === 'medical') severityScore = 36;
  else if (sit === 'other') severityScore = 18;

  // 2. People affected (25% weight, scaled to 50 people)
  const people = Math.max(1, Number(factors.people_affected) || 1);
  const peopleScore = Math.min(25, Number(((people / 50) * 25).toFixed(2)));

  // 3. Vulnerable groups present (20% weight: 4 groups * 5 pts)
  let groups: string[] = [];
  if (Array.isArray(factors.special_groups)) {
    groups = factors.special_groups;
  } else if (typeof factors.special_groups === 'string') {
    try {
      const parsed = JSON.parse(factors.special_groups);
      if (Array.isArray(parsed)) groups = parsed;
    } catch {
      groups = factors.special_groups.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const validGroups = ['children', 'elderly', 'pregnant', 'disabled'];
  const matchedCount = groups.filter((g) => validGroups.includes(g.toLowerCase())).length;
  const vulnerableScore = Math.min(20, matchedCount * 5);

  // 4. Waiting time (15% weight, grows 1.5 pts per hour, max at 10 hours)
  const createdTime = new Date(factors.created_at).getTime();
  const nowTime = referenceDate.getTime();
  const elapsedMs = Math.max(0, nowTime - createdTime);
  const elapsedHours = Number((elapsedMs / (1000 * 60 * 60)).toFixed(1));
  const waitingScore = Math.min(15, Number((elapsedHours * 1.5).toFixed(2)));

  // Total Score (0-100)
  const rawTotal = severityScore + peopleScore + vulnerableScore + waitingScore;
  const score = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

  // Determine Priority Label
  let label: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
  if (score >= 75) {
    label = 'Critical';
  } else if (score >= 50) {
    label = 'High';
  } else if (score >= 25) {
    label = 'Medium';
  } else {
    label = 'Low';
  }

  return {
    score,
    label,
    breakdown: {
      severityScore,
      peopleScore,
      vulnerableScore,
      waitingScore,
      elapsedHours,
    },
  };
}
