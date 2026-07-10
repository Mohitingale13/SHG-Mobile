import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { apiGet } from '@/lib/api';

export default function MigrationSuccess() {
  const { t } = useLanguage();
  const { group } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (group?.groupId) {
      fetchDetails();
    }
  }, [group?.groupId]);

  const fetchDetails = async () => {
    try {
      const ws = await apiGet(`/api/groups/${group?.groupId}/migration-workspace`);
      const [members, loans, bankLoans] = await Promise.all([
        apiGet(`/api/migration-workspace/${(ws as any).id}/members`),
        apiGet(`/api/migration-workspace/${(ws as any).id}/loans`),
        apiGet(`/api/migration-workspace/${(ws as any).id}/bank-loans`)
      ]);
      setData({
        workspace: ws,
        membersCount: (members as any[]).length,
        loansCount: (loans as any[]).length,
        bankLoansCount: (bankLoans as any[]).length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const ws = data?.workspace || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={100} color="#22c55e" />
      </View>
      <Text style={styles.title}>{t("migration.success_title") || "Migration Completed"}</Text>
      <Text style={styles.desc}>{t("migration.success_desc") || "Your SHG has been successfully migrated to the digital platform. You can now use all features normally."}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("migration.completion_summary") || "Completion Summary"}</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.completion_date") || "Completion Date"}:</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.imported_members") || "Imported Members"}:</Text>
          <Text style={styles.value}>{data?.membersCount || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.imported_loans") || "Imported Internal Loans"}:</Text>
          <Text style={styles.value}>{data?.loansCount || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.imported_bank_loans") || "Imported Bank Loans"}:</Text>
          <Text style={styles.value}>{data?.bankLoansCount || 0}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("migration.opening_snapshot") || "Opening Snapshot"}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.cash_in_hand") || "Cash in Hand"}:</Text>
          <Text style={styles.value}>₹{ws.cashInHand || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.bank_balance") || "Bank Balance"}:</Text>
          <Text style={styles.value}>₹{ws.bankBalance || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("migration.total_savings") || "Total Savings"}:</Text>
          <Text style={styles.value}>₹{ws.totalSavings || 0}</Text>
        </View>
      </View>
      
      <Pressable style={styles.btn} onPress={() => router.replace("/")}>
        <Text style={styles.btnText}>{t("migration.go_to_dashboard") || "Go to Dashboard"}</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnSecondary]} disabled={true}>
        <Text style={styles.btnSecondaryText}>{t("migration.historical_entry") || "Historical Entry"} ({t("common.coming_soon") || "Coming Soon"})</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  iconContainer: { marginBottom: 20, alignItems: 'center', marginTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 15, textAlign: 'center' },
  desc: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 14, color: '#475569' },
  value: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  btn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  btnSecondary: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  btnSecondaryText: { color: '#64748b', fontSize: 16, fontWeight: '600' }
});
