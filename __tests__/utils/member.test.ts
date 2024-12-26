import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateGroup } from '../../src/utils/storage';
import { AppState, Group, Member } from '../../src/types';

const STORAGE_KEY = 'kin_keeper_APP_STATE';

describe('Member Management', () => {
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

  describe('Member Operations', () => {
    it('should add a new member to group', async () => {
      const initialState: AppState = {
        groups: [mockGroup],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const newMember: Member = {
        id: '2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'member',
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

      const updatedGroup: Group = {
        ...mockGroup,
        members: [...mockGroup.members, newMember],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].members).toHaveLength(2);
      expect(state.groups[0].members[1]).toEqual(newMember);
    });

    it('should remove a member from group', async () => {
      const groupWithTwoMembers: Group = {
        ...mockGroup,
        members: [
          mockMember,
          {
            id: '2',
            name: 'Jane Doe',
            email: 'jane@example.com',
            role: 'member',
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
          },
        ],
      };

      const initialState: AppState = {
        groups: [groupWithTwoMembers],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedGroup: Group = {
        ...groupWithTwoMembers,
        members: [mockMember],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].members).toHaveLength(1);
      expect(state.groups[0].members[0].id).toBe(mockMember.id);
    });

    it('should update member role', async () => {
      // Create a group with two admin members
      const secondAdmin: Member = {
        id: '2',
        name: 'Jane Doe',
        email: 'jane@example.com',
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

      const groupWithTwoAdmins: Group = {
        ...mockGroup,
        members: [mockMember, secondAdmin],
      };

      const initialState: AppState = {
        groups: [groupWithTwoAdmins],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedMember: Member = {
        ...mockMember,
        role: 'member',
      };

      const updatedGroup: Group = {
        ...groupWithTwoAdmins,
        members: [updatedMember, secondAdmin],
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].members[0].role).toBe('member');
    });

    it('should not allow demoting last admin', async () => {
      const initialState: AppState = {
        groups: [mockGroup],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedMember: Member = {
        ...mockMember,
        role: 'member',
      };

      const updatedGroup: Group = {
        ...mockGroup,
        members: [updatedMember],
        updatedAt: new Date().toISOString(),
      };

      // Verify that the state remains unchanged when trying to demote the last admin
      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;
      expect(state.groups[0].members[0].role).toBe('admin');
    });
  });
}); 