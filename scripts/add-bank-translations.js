const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'contexts', 'LanguageContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('"bank_assisted_loan"')) {
  console.log('Bank translations already present, skipping.');
  process.exit(0);
}

const bankSection = `

  "bank": {
    "bank_assisted_loan": { "en": "Bank Assisted Loan", "mr": "\u092c\u0901\u0915 \u0938\u0939\u093e\u092f\u094d\u092f\u093f\u0924 \u0915\u0930\u094d\u091c" },
    "bank_portion": { "en": "Bank Portion", "mr": "\u092c\u0901\u0915\u0947\u091a\u093e \u0939\u093f\u0938\u094d\u0938\u093e" },
    "shg_portion": { "en": "SHG Portion", "mr": "\u0917\u091f\u093e\u091a\u093e \u0939\u093f\u0938\u094d\u0938\u093e" },
    "affiliated_banks": { "en": "Affiliated Banks", "mr": "\u0938\u0902\u0932\u0917\u094d\u0928 \u092c\u0901\u0915\u093e" },
    "bank_name": { "en": "Bank Name", "mr": "\u092c\u0901\u0915\u0947\u091a\u0947 \u0928\u093e\u0935" },
    "bank_branch": { "en": "Branch", "mr": "\u0936\u093e\u0916\u093e" },
    "ifsc_code": { "en": "IFSC Code", "mr": "IFSC \u0915\u094b\u0921" },
    "contact_person": { "en": "Contact Person", "mr": "\u0938\u0902\u092a\u0930\u094d\u0915 \u0935\u094d\u092f\u0915\u094d\u0924\u0940" },
    "contact_number": { "en": "Contact Number", "mr": "\u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u094d\u0930\u092e\u093e\u0902\u0915" },
    "bank_notes": { "en": "Notes", "mr": "\u0928\u094b\u0902\u0926\u0940" },
    "bank_active": { "en": "Active", "mr": "\u0938\u0915\u094d\u0930\u093f\u092f" },
    "bank_inactive": { "en": "Inactive", "mr": "\u0928\u093f\u0937\u094d\u0915\u094d\u0930\u093f\u092f" },
    "add_bank": { "en": "Add Bank", "mr": "\u092c\u0901\u0915 \u091c\u094b\u0921\u093e" },
    "edit_bank": { "en": "Edit Bank", "mr": "\u092c\u0901\u0915 \u0938\u0902\u092a\u093e\u0926\u093f\u0924 \u0915\u0930\u093e" },
    "no_banks_configured": { "en": "No affiliated banks configured yet.", "mr": "\u0905\u0926\u094d\u092f\u093e\u092a \u0915\u094b\u0923\u0924\u094d\u092f\u093e\u0939\u0940 \u0938\u0902\u0932\u0917\u094d\u0928 \u092c\u0901\u0915\u093e \u0915\u0949\u0928\u094d\u092b\u093f\u0917\u0930 \u0915\u0947\u0932\u094d\u092f\u093e \u0928\u093e\u0939\u0940\u0924." },
    "no_active_banks": { "en": "No active banks available. Please add a bank in SHG Settings first.", "mr": "\u0915\u094b\u0923\u0924\u0940\u0939\u0940 \u0938\u0915\u094d\u0930\u093f\u092f \u092c\u0901\u0915 \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u093e\u0939\u0940." },
    "bank_principal": { "en": "Bank Principal", "mr": "\u092c\u0901\u0915\u0947\u091a\u0947 \u092e\u0942\u0933 \u0915\u0930\u094d\u091c" },
    "bank_interest": { "en": "Bank Interest Rate", "mr": "\u092c\u0901\u0915 \u0935\u094d\u092f\u093e\u091c\u0926\u0930" },
    "bank_duration": { "en": "Bank Duration", "mr": "\u092c\u0901\u0915 \u0915\u093e\u0932\u093e\u0935\u0927\u0940" },
    "bank_emi": { "en": "Monthly Bank EMI", "mr": "\u092e\u093e\u0938\u093f\u0915 \u092c\u0901\u0915 \u0939\u092a\u094d\u0924\u093e" },
    "shg_emi": { "en": "Monthly SHG EMI", "mr": "\u092e\u093e\u0938\u093f\u0915 \u0917\u091f \u0939\u092a\u094d\u0924\u093e" },
    "total_monthly": { "en": "Total Monthly Repayment", "mr": "\u090f\u0915\u0942\u0923 \u092e\u093e\u0938\u093f\u0915 \u092a\u0930\u0924\u092b\u0947\u0921" },
    "bank_outstanding": { "en": "Bank Outstanding", "mr": "\u092c\u0901\u0915\u0947\u091a\u0940 \u0925\u0915\u0940\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "shg_outstanding": { "en": "SHG Outstanding", "mr": "\u0917\u091f\u093e\u091a\u0940 \u0925\u0915\u0940\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "combined_outstanding": { "en": "Combined Outstanding", "mr": "\u090f\u0915\u0942\u0923 \u0925\u0915\u0940\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "bank_repayment": { "en": "Bank Repayment", "mr": "\u092c\u0901\u0915 \u092a\u0930\u0924\u092b\u0947\u0921" },
    "shg_repayment": { "en": "SHG Repayment", "mr": "\u0917\u091f \u092a\u0930\u0924\u092b\u0947\u0921" },
    "total_repaid": { "en": "Total Paid", "mr": "\u090f\u0915\u0942\u0923 \u092d\u0930\u0923\u093e" },
    "loan_source": { "en": "Loan Source", "mr": "\u0915\u0930\u094d\u091c \u0938\u094d\u0930\u094b\u0924" },
    "shg_only": { "en": "SHG Only", "mr": "\u0915\u0947\u0935\u0933 \u0917\u091f" },
    "shg_and_bank": { "en": "SHG + Bank", "mr": "\u0917\u091f + \u092c\u0901\u0915" },
    "select_bank": { "en": "Select Bank", "mr": "\u092c\u0901\u0915 \u0928\u093f\u0935\u0921\u093e" },
    "bank_loan_amount": { "en": "Bank Loan Amount", "mr": "\u092c\u0901\u0915\u0947\u091a\u0940 \u0915\u0930\u094d\u091c \u0930\u0915\u094d\u0915\u092e" },
    "bank_interest_rate": { "en": "Bank Interest Rate (% /month)", "mr": "\u092c\u0901\u0915 \u0935\u094d\u092f\u093e\u091c\u0926\u0930 (% /\u092e\u0939\u093f\u0928\u093e)" },
    "bank_loan_duration": { "en": "Bank Loan Duration (months)", "mr": "\u092c\u0901\u0915 \u0915\u0930\u094d\u091c \u0915\u093e\u0932\u093e\u0935\u0927\u0940 (\u092e\u0939\u093f\u0928\u0947)" },
    "bank_loan_remarks": { "en": "Bank Loan Remarks (optional)", "mr": "\u092c\u0901\u0915 \u0915\u0930\u094d\u091c \u0936\u0947\u0930\u093e (\u092a\u0930\u094d\u092f\u093e\u092f\u0940)" },
    "deactivate_bank": { "en": "Deactivate Bank", "mr": "\u092c\u0901\u0915 \u0928\u093f\u0937\u094d\u0915\u094d\u0930\u093f\u092f \u0915\u0930\u093e" },
    "bank_name_required": { "en": "Bank name is required.", "mr": "\u092c\u0901\u0915\u0947\u091a\u0947 \u0928\u093e\u0935 \u0906\u0935\u0936\u094d\u092f\u0915 \u0906\u0939\u0947." },
    "bank_required": { "en": "Please select a bank.", "mr": "\u0915\u0943\u092a\u092f\u093e \u092c\u0901\u0915 \u0928\u093f\u0935\u0921\u093e." },
    "bank_amount_required": { "en": "Bank loan amount must be greater than 0.", "mr": "\u092c\u0901\u0915\u0947\u091a\u0940 \u0915\u0930\u094d\u091c \u0930\u0915\u094d\u0915\u092e 0 \u092a\u0947\u0915\u094d\u0937\u093e \u091c\u093e\u0938\u094d\u0924 \u0905\u0938\u0923\u0947 \u0906\u0935\u0936\u094d\u092f\u0915 \u0906\u0939\u0947." },
    "bank_duration_required": { "en": "Bank loan duration must be greater than 0.", "mr": "\u092c\u0901\u0915\u0947\u091a\u093e \u0915\u0930\u094d\u091c \u0915\u093e\u0932\u093e\u0935\u0927\u0940 0 \u092a\u0947\u0915\u094d\u0937\u093e \u091c\u093e\u0938\u094d\u0924 \u0905\u0938\u0923\u0947 \u0906\u0935\u0936\u094d\u092f\u0915 \u0906\u0939\u0947." },
    "shg_repayment_amount": { "en": "SHG Repayment Amount", "mr": "\u0917\u091f \u092a\u0930\u0924\u092b\u0947\u0921 \u0930\u0915\u094d\u0915\u092e" },
    "bank_repayment_amount": { "en": "Bank Repayment Amount", "mr": "\u092c\u0901\u0915 \u092a\u0930\u0924\u092b\u0947\u0921 \u0930\u0915\u094d\u0915\u092e" },
    "enter_at_least_one": { "en": "Enter at least one repayment amount.", "mr": "\u0915\u093f\u092e\u093e\u0928 \u090f\u0915 \u092a\u0930\u0924\u092b\u0947\u0921 \u0930\u0915\u094d\u0915\u092e \u092a\u094d\u0930\u0935\u093f\u0937\u094d\u091f \u0915\u0930\u093e." },
    "shg_income": { "en": "SHG Income", "mr": "\u0917\u091f\u093e\u091a\u0947 \u0909\u0924\u094d\u092a\u0928\u094d\u0928" },
    "bank_collections": { "en": "Bank Collections (Pass-through)", "mr": "\u092c\u0901\u0915\u0947\u091a\u0947 \u0938\u0902\u0915\u0932\u0928 (\u092a\u093e\u0938-\u0925\u094d\u0930\u0942)" },
    "combined_collected": { "en": "Combined Amount Collected", "mr": "\u090f\u0915\u0942\u0923 \u0938\u0902\u0915\u0932\u093f\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "bank_total_repayable": { "en": "Bank Total Repayable", "mr": "\u092c\u0901\u0915\u0947\u091a\u0940 \u090f\u0915\u0942\u0923 \u092a\u0930\u0924\u092b\u0947\u0921 \u0930\u0915\u094d\u0915\u092e" },
    "shg_total_repayable": { "en": "SHG Total Repayable", "mr": "\u0917\u091f\u093e\u091a\u0940 \u090f\u0915\u0942\u0923 \u092a\u0930\u0924\u092b\u0947\u0921 \u0930\u0915\u094d\u0915\u092e" },
    "pdf_bank_repayment": { "en": "Bank Repayment", "mr": "\u092c\u0901\u0915 \u092a\u0930\u0924\u092b\u0947\u0921" },
    "pdf_shg_repayment": { "en": "SHG Repayment", "mr": "\u0917\u091f \u092a\u0930\u0924\u092b\u0947\u0921" },
    "pdf_total_paid": { "en": "Total Paid", "mr": "\u090f\u0915\u0942\u0923 \u092d\u0930\u0923\u093e" },
    "pdf_bank_outstanding": { "en": "Bank Outstanding", "mr": "\u092c\u0901\u0915\u0947\u091a\u0940 \u0925\u0915\u0940\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "pdf_shg_outstanding": { "en": "SHG Outstanding", "mr": "\u0917\u091f\u093e\u091a\u0940 \u0925\u0915\u0940\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "pdf_combined_outstanding": { "en": "Combined Outstanding", "mr": "\u090f\u0915\u0942\u0923 \u0925\u0915\u0940\u0924 \u0930\u0915\u094d\u0915\u092e" },
    "pdf_bank_section": { "en": "Bank Assisted Loan Details", "mr": "\u092c\u0901\u0915 \u0938\u0939\u093e\u092f\u094d\u092f\u093f\u0924 \u0915\u0930\u094d\u091c \u0924\u092a\u0936\u093f\u0932" },
    "pdf_repayment_passbook": { "en": "Repayment Passbook", "mr": "\u092a\u0930\u0924\u092b\u0947\u0921 \u092a\u093e\u0938\u092c\u0941\u0915" },
    "pdf_loan_source": { "en": "Loan Source", "mr": "\u0915\u0930\u094d\u091c \u0938\u094d\u0930\u094b\u0924" },
    "pdf_bank_collections": { "en": "Bank Collections (Pass-through)", "mr": "\u092c\u0901\u0915\u0947\u091a\u0947 \u0938\u0902\u0915\u0932\u0928 (\u092a\u093e\u0938-\u0925\u094d\u0930\u0942)" },
    "pdf_shg_income_only": { "en": "SHG Income (excl. bank)", "mr": "\u0917\u091f\u093e\u091a\u0947 \u0909\u0924\u094d\u092a\u0928\u094d\u0928 (\u092c\u0901\u0915 \u0935\u0917\u0933\u0942\u0928)" }
  }
`;

// Handle both Windows (\r\n) and Unix (\n) line endings
let marker = '\r\n};\r\n';
let idx = content.lastIndexOf(marker);
if (idx !== -1) {
  const newContent = content.slice(0, idx) + ',\r\n' + bankSection.replace(/\n/g, '\r\n') + '\r\n};\r\n';
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Bank translations added (CRLF)');
  process.exit(0);
}

marker = '\n};\n';
idx = content.lastIndexOf(marker);
if (idx !== -1) {
  const newContent = content.slice(0, idx) + ',\n' + bankSection + '\n};\n';
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Bank translations added (LF)');
  process.exit(0);
}

// Final fallback: find last }; 
const lastBrace = content.lastIndexOf('\n};');
if (lastBrace === -1) { console.error('Could not find translations closing'); process.exit(1); }
const newContent = content.slice(0, lastBrace) + ',\n' + bankSection + '\n};\n' + content.slice(lastBrace + 3);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Bank translations added (fallback)');
