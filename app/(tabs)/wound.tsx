import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function WoundScreen() {
    const [result, setResult] = useState<{
        status: string;
        confidence: string;
        reasoning: string;
        signs: {
        redness: boolean;
        swelling: boolean;
        discharge: boolean;
        dehiscence: boolean;
        };
    } | null>(null);

    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    if (status === 'CLEAR') return '#1D9E75';
    if (status === 'MONITOR') return '#F5A623';
    if (status === 'ALERT') return '#E74C3C';
    return '#0D2B5E';
  };

  const getStatusBackground = (status: string) => {
    if (status === 'CLEAR') return '#E5F5EE';
    if (status === 'MONITOR') return '#FFF8E7';
    if (status === 'ALERT') return '#FFE5E5';
    return '#F4F6F9';
  };

  const getStatusEmoji = (status: string) => {
    if (status === 'CLEAR') return '✅';
    if (status === 'MONITOR') return '⚠️';
    if (status === 'ALERT') return '🚨';
    return '🔍';
  };

  const takePhoto = async () => {
    const permission = 
      await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed',
        'Please allow camera access');
      return;
    }
    const image = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (!image.canceled) {
      setPhoto(image.assets[0].uri);
      if (image.assets[0].base64) {
        await analyzeWound(image.assets[0].base64);
      }
    }
  };

  const pickImage = async () => {
    const permission = 
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed',
        'Please allow photo library access');
      return;
    }
    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });
    if (!image.canceled) {
      setPhoto(image.assets[0].uri);
      if (image.assets[0].base64) {
        await analyzeWound(image.assets[0].base64);
      }
    }
  };

  const analyzeWound = async (base64Image: string) => {
    setLoading(true);
    setResult(null);

    if (!ANTHROPIC_KEY) {
      Alert.alert('Error', 'API key not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/jpeg',
                      data: base64Image,
                    },
                  },
                  {
                    type: 'text',
                    text: `You are a clinical wound assessment AI analyzing a post-surgical wound photo.
                    Assess the wound for signs of infection or complications.
                    Return ONLY a JSON object in this exact format with no markdown:
                    {
                    "status": "CLEAR or MONITOR or ALERT",
                    "confidence": "percentage as string e.g. 85%",
                    "reasoning": "2-3 sentence clinical explanation of what you see",
                    "signs": {
                        "redness": true or false,
                        "swelling": true or false,
                        "discharge": true or false,
                        "dehiscence": true or false
                    }
                    }
                    CLEAR = no signs of infection, healing normally.
                    MONITOR = minor concerns, watch closely.
                    ALERT = clear signs of infection, immediate attention needed.
                    Return only the JSON, no other text.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const text = data.content[0].text;
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);

      await AsyncStorage.setItem(
        'woundResult',
        JSON.stringify(parsed)
      );
      await AsyncStorage.setItem(
        'woundDate',
        new Date().toLocaleDateString()
      );
      
      const woundAuditEntry = {
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        agent: 'DiagnosticAgent',
        icon: '🔍',
        action: `Wound assessed: ${parsed.status}`,
        detail: `Confidence: ${parsed.confidence} · ${parsed.reasoning.substring(0, 60)}...`,
      };

      const existingAudit = await AsyncStorage.getItem('auditLog');
      const auditLog = existingAudit ? JSON.parse(existingAudit) : [];
      auditLog.push(woundAuditEntry);
      await AsyncStorage.setItem('auditLog', JSON.stringify(auditLog));

    } catch (error) {
      console.log('Wound analysis error:', error);
      Alert.alert('Error',
        'Could not analyze wound. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <Text style={styles.title}>DiagnosticAgent</Text>
        <Text style={styles.subtitle}>
          Vision AI that detects infection signs with 
          clinical-grade accuracy and full reasoning trail
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={takePhoto}
          >
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={pickImage}
          >
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        {photo && !loading && (
          <Image
            source={{ uri: photo }}
            style={styles.photoPreview}
          />
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1D9E75" />
            <Text style={styles.loadingText}>
              Analyzing wound...
            </Text>
            <Text style={styles.loadingSubtext}>
              Claude is assessing for infection signs
            </Text>
          </View>
        )}

        {result && (
          <View style={[
            styles.resultBox,
            { backgroundColor: getStatusBackground(result.status) }
          ]}>

            <View style={styles.statusRow}>
              <Text style={styles.statusEmoji}>
                {getStatusEmoji(result.status)}
              </Text>
              <View>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(result.status) }
                ]}>
                  {result.status}
                </Text>
                <Text style={styles.confidenceText}>
                  Confidence: {result.confidence}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.reasoningTitle}>
              AI Reasoning Path
            </Text>
            <Text style={styles.reasoningText}>
              {result.reasoning}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.signsTitle}>
              Clinical Signs Detected
            </Text>
            <View style={styles.signsGrid}>
              <View style={styles.signItem}>
                <Text style={styles.signIcon}>
                  {result.signs.redness ? '🔴' : '⚪'}
                </Text>
                <Text style={styles.signLabel}>Redness</Text>
              </View>
              <View style={styles.signItem}>
                <Text style={styles.signIcon}>
                  {result.signs.swelling ? '🔴' : '⚪'}
                </Text>
                <Text style={styles.signLabel}>Swelling</Text>
              </View>
              <View style={styles.signItem}>
                <Text style={styles.signIcon}>
                  {result.signs.discharge ? '🔴' : '⚪'}
                </Text>
                <Text style={styles.signLabel}>Discharge</Text>
              </View>
              <View style={styles.signItem}>
                <Text style={styles.signIcon}>
                  {result.signs.dehiscence ? '🔴' : '⚪'}
                </Text>
                <Text style={styles.signLabel}>Dehiscence</Text>
              </View>
            </View>

            {result.status === 'ALERT' && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  🚨 Your doctor has been notified.
                  Please seek immediate medical attention.
                </Text>
              </View>
            )}

          </View>
        )}

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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 32,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    backgroundColor: '#0D2B5E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    resizeMode: 'cover',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: '#0D2B5E',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#888888',
    fontSize: 13,
  },
  resultBox: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusEmoji: {
    fontSize: 48,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 4,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 22,
  },
  signsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 8,
  },
  signsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signItem: {
    alignItems: 'center',
    gap: 4,
  },
  signIcon: {
    fontSize: 24,
  },
  signLabel: {
    fontSize: 11,
    color: '#888888',
  },
  alertBox: {
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  alertText: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
});