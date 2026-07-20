
const fs = require('fs');
const file = 'app/loan/[id].tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIndex = 578; // line 579 is index 578
const endIndex = 765; // line 766 is index 765, we want up to index 764. Wait, if we use splice, it's startIndex, deleteCount
const deleteCount = endIndex - startIndex; 

// The lines we want to extract: from index 578 (inclusive) to index 764 (inclusive). That's 765 - 578 = 187 lines.
const extracted = lines.splice(578, 187);

// Now we need to insert them before line 403, which is index 402.
// BUT wait, after splicing 187 lines out from index 578, the lines before 578 are unaffected.
// So line 403 is still at index 402.
lines.splice(402, 0, ...extracted);

fs.writeFileSync(file, lines.join('\n'));
console.log('Moved successfully!');
