export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export type MemberRole = 'admin' | 'member';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimeSlot = {
  start: string;
  end: string;
};

export type Availability = {
  [key in DayOfWeek]: TimeSlot[];
};

export type Job = {
  id: string;
  title: string;
  description?: string;
  groupId: string;
  assignedTo: string;
  recurrence: RecurrenceType;
  startDate: string;
  nextDueDate: string;
  lastCompletedDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  availability: Availability;
  jobPreferences: {
    [jobId: string]: {
      preferred: boolean;
      notes?: string;
    };
  };
};

export type Group = {
  id: string;
  name: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
};

export type CompletionRecord = {
  id: string;
  jobId: string;
  completedAt: string;
  completedBy: string;
};

export type AppState = {
  groups: Group[];
  jobs: Job[];
  completionHistory: CompletionRecord[];
}; 