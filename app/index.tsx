import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SplashScreen() {

  const handleGetStarted = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const patientName = await AsyncStorage.getItem('patientName');

      if (role === 'patient' && patientName) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/role-select' as any);
      }
    } catch (error) {
      router.replace('/role-select' as any);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>

        <View style={styles.topSection}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Wellora</Text>
          <Text style={styles.quote}>Care that stays with you</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.tagline}>
            Your AI-powered recovery companion
          </Text>
          <Text style={styles.description}>
            Smart post-discharge care for faster,
            safer recovery
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Get Started →</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  quote: {
    fontSize: 16,
    color: '#ffffff',
    fontStyle: 'italic',
    opacity: 0.9,
    marginTop: 8,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#1D9E75',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
