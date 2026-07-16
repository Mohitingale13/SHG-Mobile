import os
import re

def resolve(path, resolver):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Normalize to \n
    content = content.replace('\r\n', '\n')
    
    # Regex to capture the three parts of a git conflict marker
    pattern = re.compile(r'<<<<<<< ours\n(.*?)\n=======\n(.*?)\n>>>>>>> theirs\n', re.DOTALL)
    
    def repl(m):
        ours = m.group(1) + '\n'
        theirs = m.group(2) + '\n'
        return resolver(ours, theirs, path)
        
    new_content = pattern.sub(repl, content)
    
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_content)
    print(f"Resolved {path}")

def data_context_resolver(ours, theirs, path):
    if 'requestLoan: (data: {' in ours or 'memberId?: string;' in ours:
        return ours + theirs
    if 'lateFee: number;' in ours:
        return ours
    return ours

def routes_resolver(ours, theirs, path):
    if 'resolutionNo: "",' in ours:
        return theirs
    if 'const { amount, duration, memberId, memberName, startDate } = req.body;' in ours:
        return """
      // Role guard: only president or treasurer may create loans
      const caller = req.currentUser!;
      if (caller.role !== "president" && caller.role !== "treasurer")
        return res.status(403).json({ error: "Only the President or Treasurer can create loans" });

      const { amount, duration, memberId, memberName, startDate, isExisting, isCompleted, outstandingPrincipal, loanDate } = req.body;
"""
    return ours

def create_loan_resolver(ours, theirs, path):
    # This is app/create-loan.tsx
    if 'const { verifyPassword' in ours:
        return """
  const { verifyPassword, user, isPresident, isTreasurer } = useAuth();
  const { requestLoan, groupSettings, groupMembers, isMigrationWindow } = useData();

  // Active members only (excluding left/exited)
  const activeMembers = useMemo(
    () => groupMembers.filter((m) => m.status === "active"),
    [groupMembers],
  );

  // 🛡️ Migration mode state (only available when isMigrationWindow)
  const [isMigration, setIsMigration] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false); // false=Active, true=Completed
  const [migrationOutstanding, setMigrationOutstanding] = useState("");
  const [migrationLoanDate, setMigrationLoanDate] = useState(new Date().toISOString().split("T")[0]);
  const [migrationMemberId, setMigrationMemberId] = useState<string | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
"""
    if 'applicableRule = useMemo' in ours and theirs.strip() == '':
        return ours
    if 'setStartDateError' in ours and theirs.strip() == '':
        return ours
    if 'const payload: any =' in ours:
        return """
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
"""
    if 'durationHint !==' in ours and theirs.strip() == '':
        return ours
    if 'styles.summaryCard' in ours:
        return theirs # keep styling from theirs for summaryCard
    if 'Security note' in ours:
        return ours + theirs
    
    return ours + theirs

resolve('contexts/DataContext.tsx', data_context_resolver)
resolve('server/routes.ts', routes_resolver)
resolve('server/cron.ts', lambda o, t, p: o)
resolve('app/(main)/index.tsx', lambda o, t, p: o)
resolve('app/create-loan.tsx', create_loan_resolver)
