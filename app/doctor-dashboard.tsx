import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';



export default function DoctorDashboard() {
  const [escalated, setEscalated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [surgery, setSurgery] = useState('');
  const [day, setDay] = useState('');
  const [alertSentTime, setAlertSentTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [checkin, setCheckin] = useState<{
    pain: string;
    medication: string;
    mobility: string;
    flag: boolean;
    summary: string;
  } | null>(null);
  const [wound, setWound] = useState<{
    status: string;
    confidence: string;
    reasoning: string;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [checkinDate, setCheckinDate] = useState('');
  const [woundDate, setWoundDate] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
  useCallback(() => {
    loadAllData();
    return () => {
      stopSound();
    };
  }, [])
);

  useEffect(() => {
  if (!alertSentTime || acknowledged) return;

  let slaBreachLogged = false;

  const interval = setInterval(async () => {
    const elapsed = Math.floor(
      (new Date().getTime() - alertSentTime.getTime()) / 1000
    );
    setTimeElapsed(elapsed);

    if (elapsed >= SLA_LIMIT_SECONDS && !slaBreachLogged) {
      slaBreachLogged = true;
      await AsyncStorage.setItem('alertEscalated', 'true');
      setAcknowledged(true);
      setEscalated(true);
      await stopSound();

      const breachEntry = {
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        agent: 'EscalationAgent',
        icon: '🚨',
        action: 'SLA breached — On-call doctor alerted',
        detail: `Doctor did not acknowledge within ${SLA_LIMIT_SECONDS / 60} minutes. Case escalated to on-call physician automatically.`,
      };

      const existingAudit = await AsyncStorage.getItem('auditLog');
      const auditLogData = existingAudit
        ? JSON.parse(existingAudit)
        : [];
      auditLogData.push(breachEntry);
      await AsyncStorage.setItem(
        'auditLog',
        JSON.stringify(auditLogData)
      );
      setAuditLog(auditLogData);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [alertSentTime, acknowledged]);

  useEffect(() => {
    if (isCritical && !acknowledged) {
      playAlertSound();
      repeatRef.current = setInterval(() => {
        playAlertSound();
      }, 30000);
    }

    return () => {
      if (repeatRef.current) {
        clearInterval(repeatRef.current);
      }
    };
  }, [isCritical, acknowledged]);

  const playAlertSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/alert.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Could not play alert sound:', error);
    }
  };

  const stopSound = async () => {
    try {
      if (repeatRef.current) {
        clearInterval(repeatRef.current);
        repeatRef.current = null;
      }
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log('Could not stop sound:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const SLA_LIMIT_SECONDS = 60;

  const getTimerColor = (): string => {
    if (timeElapsed >= SLA_LIMIT_SECONDS) return '#E74C3C';
    if (timeElapsed >= 90) return '#F5A623';
    return '#1D9E75';
  };

  const loadAllData = async () => {
    try {
      const audit = await AsyncStorage.getItem('auditLog');
      if (audit) setAuditLog(JSON.parse(audit));
      const name = await AsyncStorage.getItem('patientName');
      const surg = await AsyncStorage.getItem('patientSurgery');
      const d = await AsyncStorage.getItem('patientDay');
      const checkinResult = await AsyncStorage.getItem('checkinResult');
      const woundResult = await AsyncStorage.getItem('woundResult');
      const checkinHistory = await AsyncStorage.getItem('checkinHistory');
      const cDate = await AsyncStorage.getItem('checkinDate');
      const wDate = await AsyncStorage.getItem('woundDate');

      if (name) setPatientName(name);
      if (surg) setSurgery(surg);
      if (d) setDay(d);
      if (checkinHistory) setHistory(JSON.parse(checkinHistory));
      if (cDate) setCheckinDate(cDate);
      if (wDate) setWoundDate(wDate);

      const checkinData = checkinResult ? JSON.parse(checkinResult) : null;
      const woundData = woundResult ? JSON.parse(woundResult) : null;

      if (checkinData) setCheckin(checkinData);
      if (woundData) setWound(woundData);

      let score = 0;
      if (checkinData) {
        const painNumber = parseInt(checkinData.pain);
        if (!isNaN(painNumber)) score += painNumber * 5;
        if (checkinData.medication === 'Not taken') score += 20;
        if (checkinData.medication === 'Partial') score += 10;
        if (checkinData.mobility === 'Poor') score += 15;
        if (checkinData.mobility === 'Limited') score += 8;
        if (checkinData.flag) score += 20;
      }
      if (woundData) {
        if (woundData.status === 'ALERT') score += 25;
        if (woundData.status === 'MONITOR') score += 10;
      }
      score = Math.min(score, 100);

      const missedCheckin = await AsyncStorage.getItem('missedCheckin');

    const critical =
      checkinData?.flag ||
      score >= 60 ||
      woundData?.status === 'ALERT' ||
      missedCheckin === 'true';

       if (critical) {
  setIsCritical(true);

  const wasAcknowledged = await AsyncStorage.getItem('alertAcknowledged');
  const wasEscalated = await AsyncStorage.getItem('alertEscalated');

  if (wasAcknowledged === 'true') {
    setAcknowledged(true);
  } else if (wasEscalated === 'true') {
    setAcknowledged(true);
    setEscalated(true);
  } else {
    setAlertSentTime(new Date());
  }
}
  } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = () => {
    let score = 0;
    if (checkin) {
      const painNumber = parseInt(checkin.pain);
      if (!isNaN(painNumber)) score += painNumber * 5;
      if (checkin.medication === 'Not taken') score += 20;
      if (checkin.medication === 'Partial') score += 10;
      if (checkin.mobility === 'Poor') score += 15;
      if (checkin.mobility === 'Limited') score += 8;
      if (checkin.flag) score += 20;
    }
    if (wound) {
      if (wound.status === 'ALERT') score += 25;
      if (wound.status === 'MONITOR') score += 10;
    }
    return Math.min(score, 100);
  };

  const getRiskColor = (score: number): string => {
    if (score >= 60) return '#E74C3C';
    if (score >= 30) return '#F5A623';
    return '#1D9E75';
  };

  const getRiskLabel = (score: number): string => {
    if (score >= 60) return 'High Risk';
    if (score >= 30) return 'Moderate Risk';
    return 'Low Risk';
  };

  const handleAcknowledge = async () => {
    setAcknowledged(true);
    await stopSound();
    await AsyncStorage.setItem('alertAcknowledged', 'true');

    const acknowledgeEntry = {
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      agent: 'VerificationAgent',
      icon: '✅',
      action: 'Doctor acknowledgment received',
      detail: `Response time: ${formatTime(timeElapsed)}. Case accepted by Dr. Sharma.`,
    };

    const existingAudit = await AsyncStorage.getItem('auditLog');
    const auditLogData = existingAudit ? JSON.parse(existingAudit) : [];
    auditLogData.push(acknowledgeEntry);
    await AsyncStorage.setItem('auditLog', JSON.stringify(auditLogData));
    setAuditLog(auditLogData);
  };

  const handleLogout = async () => {
    await stopSound();
    router.replace('/role-select' as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={styles.loadingText}>
          Loading patient data...
        </Text>
      </View>
    );
  }

  const riskScore = calculateRiskScore();

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Command Center</Text>
        <Text style={styles.headerSub}>Dr. Sharma · Cardiology</Text>
      </View>

      {isCritical && !acknowledged && (
        <View style={styles.criticalBanner}>
          <Text style={styles.criticalIcon}>🚨</Text>
          <View style={styles.criticalText}>
            <Text style={styles.criticalTitle}>
              CRITICAL ALERT — Immediate Attention Required
            </Text>
            <Text style={styles.criticalSub}>
              {patientName} · Automatically detected by TriageAgent
            </Text>
          </View>
        </View>
      )}

      {isCritical && acknowledged && !escalated && (
  <View style={styles.acknowledgedBanner}>
    <Text style={styles.acknowledgedBannerText}>
      ✅ Alert acknowledged · Response time: {formatTime(timeElapsed)}
    </Text>
  </View>
)}

{isCritical && escalated && (
  <View style={styles.escalatedBanner}>
    <Text style={styles.escalatedBannerText}>
      🚨 SLA breached · Case transferred to on-call doctor
    </Text>
  </View>
)}

      {!isCritical && (
        <View style={styles.safeBanner}>
          <Text style={styles.safeText}>
            ✓ Patient condition stable — No critical alerts
          </Text>
        </View>
      )}

      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {patientName
                ? patientName.substring(0, 2).toUpperCase()
                : 'PT'}
            </Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {patientName || 'Patient'}
            </Text>
            <Text style={styles.patientDetail}>
              Day {day} · {surgery}
            </Text>
          </View>
          <View style={[
            styles.riskBadge,
            { backgroundColor: getRiskColor(riskScore) + '22' }
          ]}>
            <Text style={[
              styles.riskText,
              { color: getRiskColor(riskScore) }
            ]}>
              {getRiskLabel(riskScore)}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={[
              styles.metricValue,
              { color: getRiskColor(riskScore) }
            ]}>
              {riskScore}
            </Text>
            <Text style={styles.metricLabel}>Risk Score</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[
              styles.metricValue,
              parseInt(checkin?.pain || '0') > 6
                ? styles.metricWarn
                : styles.metricGood,
            ]}>
              {checkin?.pain || 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>Pain</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[
              styles.metricValue,
              checkin?.medication === 'Taken'
                ? styles.metricGood
                : styles.metricWarn,
            ]}>
              {checkin?.medication === 'Taken' ? '✓' : '✗'}
            </Text>
            <Text style={styles.metricLabel}>Medication</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {wound?.status || 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>Wound</Text>
          </View>
        </View>

        {checkin && (
          <View style={styles.reasoningBox}>
            <Text style={styles.reasoningTitle}>
              Agent Decision Trail
            </Text>
            <Text style={styles.reasoningText}>
              {checkin.summary}
            </Text>
            {wound && (
              <Text style={[styles.reasoningText, { marginTop: 8 }]}>
                Wound: {wound.reasoning}
              </Text>
            )}
          </View>
        )}

        {!checkin && !wound && (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>
              No check-in or wound data yet.
              Patient has not completed any assessments.
            </Text>
          </View>
        )}

        {alertSentTime && !acknowledged && (
  <View style={[styles.slaBox, { borderColor: getTimerColor() }]}>
    <View style={styles.slaRow}>
      <Text style={styles.slaLabel}>⏱️ Alert active</Text>
      <Text style={[styles.slaTimer, { color: getTimerColor() }]}>
        {formatTime(timeElapsed)}
      </Text>
    </View>

    {timeElapsed < SLA_LIMIT_SECONDS ? (
      <>
        <Text style={styles.slaSubtext}>
          Auto-escalate to on-call doctor in{' '}
          {formatTime(SLA_LIMIT_SECONDS - timeElapsed)}
        </Text>
        <TouchableOpacity
          style={styles.acknowledgeButton}
          onPress={handleAcknowledge}
        >
          <Text style={styles.acknowledgeText}>
            ✓ Acknowledge Alert
          </Text>
        </TouchableOpacity>
      </>
    ) : (
      <Text style={[
        styles.slaSubtext,
        { color: '#E74C3C', fontWeight: '600' }
      ]}>
        ⚠️ SLA breached — Case escalated to on-call doctor.
        No further action required.
      </Text>
    )}
  </View>
)}

      </View>

      {checkin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Latest Check-in
            {checkinDate ? ` · ${checkinDate}` : ''}
          </Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pain Level</Text>
              <Text style={styles.detailValue}>{checkin.pain}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medication</Text>
              <Text style={[
                styles.detailValue,
                checkin.medication === 'Taken'
                  ? styles.metricGood
                  : styles.metricWarn,
              ]}>
                {checkin.medication}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobility</Text>
              <Text style={styles.detailValue}>
                {checkin.mobility}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Red Flag</Text>
              <Text style={[
                styles.detailValue,
                checkin.flag ? styles.metricWarn : styles.metricGood,
              ]}>
                {checkin.flag ? '⚠️ Yes' : '✓ None'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {wound && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Wound Analysis
            {woundDate ? ` · ${woundDate}` : ''}
          </Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[
                styles.detailValue,
                wound.status === 'CLEAR'
                  ? styles.metricGood
                  : wound.status === 'ALERT'
                  ? styles.metricWarn
                  : styles.metricModerate,
              ]}>
                {wound.status}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confidence</Text>
              <Text style={styles.detailValue}>
                {wound.confidence}
              </Text>
            </View>
            <View style={styles.woundReasoning}>
              <Text style={styles.detailLabel}>
                Clinical Observation
              </Text>
              <Text style={styles.reasoningText}>
                {wound.reasoning}
              </Text>
            </View>
          </View>
        </View>
      )}

      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Check-in History ({history.length})
          </Text>
          {history.slice().reverse().map((item: any, index: number) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyTime}>
                  {item.time} · {item.date}
                </Text>
                <Text style={styles.historyPain}>
                  Pain: {item.pain} · {item.mobility}
                </Text>
              </View>
              <View style={[
                styles.historyFlag,
                { backgroundColor: item.flag ? '#FFE5E5' : '#E5F5EE' }
              ]}>
                <Text style={[
                  styles.historyFlagText,
                  { color: item.flag ? '#E74C3C' : '#1D9E75' }
                ]}>
                  {item.flag ? '⚠️' : '✓'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {auditLog.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Audit Log — Agent Activity
          </Text>
          {auditLog.slice().reverse().map((entry: any, index: number) => (
            <View key={index} style={styles.auditItem}>
              <View style={styles.auditLeft}>
                <View style={styles.auditIconBox}>
                  <Text style={styles.auditIcon}>{entry.icon}</Text>
                </View>
                <View style={styles.auditLine} />
              </View>
              <View style={styles.auditRight}>
                <View style={styles.auditHeader}>
                  <Text style={styles.auditAgent}>{entry.agent}</Text>
                  <Text style={styles.auditTime}>
                    {entry.time} · {entry.date}
                  </Text>
                </View>
                <Text style={styles.auditAction}>{entry.action}</Text>
                <Text style={styles.auditDetail}>{entry.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {auditLog.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Audit Log — Agent Activity
          </Text>
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>
              No agent activity recorded yet.
              Patient has not completed any assessments.
            </Text>
          </View>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#0D2B5E',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#0D2B5E',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 14,
    color: '#1D9E75',
    marginTop: 4,
  },
  criticalBanner: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  criticalIcon: {
    fontSize: 28,
  },
  criticalText: {
    flex: 1,
  },
  criticalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  criticalSub: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.85,
  },
  acknowledgedBanner: {
    backgroundColor: '#1D9E75',
    padding: 14,
    alignItems: 'center',
  },
  acknowledgedBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  safeBanner: {
    backgroundColor: '#E5F5EE',
    padding: 14,
    alignItems: 'center',
  },
  safeText: {
    color: '#1D9E75',
    fontSize: 13,
    fontWeight: '600',
  },
  patientCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D2B5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D2B5E',
  },
  patientDetail: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F4F6F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D2B5E',
  },
  metricGood: {
    color: '#1D9E75',
  },
  metricWarn: {
    color: '#E74C3C',
  },
  metricModerate: {
    color: '#F5A623',
  },
  metricLabel: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  reasoningBox: {
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
  },
  noDataBox: {
    backgroundColor: '#F4F6F9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  slaBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    backgroundColor: '#ffffff',
  },
  slaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slaLabel: {
    fontSize: 13,
    color: '#0D2B5E',
    fontWeight: '600',
  },
  slaTimer: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  slaSubtext: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  acknowledgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D2B5E',
    marginBottom: 8,
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    color: '#888888',
    fontSize: 14,
  },
  detailValue: {
    color: '#0D2B5E',
    fontSize: 14,
    fontWeight: '500',
  },
  woundReasoning: {
    paddingTop: 10,
    gap: 6,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  historyLeft: {
    flex: 1,
  },
  historyTime: {
    fontSize: 13,
    color: '#0D2B5E',
    fontWeight: '600',
    marginBottom: 4,
  },
  historyPain: {
    fontSize: 12,
    color: '#888888',
  },
  historyFlag: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyFlagText: {
    fontSize: 16,
  },
  auditItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  auditLeft: {
    alignItems: 'center',
    width: 36,
  },
  auditIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D2B5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditIcon: {
    fontSize: 16,
  },
  auditLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  auditRight: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  auditAgent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0D2B5E',
  },
  auditTime: {
    fontSize: 11,
    color: '#888888',
  },
  auditAction: {
    fontSize: 13,
    color: '#0D2B5E',
    fontWeight: '500',
    marginBottom: 4,
  },
  auditDetail: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
  },
  escalatedBanner: {
  backgroundColor: '#E74C3C',
  padding: 14,
  alignItems: 'center',
},
escalatedBannerText: {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: '600',
},
  logoutButton: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 12,
    marginBottom: 32,
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
});


