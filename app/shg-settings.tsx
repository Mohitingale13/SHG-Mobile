// @ts-nocheck
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Switch
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData, GroupSettings, DEFAULT_SETTINGS, AffiliatedBank } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { Modal } from "react-native";

export default function ShgSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { group, isPresident } = useAuth();
  const { groupSettings, updateGroupSettings, updateGroupInfo, affiliatedBanks, createBank, updateBank, deactivateBank } = useData();

  // Bank modal state
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState<AffiliatedBank | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankContact, setBankContact] = useState("");
  const [bankPhone, setBankPhone] = useState("");
  const [bankNotesVal, setBankNotesVal] = useState("");
  const [bankSaving, setBankSaving] = useState(false);

  const openBankModal = (bank?: AffiliatedBank) => {
    setEditingBank(bank || null);
    setBankName(bank?.name || "");
    setBankBranch(bank?.branch || "");
    setBankIfsc(bank?.ifscCode || "");
    setBankContact(bank?.contactPerson || "");
    setBankPhone(bank?.contactNumber || "");
    setBankNotesVal(bank?.notes || "");
    setBankModalVisible(true);
  };

  const handleSaveBank = async () => {
    if (!bankName.trim()) {
      Alert.alert(t("error"), t("bank.bank_name_required"));
      return;
    }
    setBankSaving(true);
    try {
      if (editingBank) {
        await updateBank(editingBank.id, {
          name: bankName.trim(),
          branch: bankBranch.trim() || undefined,
          ifscCode: bankIfsc.trim() || undefined,
          contactPerson: bankContact.trim() || undefined,
          contactNumber: bankPhone.trim() || undefined,
          notes: bankNotesVal.trim() || undefined,
        });
      } else {
        await createBank({
          groupId: group?.id || "",
          name: bankName.trim(),
          branch: bankBranch.trim() || undefined,
          ifscCode: bankIfsc.trim() || undefined,
          contactPerson: bankContact.trim() || undefined,
          contactNumber: bankPhone.trim() || undefined,
          notes: bankNotesVal.trim() || undefined,
        });
      }
      setBankModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    } finally {
      setBankSaving(false);
    }
  };

  const handleDeactivateBank = (bank: AffiliatedBank) => {
    Alert.alert(
      t("bank.deactivate_bank"),
      t("bank.deactivate_bank") + "?\n" + bank.name,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("bank.deactivate_bank"), style: "destructive", onPress: async () => {
            await deactivateBank(bank.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        },
      ]
    );
  };

  const [groupName, setGroupName] = useState(group?.name || "");
  const [village, setVillage] = useState(group?.village || "");
  const [taluka, setTaluka] = useState(group?.taluka || "");
  const [district, setDistrict] = useState(group?.district || "");
  const [prefLang, setPrefLang] = useState(group?.preferredLanguage || "mr");

  const [monthlyAmount, setMonthlyAmount] = useState(String(groupSettings.monthlyContributionAmount || 100));
  const [dueDay, setDueDay] = useState(String(groupSettings.contributionDueDay || 5));
  const [lateFee, setLateFee] = useState(String(groupSettings.lateFeeAmount || 10));
  const [lateFeeType, setLateFeeType] = useState<"fixed" | "percentage">(groupSettings.lateFeeType || "fixed");
  const [gracePeriod, setGracePeriod] = useState(String(groupSettings.gracePeriodDays || 5));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amount = parseInt(monthlyAmount);
    const dDay = parseInt(dueDay);
    const fee = parseInt(lateFee);
    const grace = parseInt(gracePeriod);

    if (!amount || amount <= 0) {
      Alert.alert(t("error"), "Please enter a valid monthly contribution amount");
      return;
    }
    if (!dDay || dDay < 1 || dDay > 28) {
      Alert.alert(t("error"), "Due day must be between 1 and 28");
      return;
    }
    if (!fee || fee < 0) {
      Alert.alert(t("error"), "Late fee must be 0 or greater");
      return;
    }
    if (!grace || grace < 0) {
      Alert.alert(t("error"), "Grace period must be 0 or greater");
      return;
    }

    if (!groupName.trim()) {
      Alert.alert(t("error"), "Group name is required");
      return;
    }
    setSaving(true);
    try {
      await updateGroupInfo({
        name: groupName.trim(),
        village: village.trim(),
        taluka: taluka.trim(),
        district: district.trim(),
        preferredLanguage: prefLang,
      });
    } catch (e) {
      setSaving(false);
      Alert.alert(t("error"), "Failed to update group information");
      return;
    }

    const newSettings: GroupSettings = {
      ...groupSettings,
      monthlyContributionAmount: amount,
      contributionDueDay: dDay,
      lateFeeAmount: fee,
      lateFeeType: lateFeeType,
      gracePeriodDays: grace
    };
    await updateGroupSettings(newSettings);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t("success"), t("settingsSaved"), [{ text: "OK", onPress: () => router.back() }]);
  };

  const handleReset = () => {
    Alert.alert(
      t("resetDefaults"),
      "Reset all contribution settings to defaults?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setMonthlyAmount(String(DEFAULT_SETTINGS.monthlyContributionAmount || 100));
            setDueDay(String(DEFAULT_SETTINGS.contributionDueDay || 5));
            setLateFee(String(DEFAULT_SETTINGS.lateFeeAmount || 10));
            setLateFeeType(DEFAULT_SETTINGS.lateFeeType || "fixed");
            setGracePeriod(String(DEFAULT_SETTINGS.gracePeriodDays || 5));
          },
        },
      ]
    );
  };

  if (!isPresident) {
    return (
      <View style={styles.accessDenied}>
        <Ionicons name="lock-closed" size={48} color={Colors.light.textMuted} />
        <Text style={styles.accessDeniedText}>{t("presidentOnly")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top) + 12,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.title}>{t("settings.contribution_settings")}</Text>
          <Pressable onPress={handleReset}>
            <Ionicons name="refresh" size={22} color={Colors.light.textMuted} />
          </Pressable>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("superAdmin.shg_name")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="people-outline" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput style={styles.input} value={groupName} onChangeText={setGroupName} placeholderTextColor={Colors.light.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("village")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholderTextColor={Colors.light.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("taluka")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="map-outline" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput style={styles.input} value={taluka} onChangeText={setTaluka} placeholderTextColor={Colors.light.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("district")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="map" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholderTextColor={Colors.light.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("auto.language")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="language-outline" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <Pressable onPress={() => setPrefLang("mr")} style={[styles.input, { flex: 1, backgroundColor: prefLang === 'mr' ? Colors.light.primary : 'transparent', padding: 10, borderRadius: 8 }]}>
              <Text style={{ color: prefLang === 'mr' ? '#fff' : Colors.light.text, textAlign: 'center' }}>{t("auto.mr")}</Text>
            </Pressable>
            <Pressable onPress={() => setPrefLang("en")} style={[styles.input, { flex: 1, backgroundColor: prefLang === 'en' ? Colors.light.primary : 'transparent', padding: 10, borderRadius: 8 }]}>
              <Text style={{ color: prefLang === 'en' ? '#fff' : Colors.light.text, textAlign: 'center' }}>{t("auto.en")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.monthly_contribution")}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.rupee}>Rs.</Text>
            <TextInput
              style={styles.input}
              value={monthlyAmount}
              onChangeText={setMonthlyAmount}
              keyboardType="number-pad"
              placeholder="100"
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>
          <Text style={styles.fieldHint}>
            Amount expected from each active member every month
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.contribution_due_day")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={dueDay}
              onChangeText={setDueDay}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={Colors.light.textMuted}
            />
            <Text style={styles.suffix}>{t("settings.th_of_month")}</Text>
          </View>
          <Text style={styles.fieldHint}>
            Day of the month when contributions are due (1-28)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.grace_period_days")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="time-outline" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={gracePeriod}
              onChangeText={setGracePeriod}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={Colors.light.textMuted}
            />
            <Text style={styles.suffix}>{t("settings.days")}</Text>
          </View>
          <Text style={styles.fieldHint}>
            Days allowed after due date before late fee is applied
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.late_fee_setup")}</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>{t("settings.fixed_amount")}</Text>
            <Switch
              value={lateFeeType === "percentage"}
              onValueChange={(val) => setLateFeeType(val ? "percentage" : "fixed")}
              trackColor={{ false: Colors.light.primary, true: Colors.light.secondary }}
            />
            <Text style={styles.toggleText}>{t("settings.percentage")}</Text>
          </View>

          <View style={[styles.inputContainer, { marginTop: 12 }]}>
            {lateFeeType === "fixed" && <Text style={styles.rupee}>Rs.</Text>}
            <TextInput
              style={styles.input}
              value={lateFee}
              onChangeText={setLateFee}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={Colors.light.textMuted}
            />
            {lateFeeType === "percentage" && <Text style={styles.suffix}>{t("settings.percent_of_expected")}</Text>}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? t("saving") : t("save")}</Text>
        </Pressable>

        {/* ─── Affiliated Banks (President only) ─────────────────── */}
        {isPresident && (
          <View style={[styles.section, { marginTop: 32 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>{t("bank.affiliated_banks")}</Text>
              <Pressable
                onPress={() => openBankModal()}
                style={({ pressed }) => [styles.addBankBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBankBtnText}>{t("bank.add_bank")}</Text>
              </Pressable>
            </View>

            {affiliatedBanks.length === 0 ? (
              <Text style={styles.emptyBanks}>{t("bank.no_banks_configured")}</Text>
            ) : (
              affiliatedBanks.map((bank) => (
                <View key={bank.id} style={styles.bankCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.bankCardName}>{bank.name}</Text>
                      <View style={[styles.bankBadge, { backgroundColor: bank.isActive ? "#22c55e20" : "#ef444420" }]}>
                        <Text style={[styles.bankBadgeText, { color: bank.isActive ? "#22c55e" : "#ef4444" }]}>
                          {bank.isActive ? t("bank.bank_active") : t("bank.bank_inactive")}
                        </Text>
                      </View>
                    </View>
                    {bank.branch ? <Text style={styles.bankCardSub}>{bank.branch}</Text> : null}
                    {bank.ifscCode ? <Text style={styles.bankCardSub}>IFSC: {bank.ifscCode}</Text> : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => openBankModal(bank)} style={styles.bankActionBtn}>
                      <Ionicons name="pencil-outline" size={16} color={Colors.light.primary} />
                    </Pressable>
                    {bank.isActive && (
                      <Pressable onPress={() => handleDeactivateBank(bank)} style={[styles.bankActionBtn, { backgroundColor: "#ef444420" }]}>
                        <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Bank Modal ──────────────────────────────────────────── */}
      <Modal visible={bankModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingBank ? t("bank.edit_bank") : t("bank.add_bank")}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              {[
                { label: t("bank.bank_name"), val: bankName, set: setBankName, req: true },
                { label: t("bank.bank_branch"), val: bankBranch, set: setBankBranch },
                { label: t("bank.ifsc_code"), val: bankIfsc, set: setBankIfsc },
                { label: t("bank.contact_person"), val: bankContact, set: setBankContact },
                { label: t("bank.contact_number"), val: bankPhone, set: setBankPhone, keyboard: "phone-pad" },
                { label: t("bank.bank_notes"), val: bankNotesVal, set: setBankNotesVal, multiline: true },
              ].map((field) => (
                <View key={field.label} style={{ marginBottom: 12 }}>
                  <Text style={styles.modalLabel}>{field.label}{field.req ? " *" : ""}</Text>
                  <TextInput
                    style={[styles.modalInput, field.multiline && { height: 80, textAlignVertical: "top" }]}
                    value={field.val}
                    onChangeText={field.set}
                    keyboardType={field.keyboard || "default"}
                    multiline={!!field.multiline}
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: Colors.light.card, flex: 1 }]}
                onPress={() => setBankModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: Colors.light.text }]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: Colors.light.primary, flex: 1, opacity: bankSaving ? 0.7 : 1 }]}
                onPress={handleSaveBank}
                disabled={bankSaving}
              >
                <Text style={styles.modalBtnText}>{bankSaving ? t("saving") : t("save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.text,
  },
  rupee: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  suffix: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  fieldHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  toggleText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  accessDeniedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
  // Bank styles
  addBankBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBankBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  emptyBanks: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
  bankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bankCardName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  bankCardSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  bankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bankBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },
  bankActionBtn: {
    backgroundColor: Colors.light.primary + "20",
    padding: 8,
    borderRadius: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 16,
  },
  modalLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
  },
  modalBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
