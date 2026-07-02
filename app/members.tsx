import { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, Alert, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth, User } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData } from "@/contexts/DataContext";
import Colors from "@/constants/colors";

function RoleBadge({ role }: { role: "president" | "treasurer" | "member" }) {
  const { t } = useLanguage();
  if (role === "president") {
    return (
      <View style={[styles.roleBadge, { backgroundColor: Colors.light.primary + "20" }]}>
        <Ionicons name="shield" size={10} color={Colors.light.primary} />
        <Text style={[styles.roleBadgeText, { color: Colors.light.primary }]}>{t("president")}</Text>
      </View>
    );
  }
  if (role === "treasurer") {
    return (
      <View style={[styles.roleBadge, { backgroundColor: "#F59E0B25" }]}>
        <Ionicons name="wallet" size={10} color="#D97706" />
        <Text style={[styles.roleBadgeText, { color: "#D97706" }]}>{t("treasurer")}</Text>
      </View>
    );
  }
  return null;
}

function MemberItem({
  member, isPresident, treasurerId, onToggleStatus, onAssignTreasurer,
}: {
  member: User;
  isPresident: boolean;
  treasurerId?: string;
  onToggleStatus: (id: string, status: "active" | "left") => void;
  onAssignTreasurer: (member: User) => void;
}) {
  const { t, language } = useLanguage();
  const isActive = member.status === "active";
  const isCurrentTreasurer = member.id === treasurerId;
  const canManage = isPresident && member.role !== "president";

  const avatarBg = member.role === "president"
    ? Colors.light.primary
    : member.role === "treasurer"
    ? "#D97706"
    : Colors.light.secondary;

  const avatarIcon = member.role === "president" ? "shield" : member.role === "treasurer" ? "wallet" : "person";

  return (
    <Pressable
      style={[styles.memberCard, isCurrentTreasurer && styles.treasurerCard]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/member/${member.id}`);
      }}
    >
      {isCurrentTreasurer && <View style={styles.treasurerStripe} />}
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Ionicons name={avatarIcon as any} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName}>{member.name}</Text>
          <RoleBadge role={member.role} />
        </View>
        <Text style={styles.memberInfo}>{member.village}</Text>
        <Text style={styles.memberInfo}>{member.phone}</Text>
        <Text style={styles.memberInfo}>{t("joinDate")}: {member.joinDate}</Text>
        {canManage && (
          <View style={styles.memberActions}>
            <Pressable onPress={() => onAssignTreasurer(member)} style={styles.assignBtn}>
              <Ionicons
                name={isCurrentTreasurer ? "wallet" : "wallet-outline"}
                size={13}
                color={isCurrentTreasurer ? "#D97706" : Colors.light.textSecondary}
              />
              <Text style={[styles.assignBtnText, isCurrentTreasurer && { color: "#D97706" }]}>
                {isCurrentTreasurer ? t("removeTreasurer") : t("assignTreasurer")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleStatus(member.id, isActive ? "left" : "active");
              }}
              style={[styles.removeBtn, { backgroundColor: isActive ? Colors.light.danger + "12" : Colors.light.success + "12" }]}
            >
              <Ionicons
                name={isActive ? "person-remove-outline" : "person-add-outline"}
                size={13}
                color={isActive ? Colors.light.danger : Colors.light.success}
              />
              <Text style={[styles.removeBtnText, { color: isActive ? Colors.light.danger : Colors.light.success }]}>
                {isActive
                  ? (language === "en" ? "Remove from group" : "गटातून काढा")
                  : (language === "en" ? "Reactivate" : "पुन्हा सक्रिय करा")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.light.success + "20" : Colors.light.textMuted + "20" }]}>
          <Text style={[styles.statusText, { color: isActive ? Colors.light.success : Colors.light.textMuted }]}>
            {isActive ? t("active") : t("left")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.light.textMuted} />
      </View>
    </Pressable>
  );
}

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { isPresident, group, refreshSession } = useAuth();
  const { t, language } = useLanguage();
  const { groupMembers, updateMemberStatus, assignTreasurer } = useData();
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const handleToggleStatus = (memberId: string, newStatus: "active" | "left") => {
    const msg = newStatus === "left"
      ? (language === "en" ? "Mark this member as left?" : "या सदस्याला बाहेर पडले म्हणून नोंदवायचे?")
      : (language === "en" ? "Mark this member as active?" : "या सदस्याला सक्रिय म्हणून नोंदवायचे?");
    Alert.alert(t("confirm"), msg, [
      { text: t("cancel"), style: "cancel" },
      { text: t("confirm"), onPress: () => updateMemberStatus(memberId, newStatus) },
    ]);
  };

  const handleAssignTreasurer = (member: User) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const confirmAssign = async () => {
    if (!selectedMember) return;
    const isAlreadyTreasurer = selectedMember.id === group?.treasurerId;
    try {
      await assignTreasurer(isAlreadyTreasurer ? null : selectedMember.id);
      await refreshSession();
    } catch {}
    setShowModal(false);
  };

  const activeMembers = groupMembers.filter((m) => m.status === "active");
  const leftMembers = groupMembers.filter((m) => m.status === "left");
  const currentTreasurer = groupMembers.find((m) => m.id === group?.treasurerId);

  const isRemoving = selectedMember?.id === group?.treasurerId;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top) + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>{t("members")}</Text>
        <Text style={styles.countText}>{activeMembers.length} {t("active")}</Text>
      </View>

      {currentTreasurer && (
        <View style={styles.treasurerBanner}>
          <Ionicons name="wallet" size={16} color="#D97706" />
          <Text style={styles.treasurerBannerText}>
            {t("currentTreasurer")}: <Text style={{ fontFamily: "Poppins_600SemiBold" }}>{currentTreasurer.name}</Text>
          </Text>
        </View>
      )}

      <FlatList
        data={[...activeMembers, ...leftMembers]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MemberItem
            member={item}
            isPresident={isPresident}
            treasurerId={group?.treasurerId}
            onToggleStatus={handleToggleStatus}
            onAssignTreasurer={handleAssignTreasurer}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>{t("noMembers")}</Text>
          </View>
        }
        scrollEnabled={groupMembers.length > 0}
      />

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIconWrap, { backgroundColor: isRemoving ? Colors.light.danger + "15" : "#FEF3C7" }]}>
              <Ionicons name="wallet" size={32} color={isRemoving ? Colors.light.danger : "#D97706"} />
            </View>
            <Text style={styles.modalTitle}>
              {isRemoving ? t("removeTreasurer") : t("assignTreasurer")}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isRemoving
                ? (language === "en"
                    ? `Remove ${selectedMember?.name} as Treasurer?`
                    : `${selectedMember?.name} यांना खजिनदार पदावरून काढायचे?`)
                : (language === "en"
                    ? `Assign ${selectedMember?.name} as the group Treasurer?`
                    : `${selectedMember?.name} यांना गटाचे खजिनदार म्हणून नियुक्त करायचे?`)}
            </Text>
            {!isRemoving && (
              <View style={styles.modalNote}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.light.textMuted} />
                <Text style={styles.modalNoteText}>
                  {language === "en"
                    ? "Future loan requests will require Treasurer approval before reaching the President."
                    : "भविष्यातील कर्ज मागण्या अध्यक्षाकडे पोहोचण्यापूर्वी खजिनदाराच्या मंजुरीची आवश्यकता असेल."}
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: isRemoving ? Colors.light.danger : "#D97706" }]}
                onPress={confirmAssign}
              >
                <Ionicons name={isRemoving ? "close" : "checkmark"} size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>{t("confirm")}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  countText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.success,
  },
  treasurerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#FEF3C740",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F59E0B40",
  },
  treasurerBannerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#92400E",
  },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  memberCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  treasurerCard: {
    borderWidth: 1.5,
    borderColor: "#F59E0B50",
    backgroundColor: "#FFFBEB",
  },
  treasurerStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#F59E0B",
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },
  memberInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  memberActions: {
    gap: 6,
    marginTop: 6,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assignBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  removeBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 8,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  modalNote: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    padding: 10,
    width: "100%",
    marginTop: 4,
  },
  modalNoteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalConfirmText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
