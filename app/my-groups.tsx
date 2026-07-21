// @ts-nocheck
import { useState, useEffect } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform, TextInput, Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth, MembershipOption } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

export default function MyGroupsScreen() {
  const insets = useSafeAreaInsets();
  const { user, myMemberships, loadMyMemberships, switchSHG } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(!myMemberships);
  const [switching, setSwitching] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ visible: boolean; membershipId: string | null }>({ visible: false, membershipId: null });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    loadMyMemberships().finally(() => setLoading(false));
  }, []);

  const handleSwitch = (item: MembershipOption) => {
    if (!item.membershipId || item.groupId === user?.groupId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPassword("");
    setPwError("");
    setPasswordModal({ visible: true, membershipId: item.membershipId });
  };

  const confirmSwitch = async () => {
    if (!password.trim()) {
      setPwError(t("validation.fill_all_fields") || "Please enter your password.");
      return;
    }
    const { membershipId } = passwordModal;
    if (!membershipId) return;
    setSwitching(membershipId);
    setPasswordModal({ visible: false, membershipId: null });
    const result = await switchSHG(membershipId, password);
    setSwitching(null);
    if (result.success) {
      router.replace("/(main)");
    } else {
      const msg = t(result.error || "error");
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert(t("error"), msg);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      );
    }
    if (!myMemberships || myMemberships.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("auto.no_groups_found") || "No groups found."}</Text>
        </View>
      );
    }
    return (
      <View style={styles.list}>
        {myMemberships.map((item) => {
          const isCurrent = item.groupId === user?.groupId;
          const isSwitching = switching === item.membershipId;
          const roleColor =
            item.role === "president" ? Colors.light.primary
            : item.role === "treasurer" ? "#7C3AED"
            : Colors.light.secondary;
          return (
            <Pressable
              key={item.membershipId || item.groupId}
              style={({ pressed }) => [styles.card, isCurrent && styles.cardActive, { opacity: pressed && !isCurrent ? 0.85 : 1 }]}
              onPress={() => handleSwitch(item)}
              disabled={isCurrent || isSwitching}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.roleIcon, { backgroundColor: roleColor + "18" }]}>
                  <Ionicons name="people-circle-outline" size={28} color={roleColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName} numberOfLines={1}>{item.groupName}</Text>
                  {item.village ? <Text style={styles.village}>{item.village}</Text> : null}
                  <View style={[styles.roleBadge, { backgroundColor: roleColor + "18", alignSelf: "flex-start", marginTop: 4 }]}>
                    <Text style={[styles.roleText, { color: roleColor }]}>{item.role}</Text>
                  </View>
                </View>
              </View>
              <View>
                {isCurrent ? (
                  <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                    <Text style={styles.activeText}>{t("auto.current") || "Current"}</Text>
                  </View>
                ) : isSwitching ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <Ionicons name="swap-horizontal-outline" size={22} color={Colors.light.textMuted} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("auto.my_groups") || "My Groups"}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>

      {/* Password Confirmation Modal */}
      <Modal visible={passwordModal.visible} transparent animationType="fade" onRequestClose={() => setPasswordModal({ visible: false, membershipId: null })}>
        <Pressable style={styles.modalOverlay} onPress={() => setPasswordModal({ visible: false, membershipId: null })}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t("auto.confirm_password") || "Confirm Password"}</Text>
            <Text style={styles.modalSubtitle}>{t("auto.enter_password_to_switch_shg") || "Enter your password to switch SHG."}</Text>
            <View style={styles.pwInputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.light.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.pwInput}
                placeholder={t("password") || "Password"}
                placeholderTextColor={Colors.light.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); setPwError(""); }}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
            {!!pwError && <Text style={styles.pwError}>{pwError}</Text>}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setPasswordModal({ visible: false, membershipId: null })}>
                <Text style={styles.cancelText}>{t("cancel") || "Cancel"}</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={confirmSwitch}>
                <Text style={styles.confirmText}>{t("auto.switch") || "Switch"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17, color: Colors.light.text },
  scrollContent: { padding: 20, flexGrow: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.textSecondary },
  list: { gap: 12 },
  card: {
    backgroundColor: Colors.light.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  cardActive: { borderColor: Colors.light.primary, borderWidth: 2, backgroundColor: Colors.light.primary + "08" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  roleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  groupName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.light.text },
  village: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.textSecondary },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleText: { fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "capitalize" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  activeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: Colors.light.primary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  modalCard: {
    backgroundColor: Colors.light.card, borderRadius: 20,
    padding: 24, width: "85%", maxWidth: 380,
  },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.light.text, marginBottom: 6 },
  modalSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.light.textSecondary, marginBottom: 18 },
  pwInputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  pwInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 15, color: Colors.light.text },
  pwError: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "#EF4444", marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 13,
    borderWidth: 1, borderColor: Colors.light.border, alignItems: "center",
  },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.light.textSecondary },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, backgroundColor: Colors.light.primary, alignItems: "center" },
  confirmText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
});
