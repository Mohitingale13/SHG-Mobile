import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";
import { User, Group } from "@/contexts/AuthContext";
import { Meeting, Payment, Loan, LoanRepayment } from "@/contexts/DataContext";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

interface StatementData {
  member: User;
  group: Group;
  president: User | undefined;
  payments: Payment[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  meetings: Meeting[];
  groupMembers: User[];
  language: "en" | "mr";
}

function generateHTML(data: StatementData): string {
  const { member, group, president, payments, loans, loanRepayments, meetings, language } = data;
  const isEn = language === "en";

  const memberPayments = payments
    .filter((p) => p.memberId === member.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const memberLoans = loans
    .filter((l) => l.memberId === member.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const memberRepayments = loanRepayments
    .filter((r) => loans.find((l) => l.id === r.loanId)?.memberId === member.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const confirmedPayments = memberPayments.filter((p) => p.status === "confirmed");
  const totalSavings = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalLoanTaken = memberLoans.filter((l) => l.status === "approved").reduce((sum, l) => sum + l.amount, 0);
  const outstandingLoan = memberLoans.filter((l) => l.status === "approved").reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalRepaid = memberRepayments.reduce((sum, r) => sum + r.amount, 0);

  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const attendedMeetings = completedMeetings.filter((m) => m.attendance.includes(member.id));
  const attendancePercent = completedMeetings.length > 0
    ? Math.round((attendedMeetings.length / completedMeetings.length) * 100)
    : 0;

  const presidentName = president?.name || "-";
  const generatedDate = formatDate(new Date().toISOString());

  let savingsRows = "";
  memberPayments.forEach((p) => {
    const verifier = p.verifiedBy ? (data.groupMembers.find((m) => m.id === p.verifiedBy)?.name || "-") : "-";
    const statusClass = p.status === "confirmed" ? "status-confirmed"
      : (p.status === "rejected" || p.status === "payment_not_received") ? "status-rejected"
      : "status-pending";
    const statusLabel = isEn
      ? (p.status === "confirmed" ? "Confirmed"
        : p.status === "pending" ? "Pending Verification"
        : p.status === "pending_verification" ? "Awaiting Treasurer"
        : p.status === "payment_not_received" ? "Not Received"
        : "Rejected")
      : (p.status === "confirmed" ? "पुष्टी"
        : p.status === "pending" ? "प्रलंबित"
        : p.status === "pending_verification" ? "खजिनदाराची प्रतीक्षा"
        : p.status === "payment_not_received" ? "मिळाला नाही"
        : "नाकारले");
    const modeLabel = isEn
      ? (p.mode === "online" ? "Online" : "Cash")
      : (p.mode === "online" ? "ऑनलाइन" : "रोख");
    savingsRows += `<tr>
      <td>${formatDate(p.date)}</td>
      <td class="amount">${formatCurrency(p.amount)}</td>
      <td><span class="badge-mode-${p.mode || "cash"}">${modeLabel}</span></td>
      <td><span class="${statusClass}">${statusLabel}</span></td>
      <td>${verifier}${p.verifiedAt ? `<br/><span style="font-size:9px;color:#888">${formatDate(p.verifiedAt)}</span>` : ""}</td>
    </tr>`;
  });

  let fineRows = "";
  const fines = memberPayments.filter(p => p.status === "confirmed" && p.amount > 0 && p.amount < 100); 
  fines.forEach(f => {
      fineRows += `<tr>
        <td>${formatDate(f.date)}</td>
        <td>${isEn ? "Late Fee / Fine" : "विलंब शुल्क / दंड"}</td>
        <td class="amount">${formatCurrency(f.amount)}</td>
        <td><span class="status-confirmed">${isEn ? "Paid" : "भरले"}</span></td>
      </tr>`;
  });

  let loansSection = "";
  memberLoans.forEach((loan) => {
    const loanRepays = loanRepayments
      .filter((r) => r.loanId === loan.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let repayRows = "";
    let runningBalance = loan.amount;
    loanRepays.forEach((r) => {
      runningBalance = Math.max(0, runningBalance - r.amount);
      repayRows += `<tr>
        <td>${formatDate(r.date)}</td>
        <td class="amount">${formatCurrency(r.amount)}</td>
        <td class="amount">${formatCurrency(runningBalance)}</td>
      </tr>`;
    });

    const statusLabel = isEn
      ? (loan.status === "approved" ? "Approved" : loan.status === "pending_treasurer" ? "Pending Treasurer" : loan.status === "pending_president" ? "Pending President" : loan.status === "treasurer_rejected" ? "Rejected by Treasurer" : "Rejected")
      : (loan.status === "approved" ? "मंजूर" : loan.status === "pending_treasurer" ? "खजिनदार प्रलंबित" : loan.status === "pending_president" ? "अध्यक्ष प्रलंबित" : loan.status === "treasurer_rejected" ? "खजिनदाराने नाकारले" : "नाकारले");

    loansSection += `
      <div class="loan-block">
        <div class="loan-summary">
          <div class="loan-row"><span class="loan-label">${isEn ? "Resolution No." : "ठराव क्र."}</span><span>${loan.resolutionNo || "-"}</span></div>
          <div class="loan-row"><span class="loan-label">${isEn ? "Loan Amount" : "कर्ज रक्कम"}</span><span class="amount">${formatCurrency(loan.amount)}</span></div>
          <div class="loan-row"><span class="loan-label">${isEn ? "Interest Rate" : "व्याज दर"}</span><span>${loan.interest}%</span></div>
          <div class="loan-row"><span class="loan-label">${isEn ? "Duration" : "कालावधी"}</span><span>${loan.duration} ${isEn ? "months" : "महिने"}</span></div>
          <div class="loan-row"><span class="loan-label">${isEn ? "Status" : "स्थिती"}</span><span>${statusLabel}</span></div>
          <div class="loan-row"><span class="loan-label">${isEn ? "Request Date" : "मागणी तारीख"}</span><span>${formatDate(loan.createdAt)}</span></div>
          ${loan.treasurerActionAt ? `<div class="loan-row"><span class="loan-label">${isEn ? "Treasurer Approved" : "खजिनदार मंजुरी"}</span><span>${formatDate(loan.treasurerActionAt)}</span></div>` : ""}
          <div class="loan-row"><span class="loan-label">${isEn ? "President Approved" : "अध्यक्ष मंजुरी"}</span><span>${loan.approvedAt ? formatDate(loan.approvedAt) : "-"}</span></div>
          <div class="loan-row"><span class="loan-label">${isEn ? "Remaining Balance" : "शिल्लक रक्कम"}</span><span class="amount highlight">${formatCurrency(loan.remainingBalance)}</span></div>
        </div>
        ${loanRepays.length > 0 ? `
        <h4>${isEn ? "Repayment History" : "परतफेड इतिहास"}</h4>
        <table>
          <thead><tr>
            <th>${isEn ? "Date" : "तारीख"}</th>
            <th>${isEn ? "Amount Paid" : "भरलेली रक्कम"}</th>
            <th>${isEn ? "Remaining" : "शिल्लक"}</th>
          </tr></thead>
          <tbody>${repayRows}</tbody>
        </table>` : `<p class="no-data">${isEn ? "No repayments recorded" : "परतफेड नोंदवलेली नाही"}</p>`}
      </div>
    `;
  });

  let attendanceRows = "";
  completedMeetings
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .forEach((m) => {
      const present = m.attendance.includes(member.id);
      attendanceRows += `<tr>
        <td>${formatDate(m.scheduledDate)}</td>
        <td><span class="${present ? "status-confirmed" : "status-rejected"}">${present ? (isEn ? "Present" : "उपस्थित") : (isEn ? "Absent" : "अनुपस्थित")}</span></td>
        <td>${m.agenda || "-"}</td>
      </tr>`;
    });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 40px 30px; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.5;
    padding: 0;
  }

  .header {
    background: linear-gradient(135deg, #1B6B4A 0%, #0d4a32 100%);
    color: white;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .header h1 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .header .subtitle {
    font-size: 11px;
    opacity: 0.85;
    margin-bottom: 12px;
  }
  .header-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    font-size: 10px;
    opacity: 0.9;
  }
  .header-details span { display: inline-block; }
  .header-details strong { font-weight: 600; }

  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1B6B4A;
    border-bottom: 2px solid #1B6B4A;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }

  .member-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 20px;
  }
  .member-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid #f0ebe6;
  }
  .member-label {
    color: #6B6560;
    font-size: 10px;
  }
  .member-value {
    font-weight: 600;
    text-align: right;
    font-size: 11px;
  }

  .summary-cards {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 8px;
  }
  .summary-card {
    flex: 1;
    background: #f9f6f2;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    border: 1px solid #e8e2dc;
  }
  .summary-card .label {
    font-size: 9px;
    color: #6B6560;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .summary-card .value {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    margin-top: 8px;
  }
  thead { background: #f5f0eb; }
  th {
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
    color: #6B6560;
    border-bottom: 2px solid #e8e2dc;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  td {
    padding: 7px 10px;
    border-bottom: 1px solid #f0ebe6;
  }
  tr:last-child td { border-bottom: none; }
  .amount { font-weight: 600; font-variant-numeric: tabular-nums; }
  .total-row {
    background: #f5f0eb;
    font-weight: 700;
  }

  .status-confirmed {
    background: #d4edda;
    color: #155724;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 600;
  }
  .status-pending {
    background: #fff3cd;
    color: #856404;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 600;
  }
  .status-rejected {
    background: #f8d7da;
    color: #721c24;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 600;
  }
  .badge-mode-cash {
    background: #d4edda;
    color: #155724;
    padding: 2px 7px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 600;
  }
  .badge-mode-online {
    background: #dbeafe;
    color: #1e40af;
    padding: 2px 7px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 600;
  }

  .loan-block {
    background: #faf7f4;
    border: 1px solid #e8e2dc;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
  }
  .loan-summary {
    margin-bottom: 10px;
  }
  .loan-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    border-bottom: 1px solid #f0ebe6;
    font-size: 10px;
  }
  .loan-label { color: #6B6560; }
  .highlight { color: #D94040; font-weight: 700; }
  h4 {
    font-size: 11px;
    color: #1B6B4A;
    margin: 8px 0 4px;
  }

  .attendance-summary {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    margin-bottom: 10px;
  }
  .att-stat {
    font-size: 10px;
    color: #6B6560;
  }
  .att-stat strong { color: #1a1a1a; }

  .no-data {
    font-style: italic;
    color: #9E9893;
    font-size: 10px;
    padding: 8px 0;
  }

  .footer {
    margin-top: 30px;
    padding-top: 16px;
    border-top: 2px solid #e8e2dc;
    text-align: center;
    font-size: 9px;
    color: #9E9893;
    line-height: 1.8;
  }
  .footer strong { color: #6B6560; }
</style>
</head>
<body>

<div class="header">
  <h1>${group.name}</h1>
  <div class="subtitle">${isEn ? "SHG Digital Record Platform" : "बचत गट डिजिटल नोंद व्यवस्थापन"}</div>
  <div class="header-details">
    <span><strong>${isEn ? "Group ID:" : "गट क्रमांक:"}</strong> ${group.groupId}</span>
    <span><strong>${isEn ? "Village:" : "गाव:"}</strong> ${member.village}</span>
    <span><strong>${isEn ? "President:" : "अध्यक्ष:"}</strong> ${presidentName}</span>
    <span><strong>${isEn ? "Generated:" : "तारीख:"}</strong> ${generatedDate}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">${isEn ? "Member Statement" : "सदस्य विवरणपत्र"} - ${member.name}</div>
  <div class="member-grid">
    <div class="member-row"><span class="member-label">${isEn ? "Name" : "नाव"}</span><span class="member-value">${member.name}</span></div>
    <div class="member-row"><span class="member-label">${isEn ? "Phone" : "फोन"}</span><span class="member-value">${member.phone}</span></div>
    <div class="member-row"><span class="member-label">${isEn ? "Village" : "गाव"}</span><span class="member-value">${member.village}</span></div>
    <div class="member-row"><span class="member-label">${isEn ? "Join Date" : "सामील तारीख"}</span><span class="member-value">${formatDate(member.joinDate)}</span></div>
    <div class="member-row"><span class="member-label">${isEn ? "Exit Date" : "बाहेर पडण्याची तारीख"}</span><span class="member-value">${member.exitDate ? formatDate(member.exitDate) : "-"}</span></div>
    <div class="member-row"><span class="member-label">${isEn ? "Status" : "स्थिती"}</span><span class="member-value">${member.status === "active" ? (isEn ? "Active" : "सक्रिय") : (isEn ? "Left" : "बाहेर पडले")}</span></div>
  </div>
  <div class="summary-cards">
    <div class="summary-card">
      <div class="label">${isEn ? "Total Savings" : "एकूण बचत"}</div>
      <div class="value">${formatCurrency(totalSavings)}</div>
    </div>
    <div class="summary-card">
      <div class="label">${isEn ? "Total Loan" : "एकूण कर्ज"}</div>
      <div class="value">${formatCurrency(totalLoanTaken)}</div>
    </div>
    <div class="summary-card">
      <div class="label">${isEn ? "Total Repaid" : "एकूण परतफेड"}</div>
      <div class="value">${formatCurrency(totalRepaid)}</div>
    </div>
    <div class="summary-card">
      <div class="label">${isEn ? "Outstanding" : "बाकी रक्कम"}</div>
      <div class="value" style="color: ${outstandingLoan > 0 ? '#D94040' : '#2D9B6A'}">${formatCurrency(outstandingLoan)}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">${isEn ? "Savings History" : "बचत इतिहास"}</div>
  ${memberPayments.length > 0 ? `
  <table>
    <thead><tr>
      <th>${isEn ? "Date" : "तारीख"}</th>
      <th>${isEn ? "Amount" : "रक्कम"}</th>
      <th>${isEn ? "Mode" : "प्रकार"}</th>
      <th>${isEn ? "Status" : "स्थिती"}</th>
      <th>${isEn ? "Verified By" : "सत्यापित"}</th>
    </tr></thead>
    <tbody>
      ${savingsRows}
      <tr class="total-row">
        <td><strong>${isEn ? "Total Confirmed Savings" : "एकूण पुष्टी बचत"}</strong></td>
        <td class="amount"><strong>${formatCurrency(totalSavings)}</strong></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>` : `<p class="no-data">${isEn ? "No savings records found" : "बचत नोंद सापडली नाही"}</p>`}
</div>

<div class="section">
  <div class="section-title">${isEn ? "Loan History" : "कर्ज इतिहास"}</div>
  ${memberLoans.length > 0 ? loansSection : `<p class="no-data">${isEn ? "No loan records found" : "कर्ज नोंद सापडली नाही"}</p>`}
</div>

<div class="section">
  <div class="section-title">${isEn ? "Meeting Attendance" : "बैठक उपस्थिती"}</div>
  <div class="attendance-summary">
    <span class="att-stat"><strong>${completedMeetings.length}</strong> ${isEn ? "Total Meetings" : "एकूण बैठका"}</span>
    <span class="att-stat"><strong>${attendedMeetings.length}</strong> ${isEn ? "Present" : "उपस्थित"}</span>
    <span class="att-stat"><strong>${attendancePercent}%</strong> ${isEn ? "Attendance" : "उपस्थिती"}</span>
  </div>
  ${completedMeetings.length > 0 ? `
  <table>
    <thead><tr>
      <th>${isEn ? "Meeting Date" : "बैठक तारीख"}</th>
      <th>${isEn ? "Status" : "स्थिती"}</th>
      <th>${isEn ? "Agenda" : "कार्यसूची"}</th>
    </tr></thead>
    <tbody>${attendanceRows}</tbody>
  </table>` : `<p class="no-data">${isEn ? "No completed meetings yet" : "अद्याप पूर्ण बैठका नाहीत"}</p>`}
</div>

<div class="section">
  <div class="section-title">${isEn ? "Fine History" : "दंडाचा इतिहास"}</div>
  ${fines.length > 0 ? `
  <table>
    <thead><tr>
      <th>${isEn ? "Date" : "तारीख"}</th>
      <th>${isEn ? "Reason" : "कारण"}</th>
      <th>${isEn ? "Amount" : "रक्कम"}</th>
      <th>${isEn ? "Status" : "स्थिती"}</th>
    </tr></thead>
    <tbody>${fineRows}</tbody>
  </table>` : `<p class="no-data">${isEn ? "No fine records found" : "कोणतीही दंडाची नोंद सापडली नाही"}</p>`}
</div>

<div class="footer">
  <strong>${isEn ? "SHG Digital Record Platform" : "बचत गट डिजिटल नोंद व्यवस्थापन"}</strong><br/>
  ${isEn ? "This is a digitally generated record. No manual signature required." : "हे डिजिटल पद्धतीने तयार केलेले विवरणपत्र आहे. मॅन्युअल स्वाक्षरी आवश्यक नाही."}<br/>
  ${isEn ? "Generated on" : "तारीख"}: ${generatedDate}
</div>

</body>
</html>`;
}

export async function generateMemberStatement(data: StatementData): Promise<void> {
  try {
    const html = generateHTML(data);
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
    });

    if (Platform.OS === "web") {
      await Print.printAsync({ html });
    } else {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: data.language === "en"
            ? `${data.member.name} - Statement`
            : `${data.member.name} - विवरणपत्र`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert(
          data.language === "en" ? "PDF Generated" : "PDF तयार",
          data.language === "en" ? "PDF saved successfully" : "PDF यशस्वीरित्या जतन केले",
        );
      }
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    Alert.alert(
      data.language === "en" ? "Error" : "त्रुटी",
      data.language === "en" ? "Failed to generate PDF" : "PDF तयार करण्यात अयशस्वी",
    );
  }
}
