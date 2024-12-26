export type RootStackParamList = {
  Groups: undefined;
  CreateGroup: undefined;
  GroupDetails: {
    groupId: string;
    refresh?: boolean;
  };
  CreateJob: {
    groupId?: string;
  };
  JobDetails: {
    jobId: string;
  };
};

export type BottomTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Profile: undefined;
}; 