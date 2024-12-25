import { Member, Job, TimeSlot, DayOfWeek } from '../types';

const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const isTimeInSlot = (time: string, slot: TimeSlot): boolean => {
  const timeMinutes = parseTime(time);
  const startMinutes = parseTime(slot.start);
  const endMinutes = parseTime(slot.end);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

const getAffectedDays = (job: Job): DayOfWeek[] => {
  const startDate = new Date(job.nextDueDate);
  const days: DayOfWeek[] = [];
  
  switch (job.recurrence) {
    case 'daily':
      // For daily jobs, need to check all days
      return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    case 'weekly':
      // For weekly jobs, only need to check the same day of week
      return [getDayOfWeek(startDate)];
    
    case 'monthly':
      // For monthly jobs, only need to check the same day of week
      return [getDayOfWeek(startDate)];
    
    default:
      return [getDayOfWeek(startDate)];
  }
};

export const isMemberAvailableForJob = (member: Member, job: Job): { available: boolean; reason?: string } => {
  const jobDate = new Date(job.nextDueDate);
  const jobTime = jobDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const affectedDays = getAffectedDays(job);
  
  // Check availability for all affected days
  const unavailableDays: string[] = [];
  
  for (const day of affectedDays) {
    const daySlots = member.availability[day];
    if (!daySlots || daySlots.length === 0) {
      unavailableDays.push(day);
      continue;
    }
    
    const isAvailable = daySlots.some(slot => isTimeInSlot(jobTime, slot));
    if (!isAvailable) {
      unavailableDays.push(day);
    }
  }
  
  if (unavailableDays.length > 0) {
    let reason = '';
    if (unavailableDays.length === affectedDays.length) {
      // Member is not available on any required day
      if (job.recurrence === 'daily') {
        reason = `Member is not available at ${jobTime} on any day`;
      } else {
        const daysStr = unavailableDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        reason = `Member is not available at ${jobTime} on ${daysStr}`;
      }
    } else {
      // Member is available on some days but not all
      const daysStr = unavailableDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
      reason = `Member is not available at ${jobTime} on these days: ${daysStr}`;
    }
    
    return {
      available: false,
      reason
    };
  }
  
  return { available: true };
}; 