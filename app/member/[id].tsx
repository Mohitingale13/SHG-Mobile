// @ts-nocheck
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Alert, ActivityIndicator, Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData } from "@/contexts/DataContext";
import { generateMemberPassbook } from "@/lib/pdf-generator";
import Colors from "@/constants/colors";

function formatDisplayDate(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return isoString;
  }
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={infoRowStyle}>
      <Ionicons name={icon as any} size={16} color={Colors.light.textSecondary} />
      <Text style={infoLabelStyle}>{label}</Text>
      <Text style={infoValueStyle}>{value}</Text>
    </View>
  );
}
const infoRowStyle = { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, marginTop: 6 };
const infoLabelStyle = { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#64748b", flex: 1 };
const infoValueStyle = { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#0f172a" };

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, group, isPresident } = useAuth();
  const { t, language } = useLanguage();
  const { payments, loans, loanRepayments, loanLedgers, meetings, groupMembers, groupBankLoans, bankLoanAllocations, updateMember, getBankLoanAllocationLedger } = useData();
  const [generating, setGenerating] = useState(false);

  const member = groupMembers.find((m) => m.id === id);

  if (!member) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="person-outline" size={48} color={Colors.light.textMuted} />
        <Text style={styles.emptyText}>{t("members.memberNotFound")}</Text>
      </View>
    );
  }

  const isAuthorized = isPresident || user?.role === "treasurer" || user?.id === member.id;
  
  if (!isAuthorized) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <Ionicons name="lock-closed-outline" size={64} color={Colors.light.danger} />
        <Text style={[styles.emptyText, { marginTop: 16, color: Colors.light.danger, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }]}>{t("access_denied")}</Text>
        <Text style={{ marginTop: 8, color: Colors.light.textSecondary, textAlign: 'center' }}>{t("loan_privacy_notice")}</Text>
      </View>
    );
  }

  const canDownload = isPresident || user?.role === "treasurer" || user?.id === member.id;
  const isActive = member.status === "active";

  // ── Calculations ──
  const memberPayments = payments.filter((p) => p.memberId === member.id);
  const confirmedPayments = memberPayments.filter((p) => p.status === "confirmed");
  const pendingPaymentsCount = memberPayments.filter((p) => p.status === "pending" || p.status === "payment_not_received").length;
  const totalSavings = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
  const lateFeesPaid = confirmedPayments.reduce((sum, p) => sum + (p.lateFee || 0), 0);

  const memberLoans = loans.filter((l) => l.memberId === member.id);
  const activeLoan = memberLoans.find((l) => l.status === "approved" && l.remainingBalance > 0);
  const totalInterestPaid = activeLoan ? (activeLoan.totalInterestPaid || 0) : 0;
  const principalInstallment = activeLoan ? (activeLoan.fixedPrincipalInstallment || Math.floor(activeLoan.amount / activeLoan.duration)) : 0;
  const remainingInstallments = activeLoan && principalInstallment > 0 ? Math.ceil(activeLoan.remainingBalance / principalInstallment) : 0;

  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const attendedCount = completedMeetings.filter((m) => m.attendance.includes(member.id)).length;
  const attendancePercent = completedMeetings.length > 0 ? Math.round((attendedCount / completedMeetings.length) * 100) : 0;

  const now = new Date();
  const confirmedThisMonth = confirmedPayments.find(
    (p) => new Date(p.date).getMonth() === now.getMonth() && new Date(p.date).getFullYear() === now.getFullYear()
  );
  const pendingThisMonth = memberPayments.find(
    (p) => (p.status === "pending" || p.status === "pending_verification") &&
      new Date(p.date).getMonth() === now.getMonth() && new Date(p.date).getFullYear() === now.getFullYear()
  );
  const unpaidThisMonth = memberPayments.filter((p) => p.status === "payment_not_received");
  const nextMeeting = meetings
    .filter((m) => m.status === "scheduled" && new Date(m.scheduledDate) >= now)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

  let savingsStatusLabel = "";
  let savingsStatusColor = Colors.light.textMuted;
  let savingsStatusIcon = "help-circle-outline";
  if (confirmedThisMonth) {
    savingsStatusLabel = t("dashboard.paid"); savingsStatusColor = Colors.light.success; savingsStatusIcon = "checkmark-circle";
  } else if (pendingThisMonth) {
    savingsStatusLabel = t("dashboard.awaiting_verification"); savingsStatusColor = Colors.light.pending; savingsStatusIcon = "hourglass-outline";
  } else if (unpaidThisMonth.length > 0) {
    savingsStatusLabel = t("dashboard.overdue"); savingsStatusColor = Colors.light.danger; savingsStatusIcon = "alert-circle";
  } else {
    savingsStatusLabel = t("pending"); savingsStatusColor = Colors.light.pending; savingsStatusIcon = "time-outline";
  }

  const myBankAlloc = bankLoanAllocations ? bankLoanAllocations.find((a) => a.memberId === member.id && a.status === "active") : null;
  const myBankLoan = myBankAlloc && groupBankLoans ? groupBankLoans.find((l) => l.id === myBankAlloc.bankLoanId) : null;

  const handleDownloadPDF = async () => {
    if (!group) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    let bLedgers: any[] = [];
    const myAllocs = bankLoanAllocations ? bankLoanAllocations.filter((a) => a.memberId === member.id) : [];
    if (myAllocs.length > 0) {
      try {
        const fetchPromises = myAllocs.map((a) => getBankLoanAllocationLedger(a.id));
        const res = await Promise.all(fetchPromises);
        bLedgers = res.flat();
      } catch (err) {
        console.error("Failed to load bank ledgers", err);
      }
    }

    await generateMemberPassbook({
      group,
      groupMembers,
      member,
      payments,
      loans,
      loanRepayments,
      loanLedger: loanLedgers,
      bankAllocations: myAllocs,
      bankLoanLedger: bLedgers,
      t,
      user,
    });
    setGenerating(false);
  };


  
  const handleToggleStatus = () => {
    const newStatus = isActive ? "left" : "active";
    const msg = newStatus === "left"
      ? (t("members.confirmDeactivate"))
      : (t("members.confirmActivate"));

    Alert.alert(t("confirm"), msg, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        onPress: () => updateMember(member.id, { status: newStatus }),
      },
    ]);
  };

  // ── Unified History Timeline ─────────────
  const timelineItems: Array<{
    id: string;
    type: 'payment' | 'loan_request' | 'loan_repayment' | 'meeting';
    date: Date;
    sortDate: number;
    title: string;
    subtitle: string;
    amount?: string;
    amountBreakdown?: { p: string; i: string; remain: string };
    receiptNo?: string;
    recordedBy?: string;
    statusColor: string;
    statusLabel: string;
    routeTo?: { pathname: string; params?: any };
  }> = [];

  // Add savings
  memberPayments.forEach(p => {
    timelineItems.push({
      id: p.id,
      type: 'payment',
      date: new Date(p.date),
      sortDate: new Date(p.date).getTime(),
      title: t("dashboard.totalSavings"),
      subtitle: p.status === "confirmed" ? t("confirmed") : t("pending"),
      amount: p.amount.toString(),
      statusColor: p.status === "confirmed" ? Colors.light.success : p.status === "pending" ? Colors.light.pending : Colors.light.danger,
      statusLabel: t(p.status)
    });
  });

  // Add loan requests/approvals
  memberLoans.forEach(l => {
    timelineItems.push({
      id: l.id,
      type: 'loan_request',
      date: new Date(l.createdAt),
      sortDate: new Date(l.createdAt).getTime(),
      title: t("loans.loanHistory"),
      subtitle: l.resolutionNumber ? `${t("history.resolution_number")}: ${l.resolutionNumber}` : `${l.interest}% / ${l.duration} ${t("loans.mo")}`,
      amount: l.amount.toString(),
      statusColor: ["approved", "completed"].includes(l.status) ? Colors.light.success : l.status === "requested" ? Colors.light.pending : Colors.light.danger,
      statusLabel: t(l.status),
      routeTo: { pathname: "/loan/[id]", params: { id: l.id } }
    });
    
    // Add repayments for this loan
    if (l.calculationMethod === "reducing_balance") {
      const ledgers = loanLedgers.filter(ledger => ledger.loanId === l.id && ledger.type === "repayment");
      ledgers.forEach(ledger => {
        timelineItems.push({
          id: ledger.id,
          type: 'loan_repayment',
          date: new Date(ledger.date),
          sortDate: new Date(ledger.date).getTime(),
          title: t("history.loan_repayment"),
          subtitle: `${l.resolutionNumber ? l.resolutionNumber : l.id.slice(0,6)}`,
          amount: ledger.paymentReceived.toString(),
          amountBreakdown: {
            p: ledger.principalPaid.toString(),
            i: ledger.interestPaid.toString(),
            remain: ledger.closingPrincipal.toString()
          },
          receiptNo: ledger.receiptNo,
          recordedBy: groupMembers.find(m => m.id === ledger.recordedBy)?.name || t("history.recorded_by"),
          statusColor: Colors.light.primary,
          statusLabel: t("confirmed"),
          routeTo: { pathname: "/loan/[id]", params: { id: l.id } }
        });
      });
    } else {
      const reps = loanRepayments.filter(r => r.loanId === l.id);
      reps.forEach(rep => {
        timelineItems.push({
          id: rep.id,
          type: 'loan_repayment',
          date: new Date(rep.date),
          sortDate: new Date(rep.date).getTime(),
          title: t("history.loan_repayment"),
          subtitle: `${l.resolutionNumber ? l.resolutionNumber : l.id.slice(0,6)}`,
          amount: rep.amount.toString(),
          amountBreakdown: {
             p: rep.shgAmount.toString(),
             i: '0',
             remain: l.remainingBalance.toString()
          },
          statusColor: Colors.light.primary,
          statusLabel: t("confirmed"),
          routeTo: { pathname: "/loan/[id]", params: { id: l.id } }
        });
      });
    }
  });

  timelineItems.sort((a, b) => b.sortDate - a.sortDate);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, {
        paddingTop: (Platform.OS === "web" ? 0 : insets.top) + 12,
        paddingBottom: insets.bottom + 40,
      }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.light.text} /></Pressable>
        <Text style={styles.headerTitle}>{t("memberDetails")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 1. Profile */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: member.role === "president" ? Colors.light.primary : Colors.light.secondary }]}>
          <Ionicons name={member.role === "president" ? "shield" : "person"} size={32} color="#fff" />
        </View>
        <Text style={styles.memberName}>{member.name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.roleBadge, { backgroundColor: member.role === "president" ? Colors.light.primary + "20" : Colors.light.secondary + "20" }]}>
            <Text style={[styles.roleBadgeText, { color: member.role === "president" ? Colors.light.primary : Colors.light.secondary }]}>
              {member.role === "president" ? t("president") : t("member")}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.light.success + "20" : Colors.light.textMuted + "20" }]}>
            <Text style={[styles.statusBadgeText, { color: isActive ? Colors.light.success : Colors.light.textMuted }]}>
              {isActive ? t("active") : t("left")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="call-outline" label={t("phone")} value={member.phone} />
        <InfoRow icon="location-outline" label={t("village")} value={member.village} />
        <InfoRow icon="calendar-outline" label={t("joinDate")} value={formatDisplayDate(member.joinDate)} />
        {member.exitDate && <InfoRow icon="exit-outline" label={t("exitDate")} value={formatDisplayDate(member.exitDate)} />}
      </View>

      {/* 2. This Month */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>{t("dashboard.this_month")}</Text>
          </View>
        </View>
        <View style={[styles.thisMonthCard, { borderLeftColor: savingsStatusColor }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.thisMonthLabel}>{t("dashboard.savings_status")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={savingsStatusIcon as any} size={16} color={savingsStatusColor} />
              <Text style={[styles.thisMonthBadge, { color: savingsStatusColor }]}>{savingsStatusLabel}</Text>
            </View>
          </View>
          <View style={styles.thisMonthRow}>
            <Text style={styles.thisMonthLabel}>{t("dashboard.next_meeting")}</Text>
            <Text style={styles.thisMonthValue}>
              {nextMeeting ? new Date(nextMeeting.scheduledDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : t("dashboard.none_scheduled")}
            </Text>
          </View>
          {unpaidThisMonth.length > 0 && (
            <View style={[styles.thisMonthRow,{borderTopWidth:1,borderTopColor:Colors.light.border,paddingTop:8,marginTop:4}]}>
              <Text style={[styles.thisMonthLabel,{color:Colors.light.danger}]}>{t("dashboard.late_fees_collected")}</Text>
              <Text style={[styles.thisMonthValue,{color:Colors.light.danger}]}>+ Rs. {unpaidThisMonth.reduce((s,p)=>s+(p.lateFee||0),0).toLocaleString("en-IN")}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. My Savings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{flexDirection:"row",alignItems:"center",gap:6}}>
            <Ionicons name="wallet-outline" size={16} color={Colors.light.success} />
            <Text style={styles.sectionTitle}>{t("dashboard.my_savings_section")}</Text>
          </View>
        </View>
        <View style={styles.savingsGrid}>
          <View style={styles.savingsTile}>
            <Ionicons name="trending-up" size={18} color={Colors.light.success} />
            <Text style={styles.savingsTileLabel}>{t("dashboard.total_savings")}</Text>
            <Text style={[styles.savingsTileValue,{color:Colors.light.success}]}>Rs. {totalSavings.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.savingsTile}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.light.primary} />
            <Text style={styles.savingsTileLabel}>{t("dashboard.payments_made")}</Text>
            <Text style={styles.savingsTileValue}>{confirmedPayments.length}</Text>
          </View>
          <View style={styles.savingsTile}>
            <Ionicons name="time-outline" size={18} color={Colors.light.pending} />
            <Text style={styles.savingsTileLabel}>{t("pendingPayments")}</Text>
            <Text style={[styles.savingsTileValue,{color:pendingPaymentsCount>0?Colors.light.pending:Colors.light.success}]}>{pendingPaymentsCount}</Text>
          </View>
          <View style={styles.savingsTile}>
            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
            <Text style={styles.savingsTileLabel}>{t("dashboard.late_fees_paid")}</Text>
            <Text style={[styles.savingsTileValue,{color:lateFeesPaid>0?"#B45309":Colors.light.textMuted}]}>Rs. {lateFeesPaid.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </View>

      {/* 4. My Internal Loan */}
      <View style={styles.section}>
        <View style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12}}>
          <Ionicons name="people-circle-outline" size={18} color="#16A34A" />
          <Text style={[styles.sectionTitle,{color:"#14532D"}]}>{t("dashboard.my_internal_loan")}</Text>
        </View>
        {activeLoan ? (
          <Pressable style={styles.loanCard} onPress={() => router.push(`/loan/${activeLoan.id}` as any)}>
            <View style={styles.loanGrid}>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("dashboard.my_loan_amount")}</Text><Text style={[styles.loanItemValue,{color:"#14532D"}]}>Rs. {(activeLoan.amount||0).toLocaleString("en-IN")}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("dashboard.outstanding_principal")}</Text><Text style={[styles.loanItemValue,{color:"#B91C1C"}]}>Rs. {(activeLoan.remainingBalance||0).toLocaleString("en-IN")}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("dashboard.interest_paid")}</Text><Text style={[styles.loanItemValue,{color:"#15803D"}]}>Rs. {totalInterestPaid.toLocaleString("en-IN")}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("dashboard.remaining_installments")}</Text><Text style={[styles.loanItemValue,{color:"#14532D"}]}>{remainingInstallments}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("dashboard.my_loan_status")}</Text><Text style={[styles.loanItemValue,{color:Colors.light.success}]}>{t("dashboard.loan_status_active")}</Text></View>
            </View>
            <View style={{flexDirection:"row",alignItems:"center",marginTop:10}}>
              <Ionicons name="book-outline" size={13} color="#16A34A" />
              <Text style={{fontSize:12,color:"#16A34A",marginLeft:4,fontFamily:"Poppins_500Medium"}}>{t("viewAll")}</Text>
              <View style={{flex:1}} />
              <Ionicons name="chevron-forward" size={14} color="#16A34A" />
            </View>
          </Pressable>
        ) : (
          <View style={styles.loanEmpty}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#86EFAC" />
            <Text style={styles.loanEmptyText}>{t("dashboard.no_active_loan")}</Text>
          </View>
        )}
      </View>

      {/* 5. My Group Bank Loan */}
      {myBankAlloc && myBankLoan && (
        <View style={styles.section}>
          <View style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12}}>
            <Ionicons name="business-outline" size={18} color="#2980B9" />
            <Text style={[styles.sectionTitle,{color:"#1B4F72"}]}>{t("bank_loan.dashboard_title")}</Text>
          </View>
          <View style={styles.bankLoanCard}>
            <View style={styles.loanGrid}>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("bank_loan.allocated_principal")}</Text><Text style={[styles.loanItemValue,{color:"#1B4F72"}]}>Rs. {(myBankAlloc.allocatedPrincipal||0).toLocaleString("en-IN")}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("bank_loan.outstanding")}</Text><Text style={[styles.loanItemValue,{color:"#C0392B"}]}>Rs. {(myBankAlloc.outstandingBalance||0).toLocaleString("en-IN")}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("bank_loan.total_principal_paid")}</Text><Text style={[styles.loanItemValue,{color:"#15803D"}]}>Rs. {(myBankAlloc.totalPrincipalPaid||0).toLocaleString("en-IN")}</Text></View>
              <View style={styles.loanItem}><Text style={styles.loanItemLabel}>{t("bank_loan.total_interest_paid")}</Text><Text style={[styles.loanItemValue,{color:"#15803D"}]}>Rs. {(myBankAlloc.totalInterestPaid||0).toLocaleString("en-IN")}</Text></View>
            </View>
          </View>
        </View>
      )}

      {/* 6. Meeting Attendance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{flexDirection:"row",alignItems:"center",gap:6}}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.secondary} />
            <Text style={styles.sectionTitle}>{t("dashboard.meeting_attendance")}</Text>
          </View>
        </View>
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceItem}>
              <Text style={styles.attendanceLabel}>{t("dashboard.meetings_attended")}</Text>
              <Text style={styles.attendanceValue}>{attendedCount} / {completedMeetings.length}</Text>
            </View>
            <View style={[styles.attendanceItem,styles.attendanceHighlight]}>
              <Text style={styles.attendanceLabel}>{t("attendance")}</Text>
              <Text style={[styles.attendancePct,{color:attendancePercent>=75?Colors.light.success:Colors.light.danger}]}>{attendancePercent}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 7. Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle,{marginBottom:10}]}>{t("dashboard.recent_activity")}</Text>
        {timelineItems.length === 0 ? (
          <View style={styles.emptySection}><Text style={styles.emptySectionText}>{t("noPayments")}</Text></View>
        ) : (
          timelineItems.slice(0,20).map((item) => (
            <Pressable key={item.id} style={styles.historyRow} onPress={() => item.routeTo && router.push(item.routeTo as any)} disabled={!item.routeTo}>
              <View style={[styles.historyDot,{backgroundColor:item.statusColor}]} />
              <View style={{flex:1}}>
                <Text style={styles.historyRowDate}>{formatDisplayDate(item.date.toISOString())} · {item.title}</Text>
                <Text style={[styles.historyRowStatus,{color:item.statusColor}]}>{item.statusLabel}</Text>
              </View>
              <View style={{alignItems:"flex-end"}}>
                {item.amount && <Text style={styles.historyRowAmount}>{item.amount}</Text>}
                {item.routeTo && <Ionicons name="chevron-forward" size={14} color={Colors.light.textMuted} />}
              </View>
            </Pressable>
          ))
        )}
        {timelineItems.length > 20 && <Text style={styles.showMoreText}>{`${t("common.more_plus")} ${timelineItems.length - 20}`}</Text>}
      </View>

      {/* 8. Download My Statement */}
      {canDownload && (
        <Pressable style={({pressed}) => [styles.downloadBtn,{opacity:pressed?0.85:1}]} onPress={handleDownloadPDF} disabled={generating}>
          {generating ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="download-outline" size={22} color="#fff" />}
          <Text style={styles.downloadBtnText}>{generating ? t("reports.generatingPdf") : t("dashboard.download_my_statement")}</Text>
        </Pressable>
      )}

      {/* MEMBER DEACTIVATION BUTTON */}
      {isPresident && member.role !== "president" && (
        <Pressable style={[styles.toggleStatusBtn,{borderColor:isActive?Colors.light.danger+"40":Colors.light.success+"40"}]} onPress={handleToggleStatus}>
          <Ionicons name={isActive?"person-remove-outline":"person-add-outline"} size={20} color={isActive?Colors.light.danger:Colors.light.success} />
          <Text style={[styles.toggleStatusText,{color:isActive?Colors.light.danger:Colors.light.success}]}>
            {isActive ? t("members.deactivate") : t("members.activate")}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: Colors.light.text },
  emptyText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: Colors.light.textMuted, marginTop: 12 },
  
  profileCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16 },
  infoCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, gap: 4, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  memberName: { fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.light.text, marginBottom: 8 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  roleBadgeText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusBadgeText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: Colors.light.text },
  
  thisMonthCard: { backgroundColor: Colors.light.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.light.border, borderLeftWidth: 4, gap: 10 },
  thisMonthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  thisMonthLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.light.textSecondary },
  thisMonthValue: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.light.text },
  thisMonthBadge: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  
  savingsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  savingsTile: { width: "48%", backgroundColor: Colors.light.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.light.border },
  savingsTileLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary, marginBottom: 4 },
  savingsTileValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: Colors.light.text },
  
  loanCard: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#bbf7d0", gap: 10 },
  bankLoanCard: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#bfdbfe", gap: 10 },
  loanGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  loanItem: { width: "48%" },
  loanItemLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary },
  loanItemValue: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.light.text },
  loanEmpty: { backgroundColor: Colors.light.card, borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: Colors.light.border, borderStyle: "dashed" },
  loanEmptyText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.light.textMuted },
  
  attendanceCard: { backgroundColor: Colors.light.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.light.border, flexDirection: "row", alignItems: "center", gap: 16 },
  attendanceRow: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  attendanceItem: { alignItems: "center" },
  attendanceHighlight: { backgroundColor: "#f8fafc", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  attendanceLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.textSecondary, marginBottom: 4 },
  attendanceValue: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: Colors.light.text },
  attendancePct: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  
  historySection: { marginBottom: 16 },
  historySectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.light.text, marginBottom: 10 },
  emptySection: { backgroundColor: Colors.light.card, borderRadius: 12, padding: 20, alignItems: "center" },
  emptySectionText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.light.textMuted },
  historyRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.card, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyRowDate: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.light.text },
  historyRowStatus: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  historyRowAmount: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.light.text },
  showMoreText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.primary, textAlign: "center", paddingVertical: 8 },
  
  downloadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.light.secondary, borderRadius: 14, paddingVertical: 16, marginBottom: 12 },
  downloadBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },
  
  toggleStatusBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginBottom: 12, backgroundColor: Colors.light.card },
  toggleStatusText: { fontFamily: "Poppins_500Medium", fontSize: 14 }
});
