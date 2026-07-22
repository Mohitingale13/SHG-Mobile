// @ts-nocheck
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Platform, Modal } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Group } from "@/server/storage";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLang, setNewGroupLang] = useState("mr");
  const [creating, setCreating] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [suspendingGroupId, setSuspendingGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const { verifyPassword } = useAuth();

  const handleLogout = async () => {
    const confirmMessage = "Are you sure you want to log out?";
    
    const executeLogout = async () => {
      await logout();
      router.replace("/(auth)/login");
    };

    if (Platform.OS === "web") {
      if (window.confirm(confirmMessage)) {
        executeLogout();
      }
    } else {
      Alert.alert(
        "Logout",
        confirmMessage,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: executeLogout
          }
        ]
      );
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await apiGet<Group[]>("/api/super-admin/groups");
      setGroups(data);
    } catch (e) {
      Alert.alert(t("common.error"), t("superAdmin.failed_fetch_groups"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert(t("common.error"), t("validation.group_name_required"));
      return;
    }
    setCreating(true);
    try {
      const group = await apiPost<Group>("/api/super-admin/groups", {
        name: newGroupName.trim(),
        preferredLanguage: newGroupLang,
      });
      setGroups([...groups, group]);
      setNewGroupName("");
      Alert.alert(t("common.success"), `${t("superAdmin.group_created")} ${group.uniqueGroupCode}`);
    } catch (e) {
      Alert.alert(t("common.error"), t("superAdmin.failed_create_group"));
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (group: Group) => {
    const newStatus = group.status === "suspended" ? "active" : "suspended";
    setSuspendingGroupId(group.groupId);
    try {
      await apiPatch(`/api/super-admin/groups/${group.groupId}/status`, {
        status: newStatus,
      });
      await fetchGroups();
    } catch (e) {
      Alert.alert(t("common.error"), t("superAdmin.failed_update_status"));
    } finally {
      setSuspendingGroupId(null);
    }
  };

  const handleDeleteGroup = (group: Group) => {
    setGroupToDelete(group);
    setAdminPassword("");
    setPasswordModalVisible(true);
  };

  const executeDelete = async () => {
    if (!groupToDelete || !adminPassword.trim()) return;
    
    setVerifyingPassword(true);
    const isValid = await verifyPassword(adminPassword);
    setVerifyingPassword(false);
    
    if (!isValid) {
      if (Platform.OS === "web") {
        window.alert("Incorrect password");
      } else {
        Alert.alert("Error", "Incorrect password");
      }
      return;
    }
    
    setPasswordModalVisible(false);
    setDeletingGroupId(groupToDelete.groupId);
    try {
      await apiDelete(`/api/super-admin/groups/${groupToDelete.groupId}`);
      await fetchGroups();
      if (Platform.OS !== "web") {
        Alert.alert("Deleted", "Group deleted successfully.");
      } else {
        window.alert("Group deleted successfully.");
      }
    } catch (e) {
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to delete group.");
      } else {
        window.alert("Failed to delete group.");
      }
    } finally {
      setDeletingGroupId(null);
      setGroupToDelete(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("auto.super_admin_panel")}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setLanguage(t("auto.mr"))} style={styles.langToggle}>
            <Ionicons name="language" size={16} color={Colors.light.primary} />
            <Text style={styles.langToggleText}>{t("auto.empty")}</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t("auto.logout")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("auto.create_new_shg")}</Text>
        <View style={styles.formRow}>
          <TextInput
            style={styles.input}
            placeholder={t("superAdmin.shg_name")}
            value={newGroupName}
            onChangeText={setNewGroupName}
          />
          <Text style={{ fontSize: 12, color: Colors.light.secondary, marginBottom: 4 }}>{t("auto.language")}</Text>
          <View style={styles.langSelector}>
            <Pressable
              style={[styles.langBtn, newGroupLang === "mr" && styles.langBtnActive]}
              onPress={() => setNewGroupLang("mr")}
            >
              <Text style={newGroupLang === "mr" ? styles.langTextActive : styles.langText}>मराठी</Text>
            </Pressable>
            <Pressable
              style={[styles.langBtn, newGroupLang === "en" && styles.langBtnActive]}
              onPress={() => setNewGroupLang("en")}
            >
              <Text style={newGroupLang === "en" ? styles.langTextActive : styles.langText}>English</Text>
            </Pressable>
          </View>
          <Pressable style={styles.createBtn} onPress={handleCreateGroup} disabled={creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>{t("superAdmin.generate_code")}</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{t("superAdmin.platform_groups")}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal style={{ width: '100%' }} showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, { flex: 2 }]}>{t("superAdmin.group_name")}</Text>
              <Text style={[styles.cell, { flex: 1.5 }]}>{t("superAdmin.code")}</Text>
              <Text style={styles.cell}>{t("superAdmin.status")}</Text>
              <Text style={styles.cell}>{t("superAdmin.president")}</Text>
              <Text style={styles.cell}>{t("superAdmin.actions")}</Text>
            </View>
            {groups
              .filter(g => 
                g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                g.uniqueGroupCode.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((g) => (
              <View key={g.id} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 2 }]} numberOfLines={2}>{g.name}</Text>
                <Text style={[styles.cell, { flex: 1.5 }]} selectable>{g.uniqueGroupCode}</Text>
                <Text style={styles.cell}>
                  <Text style={{
                    color: g.status === "active" ? "green" : g.status === "pending" ? "orange" : "red",
                    fontWeight: "bold"
                  }}>
                    {g.status.toUpperCase()}
                  </Text>
                </Text>
                <Text style={styles.cell}>{g.presidentId ? (t("superAdmin.claimed")) : (t("superAdmin.unclaimed"))}</Text>
                <View style={[styles.cell, { flexDirection: "row", gap: 8 }]}>
                  <Pressable
                    style={[styles.actionBtn, g.status === "suspended" ? styles.activateBtn : styles.suspendBtn, suspendingGroupId === g.groupId && { opacity: 0.6 }]}
                    onPress={() => toggleStatus(g)}
                    disabled={suspendingGroupId === g.groupId}
                  >
                    {suspendingGroupId === g.groupId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionBtnText}>
                        {g.status === "suspended"
                          ? (t("auto.reactivate"))
                          : (t("auto.suspend"))}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.deleteBtn, deletingGroupId === g.groupId && { opacity: 0.6 }]}
                    onPress={() => handleDeleteGroup(g)}
                    disabled={deletingGroupId === g.groupId}
                  >
                    {deletingGroupId === g.groupId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.actionBtnText, { color: "#fff" }]}>Delete</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalDesc}>
              Please enter your password to permanently delete {groupToDelete?.name}.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Admin Password"
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDeleteBtn, (!adminPassword.trim() || verifyingPassword) && { opacity: 0.6 }]}
                onPress={executeDelete}
                disabled={!adminPassword.trim() || verifyingPassword}
              >
                {verifyingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalDeleteText}>Confirm Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 20, maxWidth: 1200, alignSelf: "center", width: "100%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 10 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  langToggle: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.light.primary + "15", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  langToggleText: { color: Colors.light.primary, fontWeight: "bold", fontSize: 14 },
  logoutBtn: { padding: 10, backgroundColor: "#ef4444", borderRadius: 8 },
  logoutText: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 20, elevation: 3, ...Platform.select({ web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }, default: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } }) },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#374151" },
  formRow: { flexDirection: "column", gap: 15 },
  input: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, fontSize: 16, width: "100%" },
  langSelector: { flexDirection: "row", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, overflow: "hidden" },
  langBtn: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: "#f9fafb" },
  langBtnActive: { backgroundColor: Colors.light.primary },
  langText: { color: "#4b5563" },
  langTextActive: { color: "#fff", fontWeight: "bold" },
  createBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  createBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  table: { width: "100%", minWidth: 600 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#e5e7eb", paddingBottom: 10, marginBottom: 10 },
  tableRow: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", alignItems: "center" },
  cell: { flex: 1, fontSize: 13, color: "#374151", paddingRight: 5 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignItems: "center" },
  suspendBtn: { backgroundColor: "#fee2e2" },
  activateBtn: { backgroundColor: "#dcfce7" },
  deleteBtn: { backgroundColor: "#ef4444" },
  actionBtnText: { fontSize: 12, fontWeight: "bold", color: "#374151" },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  searchInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, flex: 1, marginLeft: 15, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "90%", maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalDesc: { color: "#4b5563", marginBottom: 15, fontSize: 14, lineHeight: 20 },
  modalInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalCancelBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, backgroundColor: "#f3f4f6" },
  modalCancelText: { color: "#374151", fontWeight: "bold" },
  modalDeleteBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, backgroundColor: "#ef4444", minWidth: 100, alignItems: "center" },
  modalDeleteText: { color: "#fff", fontWeight: "bold" },
});
