import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Group } from '../types';
import { loadState } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Groups'>;

export const GroupsScreen = ({ navigation }: Props) => {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const state = await loadState();
    setGroups(state.groups);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGroups();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {groups.length === 0 ? (
          <Text style={styles.emptyText}>
            No groups yet. Create one by tapping the + button.
          </Text>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
            >
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.memberCount}>
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.select({
      ios: '#F2F2F7',
      android: '#fff',
    }),
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.select({
      ios: 10,
      android: 8,
    }),
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  groupName: {
    fontSize: Platform.select({
      ios: 17,
      android: 16,
    }),
    fontWeight: Platform.select({
      ios: '600',
      android: 'bold',
    }),
    color: '#000',
  },
  memberCount: {
    fontSize: Platform.select({
      ios: 15,
      android: 14,
    }),
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Platform.select({
      ios: '#007AFF',
      android: '#007AFF',
    }),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    marginTop: Platform.select({
      ios: -4,
      android: -2,
    }),
  },
}); 