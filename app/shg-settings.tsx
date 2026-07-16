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
import { useData, GroupSettings, DEFAULT_SETTINGS } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function ShgSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { group, isPresident } = useAuth();
  const { groupSettings, updateGroupSettings, updateGroupInfo } = useData();


  const [groupName, setGroupName] = useState(group?.name || "");
  const [village, setVillage] = useState(group?.village || "");
  const [taluka, setTaluka] = useState(group?.taluka || "");
  const [district, setDistrict] = useState(group?.district || "");

  const [monthlyAmount, setMonthlyAmount] = useState(String(groupSettings.monthlyContributionAmount || 100));
  const [dueDay, setDueDay] = useState(String(groupSettings.contributionDueDay || 5));
  const [lateFee, setLateFee] = useState(String(groupSettings.lateFeeAmount || 10));
  const [lateFeeType, setLateFeeType] = useState<"fixed" | "daily" | "none">(groupSettings.lateFeeType || "fixed");
  const [gracePeriod, setGracePeriod] = useState(String(groupSettings.gracePeriodDays || 5));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amount = parseInt(monthlyAmount);
    const dDay = parseInt(dueDay);
    const fee = parseInt(lateFee);
    const grace = parseInt(gracePeriod);

    if (!amount || amount <= 0) {
      const msg = "Please enter a valid monthly contribution amount";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    if (!dDay || dDay < 1 || dDay > 28) {
      const msg = "Due day must be between 1 and 28";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    if (!fee || fee < 0) {
      const msg = "Late fee must be 0 or greater";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    if (!grace || grace < 0) {
      const msg = "Grace period must be 0 or greater";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }

    if (!groupName.trim()) {
      const msg = "Group name is required";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
      return;
    }
    setSaving(true);
    try {
      await updateGroupInfo({
        name: groupName.trim(),
        village: village.trim(),
        taluka: taluka.trim(),
        district: district.trim(),
      });
    } catch (e) {
      setSaving(false);
      const msg = "Failed to update group information";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert(t("error"), msg);
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
    
    if (Platform.OS === "web") {
      window.alert(t("settingsSaved") || "Settings saved successfully");
      router.back();
    } else {
      Alert.alert(t("success"), t("settingsSaved") || "Settings saved successfully", [{ text: "OK", onPress: () => router.back() }]);
    }
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
            paddingTop: (Platform.OS === "web" ? 0 : insets.top) + 12,
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
          <Text style={styles.sectionTitle}>{t("settings.late_fee_setup") || "Late Fee Setup"}</Text>
          <View style={[styles.inputContainer, { paddingHorizontal: 0, overflow: 'hidden' }]}>
            <Picker
              selectedValue={lateFeeType}
              onValueChange={(val: any) => {
                setLateFeeType(val);
                if (val === "none") setLateFee("0");
              }}
              style={{ flex: 1, backgroundColor: 'transparent', color: Colors.light.text, borderWidth: 0, outline: 'none', paddingLeft: 16 }}
            >
              <Picker.Item label={t("settings.fixed_amount") || "Fixed Amount"} value="fixed" />
              <Picker.Item label={t("settings.daily_amount") || "Daily Amount"} value="daily" />
              <Picker.Item label={t("settings.no_late_fee") || "No Late Fee"} value="none" />
            </Picker>
          </View>

          {lateFeeType !== "none" && (
            <View style={[styles.inputContainer, { marginTop: 16 }]}>
              {lateFeeType === "fixed" && <Text style={styles.rupee}>Rs.</Text>}
              <TextInput
                style={styles.input}
                value={lateFee}
                onChangeText={setLateFee}
                keyboardType="number-pad"
                placeholder={lateFeeType === "daily" ? "e.g. 5" : "e.g. 50"}
                placeholderTextColor={Colors.light.textMuted}
              />
              {lateFeeType === "daily" && <Text style={styles.suffix}>{t("settings.per_day") || "/ day"}</Text>}
            </View>
          )}
        </View>

        {lateFeeType !== "none" && (
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
        )}

        <Pressable
          style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Text style={styles.saveBtnText}>{t("saving") || "Saving..."}</Text>
          ) : (
            <Text style={styles.saveBtnText}>{t("save") || "Save"}</Text>
          )}
        </Pressable>



        <View style={{ height: 40 }} />
      </ScrollView>


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
