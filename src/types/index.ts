export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export type MemberRole = 'admin' | 'regular';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string; // 24-hour format HH:mm
  end: string;   // 24-hour format HH:mm
}

export interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface JobPreference {
  preferred: boolean;
  notes?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  availability: Availability;
  preferences: {
    [jobId: string]: JobPreference;
  };
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  recurrence: RecurrenceType;
  assignedTo: string; // Member ID
  groupId: string;
  dueDate: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  jobs: Job[];
}

export interface CompletionRecord {
  id: string;
  jobId: string;
  completedAt: string;
  completedBy: string;
}

export interface AppState {
  groups: Group[];
  completionHistory: CompletionRecord[];
} 