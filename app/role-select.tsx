import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function RoleSelectScreen() {
  const [tapCount, setTapCount] = useState(0);

  const handleLogoTap = async () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 3) {
      await AsyncStorage.clear();
      setTapCount(0);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogoTap}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>
          Select your role to continue
        </Text>
      </View>

      <View style={styles.cardsContainer}>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.replace('/patient-login' as any)}
        >
          <Text style={styles.roleIcon}>🧑🏻‍🦽</Text>
          <Text style={styles.roleName}>I am a Patient</Text>
          <Text style={styles.roleDesc}>
            Track your recovery, scan prescriptions,
            monitor your wound and do daily check-ins
          </Text>
          <View style={styles.roleButton}>
            <Text style={styles.roleButtonText}>
              Continue as Patient →
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, styles.doctorCard]}
          onPress={() => router.replace('/doctor-auth' as any)}
        >
          <Text style={styles.roleIcon}>👨‍⚕️</Text>
          <Text style={[styles.roleName, styles.textWhite]}>
            I am a Doctor
          </Text>
          <Text style={[styles.roleDesc, styles.textWhiteOpacity]}>
            View patient recovery data, AI analysis,
            risk scores and send alerts
          </Text>
          <View style={styles.doctorButton}>
            <Text style={styles.roleButtonText}>
              Continue as Doctor →
            </Text>
          </View>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 16,
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
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
  },
  doctorCard: {
    backgroundColor: '#0D2B5E',
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 8,
  },
  textWhite: {
    color: '#ffffff',
  },
  roleDesc: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 22,
    marginBottom: 20,
  },
  textWhiteOpacity: {
    color: '#ffffff',
    opacity: 0.7,
  },
  roleButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  doctorButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  roleButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});