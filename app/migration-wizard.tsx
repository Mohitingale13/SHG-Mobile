import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

import Step1Group from '@/components/migration/Step1Group';
import Step2Snapshot from '@/components/migration/Step2Snapshot';
import Step3Members from '@/components/migration/Step3Members';
import Step4Loans from '@/components/migration/Step4Loans';
import Step5BankLoans from '@/components/migration/Step5BankLoans';
import Step6Review from '@/components/migration/Step6Review';

export default function MigrationWizard() {
  const insets = useSafeAreaInsets();
  const { group } = useAuth();
  const { t } = useLanguage();
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (group?.groupId) {
      loadOrCreateWorkspace();
    }
  }, [group?.groupId]);

  const loadOrCreateWorkspace = async () => {
    try {
      let data = (await apiGet(`/api/groups/${group?.groupId}/migration-workspace`)) as any;
      if (!data) {
        data = (await apiPost(`/api/groups/${group?.groupId}/migration-workspace`, {})) as any;
      }
      setWorkspace(data);
      setStep(data.currentStep || 1);
    } catch (e) {
      Alert.alert(t("common.error"), "Failed to load migration workspace");
    } finally {
      setLoading(false);
    }
  };

  const saveWorkspaceProgress = async (stepData: any, nextStep: number) => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await apiPatch(`/api/groups/${group?.groupId}/migration-workspace/${workspace.id}`, {
        ...stepData,
        currentStep: nextStep
      });
      setWorkspace(updated);
      setStep(nextStep);
    } catch (e) {
      Alert.alert(t("common.error"), "Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      saveWorkspaceProgress({}, step - 1);
    } else {
      router.back();
    }
  };

    const finishWizard = async () => {
    setSaving(true);
    try {
      await apiPost(`/api/groups/${group?.groupId}/migration/complete`, {});
      router.replace("/migration-success" as any);
    } catch (e: any) {
      if (e.details && Array.isArray(e.details)) {
        Alert.alert(t("migration.validation_failed") || "Validation Failed", e.details.join("\\n"));
      } else {
        Alert.alert(t("common.error"), e.error || e.message || "Failed to complete migration.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const steps = [
    { id: 1, title: t("migration.step1_group") || "Group Verification" },
    { id: 2, title: t("migration.step2_snapshot") || "Opening Snapshot" },
    { id: 3, title: t("migration.step3_members") || "Current Members" },
    { id: 4, title: t("migration.step4_loans") || "Current Internal Loans" },
    { id: 5, title: t("migration.step5_bank_loans") || "Current Bank Loans" },
    { id: 6, title: t("migration.step6_review") || "Review" },
    { id: 7, title: t("migration.step7_finish") || "Finish" }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} disabled={saving}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>{t("migration.title") || "Migration Wizard"}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.light.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {t("migration.step")} {step} {t("migration.of")} 6
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
              {steps.find(s => s.id === step)?.title}
            </Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView style={styles.contentWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 1 && <Step1Group workspace={workspace} onNext={(data: any) => saveWorkspaceProgress(data, 2)} saving={saving} />}
        {step === 2 && <Step2Snapshot workspace={workspace} onNext={(data: any) => saveWorkspaceProgress(data, 3)} saving={saving} />}
        {step === 3 && <Step3Members workspace={workspace} onNext={() => saveWorkspaceProgress({}, 4)} saving={saving} />}
        {step === 4 && <Step4Loans workspace={workspace} onNext={() => saveWorkspaceProgress({}, 5)} saving={saving} />}
        {step === 5 && <Step5BankLoans workspace={workspace} onNext={() => saveWorkspaceProgress({}, 6)} saving={saving} />}
        {step === 6 && <Step6Review workspace={workspace} onNext={finishWizard} saving={saving} onBack={() => saveWorkspaceProgress({}, 5)} />}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: '700', marginLeft: 15, color: '#0f172a' },
  progressContainer: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  progressBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.light.primary },
  progressText: { fontSize: 13, color: '#64748b', marginTop: 10, fontWeight: '600' },
  contentWrapper: { flex: 1 }
});
