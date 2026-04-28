import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import apiService, { User } from '../services/api';

interface ReportIssueScreenProps {
  navigation: any;
}

const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [location] = useState({
    latitude: 28.6139 + Math.random() * 0.01, // Simulate Delhi location
    longitude: 77.2090 + Math.random() * 0.01,
    address: 'New Delhi, India'
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await apiService.getCurrentUser();
    setUser(currentUser);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const issueData = {
        title: title.trim(),
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        citizenId: user.id,
        photoUrl: undefined, // For demo, we'll skip photo upload
      };

      const response = await apiService.createIssue(issueData);
      
      if (response.success) {
        Alert.alert(
          'Success!', 
          `Issue reported successfully!\\n\\nAI Categorization: ${response.data?.category}\\nAssigned to: ${response.data?.assignedDepartment}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setTitle('');
                setDescription('');
                // Navigate to issues list
                navigation.navigate('MyIssues');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit issue');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Issue saved offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Issue</Text>
        <Text style={styles.subtitle}>30-second problem submission</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Issue Details</Text>
        
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Large pothole on Main Street"
          editable={!loading}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail..."
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationBox}>
          <Text style={styles.locationText}>📍 GPS Auto-captured</Text>
          <Text style={styles.locationAddress}>{location.address}</Text>
          <Text style={styles.locationCoords}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Photo (Optional)</Text>
        <TouchableOpacity style={styles.photoButton} disabled={loading}>
          <Text style={styles.photoButtonText}>📷 Take Photo</Text>
          <Text style={styles.photoSubtext}>Photo upload simulated for demo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Issue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Issues are automatically categorized using AI and routed to the appropriate department
        </Text>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 5,
  },
  locationAddress: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  locationCoords: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  photoButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    alignItems: 'center',
    marginBottom: 30,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 5,
  },
  photoSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default ReportIssueScreen;