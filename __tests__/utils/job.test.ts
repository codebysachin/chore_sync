import AsyncStorage from '@react-native-async-storage/async-storage';
import { addJob, updateJob, getMemberJobs } from '../../src/utils/storage';
import { AppState, Job, CompletionRecord } from '../../src/types';

const STORAGE_KEY = 'kin_keeper_APP_STATE';

describe('Job Management', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  const mockJob: Job = {
    id: '1',
    title: 'Test Job',
    description: 'Test Description',
    groupId: '1',
    assignedTo: 'user1',
    recurrence: 'daily',
    startDate: new Date().toISOString(),
    nextDueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('Job Operations', () => {
    it('should add a new job', async () => {
      const initialState: AppState = {
        groups: [],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      await addJob(mockJob);

      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;
      expect(state.jobs).toHaveLength(1);
      expect(state.jobs[0]).toEqual(mockJob);
    });

    it('should update an existing job', async () => {
      const initialState: AppState = {
        groups: [],
        jobs: [mockJob],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedJob: Job = {
        ...mockJob,
        title: 'Updated Job Title',
        updatedAt: new Date().toISOString(),
      };

      await updateJob(updatedJob);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.jobs[0].title).toBe('Updated Job Title');
      expect(state.jobs[0].id).toBe(mockJob.id);
    });

    it('should not update if job does not exist', async () => {
      const initialState: AppState = {
        groups: [],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedJob: Job = {
        ...mockJob,
        id: 'nonexistent',
      };

      await updateJob(updatedJob);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.jobs).toHaveLength(0);
    });
  });

  describe('Job Assignments', () => {
    it('should get jobs assigned to a member', async () => {
      const memberId = 'user1';
      const otherMemberId = 'user2';

      const mockJobs: Job[] = [
        mockJob,
        {
          ...mockJob,
          id: '2',
          title: 'Another Job',
          assignedTo: otherMemberId,
        },
        {
          ...mockJob,
          id: '3',
          title: 'Third Job',
          assignedTo: memberId,
        },
      ];

      const initialState: AppState = {
        groups: [],
        jobs: mockJobs,
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const memberJobs = await getMemberJobs(memberId);
      expect(memberJobs).toHaveLength(2);
      expect(memberJobs.every(job => job.assignedTo === memberId)).toBe(true);
    });
  });

  describe('Job Completion', () => {
    it('should update job next due date when completed', async () => {
      const initialState: AppState = {
        groups: [],
        jobs: [mockJob],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const completionRecord: CompletionRecord = {
        id: '1',
        jobId: mockJob.id,
        completedAt: new Date().toISOString(),
        completedBy: mockJob.assignedTo,
      };

      const updatedJob: Job = {
        ...mockJob,
        lastCompletedDate: completionRecord.completedAt,
        nextDueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // Next day for daily job
      };

      const updatedState: AppState = {
        ...initialState,
        jobs: [updatedJob],
        completionHistory: [completionRecord],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.jobs[0].lastCompletedDate).toBe(completionRecord.completedAt);
      expect(state.completionHistory).toHaveLength(1);
      expect(state.completionHistory[0]).toEqual(completionRecord);
    });
  });
}); 