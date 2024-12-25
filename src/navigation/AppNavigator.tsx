import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { GroupsScreen } from '../screens/GroupsScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { GroupDetailsScreen } from '../screens/GroupDetailsScreen';
import { CreateJobScreen } from '../screens/CreateJobScreen';
import { JobDetailsScreen } from '../screens/JobDetailsScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Groups"
        screenOptions={{
          headerStyle: Platform.select({
            ios: {
              backgroundColor: '#fff',
            },
            android: {
              backgroundColor: '#007AFF',
            },
          }),
          headerTintColor: Platform.select({
            ios: '#007AFF',
            android: '#fff',
          }),
          headerTitleStyle: {
            fontWeight: Platform.select({
              ios: '600',
              android: 'bold',
            }),
          },
          headerShadowVisible: Platform.OS === 'ios',
          headerBackTitleVisible: Platform.OS === 'ios',
        }}
      >
        <Stack.Screen
          name="Groups"
          component={GroupsScreen}
          options={{
            title: 'My Groups',
          }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{
            title: 'Create Group',
          }}
        />
        <Stack.Screen
          name="GroupDetails"
          component={GroupDetailsScreen}
          options={{
            title: 'Group Details',
          }}
        />
        <Stack.Screen
          name="CreateJob"
          component={CreateJobScreen}
          options={{
            title: 'Create Job',
          }}
        />
        <Stack.Screen
          name="JobDetails"
          component={JobDetailsScreen}
          options={{
            title: 'Job Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 