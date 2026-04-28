import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import apiService, { Issue, User } from '../services/api';

interface MyIssuesScreenProps {
  navigation: any;
}

const MyIssuesScreen: React.FC<MyIssuesScreenProps> = ({ navigation }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadIssues();
    }
  }, [user]);

  const loadUser = async () => {
    const currentUser = await apiService.getCurrentUser();
    setUser(currentUser);
  };

  const loadIssues = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiService.getIssues(user.id, 'citizen');
      if (response.success && response.data) {
        setIssues(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  }, [user]);

  const handleSupport = async (issueId: string) => {
    try {
      const token = await apiService.getToken();
      if (!token) {
        Alert.alert('Error', 'Please login to support issues');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/reports/${issueId}/support`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the issue in the local state
        setIssues(prev => prev.map(issue => 
          issue.id === issueId 
            ? { ...issue, supportCount: data.supportCount, hasSupported: data.hasSupported }
            : issue
        ));
      }
    } catch (error) {
      console.error('Support error:', error);
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'Reported':
        return '#3498db';
      case 'In Progress':
        return '#f39c12';
      case 'Resolved':
        return '#27ae60';
      case 'Rejected':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  const getCategoryEmoji = (category: Issue['category']) => {
    switch (category) {
      case 'Pothole':
        return '🕳️';
      case 'Drainage':
        return '💧';
      case 'Streetlight':
        return '💡';
      default:
        return '⚠️';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderIssueItem = ({ item }: { item: Issue }) => (
    <TouchableOpacity style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <View style={styles.issueTitleRow}>
          <Text style={styles.categoryEmoji}>{getCategoryEmoji(item.category)}</Text>
          <Text style={styles.issueTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.issueDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.issueFooter}>
        <Text style={styles.departmentText}>
          📋 {item.assignedDepartment}
        </Text>
        <Text style={styles.dateText}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      {/* Support/Upvote Section */}
      <View style={styles.supportSection}>
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => handleSupport(item.id)}
        >
          <Text style={styles.supportIcon}>👍</Text>
          <Text style={styles.supportCount}>{item.supportCount || 0}</Text>
        </TouchableOpacity>
        <Text style={styles.supportLabel}>Community Support</Text>
      </View>
      
      {item.adminNotes && (
        <View style={styles.adminNotesBox}>
          <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
          <Text style={styles.adminNotesText}>{item.adminNotes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Issues Reported</Text>
      <Text style={styles.emptyStateText}>
        Tap the + button to report your first civic issue
      </Text>
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => navigation.navigate('ReportIssue')}
      >
        <Text style={styles.reportButtonText}>Report Issue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Issues</Text>
        <Text style={styles.headerSubtitle}>
          {issues.length} issue{issues.length !== 1 ? 's' : ''} reported
        </Text>
      </View>

      <FlatList
        data={issues}
        renderItem={renderIssueItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={issues.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  issueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  issueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  issueDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
    lineHeight: 18,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  departmentText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  supportSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  supportIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  supportCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
  },
  supportLabel: {
    fontSize: 12,
    color: '#95a5a6',
  },
  adminNotesBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  adminNotesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 13,
    color: '#2c3e50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  reportButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  reportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyIssuesScreen;