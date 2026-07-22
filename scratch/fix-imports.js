const fs = require('fs');

const files = [
  'app/(main)/payments.tsx',
  'app/loans.tsx',
  'app/bank-loans.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('useFocusEffect } from "expo-router"')) {
    if (content.includes('from "expo-router"')) {
       content = content.replace('from "expo-router"', ', useFocusEffect } from "expo-router"');
    } else {
       // Insert it after the last import
       const lastImportMatch = [...content.matchAll(/import .* from .*;/g)].pop();
       if (lastImportMatch) {
         const insertPos = lastImportMatch.index + lastImportMatch[0].length;
         content = content.slice(0, insertPos) + '\nimport { useFocusEffect } from "expo-router";' + content.slice(insertPos);
       } else {
         content = 'import { useFocusEffect } from "expo-router";\n' + content;
       }
    }
    fs.writeFileSync(file, content);
    console.log('Fixed imports in ' + file);
  }
});
