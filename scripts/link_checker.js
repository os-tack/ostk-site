import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (file.endsWith('.html')) {
      files.push(name);
    }
  }
  return files;
}

if (!fs.existsSync(distDir)) {
  console.error(`Dist directory ${distDir} does not exist. Run build first.`);
  process.exit(1);
}

const htmlFiles = getFiles(distDir);
console.log(`Found ${htmlFiles.length} HTML files in ${distDir}`);

let checkedLinks = 0;
const brokenLinks = [];

const hrefRegex = /href=["']([^"']+)["']/g;

for (const filePath of htmlFiles) {
  const relPath = path.relative(distDir, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    checkedLinks++;
    
    // Skip external, protocol, hash-only, and query-only
    if (
      href.startsWith('http://') || 
      href.startsWith('https://') || 
      href.startsWith('mailto:') || 
      href.startsWith('tel:') || 
      href.startsWith('#') ||
      href.startsWith('?')
    ) {
      continue;
    }
    
    // Clean query params or hash fragment
    const cleanHref = href.split('#')[0].split('?')[0];
    if (!cleanHref) continue;
    
    let targetPath;
    if (cleanHref.startsWith('/')) {
      targetPath = path.join(distDir, cleanHref.slice(1));
    } else {
      targetPath = path.resolve(path.dirname(filePath), cleanHref);
    }
    
    // Check if targetPath exists, or if targetPath + '/index.html' exists (Astro routing)
    let exists = fs.existsSync(targetPath);
    if (!exists) {
      // Check if it's a directory target without index.html
      const dirIndex = path.join(targetPath, 'index.html');
      if (fs.existsSync(dirIndex)) {
        exists = true;
      }
    }
    
    if (!exists) {
      brokenLinks.push({ source: relPath, href, resolved: targetPath });
    }
  }
}

console.log(`Checked ${checkedLinks} links.`);
if (brokenLinks.length > 0) {
  console.error(`\nFound ${brokenLinks.length} broken link(s):`);
  for (const bl of brokenLinks) {
    console.error(`  In ${bl.source}: href="${bl.href}" (resolved: ${bl.resolved})`);
  }
  process.exit(1);
} else {
  console.log('All links verified successfully!');
}
