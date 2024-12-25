import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Group, Job } from '../types';

const STORAGE_KEY = 'kin_keeper_APP_STATE';

export const getInitialState = (): AppState => ({
  groups: [],
  jobs: [],
  completionHistory: [],
});

export const loadState = async (): Promise<AppState> => {
  try {
    const jsonState = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonState ? JSON.parse(jsonState) : getInitialState();
  } catch (error) {
    console.error('Error loading state:', error);
    return getInitialState();
  }
};

export const saveState = async (state: AppState): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

export const addGroup = async (group: Group): Promise<void> => {
  const state = await loadState();
  state.groups.push(group);
  await saveState(state);
};

export const updateGroup = async (group: Group): Promise<void> => {
  const state = await loadState();
  const index = state.groups.findIndex(g => g.id === group.id);
  if (index !== -1) {
    state.groups[index] = group;
    await saveState(state);
  }
};

export const addJob = async (job: Job): Promise<void> => {
  const state = await loadState();
  state.jobs.push(job);
  await saveState(state);
};

export const updateJob = async (job: Job): Promise<void> => {
  const state = await loadState();
  const index = state.jobs.findIndex(j => j.id === job.id);
  if (index !== -1) {
    state.jobs[index] = job;
    await saveState(state);
  }
};

export const getGroupJobs = async (groupId: string): Promise<Job[]> => {
  const state = await loadState();
  return state.jobs.filter(job => job.groupId === groupId);
};

export const getMemberJobs = async (memberId: string): Promise<Job[]> => {
  const state = await loadState();
  return state.jobs.filter(job => job.assignedTo === memberId);
}; 