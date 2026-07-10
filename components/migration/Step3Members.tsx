import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import SHGDatePicker from '@/components/SHGDatePicker';


const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};


export default function Step3Members({ workspace, onNext, saving: parentSaving }: { workspace: any, onNext: () => void, saving: boolean }) {
  const { t } = useLanguage();
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('member');
  const [joinedAt, setJoinedAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [workspace.id]);

  const fetchMembers = async () => {
    try {
      const data = (await apiGet(`/api/migration-workspace/${workspace.id}/members`)) as any[];
      setMembers(data);
    } catch (e) {
      Alert.alert(t("common.error"), "Failed to load draft members");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setMobile('');
    setRole('member');
    setJoinedAt(new Date().toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const openEditModal = (m: any) => {
    setEditingMember(m);
    setName(m.name);
    setMobile(m.mobile || '');
    setRole(m.role || 'member');
    setJoinedAt(m.joinedAt ? parseLocalDate(m.joinedAt) : new Date().toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const saveMember = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name is required");
    
    setSaving(true);
    try {
      if (editingMember) {
        await apiPatch(`/api/migration-workspace/members/${editingMember.id}`, { name, mobile, role, joinedAt: joinedAt ? new Date(joinedAt).toISOString() : null });
      } else {
        await apiPost(`/api/migration-workspace/${workspace.id}/members`, { name, mobile, role, joinedAt: joinedAt ? new Date(joinedAt).toISOString() : null });
      }
      setModalVisible(false);
      await fetchMembers();
    } catch (e) {
      Alert.alert("Error", "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    Alert.alert(t("common.delete") || "Delete", t("common.confirm_delete") || "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await apiDelete(`/api/migration-workspace/members/${id}`);
          fetchMembers();
        } catch (e) {
          Alert.alert("Error", "Failed to delete");
        }
      }}
    ]);
  };

  const renderMember = ({ item }: { item: any }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
        <View style={styles.details}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRole}>{item.role === 'president' ? t("roles.president") : item.role === 'secretary' ? t("roles.secretary") : item.role === 'treasurer' ? t("roles.treasurer") : t("roles.member")}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={() => openEditModal(item)}>
          <Ionicons name="pencil" size={20} color={Colors.light.primary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => deleteMember(item.id)}>
          <Ionicons name="trash" size={20} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.desc}>{members.length} {t("migration.members_added") || "Members Added"}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t("member.add_member") || "Add Member"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t("migration.no_members") || "No members added yet"}</Text>
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
            <Text style={styles.modalTitle}>{editingMember ? (t("member.edit_member") || "Edit Member") : (t("member.add_member") || "Add Member")}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("member.full_name") || "Full Name"} *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("member.mobile") || "Mobile Number"}</Text>
              <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="10 digit number" keyboardType="numeric" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("member.role") || "Role"}</Text>
              <View style={styles.roleContainer}>
                {['member', 'treasurer'].map((r) => (
                  <Pressable key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
                    <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                      {r === 'member' ? t("roles.member") : t("roles.treasurer")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("member.joining_date") || "Joining Date"}</Text>
              <SHGDatePicker value={joinedAt} onSelect={(d: string) => setJoinedAt(d)} placeholder="Joining Date" />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>{t("common.cancel") || "Cancel"}</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveMember} disabled={saving}>
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
  memberCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: {width: 0, height: 1} },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#0284c7' },
  details: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  memberRole: { fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', marginTop: 10 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  nextBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 14, fontSize: 16, backgroundColor: '#f8fafc', color: '#0f172a' },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  roleBtnActive: { borderColor: Colors.light.primary, backgroundColor: '#eff6ff' },
  roleBtnText: { color: '#475569', fontSize: 13, fontWeight: '500' },
  roleBtnTextActive: { color: Colors.light.primary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { padding: 14, paddingHorizontal: 20 },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.light.primary, padding: 14, paddingHorizontal: 24, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
