import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  TextInput, Modal, Alert, Switch
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData } from "@/contexts/DataContext";
import { resolveRepaymentAmounts, calculateShgTotal, calculateBankTotal, calculateShgEmi, calculateBankEmi } from "@/shared/accounting";
import Colors from "@/constants/colors";
import ConfirmDialog from "@/components/ConfirmDialog";

function loanStatusColor(status: string): string {
  switch (status) {
    case "approved": return Colors.light.success;
    case "rejected": return Colors.light.danger;
    case "treasurer_rejected": return Colors.light.danger;
    case "pending_treasurer": return "#D97706";
    case "pending_president": return Colors.light.pending;
    default: return Colors.light.pending;
  }
}

type DialogType = "approveTreasurer" | "rejectTreasurer" | "rejectPresident" | "deleteLoan" | null;

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isPresident, isTreasurer, user } = useAuth();
  const { t, language } = useLanguage();
  const {
    loans, loanRepayments,
    treasurerApproveLoan, treasurerRejectLoan,
    approveLoan, rejectLoan,
    addRepayment, deleteRepayment, deleteLoan,
    affiliatedBanks,
  } = useData();
  const loan = loans.find((l) => l.id === id);

  const [resolutionNo, setResolutionNo] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [shgRepayAmount, setShgRepayAmount] = useState("");
  const [bankRepayAmount, setBankRepayAmount] = useState("");
  const [showRepay, setShowRepay] = useState(false);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteRepaymentId, setDeleteRepaymentId] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState(false);

  const [hasBankLoan, setHasBankLoan] = useState(loan?.hasBankLoan || false);
  const [bankName, setBankName] = useState(loan?.bankName || "");
  const [bankAmount, setBankAmount] = useState(loan?.bankLoanAmount?.toString() || "");
  const [bankInterestRate, setBankInterestRate] = useState(loan?.bankInterestRate?.toString() || "");
  const [bankDuration, setBankDuration] = useState(loan?.bankDuration?.toString() || "");
  const [bankRemarks, setBankRemarks] = useState(loan?.bankLoanRemarks || "");

  const validateBankDetails = () => {
    if (!hasBankLoan) return true;
    if (!bankName.trim()) { Alert.alert(t("error"), t("bank.bank_required")); return false; }
    if (!parseInt(bankAmount) || parseInt(bankAmount) <= 0) { Alert.alert(t("error"), t("bank.bank_amount_required")); return false; }
    if (!parseInt(bankDuration) || parseInt(bankDuration) <= 0) { Alert.alert(t("error"), t("bank.bank_duration_required")); return false; }
    return true;
  };

  const getBankPayload = () => {
    if (!hasBankLoan) return { hasBankLoan: false };
    return {
      hasBankLoan: true,
      bankName: bankName.trim(),
      bankAmount: parseInt(bankAmount),
      bankInterestRate: parseFloat(bankInterestRate) || 0,
      bankDuration: parseInt(bankDuration),
      bankRemarks: bankRemarks.trim() || undefined
    };
  };

  if (!loan) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textMuted} />
        <Text style={styles.emptyText}>{t("auto.loan_not_found")}</Text>
      </View>
    );
  }

  const repayments = loanRepayments
    .filter((r) => r.loanId === loan.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const shgTotal = calculateShgTotal(loan);
  const bankTotal = calculateBankTotal(loan);
  const shgEmi = calculateShgEmi(loan);
  const bankEmi = calculateBankEmi(loan);
  let currentShgRem = shgTotal;
  let currentBankRem = bankTotal;

  const passbookEntries = [...repayments].reverse().map(r => {
    const { shgAmount, bankAmount } = resolveRepaymentAmounts(r);
    currentShgRem = Math.max(0, currentShgRem - shgAmount);
    currentBankRem = Math.max(0, currentBankRem - bankAmount);
    return {
      ...r,
      resolvedShg: shgAmount,
      resolvedBank: bankAmount,
      runShgRem: currentShgRem,
      runBankRem: currentBankRem,
    };
  }).reverse();

  const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
  const color = loanStatusColor(loan.status);

  const totalInterest = Math.round(loan.amount * (loan.interest / 100) * loan.duration);
  const bankInterest = loan.hasBankLoan ? Math.round((loan.bankLoanAmount || 0) * ((loan.bankInterestRate || 0) / 100) * (loan.bankDuration || 0)) : 0;
  const totalRepayable = loan.amount + totalInterest + (loan.hasBankLoan ? ((loan.bankLoanAmount || 0) + bankInterest) : 0);
  const rawProgress = totalRepayable > 0 ? (totalRepaid / totalRepayable) * 100 : 0;
  const progress = Math.min(100, Math.max(0, rawProgress));

  const handleTreasurerApprove = async () => {
    try {
      if (!validateBankDetails()) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await treasurerApproveLoan(loan.id, getBankPayload());
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const handleTreasurerReject = async () => {
    try {
      setDialog(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await treasurerRejectLoan(loan.id, rejectReason.trim() || undefined);
      setRejectReason("");
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const handleApprove = async () => {
    try {
      if (!resolutionNo.trim()) {
        setResolutionError(true);
        return;
      }
      if (!validateBankDetails()) return;
      setResolutionError(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await approveLoan(loan.id, resolutionNo.trim(), undefined, getBankPayload());
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const handleReject = async () => {
    try {
      setDialog(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await rejectLoan(loan.id, rejectReason.trim() || undefined);
      setRejectReason("");
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const handleRepay = async () => {
    try {
      if (loan.hasBankLoan) {
        const shgNum = parseInt(shgRepayAmount) || 0;
        const bankNum = parseInt(bankRepayAmount) || 0;
        if (shgNum <= 0 && bankNum <= 0) {
          Alert.alert(t("error"), t("bank.enter_at_least_one"));
          return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await addRepayment(loan.id, { shgAmount: shgNum, bankAmount: bankNum });
        setShgRepayAmount("");
        setBankRepayAmount("");
      } else {
        const num = parseInt(repayAmount);
        if (!num || num <= 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await addRepayment(loan.id, { shgAmount: num, bankAmount: 0 });
        setRepayAmount("");
      }
      setShowRepay(false);
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const handleDeleteRepayment = async () => {
    try {
      if (!deleteRepaymentId) return;
      setDeleteRepaymentId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteRepayment(deleteRepaymentId);
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const handleDeleteLoan = async () => {
    try {
      setDialog(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteLoan(loan.id);
      router.back();
    } catch (e: any) {
      Alert.alert(t("error"), e.message || t("error"));
    }
  };

  const showTreasurerActions = isTreasurer && loan.status === "pending_treasurer";
  const showPresidentActions = isPresident && (loan.status === "pending_president" || loan.status === "pending_treasurer");
  const isDirectOverride = loan.presidentOverride === true;
  const isFinal = loan.status === "approved" || loan.status === "rejected" || loan.status === "treasurer_rejected";
  const showRepayment = loan.status === "approved";
  const canDelete = isPresident;

  const renderBankForm = () => (
    <View style={{ marginTop: 12 }}>
      <View style={[styles.inputContainer, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, backgroundColor: Colors.light.card, borderWidth: 1, borderColor: hasBankLoan ? Colors.light.primary : Colors.light.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { marginBottom: 2 }]}>{t("Bank Assisted Loan")}</Text>
          <Text style={{ fontSize: 12, color: Colors.light.textMuted, fontFamily: "Poppins_400Regular" }}>
            {t("Bank assisted loan desc")}
          </Text>
        </View>
        <Switch
          value={hasBankLoan}
          onValueChange={setHasBankLoan}
          trackColor={{ false: Colors.light.border, true: Colors.light.primary + "80" }}
          thumbColor={hasBankLoan ? Colors.light.primary : "#f4f3f4"}
        />
      </View>

      {hasBankLoan && (
        <View style={styles.bankFormCard}>
          <Text style={styles.label}>{t("bank.select_bank")} *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("bank.select_bank")}
              placeholderTextColor={Colors.light.textMuted}
              value={bankName}
              onChangeText={setBankName}
              autoCapitalize="words"
            />
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{t("bank.bank_loan_amount")} *</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.rupeeText}>Rs.</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              value={bankAmount}
              onChangeText={setBankAmount}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t("bank.bank_interest_rate")}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  value={bankInterestRate}
                  onChangeText={setBankInterestRate}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.suffix}>%</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t("bank.bank_loan_duration")} *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.light.textMuted}
                  value={bankDuration}
                  onChangeText={setBankDuration}
                  keyboardType="number-pad"
                />
                <Text style={styles.suffix}>{t("auto.mo")}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{t("bank.bank_loan_remarks")}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("enter_remarks")}
              placeholderTextColor={Colors.light.textMuted}
              value={bankRemarks}
              onChangeText={setBankRemarks}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: (Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top) + 12, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("loanDetails")}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.statusBanner, { backgroundColor: color + "18" }]}>
          {loan.status === "pending_treasurer" && <Ionicons name="wallet" size={16} color={color} />}
          {loan.status === "pending_president" && <Ionicons name="shield" size={16} color={color} />}
          {loan.status === "approved" && <Ionicons name="checkmark-circle" size={16} color={color} />}
          {(loan.status === "rejected" || loan.status === "treasurer_rejected") && (
            <Ionicons name="close-circle" size={16} color={color} />
          )}
          <Text style={[styles.statusLabel, { color }]}>{t(loan.status)}</Text>
        </View>

        {loan.status === "pending_president" && loan.treasurerActionAt && !isDirectOverride && (
          <View style={styles.workflowNote}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.light.success} />
            <Text style={styles.workflowNoteText}>
              {t("auto.treasurer_approved_forwarded_to_president")}
            </Text>
          </View>
        )}

        {isDirectOverride && (
          <View style={[styles.workflowNote, { backgroundColor: "#F59E0B15", borderColor: "#FDE68A" }]}>
            <Ionicons name="shield-checkmark" size={14} color="#D97706" />
            <Text style={[styles.workflowNoteText, { color: "#D97706" }]}>
              {loan.status === "approved" ? t("approved_directly") : t("rejected_directly")}
            </Text>
          </View>
        )}

        {loan.hasBankLoan ? (
          <View style={styles.amountCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={styles.amountLabel}>{t("bank.combined_outstanding")}</Text>
                <Text style={styles.amountValue}>Rs. {((loan.remainingBalance || 0) + (loan.bankRemainingBalance || 0)).toLocaleString("en-IN")}</Text>
              </View>
              <View style={{ backgroundColor: Colors.light.primary + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 12, color: Colors.light.primary }}>
                  {t("bank.shg_and_bank")}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: Colors.light.background, padding: 10, borderRadius: 10 }}>
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.light.text, marginBottom: 8 }}>{t("bank.shg_portion")}</Text>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("loanAmount")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>Rs. {loan.amount.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("interest")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>{loan.interest}%</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("monthly_installment")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>Rs. {shgEmi.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("bank.shg_outstanding")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: loan.remainingBalance > 0 ? Colors.light.danger : Colors.light.success }}>Rs. {loan.remainingBalance.toLocaleString("en-IN")}</Text>
                  </View>
                </View>
              </View>

              <View style={{ flex: 1, backgroundColor: Colors.light.background, padding: 10, borderRadius: 10 }}>
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.light.text, marginBottom: 8 }}>{t("bank.bank_portion")}</Text>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("loanAmount")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>Rs. {(loan.bankLoanAmount || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("interest")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>{loan.bankInterestRate || 0}%</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("monthly_installment")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>Rs. {bankEmi.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>{t("bank.bank_outstanding")}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: (loan.bankRemainingBalance || 0) > 0 ? Colors.light.danger : Colors.light.success }}>Rs. {(loan.bankRemainingBalance || 0).toLocaleString("en-IN")}</Text>
                  </View>
                </View>
              </View>
            </View>

            {showRepayment && (
              <View style={[styles.progressContainer, { marginTop: 16 }]}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` as any }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}% {t("auto.repaid")}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>{t("loanAmount")}</Text>
            <Text style={styles.amountValue}>Rs. {loan.amount.toLocaleString("en-IN")}</Text>
            <View style={styles.amountRow}>
              <View style={styles.amountDetail}>
                <Text style={styles.amountDetailLabel}>{t("interest")}</Text>
                <Text style={styles.amountDetailValue}>{loan.interest}%</Text>
              </View>
              <View style={styles.amountDetail}>
                <Text style={styles.amountDetailLabel}>{t("duration")}</Text>
                <Text style={styles.amountDetailValue}>{loan.duration} {t("auto.mo")}</Text>
              </View>
              <View style={styles.amountDetail}>
                <Text style={styles.amountDetailLabel}>{t("monthly_installment")}</Text>
                <Text style={styles.amountDetailValue}>Rs. {shgEmi.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.amountDetail}>
                <Text style={styles.amountDetailLabel}>{t("remaining")}</Text>
                <Text style={[styles.amountDetailValue, { color: loan.remainingBalance > 0 ? Colors.light.danger : Colors.light.success }]}>
                  Rs. {loan.remainingBalance.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
            {showRepayment && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` as any }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}% {t("auto.repaid")}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoRow}>{t("name")}: {loan.memberName}</Text>
          {loan.resolutionNo ? <Text style={styles.infoRow}>{t("resolutionNo")} {loan.resolutionNo}</Text> : null}
          <Text style={styles.infoRow}>{t("date")}: {new Date(loan.createdAt).toLocaleDateString("en-IN")}</Text>
        </View>

        {(loan.status === "rejected" || loan.status === "treasurer_rejected") && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>{t("rejection_reason")}:</Text>
            <Text style={styles.rejectionText}>{loan.rejectionReason || t("no_remarks_provided")}</Text>
            {loan.rejectedAt && (
              <Text style={styles.rejectionMeta}>
                {t("rejected_on")} {new Date(loan.rejectedAt).toLocaleDateString("en-IN")}
              </Text>
            )}
          </View>
        )}

        {loan.overrideReason && (
          <View style={[styles.rejectionBox, { backgroundColor: "#F59E0B15", borderColor: "#FDE68A" }]}>
            <Text style={[styles.rejectionLabel, { color: "#D97706" }]}>{t("override_history")}</Text>
            <Text style={[styles.rejectionText, { color: "#92400E" }]}>{loan.overrideReason}</Text>
            {loan.overrideAt && (
              <Text style={[styles.rejectionMeta, { color: "#92400E" }]}>
                {new Date(loan.overrideAt).toLocaleDateString("en-IN")}
              </Text>
            )}
          </View>
        )}

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>{t("approval_timeline")}</Text>
          <View style={styles.timelineStep}>
            <Text style={styles.timelineStepTitle}>{t("loan_requested")}</Text>
            <Text style={styles.timelineMeta}>{new Date(loan.createdAt).toLocaleDateString("en-IN")}</Text>
          </View>
          {loan.status === "pending_treasurer" && (
            <View style={styles.timelineStep}>
              <Text style={styles.timelineStepTitle}>{t("treasurer_review_pending")}</Text>
              <Text style={styles.timelineMeta}>{t("pending")}</Text>
            </View>
          )}
          {(loan.status === "pending_president" || loan.status === "approved" || loan.status === "rejected" || loan.status === "treasurer_rejected") && (
            <View style={styles.timelineStep}>
              <Text style={styles.timelineStepTitle}>{loan.treasurerActionAt ? t("treasurer_reviewed") : t("treasurer_review_pending")}</Text>
              <Text style={styles.timelineMeta}>{loan.treasurerActionAt ? new Date(loan.treasurerActionAt).toLocaleDateString("en-IN") : t("pending")}</Text>
            </View>
          )}
          {isFinal && (
            <View style={styles.timelineStep}>
              <Text style={styles.timelineStepTitle}>{loan.status === "approved" ? t("president_approved") : t("president_rejected")}</Text>
              <Text style={styles.timelineMeta}>{loan.approvedAt ? new Date(loan.approvedAt).toLocaleDateString("en-IN") : t("pending")}</Text>
            </View>
          )}
        </View>

        {showTreasurerActions && (
          <View style={styles.approvalCard}>
            <View style={styles.approvalCardHeader}>
              <Ionicons name="wallet" size={18} color="#D97706" />
              <Text style={[styles.approvalCardTitle, { color: "#D97706" }]}>
                {t("auto.treasurer_decision")}
              </Text>
            </View>
            <Text style={styles.approvalCardSub}>
              {t("auto.your_decision_will_be_forwarded")}
            </Text>
            {renderBankForm()}
            <View style={styles.approvalButtons}>
              <Pressable style={[styles.approveBtn, { backgroundColor: Colors.light.success }]} onPress={() => setDialog("approveTreasurer")}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.approveBtnText}>{t("approve")}</Text>
              </Pressable>
              <Pressable style={styles.rejectBtn} onPress={() => setDialog("rejectTreasurer")}>
                <Ionicons name="close" size={18} color={Colors.light.danger} />
                <Text style={styles.rejectBtnText}>{t("reject")}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {showPresidentActions && (
          <View style={styles.approvalCard}>
            <View style={styles.approvalCardHeader}>
              <Ionicons name="shield" size={18} color={Colors.light.primary} />
              <Text style={[styles.approvalCardTitle, { color: Colors.light.primary }]}>
                {loan.status === "pending_treasurer" ? t("president_override_decision") : t("auto.president_s_final_decision")}
              </Text>
            </View>
            <Text style={styles.fieldLabel}>{t("resolutionNo")} *</Text>
            <TextInput
              style={[styles.editInput, resolutionError && { borderColor: Colors.light.danger }]}
              value={resolutionNo}
              onChangeText={(v) => { setResolutionNo(v); setResolutionError(false); }}
              placeholder={t("auto.enter_resolution_number")}
              placeholderTextColor={Colors.light.textMuted}
            />
            {resolutionError && (
              <Text style={{ color: Colors.light.danger, fontSize: 12, fontFamily: "Poppins_400Regular" }}>
                {t("auto.resolution_number_is_required")}
              </Text>
            )}
            {renderBankForm()}
            <View style={styles.approvalButtons}>
              <Pressable style={[styles.approveBtn, { backgroundColor: Colors.light.primary }]} onPress={handleApprove}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.approveBtnText}>
                  {loan.status === "pending_treasurer" ? t("direct_approve") : t("approve")}
                </Text>
              </Pressable>
              <Pressable style={styles.rejectBtn} onPress={() => setDialog("rejectPresident")}>
                <Ionicons name="close" size={18} color={Colors.light.danger} />
                <Text style={styles.rejectBtnText}>
                  {loan.status === "pending_treasurer" ? t("direct_reject") : t("reject")}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {showRepayment && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("repayment")}</Text>
              {isPresident && (
                <Pressable onPress={() => setShowRepay(!showRepay)}>
                  <Ionicons name={showRepay ? "close" : "add-circle"} size={24} color={Colors.light.primary} />
                </Pressable>
              )}
            </View>

            {showRepay && (
              <View style={styles.repayInput}>
                {loan.hasBankLoan ? (
                  <View style={{ gap: 10, width: "100%" }}>
                    <View style={styles.inputRow}>
                      <Text style={styles.rupee}>SHG Rs.</Text>
                      <TextInput
                        style={styles.repayField}
                        value={shgRepayAmount}
                        onChangeText={setShgRepayAmount}
                        placeholder="0"
                        placeholderTextColor={Colors.light.textMuted}
                        keyboardType="number-pad"
                        autoFocus
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.rupee}>Bank Rs.</Text>
                      <TextInput
                        style={styles.repayField}
                        value={bankRepayAmount}
                        onChangeText={setBankRepayAmount}
                        placeholder="0"
                        placeholderTextColor={Colors.light.textMuted}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Pressable style={[styles.repayBtn, { width: "100%", marginTop: 8, height: 48, justifyContent: 'center', backgroundColor: Colors.light.primary, borderRadius: 14 }]} onPress={handleRepay}>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", color: "#fff", fontSize: 15, textAlign: 'center' }}>{t("save")}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.inputRow}>
                    <Text style={styles.rupee}>Rs.</Text>
                    <TextInput
                      style={styles.repayField}
                      value={repayAmount}
                      onChangeText={setRepayAmount}
                      placeholder="0"
                      placeholderTextColor={Colors.light.textMuted}
                      keyboardType="number-pad"
                      autoFocus
                    />
                    <Pressable style={styles.repayBtn} onPress={handleRepay}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {passbookEntries.length > 0 ? (
              passbookEntries.map((r, i) => (
                <View key={r.id} style={[styles.repaymentItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="return-down-forward" size={16} color={Colors.light.success} />
                      <Text style={styles.repaymentDate}>{new Date(r.date).toLocaleDateString("en-IN")}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.repaymentAmount}>Rs. {r.amount.toLocaleString("en-IN")}</Text>
                      {isPresident && (
                        <Pressable onPress={() => setDeleteRepaymentId(r.id)}>
                          <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.light.background, padding: 8, borderRadius: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: Colors.light.text }}>SHG Portion</Text>
                      <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary }}>Paid: Rs. {r.resolvedShg.toLocaleString("en-IN")}</Text>
                      <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary }}>Rem: Rs. {r.runShgRem.toLocaleString("en-IN")}</Text>
                    </View>
                    {loan.hasBankLoan && (
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: Colors.light.primary }}>Bank Portion</Text>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary }}>Paid: Rs. {r.resolvedBank.toLocaleString("en-IN")}</Text>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary }}>Rem: Rs. {r.runBankRem.toLocaleString("en-IN")}</Text>
                      </View>
                    )}
                  </View>
                  {r.remarks && (
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                      "{r.remarks}"
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noRepayments}>{t("auto.no_repayments_yet")}</Text>
            )}

            {repayments.length > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t("auto.total_repaid")}</Text>
                <Text style={styles.totalValue}>Rs. {totalRepaid.toLocaleString("en-IN")}</Text>
              </View>
            )}
          </View>
        )}

        {canDelete && (
          <Pressable style={styles.deleteLoanBtn} onPress={() => setDialog("deleteLoan")}>
            <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
            <Text style={styles.deleteLoanBtnText}>
              {t("auto.delete_loan")}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={dialog === "approveTreasurer"}
        title={t("auto.approve_loan_request")}
        message={t("auto.this_will_forward_the_request")}
        confirmText={t("approve")}
        cancelText={t("cancel")}
        onConfirm={handleTreasurerApprove}
        onCancel={() => setDialog(null)}
      />

      <Modal visible={dialog === "rejectTreasurer" || dialog === "rejectPresident"} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("reject")}</Text>
            <Text style={styles.modalSubtitle}>{t("enter_remarks")}</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder={t("remarks") + "..."}
              placeholderTextColor={Colors.light.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setDialog(null)}>
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={dialog === "rejectTreasurer" ? handleTreasurerReject : handleReject}>
                <Text style={styles.modalConfirmText}>{t("reject")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteRepaymentId !== null}
        title={t("auto.delete_repayment")}
        message={t("auto.this_repayment_record_will_be")}
        confirmText={t("auto.delete")}
        cancelText={t("cancel")}
        destructive
        onConfirm={handleDeleteRepayment}
        onCancel={() => setDeleteRepaymentId(null)}
      />

      <ConfirmDialog
        visible={dialog === "deleteLoan"}
        title={t("auto.delete_loan_1")}
        message={t("auto.this_loan_record_will_be")}
        confirmText={t("auto.delete")}
        cancelText={t("auto.keep")}
        destructive
        onConfirm={handleDeleteLoan}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  statusLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  workflowNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.success + "12",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  workflowNoteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.success,
    flex: 1,
  },
  amountCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  amountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  amountDetail: { alignItems: "center" },
  amountDetailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  amountDetailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 14,
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.light.success,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoRow: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  approvalCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timelineCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timelineTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  timelineStep: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  timelineStepTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.text,
  },
  timelineMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  approvalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  approvalCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  approvalCardSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  editInput: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  approvalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  approveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.danger + "15",
    borderWidth: 1,
    borderColor: Colors.light.danger + "40",
  },
  rejectBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.danger,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  repayInput: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rupee: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  repayField: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 12,
  },
  repayBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 8,
  },
  repaymentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 6,
  },
  repaymentDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  repaymentAmount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.success,
  },
  noRepayments: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 6,
  },
  totalLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.light.success,
  },
  deleteLoanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.danger + "10",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.danger + "30",
    marginTop: 4,
    marginBottom: 8,
  },
  deleteLoanBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.danger,
  },
  emptyText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
    marginTop: 12,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: Colors.light.background, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.light.text, marginBottom: 8 },
  modalSubtitle: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.textSecondary, marginBottom: 16 },
  remarksInput: { backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 10, padding: 12, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.text, minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: Colors.light.textSecondary },
  modalConfirmBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.light.danger, borderRadius: 10 },
  modalConfirmText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },
  rejectionBox: {
    backgroundColor: Colors.light.danger + "10",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.danger + "20",
  },
  rejectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: Colors.light.danger },
  rejectionText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.text, marginTop: 2 },
  rejectionMeta: { fontFamily: "Poppins_400Regular", fontSize: 10, color: Colors.light.textMuted, marginTop: 4 },
  bankFormCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 12,
  },
  rupeeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
    marginRight: 8,
  },
  suffix: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textMuted,
    marginLeft: 8,
  },
});
