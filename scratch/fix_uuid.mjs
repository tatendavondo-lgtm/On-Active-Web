import fs from 'fs';
import path from 'path';

function findFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(process.cwd(), 'src');
const files = findFiles(srcDir);

for (const file of files) {
  if (file.includes('uuid.ts')) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('crypto.randomUUID()')) {
    content = content.replace(/crypto\.randomUUID\(\)/g, 'generateUUID()');
    
    // Add import statement at the top if not exists
    if (!content.includes('generateUUID')) {
      // should never happen since we just replaced it, but just to be safe
    }
    
    // Determine relative path to src/lib/uuid.ts
    const fileDir = path.dirname(file);
    const uuidPath = path.join(srcDir, 'lib', 'uuid');
    let relPath = path.relative(fileDir, uuidPath).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    
    const importStmt = `import { generateUUID } from '${relPath}';\n`;
    
    // Insert after the last import, or at the top
    const importRegex = /^import\s+.*?;?\s*$/gm;
    let match;
    let lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastIndex = importRegex.lastIndex;
    }
    
    if (lastIndex > 0) {
      content = content.slice(0, lastIndex) + '\n' + importStmt + content.slice(lastIndex);
    } else {
      content = importStmt + content;
    }
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
