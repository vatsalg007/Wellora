import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


export default function PatientLoginScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [surgery, setSurgery] = useState('');
  const [day, setDay] = useState('');

  const handleContinue = async () => {
    if (!name || !age || !surgery || !day) {
      Alert.alert('Missing Info',
        'Please fill in all fields to continue');
      return;
    }

    try {
      await AsyncStorage.setItem('userRole', 'patient');
      await AsyncStorage.setItem('patientName', name);
      await AsyncStorage.setItem('patientAge', age);
      await AsyncStorage.setItem('patientSurgery', surgery);
      await AsyncStorage.setItem('patientDay', day);
      router.replace('/(tabs)' as any);
    } catch (error) {
      Alert.alert('Error', 'Could not save your details');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/role-select' as any)}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Patient Details</Text>
        <Text style={styles.subtitle}>
          Tell us about yourself so we can personalize
          your recovery plan
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Anjali Sharma"
            placeholderTextColor="#aaaaaa"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 45"
            placeholderTextColor="#aaaaaa"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Surgery / Condition</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Post Cardiac Surgery"
            placeholderTextColor="#aaaaaa"
            value={surgery}
            onChangeText={setSurgery}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recovery Day</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 7"
            placeholderTextColor="#aaaaaa"
            value={day}
            onChangeText={setDay}
            keyboardType="numeric"
          />
        </View>

        
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>
            Start My Recovery →
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  inner: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#1D9E75',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D2B5E',
    marginBottom: 8,
  },
  
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0D2B5E',
    elevation: 2,
  },

  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});