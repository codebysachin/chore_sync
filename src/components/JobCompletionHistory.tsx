import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { format } from 'date-fns';
import { Job, CompletionRecord } from '../types';
import { loadState, saveState } from '../utils/storage';

interface Props {
  job: Job;
  onComplete: () => void;
}

export const JobCompletionHistory: React.FC<Props> = ({ job, onComplete }) => {
  const [completionHistory, setCompletionHistory] = React.useState<CompletionRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadCompletionHistory();
  }, [job.id]);

  const loadCompletionHistory = async () => {
    try {
      const state = await loadState();
      const history = state.completionHistory?.filter(
        (record: CompletionRecord) => record.jobId === job.id
      ) || [];
      setCompletionHistory(history.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load completion history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const state = await loadState();
      const newRecord: CompletionRecord = {
        id: Date.now().toString(),
        jobId: job.id,
        completedAt: new Date().toISOString(),
        completedBy: job.assignedTo,
      };

      const updatedHistory = [
        ...(state.completionHistory || []),
        newRecord,
      ];

      await saveState({
        ...state,
        completionHistory: updatedHistory,
      });

      setCompletionHistory([newRecord, ...completionHistory]);
      onComplete();
    } catch (error) {
      console.error('Failed to mark job as complete:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Completion History</Text>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleMarkComplete}
        >
          <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.historyList}>
        {completionHistory.length === 0 ? (
          <Text style={styles.emptyText}>No completion history yet</Text>
        ) : (
          completionHistory.map((record) => (
            <View key={record.id} style={styles.historyItem}>
              <Text style={styles.dateText}>
                {format(new Date(record.completedAt), 'MMMM d, yyyy')}
              </Text>
              <Text style={styles.timeText}>
                {format(new Date(record.completedAt), 'h:mm a')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  completeButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#666666',
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 15,
    color: '#000000',
  },
  timeText: {
    fontSize: 15,
    color: '#666666',
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
}); 