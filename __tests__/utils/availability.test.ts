import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateGroup } from '../../src/utils/storage';
import { AppState, Group, Member, TimeSlot } from '../../src/types';

const STORAGE_KEY = 'kin_keeper_APP_STATE';

describe('Member Availability and Preferences', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  const mockMember: Member = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    jobPreferences: {},
  };

  const mockGroup: Group = {
    id: '1',
    name: 'Test Group',
    members: [mockMember],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('Availability Management', () => {
    it('should update member availability', async () => {
      const initialState: AppState = {
        groups: [mockGroup],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const timeSlots: TimeSlot[] = [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ];

      const updatedMember: Member = {
        ...mockMember,
        availability: {
          ...mockMember.availability,
          monday: timeSlots,
        },
      };

      const updatedGroup: Group = {
        ...mockGroup,
        members: [updatedMember],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].members[0].availability.monday).toHaveLength(2);
      expect(state.groups[0].members[0].availability.monday).toEqual(timeSlots);
    });

    it('should clear availability for a day', async () => {
      const memberWithAvailability: Member = {
        ...mockMember,
        availability: {
          ...mockMember.availability,
          monday: [{ start: '09:00', end: '17:00' }],
        },
      };

      const groupWithAvailability: Group = {
        ...mockGroup,
        members: [memberWithAvailability],
      };

      const initialState: AppState = {
        groups: [groupWithAvailability],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedMember: Member = {
        ...memberWithAvailability,
        availability: {
          ...memberWithAvailability.availability,
          monday: [],
        },
      };

      const updatedGroup: Group = {
        ...groupWithAvailability,
        members: [updatedMember],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].members[0].availability.monday).toHaveLength(0);
    });
  });

  describe('Job Preferences', () => {
    it('should update job preferences', async () => {
      const initialState: AppState = {
        groups: [mockGroup],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedMember: Member = {
        ...mockMember,
        jobPreferences: {
          'job1': {
            preferred: true,
            notes: 'I like this job',
          },
        },
      };

      const updatedGroup: Group = {
        ...mockGroup,
        members: [updatedMember],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].members[0].jobPreferences['job1']).toBeDefined();
      expect(state.groups[0].members[0].jobPreferences['job1'].preferred).toBe(true);
      expect(state.groups[0].members[0].jobPreferences['job1'].notes).toBe('I like this job');
    });

    it('should remove job preferences', async () => {
      const memberWithPreferences: Member = {
        ...mockMember,
        jobPreferences: {
          'job1': {
            preferred: true,
            notes: 'I like this job',
          },
        },
      };

      const groupWithPreferences: Group = {
        ...mockGroup,
        members: [memberWithPreferences],
      };

      const initialState: AppState = {
        groups: [groupWithPreferences],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedMember: Member = {
        ...memberWithPreferences,
        jobPreferences: {},
      };

      const updatedGroup: Group = {
        ...groupWithPreferences,
        members: [updatedMember],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(Object.keys(state.groups[0].members[0].jobPreferences)).toHaveLength(0);
    });
  });
}); 