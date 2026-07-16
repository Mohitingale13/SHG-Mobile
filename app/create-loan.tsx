import { useState, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData, getDurationRuleForAmount, validateLoanRequest } from "@/contexts/DataContext";
import { numberToMarathiWords } from "@/lib/numberToMarathiWords";
import Colors from "@/constants/colors";

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateLoanScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { verifyPassword, user, isPresident, isTreasurer } = useAuth();
  const { requestLoan, groupSettings, groupMembers, isMigrationWindow } = useData();

  // Active members only (excluding left/exited)
  const activeMembers = useMemo(
    () => groupMembers.filter((m) => m.status === "active"),
    [groupMembers],
  );

  // ── Migration mode state (only available when isMigrationWindow)
  const [isMigration, setIsMigration] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false); // false=Active, true=Completed
  const [migrationOutstanding, setMigrationOutstanding] = useState("");
  const [migrationLoanDate, setMigrationLoanDate] = useState(new Date().toISOString().split("T")[0]);
  const [migrationMemberId, setMigrationMemberId] = useState<string | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState(todayISO());

  const [memberError, setMemberError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [durationError, setDurationError] = useState("");
  const [startDateError, setStartDateError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ── Derived values ─────────────────────────────────────────────────────────
  const numAmount = parseInt(amount) || 0;
  const numDuration = parseInt(duration) || 0;

  const selectedMember = useMemo(
    () => activeMembers.find((m) => m.id === selectedMemberId) ?? null,
    [activeMembers, selectedMemberId],
  );

  const applicableRule = useMemo(() => {
    if (numAmount <= 0) return null;
    return getDurationRuleForAmount(numAmount, groupSettings.durationRules);
  }, [numAmount, groupSettings.durationRules]);

  const durationHint = useMemo(() => {
    if (!applicableRule) return "";
    return language === "en"
      ? `${applicableRule.minDuration}–${applicableRule.maxDuration} months`
      : `${applicableRule.minDuration}–${applicableRule.maxDuration} महिने`;
  }, [applicableRule, language]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateFields = (): boolean => {
    let valid = true;
    setMemberError("");
    setAmountError("");
    setDurationError("");
    setStartDateError("");

    if (!isMigration) {
        if (!selectedMemberId) {
          setMemberError(language === "en" ? "Please select a member" : "कृपया सदस्य निवडा");
          valid = false;
        }
    }

    if (!numAmount || numAmount <= 0) {
      setAmountError(t("invalidAmount"));
      valid = false;
    } else if (numAmount > groupSettings.maxLoanAmount) {
      setAmountError(t("exceedsMaxLoan") + ` (Max: Rs. ${groupSettings.maxLoanAmount.toLocaleString("en-IN")})`);
      valid = false;
    }

    if (!numDuration || numDuration <= 0) {
      setDurationError(t("auto.please_enter_a_valid_duration"));
      valid = false;
    }

    if (!startDate.trim()) {
      setStartDateError(language === "en" ? "Start date is required" : "प्रारंभ तारीख आवश्यक आहे");
      valid = false;
    } else if (!isValidDate(startDate)) {
      setStartDateError(language === "en" ? "Invalid date (use YYYY-MM-DD)" : "अवैध तारीख (YYYY-MM-DD वापरा)");
      valid = false;
    }

    return valid;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreatePress = () => {
    if (!validateFields()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPassword("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError(t("auto.please_enter_your_password"));
      return;
    }
    const isValid = await verifyPassword(password);
    if (!isValid) {
      setPasswordError(t("auto.incorrect_password"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setShowPasswordModal(false);
    setLoading(true);


    const payload: any = {
      amount: numAmount,
      duration: numDuration,
      memberId: selectedMemberId,
      memberName: selectedMember?.name ?? "",
      startDate: startDate.trim(),
    };
    if (isMigration) {
      payload.isExisting = true;
      payload.loanDate = migrationLoanDate;
      if (migrationCompleted) {
        payload.isCompleted = true;
      } else {
        payload.outstandingPrincipal = parseInt(migrationOutstanding) || numAmount;
      }
      if (migrationMemberId && (isPresident || isTreasurer)) payload.memberId = migrationMemberId;
    }

    const error = await requestLoan(payload);
    setLoading(false);
    if (error) {
      Alert.alert(t("error"), t(error));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.title}>
            {language === "en" ? "Create Loan" : "कर्ज तयार करा"}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {/* ─── Policy summary card ─────────────────────────────────────────── */}
        <View style={styles.policyCard}>
          <View style={styles.policyRow}>
            <View style={styles.policyItem}>
              <Ionicons name="trending-up" size={18} color={Colors.light.secondary} />
              <Text style={styles.policyLabel}>{t("auto.interest")}</Text>
              <Text style={styles.policyValue}>{groupSettings.interestRate}%</Text>
            </View>
            <View style={styles.policyDivider} />
            <View style={styles.policyItem}>
              <Ionicons name="cash" size={18} color={Colors.light.primary} />
              <Text style={styles.policyLabel}>{t("auto.max_loan")}</Text>
              <Text style={styles.policyValue}>Rs. {groupSettings.maxLoanAmount.toLocaleString("en-IN")}</Text>
            </View>
          </View>
          <Text style={styles.policyNote}>
            <Ionicons name="information-circle" size={13} color={Colors.light.textMuted} />
            {" "}{t("autoInterest")}
          </Text>
        </View>

        <View style={styles.form}>

          {/* ─── Member Selector ──────────────────────────────────────────── */}
          <Text style={styles.label}>
            {language === "en" ? "Select Member *" : "सदस्य निवडा *"}
          </Text>
          <View style={[styles.pickerWrapper, !!memberError && styles.inputError]}>
            <Ionicons name="person" size={18} color={Colors.light.textSecondary} style={{ marginLeft: 14 }} />
            <Picker
              selectedValue={selectedMemberId}
              onValueChange={(val) => { setSelectedMemberId(val); setMemberError(""); }}
              style={styles.picker}
              dropdownIconColor={Colors.light.textSecondary}
            >
              <Picker.Item
                label={language === "en" ? "— Choose a member —" : "— सदस्य निवडा —"}
                value=""
                color={Colors.light.textMuted}
              />
              {activeMembers.map((m) => (
                <Picker.Item key={m.id} label={m.name} value={m.id} color={Colors.light.text} />
              ))}
            </Picker>
          </View>
          {!!memberError && <Text style={styles.errorText}>{memberError}</Text>}

          {/* ─── Loan Amount ──────────────────────────────────────────────── */}
          <Text style={[styles.label, { marginTop: 12 }]}>{t("loanAmount")} (Rs.) *</Text>
          <View style={[styles.inputContainer, !!amountError && styles.inputError]}>
            <Text style={styles.rupee}>Rs.</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              value={amount}
              onChangeText={(v) => { setAmount(v); setAmountError(""); }}
              keyboardType="number-pad"
            />
          </View>
          {!!numberToMarathiWords(amount) && (
            <Text style={styles.amountInWords}>{numberToMarathiWords(amount)}</Text>
          )}
          {!!amountError && <Text style={styles.errorText}>{amountError}</Text>}

          {/* ─── Duration ────────────────────────────────────────────────── */}
          <Text style={[styles.label, { marginTop: 12 }]}>{t("duration")} *</Text>
          <View style={[styles.inputContainer, !!durationError && styles.inputError]}>
            <Ionicons name="time-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              value={duration}
              onChangeText={(v) => { setDuration(v); setDurationError(""); }}
              keyboardType="number-pad"
            />
            <Text style={styles.suffix}>{t("auto.months")}</Text>
          </View>
          {!!durationError && <Text style={styles.errorText}>{durationError}</Text>}

          {Number(amount) > 0 && Number(duration) > 0 && (
            <View style={{ marginTop: 16, marginBottom: 16, padding: 16, backgroundColor: Colors.light.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, elevation: 1, ...Platform.select({ web: { boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }, default: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } }) }}>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Ionicons name="calculator" size={18} color={Colors.light.primary} />
                <Text style={styles.summaryTitle}>{t("Repayment Summary")}</Text>
              </View>

              {selectedMember && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {language === "en" ? "For Member" : "सदस्यासाठी"}
                  </Text>
                  <Text style={[styles.summaryValue, { color: Colors.light.primary }]}>{selectedMember.name}</Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("loanAmount")}</Text>
                <Text style={styles.summaryValue}>Rs. {numAmount.toLocaleString("en-IN")}</Text>
              </View>

              <View style={[styles.summaryRow, styles.summaryDivider]}>
                <Text style={styles.summaryLabel}>
                  {t("interest")} ({groupSettings?.interestRate || 2}% {t("Per month")})
                </Text>
                <Text style={styles.summaryValue}>
                  + Rs. {Math.round(numAmount * (groupSettings?.interestRate || 2) / 100 * numDuration).toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={[styles.summaryLabel, { fontFamily: "Poppins_600SemiBold", color: Colors.light.text }]}>
                  {t("Total amount to Return")}
                </Text>
                <Text style={[styles.summaryValue, { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.light.primary }]}>
                  Rs. {(numAmount + Math.round(numAmount * (groupSettings?.interestRate || 2) / 100 * numDuration)).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          )}

          {/* ─── Security note ────────────────────────────────────────────── */}
          {/* ── Migration Entry (only within 30-day window, only for President/Treasurer) ── */}
          {isMigrationWindow && (isPresident || isTreasurer) && (
            <View style={{ marginTop: 16, borderWidth: 1, borderColor: Colors.light.primary + "80", borderRadius: 14, padding: 14, backgroundColor: Colors.light.primary + "10" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="time-outline" size={18} color={Colors.light.primary} />
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.light.text }}>
                    {t("migration.entry_mode") || "Historical Entry (Migration)"}
                  </Text>
                </View>
                <Switch
                  value={isMigration}
                  onValueChange={(v: boolean) => { setIsMigration(v); setMigrationCompleted(false); }}
                  trackColor={{ false: Colors.light.border, true: Colors.light.primary + "80" }}
                  thumbColor={isMigration ? Colors.light.primary : Colors.light.textMuted}
                />
              </View>
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginBottom: isMigration ? 12 : 0 }}>
                {t("migration.entry_desc") || "Use this to log a loan that existed before the app was set up."}
              </Text>

              {isMigration && (
                <>
                  {/* Active vs Completed toggle */}
                  <View style={{ flexDirection: "row", backgroundColor: Colors.light.border + "60", borderRadius: 10, padding: 3, marginBottom: 12 }}>
                    <Pressable
                      style={{ flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: !migrationCompleted ? Colors.light.primary : "transparent", alignItems: "center" }}
                      onPress={() => setMigrationCompleted(false)}
                    >
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: !migrationCompleted ? "#fff" : Colors.light.textSecondary }}>
                        {t("migration.active_loan") || "Still Active"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={{ flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: migrationCompleted ? Colors.light.success : "transparent", alignItems: "center" }}
                      onPress={() => setMigrationCompleted(true)}
                    >
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: migrationCompleted ? "#fff" : Colors.light.textSecondary }}>
                        {t("migration.completed_loan") || "Fully Repaid"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Disbursal Date */}
                  <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.light.text, marginBottom: 6 }}>
                    {t("migration.loan_date") || "Disbursal Date"}
                  </Text>
                  <View style={{ backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
                    <TextInput
                      style={{ flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.text }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.light.textMuted}
                      value={migrationLoanDate}
                      onChangeText={setMigrationLoanDate}
                    />
                  </View>

                  {/* Outstanding Principal (only for active) */}
                  {!migrationCompleted && (
                    <>
                      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.light.text, marginBottom: 6 }}>
                        {t("migration.outstanding_principal") || "Outstanding Principal (Rs.)"}
                      </Text>
                      <View style={{ backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontFamily: "Poppins_600SemiBold", color: Colors.light.textSecondary }}>Rs.</Text>
                        <TextInput
                          style={{ flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.text }}
                          placeholder="How much is still owed?"
                          placeholderTextColor={Colors.light.textMuted}
                          value={migrationOutstanding}
                          onChangeText={setMigrationOutstanding}
                          keyboardType="number-pad"
                        />
                      </View>
                    </>
                  )}

                  {/* Member selector (President can pick any member) */}
                  <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.light.text, marginBottom: 6 }}>
                    {t("migration.select_member") || "Member (leave blank = self)"}
                  </Text>
                  <Pressable
                    style={{ backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                    onPress={() => setShowMemberPicker(true)}
                  >
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: migrationMemberId ? Colors.light.text : Colors.light.textMuted }}>
                      {migrationMemberId ? groupMembers.find(m => m.id === migrationMemberId)?.name || t("auto.select_member") || "Select member" : t("auto.self") || "Self (Me)"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.light.textSecondary} />
                  </Pressable>
                </>
              )}
            </View>
          )}

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color={Colors.light.secondary} />
            <Text style={styles.securityText}>
              {t("auto.password_verification_required_before_submitting")}
            </Text>
          </View>

          {/* ─── Submit button ────────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreatePress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {language === "en" ? "Create Loan" : "कर्ज तयार करा"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── Password confirmation modal ─────────────────────────────────── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalIconWrapper}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.light.secondary} />
              </View>
              <Text style={styles.modalTitle}>{t("auto.verify_identity")}</Text>
              <Text style={styles.modalSubtitle}>
                {t("auto.enter_your_password_to_confirm")}
              </Text>

              {/* Summary box */}
              <View style={styles.modalSummary}>
                <Text style={styles.modalSummaryMember}>
                  {language === "en" ? "Member: " : "सदस्य: "}
                  <Text style={{ color: Colors.light.primary }}>{selectedMember?.name ?? "—"}</Text>
                </Text>
                <Text style={styles.modalSummaryText}>
                  {t("auto.amount")}: Rs. {numAmount.toLocaleString("en-IN")}
                  {"  ·  "}{t("auto.duration")}: {numDuration} {t("auto.mo")}
                  {"  ·  "}{t("auto.interest")}: {groupSettings.interestRate}%
                </Text>
                <Text style={styles.modalSummaryDate}>
                  {language === "en" ? "Start date: " : "प्रारंभ तारीख: "}{startDate}
                </Text>
              </View>

              <View style={styles.modalInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} />
                <TextInput
                  style={styles.modalInput}
                  placeholder={t("auto.enter_password")}
                  placeholderTextColor={Colors.light.textMuted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(""); }}
                  secureTextEntry
                  autoFocus
                />
              </View>
              {!!passwordError && <Text style={styles.modalErrorText}>{passwordError}</Text>}
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowPasswordModal(false)}>
                  <Text style={styles.modalCancelText}>{t("cancel")}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.modalConfirmBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={handlePasswordSubmit}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.modalConfirmText}>{t("confirm")}</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Member picker for migration mode */}
      <Modal visible={showMemberPicker} transparent animationType="slide" onRequestClose={() => setShowMemberPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMemberPicker(false)}>
          <View style={[styles.modalContent, { maxHeight: "70%" }]}>
            <Text style={styles.modalTitle}>{t("migration.select_member") || "Select Member"}</Text>
            <ScrollView>
              <Pressable
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.light.border }}
                onPress={() => { setMigrationMemberId(null); setShowMemberPicker(false); }}
              >
                <Text style={{ fontFamily: "Poppins_500Medium", color: Colors.light.primary }}>{t("auto.self") || "Self (Me)"}</Text>
              </Pressable>
              {groupMembers.filter(m => m.status === "active" && m.id !== user?.id).map((m) => (
                <Pressable
                  key={m.id}
                  style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.light.border, backgroundColor: migrationMemberId === m.id ? Colors.light.primary + "15" : "transparent" }}
                  onPress={() => { setMigrationMemberId(m.id); setShowMemberPicker(false); }}
                >
                  <Text style={{ fontFamily: "Poppins_500Medium", color: Colors.light.text }}>{m.name}</Text>
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.textSecondary }}>{m.phone}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  policyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  policyItem: { alignItems: "center", gap: 4, flex: 1 },
  policyDivider: { width: 1, height: 40, backgroundColor: Colors.light.border },
  policyLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  policyValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.light.text,
  },
  policyNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  form: { gap: 4 },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  // Member picker wrapper — matches inputContainer visually
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  picker: {
    flex: 1,
    color: Colors.light.text,
    height: Platform.OS === "ios" ? undefined : 52,
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
  inputError: { borderColor: Colors.light.danger },
  inputIcon: { marginRight: 10 },
  rupee: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 14,
  },
  suffix: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.danger,
    marginLeft: 4,
    marginTop: 4,
  },
  amountInWords: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    marginLeft: 4,
    marginTop: 6,
    fontStyle: "italic",
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4, marginTop: 4 },
  hintText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.primary,
    marginLeft: 4,
    marginTop: 4,
  },
  rulesCard: {
    backgroundColor: Colors.light.primary + "08",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
  },
  rulesTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  ruleRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  ruleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.text,
    flex: 1,
  },
  summaryCard: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryDivider: {
    paddingBottom: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.secondary + "10",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  securityText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  submitBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  // Modal
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
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.secondary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  modalSummary: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: "100%",
    gap: 4,
  },
  modalSummaryMember: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
    textAlign: "center",
  },
  modalSummaryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.text,
    textAlign: "center",
  },
  modalSummaryDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    width: "100%",
    gap: 10,
  },
  modalInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 14,
  },
  modalErrorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.danger,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20, width: "100%" },
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
    backgroundColor: Colors.light.secondary,
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
