import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

interface Medication {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  timing: string;
}

interface PrescriptionResult {
  medications: Medication[];
  doctorNotes: string;
}

export default function PrescriptionScreen() {
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission needed', 
        'Please allow access to your photo library');
      return;
    }

    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (!image.canceled && image.assets[0].base64) {
      await analyzePrescription(image.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission needed', 
        'Please allow access to your camera');
      return;
    }

    const image = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (!image.canceled && image.assets[0].base64) {
      await analyzePrescription(image.assets[0].base64);
    }
  };

  const analyzePrescription = async (base64Image: string) => {
    setLoading(true);
    setResult(null);

    try {
      if (!ANTHROPIC_KEY) {
        Alert.alert('Configuration Error', 'API key is not configured');
        setLoading(false);
        return;
      }

      console.log('Starting API call...');
      console.log('API Key exists:', !!ANTHROPIC_KEY);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
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
                      text: `You are a medical OCR system analyzing a handwritten prescription.
                      For every field, provide the value in both English and the original language of the prescription.
                      Format bilingual values like this: "English translation (original language text)".
                      If the prescription is already in English, just show English.
                      Extract all medications and return ONLY a JSON object in this exact format:
                      {
                        "medications": [
                          {
                            "name": "medication name",
                            "dose": "dosage amount",
                            "frequency": "how many times per day",
                            "duration": "how many days",
                            "timing": "before/after food etc"
                          }
                        ],
                      "doctorNotes": "any additional notes from doctor"
                    }
                  Return only the JSON, no other text.`,
                },
              ],
            },
          ],
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data));
      
      const text = data.content[0].text;
      console.log('Claude text:', text);

      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);

    } catch (error) {
          console.log('CATCH ERROR:', JSON.stringify(error));
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Prescription error:', errorMessage);
          Alert.alert('Error', 'Failed to analyze prescription. Please try again.');
        } finally {
          setLoading(false);
        }
      };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <Text style={styles.title}>PrescriptionAgent</Text>
        <Text style={styles.subtitle}>
          AI-powered OCR that reads handwritten prescriptions 
          and generates a structured medication schedule
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1D9E75" />
            <Text style={styles.loadingText}>
              Reading your prescription...
            </Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              Medications Found ({result.medications.length})
            </Text>

            {result.medications.map((med, index) => (
              <View key={index} style={styles.medCard}>
                <Text style={styles.medName}>{med.name}</Text>
                <View style={styles.medRow}>
                  <Text style={styles.medLabel}>Dose</Text>
                  <Text style={styles.medValue}>{med.dose}</Text>
                </View>
                <View style={styles.medRow}>
                  <Text style={styles.medLabel}>Frequency</Text>
                  <Text style={styles.medValue}>{med.frequency}</Text>
                </View>
                <View style={styles.medRow}>
                  <Text style={styles.medLabel}>Duration</Text>
                  <Text style={styles.medValue}>{med.duration}</Text>
                </View>
                <View style={styles.medRow}>
                  <Text style={styles.medLabel}>Timing</Text>
                  <Text style={styles.medValue}>{med.timing}</Text>
                </View>
              </View>
            ))}

            {result.doctorNotes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Doctor's Notes</Text>
                <Text style={styles.notesText}>{result.doctorNotes}</Text>
              </View>
            ) : null}

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
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: '#0D2B5E',
    fontSize: 14,
    fontWeight: '600',
  },
  resultBox: {
    gap: 12,
  },
  resultTitle: {
    color: '#0D2B5E',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  medCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    elevation: 2,
  },
  medName: {
    color: '#0D2B5E',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  medLabel: {
    color: '#888888',
    fontSize: 13,
  },
  medValue: {
    color: '#0D2B5E',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  notesBox: {
    backgroundColor: '#E5F5EE',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  notesTitle: {
    color: '#0D2B5E',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  notesText: {
    color: '#444444',
    fontSize: 13,
    lineHeight: 20,
  },
});