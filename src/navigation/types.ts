export type RootStackParamList = {
  Groups: undefined;
  GroupDetails: { groupId: string };
  CreateGroup: undefined;
  CreateJob: { groupId?: string };
  JobDetails: { jobId: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Profile: undefined;
}; 