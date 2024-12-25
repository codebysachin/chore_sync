/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { enableScreens } from 'react-native-screens';

// Enable native screens for better performance
enableScreens();

function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={Platform.select({
          ios: 'dark-content',
          android: 'light-content',
        })}
        backgroundColor={Platform.select({
          ios: 'transparent',
          android: '#007AFF',
        })}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
