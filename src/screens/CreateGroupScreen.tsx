import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loadState, saveState } from '../utils/storage';
import { Group, Member } from '../types';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateGroup'
>;

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const CreateGroupScreen = () => {
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  const addMember = () => {
    if (!memberName.trim() || !memberEmail.trim()) {
      Alert.alert('Error', 'Please enter both name and email for the member');
      return;
    }

    const newMember: Member = {
      id: generateId(),
      name: memberName.trim(),
      email: memberEmail.trim(),
      role: members.length === 0 ? 'admin' : 'regular',
      availability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      preferences: {},
    };

    setMembers([...members, newMember]);
    setMemberName('');
    setMemberEmail('');
  };

  const removeMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (members.length === 0) {
      Alert.alert('Error', 'Please add at least one member');
      return;
    }

    try {
      const state = await loadState();
      const newGroup: Group = {
        id: generateId(),
        name: groupName.trim(),
        members,
        jobs: [],
      };

      await saveState({
        ...state,
        groups: [...state.groups, newGroup],
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor="#999"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Add Members</Text>
          <View style={styles.memberForm}>
            <TextInput
              style={[styles.input, styles.memberInput]}
              placeholder="Name"
              placeholderTextColor="#999"
              value={memberName}
              onChangeText={setMemberName}
            />
            <TextInput
              style={[styles.input, styles.memberInput]}
              placeholder="Email"
              placeholderTextColor="#999"
              value={memberEmail}
              onChangeText={setMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addButton} onPress={addMember}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {members.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Members</Text>
            {members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor:
                            member.role === 'admin' ? '#FF9500' : '#34C759',
                        },
                      ]}
                    >
                      <Text style={styles.roleBadgeText}>{member.role}</Text>
                    </View>
                  </View>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMember(member.id)}
                >
                  <Text style={styles.removeButtonText}>-</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.createButton} onPress={createGroup}>
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E5EA',
      },
      android: {
        elevation: 2,
        marginHorizontal: 16,
        borderRadius: 8,
      },
    }),
  },
  label: {
    fontSize: Platform.select({
      ios: 13,
      android: 14,
    }),
    color: Platform.select({
      ios: '#666',
      android: '#333',
    }),
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    ...Platform.select({
      ios: {
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 12,
        fontSize: 17,
      },
      android: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
      },
    }),
  },
  sectionTitle: {
    fontSize: Platform.select({
      ios: 17,
      android: 16,
    }),
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  memberForm: {
    gap: 12,
  },
  memberInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: Platform.select({
      ios: '#007AFF',
      android: '#2196F3',
    }),
    padding: 12,
    borderRadius: Platform.select({
      ios: 10,
      android: 8,
    }),
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: Platform.select({
      ios: 17,
      android: 16,
    }),
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.select({
      ios: '#F2F2F7',
      android: '#F5F5F5',
    }),
    borderRadius: Platform.select({
      ios: 10,
      android: 8,
    }),
    padding: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Platform.select({
      ios: 17,
      android: 16,
    }),
    fontWeight: '500',
    color: '#000',
  },
  memberEmail: {
    fontSize: Platform.select({
      ios: 15,
      android: 14,
    }),
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Platform.select({
      ios: '#FF3B30',
      android: '#F44336',
    }),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: Platform.select({
      ios: -2,
      android: -1,
    }),
  },
  createButton: {
    backgroundColor: Platform.select({
      ios: '#34C759',
      android: '#4CAF50',
    }),
    margin: 16,
    padding: Platform.select({
      ios: 16,
      android: 14,
    }),
    borderRadius: Platform.select({
      ios: 12,
      android: 8,
    }),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createButtonText: {
    color: '#fff',
    fontSize: Platform.select({
      ios: 17,
      android: 16,
    }),
    fontWeight: '600',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
}); 