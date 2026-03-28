import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function DoctorScreen() {

  const handleLogout = async () => {
    router.replace('/role-select' as any);
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Physician Dashboard
        </Text>
        <Text style={styles.headerSub}>
          Dr. Sharma · Cardiology
        </Text>
      </View>

      <View style={styles.alertBanner}>
        <Text style={styles.alertIcon}>⚠️</Text>
        <View>
          <Text style={styles.alertTitle}>
            1 Patient Needs Attention
          </Text>
          <Text style={styles.alertSub}>
            Anjali Sharma · High pain reported
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active Patients</Text>

      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AS</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              Anjali Sharma
            </Text>
            <Text style={styles.patientDetail}>
              Day 7 · Post Cardiac Surgery
            </Text>
          </View>
          <View style={styles.riskBadgeHigh}>
            <Text style={styles.riskTextHigh}>High Risk</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValueWarn}>72</Text>
            <Text style={styles.metricLabel}>Risk Score</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValueWarn}>8/10</Text>
            <Text style={styles.metricLabel}>Pain</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValueGood}>✓</Text>
            <Text style={styles.metricLabel}>Medication</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValueWarn}>⚠️</Text>
            <Text style={styles.metricLabel}>Wound</Text>
          </View>
        </View>

        <View style={styles.reasoningBox}>
          <Text style={styles.reasoningTitle}>
            AI Reasoning Path
          </Text>
          <Text style={styles.reasoningText}>
            Flagged: localized redness increased ~18% around
            incision edge. Pain score elevated from 4/10 to
            8/10 in last 24 hours. Medication adherence
            confirmed. Immediate review recommended.
          </Text>
        </View>

        <TouchableOpacity style={styles.alertButton}>
          <Text style={styles.alertButtonText}>
            📲 Send Alert to Patient
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={[styles.avatar, styles.avatarGreen]}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>Rahul Kumar</Text>
            <Text style={styles.patientDetail}>
              Day 14 · Post Knee Replacement
            </Text>
          </View>
          <View style={styles.riskBadgeLow}>
            <Text style={styles.riskTextLow}>Low Risk</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValueGood}>24</Text>
            <Text style={styles.metricLabel}>Risk Score</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>3/10</Text>
            <Text style={styles.metricLabel}>Pain</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValueGood}>✓</Text>
            <Text style={styles.metricLabel}>Medication</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValueGood}>✓</Text>
            <Text style={styles.metricLabel}>Wound</Text>
          </View>
        </View>

        <View style={[styles.reasoningBox, styles.reasoningGood]}>
          <Text style={[styles.reasoningTitle,
            styles.reasoningTitleGood]}>
            AI Reasoning Path
          </Text>
          <Text style={styles.reasoningText}>
            No red flags detected. Wound healing progressing
            normally. Pain levels within expected range for
            Day 14. Full medication adherence confirmed.
            Recovery on track.
          </Text>
        </View>

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
  alertBanner: {
    backgroundColor: '#FFF3CD',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  alertIcon: {
    fontSize: 24,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
  },
  alertSub: {
    fontSize: 12,
    color: '#856404',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D2B5E',
    padding: 16,
    paddingBottom: 8,
  },
  patientCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  avatarGreen: {
    backgroundColor: '#1D9E75',
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
  riskBadgeHigh: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  riskBadgeLow: {
    backgroundColor: '#E5F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  riskTextHigh: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E74C3C',
  },
  riskTextLow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D9E75',
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
  metricValueGood: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D9E75',
  },
  metricValueWarn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
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
  reasoningGood: {
    backgroundColor: '#F0FBF6',
    borderLeftColor: '#1D9E75',
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  reasoningTitleGood: {
    color: '#1D9E75',
  },
  reasoningText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#0D2B5E',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
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
