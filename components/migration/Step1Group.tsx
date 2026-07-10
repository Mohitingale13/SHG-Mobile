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


export default function Step1Group({ workspace, onNext, saving }: { workspace: any, onNext: (data: any) => void, saving: boolean }) {
  const { t } = useLanguage();
  
  const [bankName, setBankName] = useState(workspace?.bankName || "");
  const [branchName, setBranchName] = useState(workspace?.branchName || "");
  const [ifscCode, setIfscCode] = useState(workspace?.ifscCode || "");
  const [accountNumber, setAccountNumber] = useState(workspace?.accountNumber || "");
  const [formationDate, setFormationDate] = useState<string>(workspace?.formationDate ? parseLocalDate(workspace.formationDate) : '');
  const [registrationNumber, setRegistrationNumber] = useState(workspace?.registrationNumber || "");
  const [bankLinked, setBankLinked] = useState<boolean>(workspace?.bankName ? true : false);

  const [errors, setErrors] = useState<any>({});

  const handleNext = () => {
    let newErrors: any = {};
    if (bankLinked && !bankName) newErrors.bankName = true;
    if (!formationDate) newErrors.formationDate = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onNext({
      bankName: bankLinked ? bankName : "",
      branchName: bankLinked ? branchName : "",
      ifscCode: bankLinked ? ifscCode : "",
      accountNumber: bankLinked ? accountNumber : "",
      formationDate: formationDate ? new Date(formationDate).toISOString() : null,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.desc}>{t("migration.step1_desc") || "Please verify the bank account details and formation date of the SHG."}</Text>
      
      <View style={styles.card}>
        {/* 1. Formation Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("group.formation_date") || "Formation Date"} *</Text>
          <SHGDatePicker value={formationDate} onSelect={(d: string) => {setFormationDate(d); setErrors({...errors, formationDate: false})}} placeholder={t("group.formation_date") || "Select Date"} />
          {errors.formationDate && <Text style={styles.errorText}>{t("common.required") || "This field is required"}</Text>}
        </View>

        {/* 2. Registration Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("bank.registration_number") || "Registration Number"} (Optional)</Text>
          <TextInput style={styles.input} value={registrationNumber} onChangeText={setRegistrationNumber} placeholder={t("bank.registration_number") || "Registration Number"} />
        </View>

        {/* 3. Bank Linked */}
        <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={styles.label}>{t("bank.bank_linked") || "Bank Linked?"}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={[styles.pillBtn, bankLinked && styles.pillBtnActive]} onPress={() => setBankLinked(true)}>
              <Text style={[styles.pillText, bankLinked && styles.pillTextActive]}>{t("common.yes") || "Yes"}</Text>
            </Pressable>
            <Pressable style={[styles.pillBtn, !bankLinked && styles.pillBtnActive]} onPress={() => {setBankLinked(false); setErrors({...errors, bankName: false});}}>
              <Text style={[styles.pillText, !bankLinked && styles.pillTextActive]}>{t("common.no") || "No"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Bank Fields (Conditional) */}
        {bankLinked && (
          <View style={styles.bankFieldsContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("bank.bank_name") || "Bank Name"} *</Text>
              <TextInput style={[styles.input, errors.bankName && styles.inputError]} value={bankName} onChangeText={(t) => {setBankName(t); setErrors({...errors, bankName: false})}} placeholder="e.g. State Bank of India" />
              {errors.bankName && <Text style={styles.errorText}>{t("common.required") || "This field is required"}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("bank.branch") || "Branch"}</Text>
              <TextInput style={styles.input} value={branchName} onChangeText={setBranchName} placeholder="Branch Name" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("bank.ifsc") || "IFSC Code"}</Text>
              <TextInput style={styles.input} value={ifscCode} onChangeText={setIfscCode} placeholder="IFSC Code" autoCapitalize="characters" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("bank.account_number") || "Account Number"}</Text>
              <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="Account Number" keyboardType="numeric" />
            </View>
          </View>
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
  inputGroup: { marginBottom: 16 },
  bankFieldsContainer: { padding: 15, backgroundColor: '#f1f5f9', borderRadius: 12, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 14, fontSize: 16, backgroundColor: '#f8fafc', color: '#0f172a' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  nextBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pillBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1' },
  pillBtnActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  pillText: { color: '#475569', fontWeight: '600' },
  pillTextActive: { color: '#ffffff', fontWeight: 'bold' },
});
