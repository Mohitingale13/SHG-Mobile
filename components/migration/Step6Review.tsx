import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { apiGet } from '@/lib/api';

export default function Step6Review({ workspace, onNext, saving, onBack }: { workspace: any, onNext: () => void, saving: boolean, onBack: () => void }) {
  const { t } = useLanguage();
  
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [bankLoans, setBankLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [workspace.id]);

  const fetchData = async () => {
    try {
      const [membersData, loansData, bankLoansData] = await Promise.all([
        (apiGet(`/api/migration-workspace/${workspace.id}/members`) as Promise<any[]>),
        (apiGet(`/api/migration-workspace/${workspace.id}/loans`) as Promise<any[]>),
        (apiGet(`/api/migration-workspace/${workspace.id}/bank-loans`) as Promise<any[]>)
      ]);
      setMembers(membersData);
      setLoans(loansData);
      setBankLoans(bankLoansData);
      
      const newWarnings: string[] = [];
      
      // Duplicates check
      const resolutionNos = loansData.map((l:any) => l.resolutionNo);
      if (new Set(resolutionNos).size !== resolutionNos.length) {
        newWarnings.push(t("migration.warning_duplicate_res") || "Duplicate Resolution Numbers found in internal loans.");
      }
      
      const sanctionNos = bankLoansData.map((l:any) => l.sanctionNo);
      if (new Set(sanctionNos).size !== sanctionNos.length) {
        newWarnings.push(t("migration.warning_duplicate_sanction") || "Duplicate Sanction Numbers found in bank loans.");
      }
      
      // Values check
      if (workspace.cashInHand < 0 || workspace.bankBalance < 0) {
        newWarnings.push(t("migration.warning_negative_balance") || "Opening balances cannot be negative.");
      }
      
      loansData.forEach((l:any) => {
        if (l.remainingMonths > l.durationMonths) {
          newWarnings.push(`${t("loan.remaining_months")} > ${t("loan.duration")} for loan ${l.resolutionNo}`);
        }
      });
      
      setWarnings(newWarnings);
    } catch (e) {
      Alert.alert(t("common.error"), "Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  const SummaryItem = ({ label, value }: { label: string, value: string | number }) => (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.desc}>{t("migration.review_desc") || "Please review all entered data. The migration is not finalized yet."}</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            {warnings.length > 0 && (
              <View style={styles.warningBox}>
                <View style={styles.warningHeader}>
                  <Ionicons name="warning" size={20} color="#ca8a04" />
                  <Text style={styles.warningTitle}>{t("migration.warnings") || "Validation Warnings"}</Text>
                </View>
                {warnings.map((w, i) => (
                  <Text key={i} style={styles.warningText}>• {w}</Text>
                ))}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("migration.step2_snapshot") || "Opening Snapshot"}</Text>
              <SummaryItem label={t("migration.cash_in_hand") || "Cash"} value={`₹${workspace.cashInHand}`} />
              <SummaryItem label={t("migration.bank_balance") || "Bank"} value={`₹${workspace.bankBalance}`} />
              <SummaryItem label={t("migration.total_savings") || "Savings"} value={`₹${workspace.totalSavings}`} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("migration.step3_members") || "Members"}</Text>
              <SummaryItem label={t("migration.total_members") || "Total Members"} value={members.length} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("migration.step4_loans") || "Internal Loans"}</Text>
              <SummaryItem label={t("migration.active_loans") || "Active Loans"} value={loans.length} />
              <SummaryItem label={t("migration.total_principal") || "Total Outstanding"} value={`₹${loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0)}`} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("migration.step5_bank_loans") || "Bank Loans"}</Text>
              <SummaryItem label={t("migration.active_bank_loans") || "Active Bank Loans"} value={bankLoans.length} />
              <SummaryItem label={t("migration.total_principal") || "Total Outstanding"} value={`₹${bankLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0)}`} />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.backBtn} onPress={onBack} disabled={saving}>
          <Text style={styles.backBtnText}>{t("common.back") || "Back"}</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={onNext} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>{t("migration.step7_finish") || "Finish"}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepIndicator: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  desc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 20 },
  warningBox: { backgroundColor: '#fefce8', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#fef08a', marginBottom: 20 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warningTitle: { fontSize: 16, fontWeight: '700', color: '#854d0e' },
  warningText: { color: '#a16207', fontSize: 14, marginBottom: 4, marginLeft: 8 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 15, color: '#475569' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', gap: 15 },
  backBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  backBtnText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  nextBtn: { flex: 2, backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
