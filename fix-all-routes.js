const fs = require('fs');
const path = require('path');

function findAllRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findAllRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Skip files that already have Promise<> in params
  if (content.includes('params: Promise<')) {
    return false;
  }

  // Skip files without dynamic params
  if (!content.includes('{ params }')) {
    return false;
  }

  // Fix all param type signatures to be Promise
  content = content.replace(
    /{ params }: { params: ([^}]+) }/g,
    '{ params }: { params: Promise<$1> }'
  );

  // Ensure all param destructuring uses await
  content = content.replace(
    /const { ([^}]+) } = params;/g,
    'const { $1 } = await params;'
  );

  // Fix direct property access
  content = content.replace(
    /const ([a-zA-Z]+) = params\.([a-zA-Z]+);/g,
    'const { $2: $1 } = await params;'
  );

  // Fix resolvedParams pattern
  content = content.replace(
    /const resolvedParams = await params;\s*const ([a-zA-Z]+) = (?:parseInt\()?resolvedParams\.([a-zA-Z]+)(?:\))?;/g,
    'const { $2 } = await params;\n    const $1 = parseInt($2);'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${path.relative(__dirname, filePath)}`);
  return true;
}

console.log('Fixing ALL dynamic route files for Next.js 15...\n');

const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findAllRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} route files for Next.js 15 async params!`);
