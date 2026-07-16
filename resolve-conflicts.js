const fs = require('fs');
const path = require('path');

function resolveConflict(filePath, resolver) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Split the content by <<<<<<< ours
    const parts = content.split(/<<<<<<< ours\r?\n/);
    if (parts.length === 1) return; // No conflicts
    
    let newContent = parts[0];
    
    for (let i = 1; i < parts.length; i++) {
        const conflictBlock = parts[i];
        
        // Find =======
        const midIndex = conflictBlock.indexOf('=======\r\n') !== -1 ? conflictBlock.indexOf('=======\r\n') : conflictBlock.indexOf('=======\n');
        
        // Find >>>>>>> theirs
        const endIndex = conflictBlock.indexOf('>>>>>>> theirs\r\n') !== -1 ? conflictBlock.indexOf('>>>>>>> theirs\r\n') : conflictBlock.indexOf('>>>>>>> theirs\n');
        
        if (midIndex === -1 || endIndex === -1) {
            newContent += '<<<<<<< ours\n' + conflictBlock; // fallback
            continue;
        }
        
        const midLength = conflictBlock.substring(midIndex, midIndex + 10).includes('\r\n') ? 9 : 8;
        const endLength = conflictBlock.substring(endIndex, endIndex + 16).includes('\r\n') ? 16 : 15;
        
        const ours = conflictBlock.substring(0, midIndex);
        const theirs = conflictBlock.substring(midIndex + midLength, endIndex);
        const rest = conflictBlock.substring(endIndex + endLength);
        
        newContent += resolver(ours, theirs, filePath) + rest;
    }
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Resolved ${filePath}`);
}

resolveConflict('app/(main)/index.tsx', (ours, theirs) => ours);

resolveConflict('contexts/DataContext.tsx', (ours, theirs) => {
    if (ours.includes('requestLoan: (data: {') || ours.includes('memberId?: string;')) {
        return ours + theirs;
    }
    if (ours.includes('lateFee: number;')) {
        return ours;
    }
    return ours; // recordPayment, etc.
});

resolveConflict('server/cron.ts', (ours, theirs) => ours);

resolveConflict('server/routes.ts', (ours, theirs) => {
    if (ours.includes('resolutionNo: "",')) {
        return theirs;
    }
    if (ours.includes('const { amount, duration, memberId, memberName, startDate } = req.body;')) {
        return `
      // Role guard: only president or treasurer may create loans
      const caller = req.currentUser!;
      if (caller.role !== "president" && caller.role !== "treasurer")
        return res.status(403).json({ error: "Only the President or Treasurer can create loans" });

      const { amount, duration, memberId, memberName, startDate, isExisting, isCompleted, outstandingPrincipal, loanDate } = req.body;
`;
    }
    return ours;
});

resolveConflict('app/create-loan.tsx', (ours, theirs) => {
    // Both! They generally don't overlap, one adds things at the top, one adds at the bottom.
    // For imports and hooks (first few conflicts), we combine.
    // For UI elements, we combine.
    if (theirs.trim() === '') return ours;
    if (ours.trim() === '') return theirs;
    return ours + theirs;
});

console.log('Script completed.');
