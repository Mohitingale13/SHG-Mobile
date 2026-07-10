import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import SHGDatePicker from '@/components/SHGDatePicker';

export default function Step4Loans({ workspace, onNext, saving: parentSaving }: { workspace: any, onNext: () => void, saving: boolean }) {
  const { t } = useLanguage();
  
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  
  const [draftMemberId, setDraftMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [outstandingPrincipal, setOutstandingPrincipal] = useState('');
  const [outstandingInterest, setOutstandingInterest] = useState('');
  const [interestRate, setInterestRate] = useState('2');
  const [durationMonths, setDurationMonths] = useState('');
  const [remainingMonths, setRemainingMonths] = useState('');
  const [resolutionNo, setResolutionNo] = useState('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [workspace.id]);

  const fetchData = async () => {
    try {
      const [loansData, membersData] = await Promise.all([
        (apiGet(`/api/migration-workspace/${workspace.id}/loans`) as Promise<any[]>),
        (apiGet(`/api/migration-workspace/${workspace.id}/members`) as Promise<any[]>)
      ]);
      setLoans(loansData);
      setMembers(membersData);
    } catch (e) {
      Alert.alert(t("common.error"), "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingLoan(null);
    setDraftMemberId('');
    setAmount('');
    setOutstandingPrincipal('');
    setOutstandingInterest('0');
    setInterestRate('2');
    setDurationMonths('');
    setRemainingMonths('');
    setResolutionNo('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setErrors({});
    setModalVisible(true);
  };

  const openEditModal = (l: any) => {
    setEditingLoan(l);
    setDraftMemberId(l.draftMemberId);
    setAmount(l.amount.toString());
    setOutstandingPrincipal(l.outstandingPrincipal.toString());
    setOutstandingInterest(l.outstandingInterest.toString());
    setInterestRate(l.interestRate.toString());
    setDurationMonths(l.durationMonths.toString());
    setRemainingMonths(l.remainingMonths.toString());
    setResolutionNo(l.resolutionNo);
    setStartDate(l.startDate ? new Date(l.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setErrors({});
    setModalVisible(true);
  };

  const saveLoan = async () => {
    let newErrors: any = {};
    if (!draftMemberId) newErrors.draftMemberId = true;
    if (!amount) newErrors.amount = true;
    if (!outstandingPrincipal) newErrors.outstandingPrincipal = true;
    if (!durationMonths) newErrors.durationMonths = true;
    if (!remainingMonths) newErrors.remainingMonths = true;
    if (!resolutionNo) newErrors.resolutionNo = true;
    if (!startDate) newErrors.startDate = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const member = members.find(m => m.id === draftMemberId);
    const payload = {
      draftMemberId,
      draftMemberName: member?.name || "Unknown",
      amount: parseInt(amount),
      outstandingPrincipal: parseInt(outstandingPrincipal),
      outstandingInterest: parseInt(outstandingInterest || "0"),
      interestRate: parseFloat(interestRate),
      durationMonths: parseInt(durationMonths),
      remainingMonths: parseInt(remainingMonths),
      resolutionNo,
      startDate: startDate ? new Date(startDate).toISOString() : null
    };

    setSaving(true);
    try {
      if (editingLoan) {
        await apiPatch(`/api/migration-workspace/loans/${editingLoan.id}`, payload);
      } else {
        await apiPost(`/api/migration-workspace/${workspace.id}/loans`, payload);
      }
      setModalVisible(false);
      await fetchData();
    } catch (e) {
      Alert.alert("Error", "Failed to save loan");
    } finally {
      setSaving(false);
    }
  };

  const deleteLoan = async (id: string) => {
    Alert.alert(t("common.delete") || "Delete", t("common.confirm_delete") || "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await apiDelete(`/api/migration-workspace/loans/${id}`);
          fetchData();
        } catch (e) {
          Alert.alert("Error", "Failed to delete");
        }
      }}
    ]);
  };

  const renderLoan = ({ item }: { item: any }) => (
    <View style={styles.loanCard}>
      <View style={styles.loanHeader}>
        <Text style={styles.loanMember}>{item.draftMemberName}</Text>
        <Text style={styles.loanAmount}>₹{item.outstandingPrincipal}</Text>
      </View>
      <View style={styles.loanDetails}>
        <Text style={styles.loanText}>{t("loan.original_amount") || "Original"}: ₹{item.amount}</Text>
        <Text style={styles.loanText}>{t("loan.duration") || "Duration"}: {item.remainingMonths}/{item.durationMonths} months</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={() => openEditModal(item)}>
          <Ionicons name="pencil" size={18} color={Colors.light.primary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => deleteLoan(item.id)}>
          <Ionicons name="trash" size={18} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.desc}>{loans.length} {t("migration.active_loans") || "Active Loans"}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t("loan.apply_loan") || "Add Loan"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoan}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cash-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t("migration.no_loans") || "No active internal loans"}</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Pressable style={styles.nextBtn} onPress={onNext} disabled={parentSaving}>
          {parentSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>{t("common.save_next") || "Save & Next"}</Text>}
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingLoan ? (t("loan.edit_loan") || "Edit Loan") : (t("loan.apply_loan") || "Add Active Loan")}</Text>
            
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("loan.member_name") || "Member"} *</Text>
                    <View style={styles.roleContainer}>
                      {members.map(m => (
                        <Pressable key={m.id} style={[styles.roleBtn, draftMemberId === m.id && styles.roleBtnActive]} onPress={() => {setDraftMemberId(m.id); setErrors({...errors, draftMemberId: false})}}>
                          <Text style={[styles.roleBtnText, draftMemberId === m.id && styles.roleBtnTextActive]}>{m.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {errors.draftMemberId && <Text style={styles.errorText}>{t("common.required") || "Required"}</Text>}
                  </View>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                      <Text style={styles.label}>{t("loan.loan_amount") || "Original Amount"} *</Text>
                      <TextInput style={[styles.input, errors.amount && styles.inputError]} value={amount} onChangeText={setAmount} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, {flex: 1}]}>
                      <Text style={styles.label}>{t("loan.outstanding_principal") || "Outstanding Pr."} *</Text>
                      <TextInput style={[styles.input, errors.outstandingPrincipal && styles.inputError]} value={outstandingPrincipal} onChangeText={setOutstandingPrincipal} keyboardType="numeric" />
                    </View>
                  </View>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                      <Text style={styles.label}>{t("loan.interest_rate") || "Interest %"}</Text>
                      <TextInput style={styles.input} value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, {flex: 1}]}>
                      <Text style={styles.label}>{t("loan.outstanding_interest") || "Outstanding Int."}</Text>
                      <TextInput style={styles.input} value={outstandingInterest} onChangeText={setOutstandingInterest} keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                      <Text style={styles.label}>{t("loan.duration") || "Total Duration"} *</Text>
                      <TextInput style={[styles.input, errors.durationMonths && styles.inputError]} value={durationMonths} onChangeText={setDurationMonths} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, {flex: 1}]}>
                      <Text style={styles.label}>{t("loan.remaining_months") || "Remaining Mos."} *</Text>
                      <TextInput style={[styles.input, errors.remainingMonths && styles.inputError]} value={remainingMonths} onChangeText={setRemainingMonths} keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("loan.resolution_no") || "Resolution No."} *</Text>
                    <TextInput style={[styles.input, errors.resolutionNo && styles.inputError]} value={resolutionNo} onChangeText={setResolutionNo} />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("loan.disbursement_date") || "Start Date"} *</Text>
                    <SHGDatePicker value={startDate} onSelect={(d: string) => {setStartDate(d); setErrors({...errors, startDate: false})}} placeholder="Start Date" />
                  </View>
                </>
              }
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t("common.cancel") || "Cancel"}</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveLoan} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("common.save") || "Save"}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stepIndicator: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  desc: { fontSize: 14, color: '#64748b', marginTop: 4 },
  addBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { padding: 20, paddingTop: 0 },
  loanCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: {width: 0, height: 1} },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loanMember: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  loanAmount: { fontSize: 16, fontWeight: '700', color: Colors.light.primary },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  loanText: { fontSize: 13, color: '#64748b' },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  iconBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', marginTop: 10 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  nextBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20, paddingTop: 40, paddingBottom: 40 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#f8fafc', color: '#0f172a' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  roleBtnActive: { borderColor: Colors.light.primary, backgroundColor: '#eff6ff' },
  roleBtnText: { color: '#475569', fontSize: 12, fontWeight: '500' },
  roleBtnTextActive: { color: Colors.light.primary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cancelBtn: { padding: 14, paddingHorizontal: 20 },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.light.primary, padding: 14, paddingHorizontal: 24, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
