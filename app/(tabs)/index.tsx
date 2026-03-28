import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const [missedCheckin, setMissedCheckin] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{
  pain: string;
  medication: string;
  flag: boolean;
} | null>(null);
const [checkinDate, setCheckinDate] = useState('');
const [riskScore, setRiskScore] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [surgery, setSurgery] = useState('');
  const [day, setDay] = useState('1');
  const [tapCount, setTapCount] = useState(0);

useFocusEffect(
  useCallback(() => {
    loadPatientData();
    checkMissedCheckin();
  }, [])
);

  const loadPatientData = async () => {
  const name = await AsyncStorage.getItem('patientName');
  const surg = await AsyncStorage.getItem('patientSurgery');
  const d = await AsyncStorage.getItem('patientDay');
  const checkin = await AsyncStorage.getItem('checkinResult');
  const cDate = await AsyncStorage.getItem('checkinDate');
  const woundResult = await AsyncStorage.getItem('woundResult');

  if (name) setPatientName(name);
  if (surg) setSurgery(surg);
  if (d) setDay(d);
  if (cDate) setCheckinDate(cDate);

  if (checkin) {
    const parsed = JSON.parse(checkin);
    setCheckinResult(parsed);

    const wound = woundResult ? JSON.parse(woundResult) : null;

    let score = 0;
    const painNumber = parseInt(parsed.pain);
    if (!isNaN(painNumber)) score += painNumber * 5;
    if (parsed.medication === 'Not taken') score += 20;
    if (parsed.medication === 'Partial') score += 10;
    if (parsed.mobility === 'Poor') score += 15;
    if (parsed.mobility === 'Limited') score += 8;
    if (parsed.flag) score += 20;
    if (wound?.status === 'ALERT') score += 25;
    if (wound?.status === 'MONITOR') score += 10;
    setRiskScore(Math.min(score, 100));
  }
};

  const handleLogoTap = async () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 3) {
      await AsyncStorage.clear();
      setTapCount(0);
      router.replace('/role-select' as any);
    }
  };

  const handleLogout = async () => {
  await AsyncStorage.removeItem('userRole');
  router.replace('/role-select' as any);
  };

  const DEMO_MODE = true;
// Production note: In production, missed check-in detection
// runs as a server-side scheduled job at 8 PM daily.
// It queries the patient database and flags anyone who hasn't
// checked in — regardless of app usage. DEMO_MODE simulates
// this with a 2-minute window for demonstration purposes.
const CHECKIN_WINDOW_MINUTES = 2;

