import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData, GroupSettings, DurationRule, DEFAULT_SETTINGS } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

export default function LoanSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { isPresident } = useAuth();
  const { groupSettings, updateGroupSettings } = useData();

  const [interestRate, setInterestRate] = useState(String(groupSettings.interestRate));
  const [maxLoanAmount, setMaxLoanAmount] = useState(String(groupSettings.maxLoanAmount));
  const [rules, setRules] = useState<DurationRule[]>(
    groupSettings.durationRules.map((r) => ({ ...r }))
  );
  const [saving, setSaving] = useState(false);

  const updateRule = (index: number, field: keyof DurationRule, value: string) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: parseInt(value) || 0 } : r))
    );
  };

  const addRule = () => {
    const lastMax = rules.length > 0 ? Math.max(...rules.map((r) => r.maxAmount)) : 0;
    setRules((prev) => [...prev, { maxAmount: lastMax + 10000, minDuration: 1, maxDuration: 12 }]);
  };

  const removeRule = (index: number) => {
    if (rules.length <= 1) {
      Alert.alert(t("error"), t("validation.at_least_one_rule"));
      return;
    }
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const rate = parseFloat(interestRate);
    const maxAmount = parseInt(maxLoanAmount);

    if (!rate || rate <= 0 || rate > 100) {
      Alert.alert(t("error"), t("validation.interest_rate_range"));
      return;
    }
    if (!maxAmount || maxAmount <= 0) {
      Alert.alert(t("error"), t("validation.valid_max_loan"));
      return;
    }
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.maxAmount || rule.maxAmount <= 0) {
        Alert.alert(t("error"), t("validation.enter_valid_amount_rule").replace("{n}", String(i+1)));
        return;
      }
      if (!rule.minDuration || rule.minDuration <= 0) {
        Alert.alert(t("error"), t("validation.min_duration_one_rule").replace("{n}", String(i+1)));
        return;
      }
      if (!rule.maxDuration || rule.maxDuration < rule.minDuration) {
        Alert.alert(t("error"), t("validation.max_duration_greater_rule").replace("{n}", String(i+1)));
        return;
      }
    }

    setSaving(true);
    const newSettings: GroupSettings = {
      interestRate: rate,
      maxLoanAmount: maxAmount,
      durationRules: [...rules].sort((a, b) => a.maxAmount - b.maxAmount),
    };
    await updateGroupSettings(newSettings);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t("success"), t("settingsSaved"), [{ text: "OK", onPress: () => router.back() }]);
  };

  const handleReset = () => {
    Alert.alert(
      t("resetDefaults"),
      t("auto.reset_all_loan_settings_to"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("auto.reset"),
          style: "destructive",
          onPress: () => {
            setInterestRate(String(DEFAULT_SETTINGS.interestRate));
            setMaxLoanAmount(String(DEFAULT_SETTINGS.maxLoanAmount));
            setRules(DEFAULT_SETTINGS.durationRules.map((r) => ({ ...r })));
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
          <Text style={styles.title}>{t("loanSettings")}</Text>
          <Pressable onPress={handleReset}>
            <Ionicons name="refresh" size={22} color={Colors.light.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("interestRate")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="trending-up" size={20} color={Colors.light.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              placeholder="2"
              placeholderTextColor={Colors.light.textMuted}
            />
            <Text style={styles.suffix}>%</Text>
          </View>
          <Text style={styles.fieldHint}>
            {t("auto.applied_automatically_to_all_new")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("maxLoanAmount")}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.rupee}>Rs.</Text>
            <TextInput
              style={styles.input}
              value={maxLoanAmount}
              onChangeText={setMaxLoanAmount}
              keyboardType="number-pad"
              placeholder="50000"
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>
          <Text style={styles.fieldHint}>
            {t("auto.no_member_can_request_a")}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{t("saveSettings")}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fieldHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  rupee: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 13,
  },
  suffix: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  addBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
  },
  ruleCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  ruleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ruleCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeBtnText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.danger,
  },
  ruleFieldLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    marginLeft: 2,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  durationSep: {
    paddingBottom: 13,
  },
  durationSepText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.textMuted,
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  accessDeniedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
  },
});
