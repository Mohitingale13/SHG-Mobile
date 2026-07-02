import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from "react";
import { getItem, setItem, getItemSync } from "@/lib/storage";

type Language = "en" | "mr";

const translations: Record<string, Record<Language, string>> = {
  appName: { en: "SHG Records", mr: "बचत गट नोंदी" },
  dashboard: { en: "Dashboard", mr: "मुख्य पृष्ठ" },
  meetings: { en: "Meetings", mr: "बैठकी" },
  payments: { en: "Payments", mr: "भरणा" },
  more: { en: "More", mr: "अधिक" },
  login: { en: "Login", mr: "लॉगिन" },
  register: { en: "Register", mr: "नोंदणी" },
  logout: { en: "Logout", mr: "बाहेर पडा" },
  name: { en: "Name", mr: "नाव" },
  phone: { en: "Phone Number", mr: "फोन नंबर" },
  password: { en: "Password", mr: "पासवर्ड" },
  village: { en: "Village", mr: "गाव" },
  joinDate: { en: "Join Date", mr: "सामील तारीख" },
  exitDate: { en: "Planned Exit Date", mr: "बाहेर पडण्याची तारीख" },
  groupId: { en: "Group ID", mr: "गट क्रमांक" },
  createGroup: { en: "Create Group", mr: "गट तयार करा" },
  joinGroup: { en: "Join Group", mr: "गटात सामील व्हा" },
  president: { en: "President", mr: "अध्यक्ष" },
  member: { en: "Member", mr: "सदस्य" },
  members: { en: "Members", mr: "सदस्य" },
  active: { en: "Active", mr: "सक्रिय" },
  left: { en: "Left", mr: "बाहेर पडले" },
  pending: { en: "Pending", mr: "प्रलंबित" },
  confirmed: { en: "Confirmed", mr: "पुष्टी" },
  verify: { en: "Verify", mr: "सत्यापित करा" },
  reject: { en: "Reject", mr: "नाकारा" },
  amount: { en: "Amount", mr: "रक्कम" },
  date: { en: "Date", mr: "तारीख" },
  status: { en: "Status", mr: "स्थिती" },
  createMeeting: { en: "Create Meeting", mr: "बैठक तयार करा" },
  scheduledDate: { en: "Scheduled Date", mr: "नियोजित तारीख" },
  agenda: { en: "Agenda", mr: "कार्यसूची" },
  notes: { en: "Notes", mr: "टिप्पणी" },
  attendance: { en: "Attendance", mr: "उपस्थिती" },
  cancel: { en: "Cancel", mr: "रद्द करा" },
  save: { en: "Save", mr: "जतन करा" },
  edit: { en: "Edit", mr: "संपादन" },
  delete: { en: "Delete", mr: "हटवा" },
  loans: { en: "Loans", mr: "कर्ज" },
  requestLoan: { en: "Request Loan", mr: "कर्ज मागणी" },
  loanAmount: { en: "Loan Amount", mr: "कर्ज रक्कम" },
  interest: { en: "Interest %", mr: "व्याज %" },
  duration: { en: "Duration (months)", mr: "कालावधी (महिने)" },
  remaining: { en: "Remaining", mr: "शिल्लक" },
  approve: { en: "Approve", mr: "मंजूर करा" },
  approved: { en: "Approved", mr: "मंजूर" },
  rejected: { en: "Rejected by President", mr: "अध्यक्षाने नाकारले" },
  requested: { en: "Requested", mr: "मागणी" },
  pending_treasurer: { en: "Pending Treasurer Approval", mr: "खजिनदाराची मंजुरी प्रलंबित" },
  pending_president: { en: "Pending President Approval", mr: "अध्यक्षाची मंजुरी प्रलंबित" },
  treasurer_rejected: { en: "Rejected by Treasurer", mr: "खजिनदाराने नाकारले" },
  treasurer: { en: "Treasurer", mr: "खजिनदार" },
  assignTreasurer: { en: "Assign Treasurer", mr: "खजिनदार नियुक्त करा" },
  changeTreasurer: { en: "Change Treasurer", mr: "खजिनदार बदला" },
  removeTreasurer: { en: "Remove Treasurer", mr: "खजिनदार काढा" },
  noTreasurer: { en: "No Treasurer Assigned", mr: "खजिनदार नियुक्त नाही" },
  currentTreasurer: { en: "Current Treasurer", mr: "सध्याचे खजिनदार" },
  treasurerApprove: { en: "Approve (Treasurer)", mr: "मंजूर करा (खजिनदार)" },
  treasurerReject: { en: "Reject (Treasurer)", mr: "नाकारा (खजिनदार)" },
  groupRules: { en: "Group Rules", mr: "गटाचे नियम" },
  editRules: { en: "Edit Rules", mr: "नियम संपादन" },
  noMeetings: { en: "No meetings scheduled", mr: "कोणतीही बैठक नियोजित नाही" },
  noPayments: { en: "No payment records", mr: "कोणतीही भरणा नोंद नाही" },
  noLoans: { en: "No loan records", mr: "कोणतीही कर्ज नोंद नाही" },
  noMembers: { en: "No members yet", mr: "अद्याप सदस्य नाहीत" },
  paymentDeclared: { en: "Payment Declared", mr: "भरणा घोषित" },
  declarePayment: { en: "I Have Paid", mr: "मी भरणा केला" },
  monthlySavings: { en: "Monthly Savings", mr: "मासिक बचत" },
  totalMembers: { en: "Total Members", mr: "एकूण सदस्य" },
  upcomingMeeting: { en: "Upcoming Meeting", mr: "आगामी बैठक" },
  pendingPayments: { en: "Pending Payments", mr: "प्रलंबित भरणा" },
  activeLoans: { en: "Active Loans", mr: "सक्रिय कर्ज" },
  welcome: { en: "Welcome", mr: "स्वागत" },
  resolutionNo: { en: "Resolution No.", mr: "ठराव क्र." },
  repayment: { en: "Repayment", mr: "परतफेड" },
  addRepayment: { en: "Add Repayment", mr: "परतफेड जोडा" },
  cancelMeeting: { en: "Cancel Meeting", mr: "बैठक रद्द करा" },
  meetingCancelled: { en: "Cancelled", mr: "रद्द" },
  selectDate: { en: "Select Date", mr: "तारीख निवडा" },
  enterGroupId: { en: "Enter Group ID to join", mr: "सामील होण्यासाठी गट क्रमांक टाका" },
  setGroupId: { en: "Set a unique Group ID", mr: "अद्वितीय गट क्रमांक ठरवा" },
  registerAs: { en: "Register as", mr: "म्हणून नोंदणी करा" },
  alreadyHaveAccount: { en: "Already have an account?", mr: "आधीच खाते आहे?" },
  dontHaveAccount: { en: "Don't have an account?", mr: "खाते नाही?" },
  groupName: { en: "Group Name", mr: "गटाचे नाव" },
  language: { en: "Language", mr: "भाषा" },
  english: { en: "English", mr: "इंग्रजी" },
  marathi: { en: "Marathi", mr: "मराठी" },
  overview: { en: "Overview", mr: "सारांश" },
  recentActivity: { en: "Recent Activity", mr: "अलीकडील हालचाली" },
  viewAll: { en: "View All", mr: "सर्व पहा" },
  today: { en: "Today", mr: "आज" },
  scheduled: { en: "Scheduled", mr: "नियोजित" },
  completed: { en: "Completed", mr: "पूर्ण" },
  memberDetails: { en: "Member Details", mr: "सदस्य तपशील" },
  editMember: { en: "Edit Member", mr: "सदस्य संपादन" },
  markAsLeft: { en: "Mark as Left", mr: "बाहेर पडले म्हणून नोंदवा" },
  markAsActive: { en: "Mark as Active", mr: "सक्रिय म्हणून नोंदवा" },
  noRulesSet: { en: "No rules set yet", mr: "अद्याप नियम ठरवलेले नाहीत" },
  presidentOnly: { en: "Only President can do this", mr: "फक्त अध्यक्ष हे करू शकतात" },
  invalidCredentials: { en: "Invalid credentials", mr: "चुकीची माहिती" },
  groupNotFound: { en: "Group ID not found", mr: "गट क्रमांक सापडला नाही" },
  groupIdTaken: { en: "Group ID already taken", mr: "गट क्रमांक आधीच वापरात आहे" },
  success: { en: "Success", mr: "यशस्वी" },
  error: { en: "Error", mr: "त्रुटी" },
  confirm: { en: "Confirm", mr: "पुष्टी करा" },
  total: { en: "Total", mr: "एकूण" },
  meetingDetails: { en: "Meeting Details", mr: "बैठक तपशील" },
  loanDetails: { en: "Loan Details", mr: "कर्ज तपशील" },
  downloadStatement: { en: "Download Full Statement (PDF)", mr: "संपूर्ण विवरणपत्र डाउनलोड करा (PDF)" },
  generatingPdf: { en: "Generating PDF...", mr: "PDF तयार होत आहे..." },
  totalSavings: { en: "Total Savings", mr: "एकूण बचत" },
  totalLoan: { en: "Total Loan", mr: "एकूण कर्ज" },
  outstanding: { en: "Outstanding", mr: "बाकी रक्कम" },
  memberNotFound: { en: "Member not found", mr: "सदस्य सापडला नाही" },
  present: { en: "Present", mr: "उपस्थित" },
  absent: { en: "Absent", mr: "अनुपस्थित" },
  loanSettings: { en: "Loan Settings", mr: "कर्ज सेटिंग्ज" },
  interestRate: { en: "Interest Rate (%)", mr: "व्याज दर (%)" },
  maxLoanAmount: { en: "Max Loan Amount (Rs.)", mr: "कमाल कर्ज रक्कम (रु.)" },
  durationRules: { en: "Duration Rules", mr: "कालावधी नियम" },
  durationRule: { en: "Duration Rule", mr: "कालावधी नियम" },
  upToAmount: { en: "Up to Amount (Rs.)", mr: "रकमेपर्यंत (रु.)" },
  minMonths: { en: "Min Duration (months)", mr: "किमान कालावधी (महिने)" },
  maxMonths: { en: "Max Duration (months)", mr: "कमाल कालावधी (महिने)" },
  addRule: { en: "Add Rule", mr: "नियम जोडा" },
  removeRule: { en: "Remove", mr: "काढा" },
  saveSettings: { en: "Save Settings", mr: "सेटिंग्ज जतन करा" },
  settingsSaved: { en: "Settings saved successfully", mr: "सेटिंग्ज यशस्वीरित्या जतन झाले" },
  autoInterest: { en: "Interest auto-applied by group", mr: "गटाद्वारे व्याज आपोआप लागू" },
  durationHint: { en: "Allowed duration", mr: "परवानगी कालावधी" },
  exceedsMaxLoan: { en: "Amount exceeds the group's max loan limit", mr: "रक्कम गटाच्या कमाल कर्ज मर्यादेपेक्षा जास्त आहे" },
  durationTooShort: { en: "Duration is below the minimum for this amount", mr: "कालावधी या रकमेसाठी किमानपेक्षा कमी आहे" },
  durationTooLong: { en: "Duration exceeds the maximum for this amount", mr: "कालावधी या रकमेसाठी कमालपेक्षा जास्त आहे" },
  invalidAmount: { en: "Please enter a valid amount", mr: "कृपया वैध रक्कम टाका" },
  loanPolicy: { en: "Loan Policy", mr: "कर्ज धोरण" },
  smallLoan: { en: "Small Loan", mr: "लहान कर्ज" },
  mediumLoan: { en: "Medium Loan", mr: "मध्यम कर्ज" },
  largeLoan: { en: "Large Loan", mr: "मोठे कर्ज" },
  resetDefaults: { en: "Reset to Defaults", mr: "डीफॉल्टवर रीसेट करा" },
  cash: { en: "Cash", mr: "रोख" },
  online: { en: "Online", mr: "ऑनलाइन" },
  paymentMode: { en: "Payment Mode", mr: "भरणा प्रकार" },
  selectPaymentMode: { en: "How did you pay?", mr: "तुम्ही कसे भरले?" },
  scanAndPay: { en: "Scan QR & Pay", mr: "QR स्कॅन करा आणि भरा" },
  pending_verification: { en: "Pending Treasurer Verification", mr: "खजिनदाराच्या पडताळणीची प्रतीक्षा" },
  payment_not_received: { en: "Payment Not Received", mr: "भरणा मिळाला नाही" },
  verifyOnlinePayment: { en: "Verify Online Payment", mr: "ऑनलाइन भरणा पडताळा" },
  paymentReceived: { en: "Payment Received", mr: "भरणा मिळाला" },
  paymentNotReceived: { en: "Not Received", mr: "मिळाला नाही" },
  uploadQrCode: { en: "Upload QR Code", mr: "QR कोड अपलोड करा" },
  qrCodeUploaded: { en: "QR code updated successfully", mr: "QR कोड यशस्वीरित्या अपडेट झाला" },
  noQrCode: { en: "No QR code uploaded yet", mr: "अद्याप QR कोड अपलोड केला नाही" },
  qrCodeInfo: { en: "Members will see this QR when paying online", mr: "ऑनलाइन भरणा करताना सदस्यांना हे QR दिसेल" },
  removeQrCode: { en: "Remove QR Code", mr: "QR कोड काढा" },
  pendingVerification: { en: "Pending Verification", mr: "पडताळणी प्रलंबित" },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = getItemSync("shg_language");
    return (saved === "mr" ? "mr" : "en") as Language;
  });

  useEffect(() => {
    let active = true;
    getItem("shg_language").then((saved) => {
      if (active && saved === "mr" && language !== "mr") setLanguageState("mr");
      if (active && saved === "en" && language !== "en") setLanguageState("en");
    });
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setItem("shg_language", lang).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[key]?.[language] || key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
