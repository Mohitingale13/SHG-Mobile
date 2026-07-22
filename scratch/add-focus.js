const fs = require('fs');
const files = [
  'app/(main)/index.tsx',
  'app/(main)/payments.tsx',
  'app/loans.tsx',
  'app/members.tsx',
  'app/bank-loans.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('Skipping ' + file + ' as it does not exist');
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Add useFocusEffect to expo-router import
  if (content.includes('import { router } from "expo-router";')) {
    content = content.replace('import { router } from "expo-router";', 'import { router, useFocusEffect } from "expo-router";');
  } else if (!content.includes('useFocusEffect')) {
    // some might have import { Link, router } etc.
    content = content.replace(/from "expo-router";/, ', useFocusEffect } from "expo-router";');
  }

  // Ensure useCallback is imported
  if (!content.includes('useCallback,')) {
    content = content.replace('useState,', 'useState, useCallback,');
  }

  // 2. Add useFocusEffect hook right after useData
  // We need to inject it right inside the component body, typically after const { ... } = useData();
  const useDataRegex = /const \{[^}]+\} = useData\(\);\s*const \[[^\]]+\] = useState\([^)]+\);/g;
  const match = content.match(useDataRegex);
  
  if (match && !content.includes('useFocusEffect(useCallback')) {
    const replacement = match[0] + '\n\n  useFocusEffect(\n    useCallback(() => {\n      refreshData();\n    }, [])\n  );\n';
    content = content.replace(match[0], replacement);
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  } else {
    // If regex fails to match, let's just find useData();
    const fallbackRegex = /const \{[^}]+\} = useData\(\);/g;
    const fbMatch = content.match(fallbackRegex);
    if (fbMatch && !content.includes('useFocusEffect(useCallback')) {
      const replacement = fbMatch[0] + '\n\n  useFocusEffect(\n    useCallback(() => {\n      if (refreshData) refreshData();\n    }, [])\n  );\n';
      content = content.replace(fbMatch[0], replacement);
      fs.writeFileSync(file, content);
      console.log('Updated ' + file + ' (fallback)');
    } else {
      console.log('No change needed for ' + file);
    }
  }
});
