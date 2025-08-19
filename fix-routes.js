const fs = require('fs');
const path = require('path');

// Find all route.ts files in the api directory
function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix the route file to use async params
function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern to match route handlers with params
  const handlerPattern = /export async function (GET|POST|PUT|DELETE|PATCH)\(\s*request: NextRequest,\s*\{ params \}: \{ params: ([^}]+) \}\s*\)/g;
  
  content = content.replace(handlerPattern, (match, method, paramsType) => {
    // Check if it's already a Promise
    if (paramsType.includes('Promise<')) {
      return match;
    }
    
    modified = true;
    return `export async function ${method}(
  request: NextRequest,
  { params }: { params: Promise<${paramsType}> }
)`;
  });
  
  // Fix the params usage inside functions
  const paramsUsagePattern = /const \{ ([^}]+) \} = params;/g;
  content = content.replace(paramsUsagePattern, (match, destructured) => {
    if (content.includes('await params')) {
      return match; // Already fixed
    }
    modified = true;
    return `const { ${destructured} } = await params;`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files:`);
routeFiles.forEach(file => console.log(`  ${file}`));

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixRouteFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} route files for Next.js 15 async params compatibility.`);
