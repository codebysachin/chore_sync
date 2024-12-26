import AsyncStorage from '@react-native-async-storage/async-storage';
import { addGroup, updateGroup } from '../../src/utils/storage';
import { AppState, Group, Member } from '../../src/types';

const STORAGE_KEY = 'kin_keeper_APP_STATE';

describe('Group Management', () => {
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

  describe('addGroup', () => {
    it('should add a new group to storage', async () => {
      const newGroup: Group = {
        id: '1',
        name: 'Test Group',
        members: [mockMember],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addGroup(newGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;
      
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]).toEqual(newGroup);
    });
  });

  describe('updateGroup', () => {
    it('should update an existing group', async () => {
      const initialGroup: Group = {
        id: '1',
        name: 'Test Group',
        members: [mockMember],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const initialState: AppState = {
        groups: [initialGroup],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const updatedGroup: Group = {
        ...initialGroup,
        name: 'Updated Group Name',
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(updatedGroup);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups[0].name).toBe('Updated Group Name');
      expect(state.groups[0].id).toBe(initialGroup.id);
    });

    it('should not update if group does not exist', async () => {
      const initialState: AppState = {
        groups: [],
        jobs: [],
        completionHistory: [],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

      const group: Group = {
        id: 'nonexistent',
        name: 'Test Group',
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateGroup(group);
      const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!) as AppState;

      expect(state.groups).toHaveLength(0);
    });
  });
}); 