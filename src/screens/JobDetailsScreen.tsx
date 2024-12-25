import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Job, Group, RecurrenceType } from '../types';
import { loadState, saveState } from '../utils/storage';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { isMemberAvailableForJob } from '../utils/validation';
import { JobCompletionHistory } from '../components/JobCompletionHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

const RECURRENCE_OPTIONS: RecurrenceType[] = ['daily', 'weekly', 'monthly'];

export const JobDetailsScreen = ({ route, navigation }: Props) => {
  const [job, setJob] = useState<Job | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedRecurrence, setEditedRecurrence] = useState<RecurrenceType>('daily');
  const [editedDueDate, setEditedDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, []);

  const loadJobDetails = async () => {
    try {
      const state = await loadState();
      const foundJob = state.jobs.find(j => j.id === route.params.jobId);
      if (foundJob) {
        setJob(foundJob);
        setEditedTitle(foundJob.title);
        setEditedDescription(foundJob.description || '');
        setEditedRecurrence(foundJob.recurrence);
        setEditedDueDate(new Date(foundJob.nextDueDate));
        
        const foundGroup = state.groups.find(g => g.id === foundJob.groupId);
        if (foundGroup) {
          setGroup(foundGroup);
        } else {
          throw new Error('Group not found');
        }
      } else {
        throw new Error('Job not found');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load job details');
      navigation.goBack();
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (job) {
      setEditedTitle(job.title);
      setEditedDescription(job.description || '');
      setEditedRecurrence(job.recurrence);
      setEditedDueDate(new Date(job.nextDueDate));
    }
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!job || !group) return;

    if (!editedTitle.trim()) {
      Alert.alert('Error', 'Job title is required');
      return;
    }

    const member = group.members.find(m => m.id === job.assignedTo);
    if (!member) {
      Alert.alert('Error', 'Assigned member not found');
      return;
    }

    const updatedJob: Job = {
      ...job,
      title: editedTitle.trim(),
      description: editedDescription.trim(),
      recurrence: editedRecurrence,
      nextDueDate: editedDueDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check availability if schedule changed
    if (job.nextDueDate !== updatedJob.nextDueDate || job.recurrence !== updatedJob.recurrence) {
      const availabilityCheck = isMemberAvailableForJob(member, updatedJob);
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
              text: 'Save Anyway',
              style: 'destructive',
              onPress: async () => {
                await saveJobChanges(updatedJob);
              }
            }
          ]
        );
        return;
      }
    }

    await saveJobChanges(updatedJob);
  };

  const saveJobChanges = async (updatedJob: Job) => {
    try {
      const state = await loadState();
      const updatedJobs = state.jobs.map(j =>
        j.id === updatedJob.id ? updatedJob : j
      );
      await saveState({ ...state, jobs: updatedJobs });
      setJob(updatedJob);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleDeleteJob = () => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteJob
        }
      ]
    );
  };

  const confirmDeleteJob = async () => {
    if (!job) return;

    try {
      const state = await loadState();
      const updatedJobs = state.jobs.filter(j => j.id !== job.id);
      await saveState({ ...state, jobs: updatedJobs });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete job');
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

  const handleJobCompleted = useCallback(async () => {
    if (!job) return;

    // Calculate next due date based on recurrence
    const nextDueDate = new Date(job.nextDueDate);
    switch (job.recurrence) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
    }

    const updatedJob: Job = {
      ...job,
      lastCompletedDate: new Date().toISOString(),
      nextDueDate: nextDueDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const state = await loadState();
      const updatedJobs = state.jobs.map(j =>
        j.id === updatedJob.id ? updatedJob : j
      );
      await saveState({ ...state, jobs: updatedJobs });
      setJob(updatedJob);
    } catch (error) {
      Alert.alert('Error', 'Failed to update job completion status');
    }
  }, [job]);

  if (!job || !group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {isEditing ? (
          <View style={styles.editTitleContainer}>
            <TextInput
              style={styles.editTitleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Enter job title"
            />
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{job.title}</Text>
            <TouchableOpacity onPress={handleStartEditing}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: getRecurrenceColor(job.recurrence) }]}>
          <Text style={styles.badgeText}>{job.recurrence}</Text>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.editDescriptionInput}
            value={editedDescription}
            onChangeText={setEditedDescription}
            placeholder="Enter job description"
            multiline
          />

          <Text style={styles.label}>Recurrence</Text>
          <View style={styles.recurrenceOptions}>
            {RECURRENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.recurrenceOption,
                  editedRecurrence === option && {
                    backgroundColor: getRecurrenceColor(option),
                  },
                ]}
                onPress={() => setEditedRecurrence(option)}
              >
                <Text
                  style={[
                    styles.recurrenceText,
                    editedRecurrence === option && styles.recurrenceTextSelected,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {format(editedDueDate, 'MMMM d, yyyy')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={editedDueDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setEditedDueDate(selectedDate);
                }
              }}
            />
          )}

          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelEditing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveChanges}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{job.description || 'No description'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <Text style={styles.scheduleText}>
              Next due: {format(new Date(job.nextDueDate), 'MMMM d, yyyy')}
            </Text>
            {job.lastCompletedDate && (
              <Text style={styles.completedText}>
                Last completed: {format(new Date(job.lastCompletedDate), 'MMMM d, yyyy')}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned To</Text>
            <Text style={styles.assigneeText}>
              {group.members.find(m => m.id === job.assignedTo)?.name || 'Unknown'}
            </Text>
          </View>

          <JobCompletionHistory job={job} onComplete={handleJobCompleted} />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteJob}
          >
            <Text style={styles.deleteButtonText}>Delete Job</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    color: '#007AFF',
    fontSize: 17,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 17,
    color: '#333333',
  },
  scheduleText: {
    fontSize: 17,
    color: '#333333',
    marginBottom: 4,
  },
  completedText: {
    fontSize: 15,
    color: '#666666',
    fontStyle: 'italic',
  },
  assigneeText: {
    fontSize: 17,
    color: '#333333',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  editTitleContainer: {
    marginBottom: 8,
  },
  editTitleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  editContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
    marginTop: 16,
  },
  editDescriptionInput: {
    fontSize: 17,
    color: '#000000',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    minHeight: 100,
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
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
}); 