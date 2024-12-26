import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Group, Job, Member, RecurrenceType, MemberRole, DayOfWeek, TimeSlot, Availability } from '../types';
import { loadState, getGroupJobs, updateGroup, saveState } from '../utils/storage';
import { format } from 'date-fns';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetails'>;

const DEFAULT_AVAILABILITY: Availability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const migrateGroupData = (group: Group): Group => {
  return {
    ...group,
    members: group.members.map(member => ({
      ...member,
      availability: member.availability || DEFAULT_AVAILABILITY,
      jobPreferences: member.jobPreferences || {},
    })),
  };
};

export const GroupDetailsScreen = ({ route, navigation }: Props) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<RecurrenceType | 'all'>('all');
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingTimeSlots, setEditingTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [isPreferred, setIsPreferred] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadGroupDetails(), loadGroupJobs()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadGroupDetails();
    loadGroupJobs();
  }, []);

  useEffect(() => {
    if (route.params.refresh) {
      loadGroupJobs();
      // Reset the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params.refresh]);

  const loadGroupDetails = async () => {
    const state = await loadState();
    const foundGroup = state.groups.find(g => g.id === route.params.groupId);
    if (foundGroup) {
      const migratedGroup = migrateGroupData(foundGroup);
      
      if (JSON.stringify(foundGroup) !== JSON.stringify(migratedGroup)) {
        const updatedGroups = state.groups.map(g =>
          g.id === foundGroup.id ? migratedGroup : g
        );
        await saveState({ ...state, groups: updatedGroups });
      }
      
      setGroup(migratedGroup);
      setNewGroupName(migratedGroup.name);
    } else {
      Alert.alert('Error', 'Group not found');
      navigation.goBack();
    }
  };

  const loadGroupJobs = async () => {
    const groupJobs = await getGroupJobs(route.params.groupId);
    setJobs(groupJobs);
  };

  const handleUpdateGroupName = async () => {
    if (!group || !newGroupName.trim()) return;

    try {
      const state = await loadState();
      const updatedGroup = { ...group, name: newGroupName.trim() };
      const updatedGroups = state.groups.map(g =>
        g.id === group.id ? updatedGroup : g
      );
      await saveState({ ...state, groups: updatedGroups });
      setGroup(updatedGroup);
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handleAddMember = async () => {
    if (!group || !newMemberName.trim() || !newMemberEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const newMember: Member = {
        id: generateId(),
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        role: 'member',
        availability: DEFAULT_AVAILABILITY,
        jobPreferences: {},
      };

      const updatedGroup = {
        ...group,
        members: [...group.members, newMember],
      };

      const state = await loadState();
      const updatedGroups = state.groups.map(g =>
        g.id === group.id ? updatedGroup : g
      );
      await saveState({ ...state, groups: updatedGroups });
      setGroup(updatedGroup);
      setIsAddingMember(false);
      setNewMemberName('');
      setNewMemberEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!group) return;

    // Check if trying to remove the last admin
    const member = group.members.find(m => m.id === memberId);
    const adminCount = group.members.filter(m => m.role === 'admin').length;
    
    if (member?.role === 'admin' && adminCount <= 1) {
      Alert.alert(
        'Cannot Remove Admin',
        'You cannot remove the last admin of the group. Please promote another member to admin first.'
      );
      return;
    }

    // Check if member has assigned jobs
    const memberJobs = jobs.filter(job => job.assignedTo === memberId);
    if (memberJobs.length > 0) {
      Alert.alert(
        'Warning',
        'This member has assigned jobs. Please reassign or delete their jobs first.'
      );
      return;
    }

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedGroup = {
                ...group,
                members: group.members.filter(m => m.id !== memberId),
              };

              const state = await loadState();
              const updatedGroups = state.groups.map(g =>
                g.id === group.id ? updatedGroup : g
              );
              await saveState({ ...state, groups: updatedGroups });
              setGroup(updatedGroup);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleToggleRole = async (memberId: string) => {
    if (!group) return;

    const member = group.members.find(m => m.id === memberId);
    if (!member) return;

    const adminCount = group.members.filter(m => m.role === 'admin').length;
    
    if (member.role === 'admin' && adminCount <= 1) {
      Alert.alert(
        'Cannot Change Role',
        'You cannot demote the last admin of the group. Please promote another member to admin first.'
      );
      return;
    }

    const newRole: MemberRole = member.role === 'admin' ? 'member' : 'admin';
    
    try {
      const updatedGroup = {
        ...group,
        members: group.members.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ),
      };

      const state = await loadState();
      const updatedGroups = state.groups.map(g =>
        g.id === group.id ? updatedGroup : g
      );
      await saveState({ ...state, groups: updatedGroups });
      setGroup(updatedGroup);
    } catch (error) {
      Alert.alert('Error', 'Failed to update member role');
    }
  };

  const getAssignedMemberName = (memberId: string): string => {
    const member = group?.members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const filteredJobs = selectedFilter === 'all'
    ? jobs
    : jobs.filter(job => job.recurrence === selectedFilter);

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobItem}
      onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={[styles.jobRecurrence, { color: getRecurrenceColor(item.recurrence) }]}>
          {item.recurrence}
        </Text>
      </View>
      <Text style={styles.jobAssignee}>
        Assigned to: {getAssignedMemberName(item.assignedTo)}
      </Text>
      <Text style={styles.jobDueDate}>
        Next due: {format(new Date(item.nextDueDate), 'MMM d, yyyy')}
      </Text>
      {item.lastCompletedDate && (
        <Text style={styles.jobLastCompleted}>
          Last completed: {format(new Date(item.lastCompletedDate), 'MMM d, yyyy')}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getRecurrenceColor = (recurrence: RecurrenceType): string => {
    switch (recurrence) {
      case 'daily':
        return '#007AFF';
      case 'weekly':
        return '#5856D6';
      case 'monthly':
        return '#FF2D55';
      default:
        return '#666';
    }
  };

  const handleEditAvailability = (member: Member) => {
    setSelectedMember(member);
    setSelectedDay('monday');
    setEditingTimeSlots([...member.availability[selectedDay]]);
    setIsEditingAvailability(true);
  };

  const handleAddTimeSlot = () => {
    setEditingTimeSlots([...editingTimeSlots, { start: '09:00', end: '17:00' }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    const newSlots = [...editingTimeSlots];
    newSlots.splice(index, 1);
    setEditingTimeSlots(newSlots);
  };

  const handleUpdateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...editingTimeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditingTimeSlots(newSlots);
  };

  const handleSaveAvailability = async () => {
    if (!selectedMember || !group) return;

    try {
      const updatedMember = {
        ...selectedMember,
        availability: {
          ...selectedMember.availability,
          [selectedDay]: editingTimeSlots,
        } as Availability,
      };

      const updatedGroup = {
        ...group,
        members: group.members.map(m =>
          m.id === selectedMember.id ? updatedMember : m
        ),
      };

      const state = await loadState();
      const updatedGroups = state.groups.map(g =>
        g.id === group.id ? updatedGroup : g
      );
      await saveState({ ...state, groups: updatedGroups });
      setGroup(updatedGroup);
      setIsEditingAvailability(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleEditPreferences = (member: Member, job: Job) => {
    setSelectedMember(member);
    setSelectedJob(job);
    const preference = member.jobPreferences[job.id];
    setIsPreferred(preference?.preferred ?? false);
    setPreferenceNotes(preference?.notes ?? '');
    setIsEditingPreferences(true);
  };

  const handleSavePreferences = async () => {
    if (!selectedMember || !selectedJob || !group) return;

    try {
      const updatedMember = {
        ...selectedMember,
        jobPreferences: {
          ...selectedMember.jobPreferences,
          [selectedJob.id]: {
            preferred: isPreferred,
            notes: preferenceNotes.trim(),
          },
        },
      };

      const updatedGroup = {
        ...group,
        members: group.members.map(m =>
          m.id === selectedMember.id ? updatedMember : m
        ),
      };

      const state = await loadState();
      const updatedGroups = state.groups.map(g =>
        g.id === group.id ? updatedGroup : g
      );
      await saveState({ ...state, groups: updatedGroups });
      setGroup(updatedGroup);
      setIsEditingPreferences(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const renderTimeSlots = (slots: TimeSlot[]) => (
    slots.map((slot: TimeSlot, index: number) => (
      <Text key={index} style={styles.timeSlotText}>
        {slot.start} - {slot.end}
      </Text>
    ))
  );

  const renderMemberAvailability = (member: Member) => (
    <View style={styles.availabilityContainer}>
      <Text style={styles.availabilityTitle}>Availability</Text>
      {Object.entries(member.availability).map(([day, slots]) => (
        <View key={day} style={styles.dayContainer}>
          <Text style={styles.dayText}>{day}</Text>
          {slots.length > 0 ? (
            renderTimeSlots(slots)
          ) : (
            <Text style={styles.noSlotsText}>No availability set</Text>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditAvailability(member)}
      >
        <Text style={styles.editButtonText}>Edit Availability</Text>
      </TouchableOpacity>
    </View>
  );

  const renderJobPreferences = (member: Member, job: Job) => {
    const preference = member.jobPreferences[job.id];
    return (
      <View style={styles.preferenceContainer}>
        <Text style={styles.preferenceTitle}>Preferences</Text>
        <View style={styles.preferenceContent}>
          <Text style={styles.preferenceLabel}>
            Preferred: {preference?.preferred ? 'Yes' : 'No'}
          </Text>
          {preference?.notes && (
            <Text style={styles.preferenceNotes}>Notes: {preference.notes}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditPreferences(member, job)}
        >
          <Text style={styles.editButtonText}>Edit Preferences</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMember = (member: Member) => (
    <View key={member.id} style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{member.name}</Text>
          <TouchableOpacity
            style={[
              styles.roleBadge,
              { backgroundColor: member.role === 'admin' ? '#FF9500' : '#8E8E93' }
            ]}
            onPress={() => handleToggleRole(member.id)}
          >
            <Text style={styles.roleBadgeText}>{member.role}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.memberEmail}>{member.email}</Text>
        
        {/* Availability Summary */}
        <View style={styles.availabilitySummary}>
          <Text style={styles.summaryLabel}>Availability:</Text>
          {Object.entries(member.availability).some(([_, slots]) => slots.length > 0) ? (
            <Text style={styles.summaryText}>
              {Object.entries(member.availability)
                .filter(([_, slots]) => slots.length > 0)
                .map(([day]) => day.slice(0, 3))
                .join(', ')}
            </Text>
          ) : (
            <Text style={styles.noAvailabilityText}>Not set</Text>
          )}
          <TouchableOpacity
            style={styles.editLink}
            onPress={() => handleEditAvailability(member)}
          >
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Job Preferences Summary */}
        {jobs.length > 0 && (
          <View style={styles.preferencesSummary}>
            <Text style={styles.summaryLabel}>Preferred Jobs:</Text>
            {Object.entries(member.jobPreferences).some(([_, pref]) => pref.preferred) ? (
              <Text style={styles.summaryText}>
                {jobs
                  .filter(job => member.jobPreferences[job.id]?.preferred)
                  .map(job => job.title)
                  .join(', ')}
              </Text>
            ) : (
              <Text style={styles.noPreferencesText}>None set</Text>
            )}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveMember(member.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.editNameInput}
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateGroupName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingName(true)}>
              <Text style={styles.groupName}>{group.name}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.memberCount}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddingMember(true)}
            >
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {group.members.map(renderMember)}
        </View>

        <View style={styles.jobsSection}>
          <View style={styles.jobsHeader}>
            <Text style={styles.sectionTitle}>Jobs</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateJob', { groupId: group.id })}
            >
              <Text style={styles.addButtonText}>Add Job</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            {(['all', 'daily', 'weekly', 'monthly'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredJobs}
            renderItem={renderJob}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No jobs yet. Create one!</Text>
            }
          />
        </View>

        <Modal
          visible={isAddingMember}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAddingMember(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Member</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={newMemberName}
                onChangeText={setNewMemberName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={newMemberEmail}
                onChangeText={setNewMemberEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsAddingMember(false);
                    setNewMemberName('');
                    setNewMemberEmail('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={handleAddMember}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Availability Modal */}
        <Modal
          visible={isEditingAvailability}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditingAvailability(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Availability</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
                {Object.keys(selectedMember?.availability ?? {}).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDay === day && styles.selectedDayButton,
                    ]}
                    onPress={() => {
                      setSelectedDay(day as DayOfWeek);
                      setEditingTimeSlots([...(selectedMember?.availability[day as DayOfWeek] ?? [])]);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDay === day && styles.selectedDayButtonText,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.timeSlotsContainer}>
                {editingTimeSlots.map((slot: TimeSlot, index: number) => (
                  <View key={index} style={styles.timeSlotRow}>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.start}
                      onChangeText={(value) => handleUpdateTimeSlot(index, 'start', value)}
                      placeholder="HH:mm"
                    />
                    <Text style={styles.timeSlotDash}>-</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.end}
                      onChangeText={(value) => handleUpdateTimeSlot(index, 'end', value)}
                      placeholder="HH:mm"
                    />
                    <TouchableOpacity
                      style={styles.removeSlotButton}
                      onPress={() => handleRemoveTimeSlot(index)}
                    >
                      <Text style={styles.removeSlotButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addSlotButton}
                  onPress={handleAddTimeSlot}
                >
                  <Text style={styles.addSlotButtonText}>Add Time Slot</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditingAvailability(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveAvailability}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Preferences Modal */}
        <Modal
          visible={isEditingPreferences}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditingPreferences(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Job Preferences</Text>
              
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Preferred Job</Text>
                <Switch
                  value={isPreferred}
                  onValueChange={setIsPreferred}
                />
              </View>

              <TextInput
                style={styles.notesInput}
                value={preferenceNotes}
                onChangeText={setPreferenceNotes}
                placeholder="Add notes (optional)"
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditingPreferences(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSavePreferences}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  membersSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666666',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  availabilitySummary: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  preferencesSummary: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  noAvailabilityText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    flex: 1,
  },
  noPreferencesText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    flex: 1,
  },
  editLink: {
    marginLeft: 8,
  },
  editLinkText: {
    fontSize: 14,
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#666666',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#333333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  jobItem: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobRecurrence: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  jobAssignee: {
    fontSize: 14,
    color: '#666',
  },
  jobDueDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  jobLastCompleted: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  dayPicker: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  selectedDayButton: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333333',
    textTransform: 'capitalize',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  timeSlotsContainer: {
    maxHeight: 200,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  timeSlotDash: {
    marginHorizontal: 8,
    color: '#666666',
  },
  removeSlotButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSlotButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -2,
  },
  addSlotButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addSlotButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  preferenceContent: {
    marginLeft: 16,
  },
  preferenceNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editNameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginRight: 8,
  },
  memberCount: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  jobsSection: {
    padding: 16,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayContainer: {
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 16,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    marginLeft: 16,
  },
}); 