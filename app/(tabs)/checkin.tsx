import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

const QUESTIONS = [
  {
    id: 1,
    english: 'How would you rate your pain today on a scale of 0 to 10?',
    translations: {
      'hi-IN': 'आज आप अपने दर्द को 0 से 10 के पैमाने पर कैसे आंकेंगे?',
      'ta-IN': 'இன்று உங்கள் வலியை 0 முதல் 10 வரையிலான அளவில் எவ்வாறு மதிப்பிடுவீர்கள்?',
      'bn-IN': 'আজকে আপনার ব্যথাকে ০ থেকে ১০ এর মধ্যে কত দেবেন?',
      'te-IN': 'నేడు మీ నొప్పిని 0 నుండి 10 స్కేల్‌పై ఎలా రేట్ చేస్తారు?',
      'mr-IN': 'आज तुम्ही तुमच्या वेदनांना ० ते १० च्या प्रमाणात कसे रेट कराल?',
      'en-IN': 'How would you rate your pain today on a scale of 0 to 10?',
    },
  },
  {
    id: 2,
    english: 'Have you taken all your medications today?',
    translations: {
      'hi-IN': 'क्या आपने आज अपनी सभी दवाइयां ली हैं?',
      'ta-IN': 'இன்று உங்கள் அனைத்து மருந்துகளையும் எடுத்துக்கொண்டீர்களா?',
      'bn-IN': 'আজকে কি আপনি আপনার সব ওষুধ খেয়েছেন?',
      'te-IN': 'మీరు నేడు మీ అన్ని మందులు తీసుకున్నారా?',
      'mr-IN': 'आज तुम्ही तुमची सर्व औषधे घेतली आहेत का?',
      'en-IN': 'Have you taken all your medications today?',
    },
  },
  {
    id: 3,
    english: 'How is your mobility today? Can you walk and move around?',
    translations: {
      'hi-IN': 'आज आपकी गतिशीलता कैसी है? क्या आप चल-फिर सकते हैं?',
      'ta-IN': 'இன்று உங்கள் இயக்கம் எப்படி உள்ளது? நடக்க மற்றும் நகர முடிகிறதா?',
      'bn-IN': 'আজকে আপনার চলাফেরা কেমন? হাঁটতে ও নড়াচড়া করতে পারছেন?',
      'te-IN': 'నేడు మీ కదలిక ఎలా ఉంది? నడవగలరా మరియు తిరగగలరా?',
      'mr-IN': 'आज तुमची हालचाल कशी आहे? तुम्ही चालू आणि फिरू शकता का?',
      'en-IN': 'How is your mobility today? Can you walk and move around?',
    },
  },
  {
    id: 4,
    english: 'Are you experiencing any unusual symptoms like fever, swelling, or discharge?',
    translations: {
      'hi-IN': 'क्या आपको कोई असामान्य लक्षण जैसे बुखार, सूजन या स्राव हो रहा है?',
      'ta-IN': 'காய்ச்சல், வீக்கம் அல்லது சுரப்பு போன்ற அசாதாரண அறிகுறிகள் உள்ளனவா?',
      'bn-IN': 'আপনি কি জ্বর, ফোলা বা স্রাবের মতো অস্বাভাবিক লক্ষণ অনুভব করছেন?',
      'te-IN': 'జ్వరం, వాపు లేదా స్రావం వంటి అసాధారణ లక్షణాలు అనుభవిస్తున్నారా?',
      'mr-IN': 'तुम्हाला ताप, सूज किंवा स्राव यासारखी असामान्य लक्षणे जाणवत आहेत का?',
      'en-IN': 'Are you experiencing any unusual symptoms like fever, swelling, or discharge?',
    },
  },
];