const checkMissedCheckin = async () => {
   if (!DEMO_MODE) {
    // Production: this logic runs server-side
    // Server checks daily at 8 PM if patient checked in
    // and writes missedCheckin flag to database
    // App just reads the flag — no client-side detection needed
    return;
  }
  try {
    const lastCheckinDate = await AsyncStorage.getItem('checkinDate');
    const lastCheckinTime = await AsyncStorage.getItem('checkinTime');
    const today = new Date().toLocaleDateString();
    const now = new Date();

    let isMissed = false;

    if (!lastCheckinDate) {
      isMissed = true;
    } else if (lastCheckinDate !== today) {
      isMissed = true;
    } else if (lastCheckinTime) {
      const lastCheckin = new Date();
      const [hours, minutes, seconds] = lastCheckinTime.split(':');
      lastCheckin.setHours(
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
      const minutesSince = Math.floor(
        (now.getTime() - lastCheckin.getTime()) / 60000
      );
      if (minutesSince > CHECKIN_WINDOW_MINUTES) {
        isMissed = true;
      }
    }

    if (isMissed) {
      const existingAudit = await AsyncStorage.getItem('auditLog');
      const auditLog = existingAudit ? JSON.parse(existingAudit) : [];

      const alreadyLogged = auditLog.some(
        (entry: any) =>
          entry.agent === 'RetryAgent' &&
          entry.date === today
      );

      if (!alreadyLogged) {
        const timestamp = now.toLocaleTimeString();

        auditLog.push({
          time: timestamp,
          date: today,
          agent: 'MonitorAgent',
          icon: '⚠️',
          action: 'Missed check-in detected',
          detail: `Patient has not completed check-in within ${CHECKIN_WINDOW_MINUTES} minute${CHECKIN_WINDOW_MINUTES > 1 ? 's' : ''}. Initiating retry protocol.`,
        });

        auditLog.push({
          time: timestamp,
          date: today,
          agent: 'RetryAgent',
          icon: '🔄',
          action: 'SMS fallback attempted',
          detail: 'Automated reminder sent to patient via SMS. Awaiting response within 60 seconds.',
        });

        auditLog.push({
          time: timestamp,
          date: today,
          agent: 'EscalationAgent',
          icon: '🚨',
          action: 'No response — Doctor alerted automatically',
          detail: 'Patient failed to respond to SMS retry. Dr. Sharma notified automatically by EscalationAgent.',
        });

        await AsyncStorage.setItem(
          'auditLog',
          JSON.stringify(auditLog)
        );
        await AsyncStorage.setItem('missedCheckin', 'true');
      }

      setMissedCheckin(true);
    } else {
      setMissedCheckin(false);
      await AsyncStorage.setItem('missedCheckin', 'false');
    }
  } catch (error) {
    console.log('Error checking missed check-in:', error);
  }
};

  const recoveryPercent = Math.min(
    Math.round((parseInt(day) / 30) * 100), 100
  );

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>
            {patientName || 'Patient'} 👋
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogoTap}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.headerLogo}
          />
        </TouchableOpacity>
      </View>

      {missedCheckin && (
  <View style={styles.missedBanner}>
    <Text style={styles.missedIcon}>🔄</Text>
    <View style={styles.missedText}>
      <Text style={styles.missedTitle}>
        RetryAgent — Missed Check-in
      </Text>
      <Text style={styles.missedSub}>
        You haven't checked in recently.
        Your doctor has been automatically notified.
        Please complete your check-in now.
      </Text>
    </View>
  </View>
)}

      <View style={styles.recoveryCard}>
        <Text style={styles.recoveryLabel}>
          Recovery Progress
        </Text>
        <Text style={styles.recoveryDay}>Day {day}</Text>
        <Text style={styles.recoverySurgery}>
          {surgery || 'Recovery'}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, 
            { width: `${recoveryPercent}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>
          {recoveryPercent}% recovered
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.cardGrid}>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/(tabs)/prescription')}
        >
          <Text style={styles.cardIcon}>💊</Text>
          <Text style={styles.cardTitle}>PrescriptionAgent</Text>
          <Text style={styles.cardSubtitle}>
            OCR · Medication schedule
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/(tabs)/wound')}
        >
          <Text style={styles.cardIcon}>🩹</Text>
          <Text style={styles.cardTitle}>DiagnosticAgent</Text>
          <Text style={styles.cardSubtitle}>
            Vision AI · Infection detection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/(tabs)/checkin')}
        >
          <Text style={styles.cardIcon}>🎙️</Text>
          <Text style={styles.cardTitle}>MonitorAgent</Text>
          <Text style={styles.cardSubtitle}>
            Multilingual · Daily vitals
          </Text>
        </TouchableOpacity>

      </View>
<View style={styles.statusCard}>
  <Text style={styles.statusTitle}>Today's Status</Text>

  {checkinResult ? (
    <>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Pain Level</Text>
        <Text style={[
          styles.statusValue,
          parseInt(checkinResult.pain) > 6
            ? styles.statusBad
            : styles.statusGood
        ]}>
          {checkinResult.pain}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Medication</Text>
        <Text style={[
          styles.statusValue,
          checkinResult.medication === 'Taken'
            ? styles.statusGood
            : styles.statusBad
        ]}>
          {checkinResult.medication === 'Taken'
            ? '✓ Taken'
            : '✗ ' + checkinResult.medication}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Last Check-in</Text>
        <Text style={styles.statusValue}>
          {checkinDate || 'Today'}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Risk Score</Text>
        <Text style={[
          styles.statusValue,
          riskScore !== null && riskScore >= 60
            ? styles.statusBad
            : riskScore !== null && riskScore >= 30
            ? styles.statusWarn
            : styles.statusGood
        ]}>
          {riskScore !== null
            ? `${riskScore >= 60
                ? 'High'
                : riskScore >= 30
                ? 'Moderate'
                : 'Low'} — ${riskScore}/100`
            : 'N/A'}
        </Text>
      </View>

      {checkinResult.flag && (
        <View style={styles.flagBox}>
          <Text style={styles.flagText}>
            ⚠️ Red flag detected — Doctor has been notified
          </Text>
        </View>
      )}
    </>
  ) : (
    <View style={styles.noCheckinBox}>
      <Text style={styles.noCheckinText}>
        No check-in completed today.
        Tap MonitorAgent to get started.
      </Text>
    </View>
  )}

</View>
        
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
      <Text style={styles.logoutText}>← Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  welcome: {
    fontSize: 14,
    color: '#888888',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D2B5E',
  },
  headerLogo: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  recoveryCard: {
    backgroundColor: '#0D2B5E',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  recoveryLabel: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 4,
  },
  recoveryDay: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  recoverySurgery: {
    color: '#1D9E75',
    fontSize: 14,
    marginBottom: 16,
  },
  progressBar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    height: 8,
    marginBottom: 6,
  },
  progressFill: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    height: 8,
  },
  progressText: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D2B5E',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    elevation: 3,
  },
 
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
 
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    color: '#888888',
    fontSize: 14,
  },
  statusValue: {
    color: '#0D2B5E',
    fontSize: 14,
    fontWeight: '500',
  },
  statusGood: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 12,
    marginBottom: 32,
  },

  missedBanner: {
    backgroundColor: '#FFF3CD',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
    elevation: 2,
  },
  missedIcon: {
    fontSize: 24,
  },
  missedText: {
    flex: 1,
  },
  missedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  missedSub: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  
  statusBad: {
  color: '#E74C3C',
  fontSize: 14,
  fontWeight: '500',
},
statusWarn: {
  color: '#F5A623',
  fontSize: 14,
  fontWeight: '500',
},
flagBox: {
  backgroundColor: '#FFE5E5',
  borderRadius: 10,
  padding: 12,
  marginTop: 8,
},
flagText: {
  color: '#E74C3C',
  fontSize: 12,
  fontWeight: '600',
  textAlign: 'center',
},
noCheckinBox: {
  paddingVertical: 12,
  alignItems: 'center',
},
noCheckinText: {
  color: '#888888',
  fontSize: 13,
  textAlign: 'center',
  lineHeight: 20,
},
  logoutText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
});