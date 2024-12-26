import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadState, saveState, getGroupJobs } from '../../src/utils/storage';
import { AppState, Job } from '../../src/types';

const STORAGE_KEY = 'kin_keeper_APP_STATE';

describe('Storage Utils', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe('loadState', () => {
    it('should return default state when no state exists', async () => {
      const state = await loadState();
      expect(state).toEqual({
        groups: [],
        jobs: [],
        completionHistory: [],
      });
    });

    it('should load existing state', async () => {
      const mockState: AppState = {
        groups: [
          {
            id: '1',
            name: 'Test Group',
            members: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
      const state = await loadState();
      expect(state).toEqual(mockState);
    });
  });

  describe('saveState', () => {
    it('should save state to AsyncStorage', async () => {
      const mockState: AppState = {
        groups: [],
        jobs: [],
        completionHistory: [],
      };

      await saveState(mockState);
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(savedState!)).toEqual(mockState);
    });
  });

  describe('getGroupJobs', () => {
    it('should return jobs for specific group', async () => {
      const groupId = '1';
      const mockJob: Job = {
        id: '1',
        title: 'Test Job 1',
        groupId,
        assignedTo: 'user1',
        recurrence: 'daily',
        startDate: new Date().toISOString(),
        nextDueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockState: AppState = {
        groups: [],
        jobs: [
          mockJob,
          {
            ...mockJob,
            id: '2',
            title: 'Test Job 2',
            groupId: '2',
          },
        ],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
      const jobs = await getGroupJobs(groupId);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe('1');
    });
  });
}); 