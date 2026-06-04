const fs = require('fs');
const path = require('path');

// Target directory
const targetDir = path.join(__dirname, 'app');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const colorRegexes = [
  { pattern: /\[#115d72\]/gi, replace: 'primary' },
  { pattern: /\[#14a[12]bb\]/gi, replace: 'secondary' },
  { pattern: /\[#14a[12]bb92\]/gi, replace: 'secondary/90' },
  { pattern: /['"]#115d72['"]/gi, replace: '"var(--theme-primary)"' },
  { pattern: /['"]#14a[12]bb['"]/gi, replace: '"var(--theme-secondary)"' },
  { pattern: /`#115d72`/gi, replace: '`var(--theme-primary)`' },
  { pattern: /`#14a[12]bb`/gi, replace: '`var(--theme-secondary)`' },
  { pattern: /#115d72/gi, replace: 'var(--theme-primary)' }, // fallback for inline raw text outside strings, if any
  { pattern: /#14a[12]bb/gi, replace: 'var(--theme-secondary)' },
];

let replacedCount = 0;

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // We do careful replacements.
    // First, tailwind classes
    content = content.replace(/bg-\[#115d72\]/gi, 'bg-primary');
    content = content.replace(/text-\[#115d72\]/gi, 'text-primary');
    content = content.replace(/border-\[#115d72\]/gi, 'border-primary');
    content = content.replace(/fill-\[#115d72\]/gi, 'fill-primary');
    content = content.replace(/stroke-\[#115d72\]/gi, 'stroke-primary');
    content = content.replace(/from-\[#115d72\]/gi, 'from-primary');
    content = content.replace(/to-\[#115d72\]/gi, 'to-primary');
    content = content.replace(/via-\[#115d72\]/gi, 'via-primary');
    content = content.replace(/ring-\[#115d72\]/gi, 'ring-primary');

    content = content.replace(/bg-\[#14a[12]bb\]/gi, 'bg-secondary');
    content = content.replace(/text-\[#14a[12]bb\]/gi, 'text-secondary');
    content = content.replace(/border-\[#14a[12]bb\]/gi, 'border-secondary');
    content = content.replace(/fill-\[#14a[12]bb\]/gi, 'fill-secondary');
    content = content.replace(/stroke-\[#14a[12]bb\]/gi, 'stroke-secondary');
    content = content.replace(/from-\[#14a[12]bb\]/gi, 'from-secondary');
    content = content.replace(/to-\[#14a[12]bb\]/gi, 'to-secondary');
    content = content.replace(/via-\[#14a[12]bb\]/gi, 'via-secondary');
    content = content.replace(/ring-\[#14a[12]bb\]/gi, 'ring-secondary');

    // also bg-[#14a2bb92] -> bg-secondary/90
    content = content.replace(/bg-\[#14a[12]bb92\]/gi, 'bg-secondary/90');

    // For strings like color="#115d72" or style={{ color: '#115d72' }}
    content = content.replace(/['"]#115d72['"]/gi, '"var(--theme-primary)"');
    content = content.replace(/['"]#14a[12]bb['"]/gi, '"var(--theme-secondary)"');
    content = content.replace(/`#115d72`/gi, '`var(--theme-primary)`');
    content = content.replace(/`#14a[12]bb`/gi, '`var(--theme-secondary)`');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      replacedCount++;
      console.log(`Replaced in ${filePath}`);
    }
  }
});

console.log(`Done. Modified ${replacedCount} files.`);
