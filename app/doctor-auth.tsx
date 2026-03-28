import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const DOCTOR_PIN = '1234';

export default function DoctorAuthScreen() {
  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = 
    useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const compatible = await 
      LocalAuthentication.hasHardwareAsync();
    const enrolled = await 
      LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
    if (compatible && enrolled) {
      triggerBiometric();
    }
  };

  const triggerBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity to access patient data',
      fallbackLabel: 'Use PIN instead',
      cancelLabel: 'Cancel',
    });
    if (result.success) {
      router.replace('/doctor-dashboard' as any);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === DOCTOR_PIN) {
            router.replace('/doctor-dashboard' as any);
          } else {
            Alert.alert('Wrong PIN', 
              'Incorrect PIN. Please try again.');
            setPin('');
          }
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/role-select' as any)}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.title}>Doctor Access</Text>
        <Text style={styles.subtitle}>
          Verify your identity to view patient data
        </Text>
      </View>

      {biometricAvailable && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={triggerBiometric}
        >
          <Text style={styles.biometricIcon}>👆</Text>
          <Text style={styles.biometricText}>
            Use Biometric / Fingerprint
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.orText}>— or enter PIN —</Text>

      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              pin.length > i && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(
          (key, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.key,
              key === '' && styles.keyEmpty,
            ]}
            onPress={() => {
              if (key === '⌫') handleDelete();
              else if (key !== '') handlePinPress(key);
            }}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>Demo PIN: 1234</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2B5E',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backText: {
    color: '#1D9E75',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lockIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
  },
  biometricButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  biometricIcon: {
    fontSize: 24,
  },
  biometricText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  orText: {
    color: '#ffffff',
    opacity: 0.5,
    fontSize: 13,
    marginBottom: 24,
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.5,
  },
  pinDotFilled: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
    opacity: 1,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '80%',
    gap: 16,
    justifyContent: 'center',
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  hint: {
    color: '#ffffff',
    opacity: 0.4,
    fontSize: 12,
    marginTop: 32,
  },
});