import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Group, Job, RecurrenceType, Member } from '../types';
import { loadState, saveState } from '../utils/storage';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { isMemberAvailableForJob } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateJob'>;

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const RECURRENCE_OPTIONS: RecurrenceType[] = ['daily', 'weekly', 'monthly'];

export const CreateJobScreen = ({ route, navigation }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedRecurrence, setSelectedRecurrence] = useState<RecurrenceType>('daily');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadGroupDetails();
  }, []);

  const loadGroupDetails = async () => {
    if (!route.params.groupId) {
      Alert.alert('Error', 'Group ID is required');
      navigation.goBack();
      return;
    }

    const state = await loadState();
    const foundGroup = state.groups.find(g => g.id === route.params.groupId);
    if (foundGroup) {
      setGroup(foundGroup);
      if (foundGroup.members.length > 0) {
        setSelectedMemberId(foundGroup.members[0].id);
      }
    } else {
      Alert.alert('Error', 'Group not found');
      navigation.goBack();
    }
  };

  const handleCreateJob = async () => {
    if (!title.trim() || !selectedMemberId || !selectedRecurrence || !dueDate || !group || !route.params.groupId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const member = group.members.find((m: Member) => m.id === selectedMemberId);
    if (!member) {
      Alert.alert('Error', 'Selected member not found');
      return;
    }

    const newJob: Job = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      groupId: route.params.groupId,
      assignedTo: selectedMemberId,
      recurrence: selectedRecurrence,
      startDate: dueDate.toISOString(),
      nextDueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check member availability before creating the job
    const availabilityCheck = isMemberAvailableForJob(member, newJob);
    if (!availabilityCheck.available) {
      Alert.alert(
        'Member Not Available',
        availabilityCheck.reason || 'Member is not available for this job time',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Create Anyway',
            style: 'destructive',
            onPress: async () => {
              await createJob(newJob);
            }
          }
        ]
      );
      return;
    }

    await createJob(newJob);
  };

  const createJob = async (newJob: Job) => {
    try {
      const state = await loadState();
      await saveState({
        ...state,
        jobs: [...state.jobs, newJob],
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create job');
    }
  };

  const getRecurrenceColor = (type: RecurrenceType): string => {
    switch (type) {
      case 'daily':
        return '#FF9500';
      case 'weekly':
        return '#007AFF';
      case 'monthly':
        return '#5856D6';
      default:
        return '#8E8E93';
    }
  };

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.label}>Job Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter job title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, styles.spacedLabel]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter job description (optional)"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Recurrence</Text>
          <View style={styles.recurrenceOptions}>
            {RECURRENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.recurrenceOption,
                  selectedRecurrence === option && {
                    backgroundColor: getRecurrenceColor(option),
                  },
                ]}
                onPress={() => setSelectedRecurrence(option)}
              >
                <Text
                  style={[
                    styles.recurrenceText,
                    selectedRecurrence === option && styles.recurrenceTextSelected,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.spacedLabel]}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {format(dueDate, 'MMMM d, yyyy')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Assign To</Text>
          <View style={styles.memberList}>
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberOption,
                  selectedMemberId === member.id && styles.memberOptionSelected,
                ]}
                onPress={() => setSelectedMemberId(member.id)}
              >
                <View style={styles.memberIcon}>
                  <Text style={styles.memberInitial}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.memberName,
                    selectedMemberId === member.id && styles.memberNameSelected,
                  ]}
                >
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateJob}
        >
          <Text style={styles.createButtonText}>Create Job</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 17,
    color: '#666666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  spacedLabel: {
    marginTop: 16,
  },
  input: {
    fontSize: 17,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    color: '#000000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceOption: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  recurrenceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  recurrenceTextSelected: {
    color: '#FFFFFF',
  },
  dateButton: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 17,
    color: '#000000',
  },
  memberList: {
    gap: 12,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  memberOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  memberIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberName: {
    marginLeft: 12,
    fontSize: 17,
    color: '#000000',
  },
  memberNameSelected: {
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
}); 