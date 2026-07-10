import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import SHGDatePicker from '@/components/SHGDatePicker';

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function Step2Snapshot({ workspace, onNext, saving }: { workspace: any, onNext: (data: any) => void, saving: boolean }) {
  const { t } = useLanguage();
  
  const [snapshotDate, setSnapshotDate] = useState<string>(workspace?.snapshotDate ? parseLocalDate(workspace.snapshotDate) : new Date().toISOString().split('T')[0]);
  
  const [totalSavings, setTotalSavings] = useState(workspace?.totalSavings?.toString() || "0");
  
  const initialCash = workspace?.cashInHand ? workspace.cashInHand : 0;
  const initialBank = workspace?.bankBalance ? workspace.bankBalance : 0;
  
  const [hasCash, setHasCash] = useState<boolean>(initialCash > 0);
  const [cashInHand, setCashInHand] = useState(initialCash.toString());
  
  const bankLinked = !!workspace?.bankName;
  const [hasBank, setHasBank] = useState<boolean>(initialBank > 0 || bankLinked);
  const [bankBalance, setBankBalance] = useState(initialBank.toString());
  
  const [errors, setErrors] = useState<any>({});
  
  const handleNext = () => {
    let newErrors: any = {};
    if (!snapshotDate) newErrors.snapshotDate = true;
    if (isNaN(parseInt(totalSavings))) newErrors.totalSavings = true;
    if (hasCash && isNaN(parseInt(cashInHand))) newErrors.cashInHand = true;
    if (hasBank && isNaN(parseInt(bankBalance))) newErrors.bankBalance = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onNext({
      snapshotDate: snapshotDate ? new Date(snapshotDate).toISOString() : null,
      totalSavings: parseInt(totalSavings || "0"),
      cashInHand: hasCash ? parseInt(cashInHand || "0") : 0,
      bankBalance: hasBank ? parseInt(bankBalance || "0") : 0,
      outstandingInternalPrincipal: 0,
      outstandingBankPrincipal: 0,
      openingSnapshotCompleted: true
    });
  };

  const renderInput = (label: string, desc: string, value: string, setter: any, errorKey: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.inputDesc}>{desc}</Text>
      <TextInput 
        style={[styles.input, errors[errorKey] && styles.inputError]} 
        value={value} 
        onChangeText={(v) => {setter(v); setErrors({...errors, [errorKey]: false});}} 
        keyboardType="numeric" 
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.desc}>{t("migration.step2_desc") || "Current SHG Financial Position"}</Text>
      
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("migration.snapshot_date") || "Migration Date"} *</Text>
          <SHGDatePicker value={snapshotDate} onSelect={(d: string) => {setSnapshotDate(d); setErrors({...errors, snapshotDate: false})}} placeholder={t("migration.snapshot_date") || "Migration Date"} />
          {errors.snapshotDate && <Text style={styles.errorText}>{t("common.required") || "Required"}</Text>}
        </View>

        {renderInput(
          t("migration.total_savings") || "Total Member Savings",
          t("migration.total_savings_desc") || "Total savings collected from all members till the migration date.",
          totalSavings, setTotalSavings, "totalSavings"
        )}

        <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={styles.label}>{t("migration.has_cash") || "Does the SHG currently keep physical cash?"}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={[styles.pillBtn, hasCash && styles.pillBtnActive]} onPress={() => setHasCash(true)}>
              <Text style={[styles.pillText, hasCash && styles.pillTextActive]}>{t("common.yes") || "Yes"}</Text>
            </Pressable>
            <Pressable style={[styles.pillBtn, !hasCash && styles.pillBtnActive]} onPress={() => {setHasCash(false); setErrors({...errors, cashInHand: false});}}>
              <Text style={[styles.pillText, !hasCash && styles.pillTextActive]}>{t("common.no") || "No"}</Text>
            </Pressable>
          </View>
        </View>

        {hasCash && renderInput(
          t("migration.cash_in_hand") || "Available Cash",
          t("migration.cash_balance_desc") || "Cash physically available with the President or Treasurer.",
          cashInHand, setCashInHand, "cashInHand"
        )}

        <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[styles.label, { flex: 1, paddingRight: 10 }]}>{t("migration.has_bank") || "Does the SHG currently have an SHG bank account?"}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={[styles.pillBtn, hasBank && styles.pillBtnActive]} onPress={() => setHasBank(true)}>
              <Text style={[styles.pillText, hasBank && styles.pillTextActive]}>{t("common.yes") || "Yes"}</Text>
            </Pressable>
            <Pressable style={[styles.pillBtn, !hasBank && styles.pillBtnActive]} onPress={() => {setHasBank(false); setErrors({...errors, bankBalance: false});}}>
              <Text style={[styles.pillText, !hasBank && styles.pillTextActive]}>{t("common.no") || "No"}</Text>
            </Pressable>
          </View>
        </View>

        {hasBank && (
          <>
            {renderInput(
              t("migration.bank_balance") || "Current SHG Bank Account Balance",
              t("migration.bank_balance_desc") || "Current balance available in the SHG bank account.",
              bankBalance, setBankBalance, "bankBalance"
            )}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t("migration.bank_balance_warning") || "IMPORTANT: This bank balance refers ONLY to the SHG's own savings/current account. It is NOT the Group Bank Loan. The Group Bank Loan is already captured in Step 5. Do NOT mix these concepts."}
              </Text>
            </View>
          </>
        )}
      </View>

      <Pressable style={styles.nextBtn} onPress={handleNext} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>{t("common.save_next") || "Save & Next"}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepIndicator: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  desc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 25 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, marginBottom: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  inputDesc: { fontSize: 13, color: '#64748b', marginBottom: 10, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#f8fafc', color: '#0f172a' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  nextBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pillBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1' },
  pillBtnActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  pillText: { color: '#475569', fontWeight: '600' },
  pillTextActive: { color: '#ffffff', fontWeight: 'bold' },
  warningBox: { backgroundColor: '#fff3cd', borderColor: '#ffeeba', borderWidth: 1, borderRadius: 8, padding: 12, marginTop: -5, marginBottom: 15 },
  warningText: { color: '#856404', fontSize: 13, lineHeight: 18, fontWeight: '500' }
});