export default function CheckinScreen() {
  const [language, setLanguage] = useState({
    label: 'English',
    native: 'English',
    code: 'en-IN'
  });
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    pain: string;
    medication: string;
    mobility: string;
    flag: boolean;
    summary: string;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);

  const LANGUAGES = [
    { label: 'English', native: 'English', code: 'en-IN' },
    { label: 'Hindi', native: 'हिंदी', code: 'hi-IN' },
    { label: 'Tamil', native: 'தமிழ்', code: 'ta-IN' },
    { label: 'Bengali', native: 'বাংলা', code: 'bn-IN' },
    { label: 'Telugu', native: 'తెలుగు', code: 'te-IN' },
    { label: 'Marathi', native: 'मराठी', code: 'mr-IN' },
  ];

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('patientLanguage');
      if (saved) setLanguage(JSON.parse(saved));
    } catch (e) {
      console.log('Could not load language');
    }
  };

  const speakQuestion = (index: number, langCode: string) => {
    const q = QUESTIONS[index];
    const text = q.translations[
      langCode as keyof typeof q.translations
    ] || q.english;
    Speech.speak(text, {
      language: langCode,
      pitch: 1.0,
      rate: 0.85,
    });
  };

  const startCheckin = () => {
    if (language.code === 'en-IN') {
        beginCheckin();
        return;
    }

    Alert.alert(
        '🌐 Switch Keyboard Language',
        `You selected ${language.label}. Before we begin, please switch your keyboard to ${language.label}:\n\n1. Open any text field\n2. Hold the globe 🌐 or space bar on your keyboard\n3. Select "${language.label}"\n4. Come back and tap "Ready"\n\nThis ensures your speech is recognized in ${language.label}.`,
        [
        {
            text: 'Cancel',
            style: 'cancel',
        },
        {
            text: "Ready — Let's Begin",
            onPress: () => beginCheckin(),
        },
        ]
    );
    };

    const beginCheckin = () => {
    setStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentAnswer('');
    setResult(null);
    setTimeout(() => {
        speakQuestion(0, language.code);
        setTimeout(() => inputRef.current?.focus(), 800);
    }, 500);
    };

  const handleMicPress = () => {
    Speech.stop();
    inputRef.current?.focus();
    if (language.code !== 'en-IN') {
        Alert.alert(
        '🎙️ Speak in ' + language.label,
        'Make sure your keyboard is set to ' + language.label + '.\n\nTap the 🎙️ microphone on your keyboard and speak your answer. The text will appear automatically in ' + language.label + '.',
        [{ text: 'OK, Got it' }]
        );
    }
    };

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      Alert.alert('No answer',
        'Please type or speak your answer first');
      return;
    }

    const newAnswers = [...answers, currentAnswer.trim()];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestion < QUESTIONS.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      setTimeout(() => {
        speakQuestion(next, language.code);
        setTimeout(() => inputRef.current?.focus(), 800);
      }, 300);
    } else {
      setStarted(false);
      analyzeCheckin(newAnswers);
    }
  };

  const analyzeCheckin = async (allAnswers: string[]) => {
    setLoading(true);

    const questionsAndAnswers = QUESTIONS.map((q, i) =>
      `Q${i + 1}: ${q.english}\nA${i + 1}: ${allAnswers[i]}`
    ).join('\n\n');

    try {
      const response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY as string,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{
              role: 'user',
              content: `You are a clinical AI analyzing a post-surgical patient's daily check-in.
The patient answered in ${language.label}. Here are their responses:

${questionsAndAnswers}

Extract structured data and return ONLY this JSON with no markdown:
{
  "pain": "pain score e.g. 6/10 or Not mentioned",
  "medication": "Taken or Not taken or Partial",
  "mobility": "Good or Limited or Poor",
  "flag": true or false,
  "summary": "2-3 sentence clinical summary in English"
}
flag should be true if patient mentions fever, unusual discharge, severe pain above 7, or any alarming symptoms.
Return only the JSON, no other text.`,
            }],
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

        await AsyncStorage.setItem('checkinResult', JSON.stringify(parsed));
        await AsyncStorage.setItem('checkinDate', new Date().toLocaleDateString());
        await AsyncStorage.setItem('checkinTime', new Date().toLocaleTimeString());
        
      const checkinAuditEntry = {
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        agent: 'MonitorAgent',
        icon: '🤖',
        action: `Check-in analyzed: Pain ${parsed.pain}`,
        detail: `Medication: ${parsed.medication} · Mobility: ${parsed.mobility} · Flag: ${parsed.flag ? 'YES ⚠️' : 'None'}`,
      };

      const riskEntry = {
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        agent: 'TriageAgent',
        icon: '⚖️',
        action: `Risk score recalculated`,
        detail: `Inputs: ${parsed.pain} pain + ${parsed.flag ? 'Red flag detected' : 'No red flag'} + medication ${parsed.medication}`,
      };

      const existingAudit = await AsyncStorage.getItem('auditLog');
      const auditLog = existingAudit ? JSON.parse(existingAudit) : [];
      auditLog.push(checkinAuditEntry);
      auditLog.push(riskEntry);

      if (parsed.flag) {
        const escalationEntry = {
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        agent: 'EscalationAgent',
        icon: '🚨',
        action: 'Alert dispatched to Dr. Sharma',
        detail: 'Trigger: Red flag detected in patient check-in. Doctor notification sent.',
      };
      auditLog.push(escalationEntry);
      }

      await AsyncStorage.setItem('auditLog', JSON.stringify(auditLog));
      
        const existingHistory = await AsyncStorage.getItem('checkinHistory');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        history.push({
        ...parsed,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trimmedHistory = history.filter((item: any) => {
            const itemDate = new Date(item.date);
            return itemDate >= thirtyDaysAgo;
            });

        await AsyncStorage.setItem('checkinHistory', 
            JSON.stringify(trimmedHistory));

    } catch (error) {
      Alert.alert('Error',
        'Could not analyze check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = QUESTIONS[currentQuestion];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>

        <Text style={styles.title}>MonitorAgent</Text>

        {!started && !loading && (
          <>
            <Text style={styles.subtitle}>
              Answer 4 questions about how you feel today.
              The app will speak each question in your language.
            </Text>

            <Text style={styles.sectionLabel}>
              Select Language
            </Text>
            <View style={styles.languageGrid}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageCard,
                    language.code === lang.code &&
                      styles.languageCardSelected,
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[
                    styles.languageNative,
                    language.code === lang.code &&
                      styles.languageTextSelected,
                  ]}>
                    {lang.native}
                  </Text>
                  <Text style={[
                    styles.languageLabel,
                    language.code === lang.code &&
                      styles.languageTextSelected,
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startCheckin}
            >
              <Text style={styles.startButtonText}>
                Start Today's Check-in →
              </Text>
            </TouchableOpacity>

            {result && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>
                  Today's Summary
                </Text>

                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Pain Level</Text>
                  <Text style={styles.metricValue}>{result.pain}</Text>
                </View>

                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Medication</Text>
                  <Text style={[
                    styles.metricValue,
                    result.medication === 'Taken'
                      ? styles.metricGood
                      : styles.metricBad,
                  ]}>
                    {result.medication}
                  </Text>
                </View>

                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Mobility</Text>
                  <Text style={styles.metricValue}>{result.mobility}</Text>
                </View>

                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Red Flag</Text>
                  <Text style={[
                    styles.metricValue,
                    result.flag ? styles.metricBad : styles.metricGood,
                  ]}>
                    {result.flag ? '⚠️ Yes — Doctor Alerted' : '✓ None'}
                  </Text>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>
                    AI Clinical Summary
                  </Text>
                  <Text style={styles.summaryText}>
                    {result.summary}
                  </Text>
                </View>

                {result.flag && (
                  <View style={styles.alertBox}>
                    <Text style={styles.alertText}>
                      🚨 Concerning symptoms detected.
                      Your doctor has been notified.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {started && !loading && (
          <>
            <View style={styles.progressRow}>
              {QUESTIONS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i === currentQuestion && styles.progressDotActive,
                    i < currentQuestion && styles.progressDotDone,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.questionCount}>
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </Text>

            <View style={styles.questionCard}>
              <Text style={styles.questionEnglish}>
                {currentQ.english}
              </Text>
              {language.code !== 'en-IN' && (
                <Text style={styles.questionTranslation}>
                  {currentQ.translations[
                    language.code as keyof typeof currentQ.translations
                  ]}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.speakAgainButton}
              onPress={() => speakQuestion(currentQuestion, language.code)}
            >
              <Text style={styles.speakAgainText}>
                🔊 Speak question again
              </Text>
            </TouchableOpacity>

            <View style={styles.answerInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.answerInput}
                placeholder={'Speak or type your answer in ' + language.label + '...'}
                placeholderTextColor="#aaaaaa"
                value={currentAnswer}
                onChangeText={setCurrentAnswer}
                multiline={true}
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.micButton}
                onPress={handleMicPress}
              >
                <Text style={styles.micIcon}>🎙️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputHint}>
              Tap 🎙️ then use the mic on your keyboard to speak in {language.label}
            </Text>

            <TouchableOpacity
              style={[
                styles.nextButton,
                !currentAnswer.trim() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!currentAnswer.trim()}
            >
              <Text style={styles.nextButtonText}>
                {currentQuestion < QUESTIONS.length - 1
                  ? 'Next Question →'
                  : 'Submit Check-in →'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1D9E75" />
            <Text style={styles.loadingText}>
              Analyzing your responses...
            </Text>
            <Text style={styles.loadingSubtext}>
              Claude is reviewing your check-in
            </Text>
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
    paddingBottom: 40,
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
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D2B5E',
    marginBottom: 12,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  languageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    width: '30%',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    borderColor: '#1D9E75',
    backgroundColor: '#E5F5EE',
  },
  languageNative: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: 11,
    color: '#888888',
  },
  languageTextSelected: {
    color: '#1D9E75',
  },
  startButton: {
    backgroundColor: '#0D2B5E',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D0D0D0',
  },
  progressDotActive: {
    backgroundColor: '#1D9E75',
  },
  progressDotDone: {
    backgroundColor: '#0D2B5E',
  },
  questionCount: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#0D2B5E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionEnglish: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  questionTranslation: {
    color: '#1D9E75',
    fontSize: 15,
    lineHeight: 24,
  },
  speakAgainButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  speakAgainText: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: '600',
  },
  answerInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0D2B5E',
    elevation: 2,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  micButton: {
    backgroundColor: '#0D2B5E',
    borderRadius: 12,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 24,
  },
  inputHint: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 20,
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 48,
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    gap: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricLabel: {
    color: '#888888',
    fontSize: 14,
  },
  metricValue: {
    color: '#0D2B5E',
    fontSize: 14,
    fontWeight: '500',
  },
  metricGood: {
    color: '#1D9E75',
  },
  metricBad: {
    color: '#E74C3C',
  },
  summaryBox: {
    backgroundColor: '#F4F6F9',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 20,
  },
  alertBox: {
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  alertText: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
});
