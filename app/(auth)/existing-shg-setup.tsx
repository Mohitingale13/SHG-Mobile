import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Platform, Alert, KeyboardAvoidingView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { apiPost } from "@/lib/api";
import SHGDatePicker from "@/components/SHGDatePicker";

export default function ExistingSHGSetupScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { group, user } = useAuth();
  
  const [openingDate, setOpeningDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalSavings, setTotalSavings] = useState("");
  const [cashInHand, setCashInHand] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!group?.groupId) return;
    
    const savingsNum = parseInt(totalSavings || "0");
    const cashNum = parseInt(cashInHand || "0");
    const bankNum = parseInt(bankBalance || "0");

    if (isNaN(savingsNum) || isNaN(cashNum) || isNaN(bankNum)) {
      Alert.alert(t("error") || "Error", t("invalid_amount") || "Please enter valid numeric amounts.");
      return;
    }

    setLoading(true);
    try {
      await apiPost(`/api/groups/${group.groupId}/opening-balances`, {
        openingDate,
        totalSavings: savingsNum,
        cashInHand: cashNum,
        bankBalance: bankNum
      });
      
      router.replace("/(main)" as any);
    } catch (e: any) {
      Alert.alert(t("error") || "Error", e.message || "Failed to save opening balances.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: (Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top) + 16, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t("setup.opening_balances") || "Opening Balances"}</Text>
        <Text style={styles.subtitle}>
          {t("setup.opening_balances_desc") || "Enter the financial position of your SHG as of the day you are starting to use this application.\n\nYou do not need to enter previous monthly records now. Those can be added later if required."}
        </Text>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>{t("setup.opening_date") || "Opening Date"}</Text>
          <SHGDatePicker
            value={openingDate}
            onSelect={setOpeningDate}
            style={styles.datePicker}
          />

          <Text style={styles.inputLabel}>{t("setup.total_savings") || "Total Accumulated Savings (Rs)"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="wallet-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              value={totalSavings}
              onChangeText={(text) => setTotalSavings(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.inputLabel}>{t("setup.cash_in_hand") || "Current Cash In Hand (Rs)"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              value={cashInHand}
              onChangeText={(text) => setCashInHand(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.inputLabel}>{t("setup.bank_balance") || "Current Bank Account Balance (Rs)"}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              value={bankBalance}
              onChangeText={(text) => setBankBalance(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.infoBoxText}>
              {t("setup.opening_balances_note") || "Do not worry about member distributions right now. You can manage member lists and assign active loans from the Dashboard after completing this setup."}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? t("saving") || "Saving..." : t("continue") || "Continue to Dashboard"}</Text>
          {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.light.text,
    marginBottom: -8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  datePicker: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary + "15",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.primary,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  btn: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
