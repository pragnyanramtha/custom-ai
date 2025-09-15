#!/usr/bin/env node

/**
 * Validate React deployment configuration and functionality
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Validating React Deployment Configuration...\n');

let allChecksPass = true;

function checkResult(test, condition, successMsg, failMsg) {
  if (condition) {
    console.log(`✅ ${test}: ${successMsg}`);
  } else {
    console.log(`❌ ${test}: ${failMsg}`);
    allChecksPass = false;
  }
}

// 1. Check package.json build configuration
console.log('📦 Checking package.json configuration...');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

checkResult(
  'Build script',
  packageJson.scripts && packageJson.scripts.build === 'vite build',
  'Build script correctly configured',
  'Build script missing or incorrect'
);

checkResult(
  'Dev script',
  packageJson.scripts && packageJson.scripts.dev === 'vite',
  'Dev script correctly configured',
  'Dev script missing or incorrect'
);

checkResult(
  'React dependencies',
  packageJson.dependencies && packageJson.dependencies.react && packageJson.dependencies['react-dom'],
  'React dependencies present',
  'React dependencies missing'
);

// 2. Check vercel.json configuration
console.log('\n🔧 Checking vercel.json configuration...');
const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));

checkResult(
  'Build command',
  vercelConfig.buildCommand === 'npm run build',
  'Build command correctly set',
  'Build command incorrect'
);

checkResult(
  'Output directory',
  vercelConfig.outputDirectory === 'dist',
  'Output directory correctly set',
  'Output directory incorrect'
);

checkResult(
  'SPA routing',
  vercelConfig.rewrites && vercelConfig.rewrites.some(r => r.destination === '/index.html'),
  'SPA routing configured',
  'SPA routing not configured'
);

checkResult(
  'API functions',
  vercelConfig.functions && vercelConfig.functions['api/**/*.js'],
  'API functions configured',
  'API functions not configured'
);

// 3. Check build output
console.log('\n🏗️  Checking build output...');
try {
  console.log('   Building React app...');
  execSync('npm run build', { stdio: 'pipe' });
  
  checkResult(
    'Build success',
    fs.existsSync('./dist'),
    'Build completed successfully',
    'Build failed or dist directory missing'
  );
  
  if (fs.existsSync('./dist')) {
    const distFiles = fs.readdirSync('./dist');
    checkResult(
      'Build files',
      distFiles.includes('index.html') && distFiles.includes('assets'),
      'Required build files present',
      'Required build files missing'
    );
  }
} catch (error) {
  checkResult(
    'Build process',
    false,
    'Build successful',
    `Build failed: ${error.message}`
  );
}

// 4. Check React components
console.log('\n⚛️  Checking React components...');
const requiredComponents = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components/ChatInterface.tsx',
  'src/components/AdminPanel.tsx'
];

requiredComponents.forEach(component => {
  checkResult(
    `Component ${component}`,
    fs.existsSync(component),
    'Component exists',
    'Component missing'
  );
});

// 5. Check API integration
console.log('\n🔌 Checking API integration...');
const chatInterfaceContent = fs.readFileSync('./src/components/ChatInterface.tsx', 'utf8');

checkResult(
  'Chat API integration',
  chatInterfaceContent.includes('/api/chat') && chatInterfaceContent.includes('fetch'),
  'Chat API properly integrated',
  'Chat API integration missing'
);

checkResult(
  'localStorage integration',
  chatInterfaceContent.includes('localStorage') && chatInterfaceContent.includes('chatHistory'),
  'localStorage integration present',
  'localStorage integration missing'
);

const adminPanelContent = fs.readFileSync('./src/components/AdminPanel.tsx', 'utf8');

checkResult(
  'Knowledge API integration',
  adminPanelContent.includes('/api/knowledge') && adminPanelContent.includes('fetch'),
  'Knowledge API properly integrated',
  'Knowledge API integration missing'
);

// 6. Check deployment requirements
console.log('\n🚀 Checking deployment requirements...');

checkResult(
  'Environment variables',
  vercelConfig.env && vercelConfig.env.GEMINI_API_KEY,
  'Environment variables configured',
  'Environment variables missing'
);

checkResult(
  'CORS headers',
  vercelConfig.headers && vercelConfig.headers.some(h => h.source === '/api/(.*)'),
  'CORS headers configured',
  'CORS headers missing'
);

// 7. Verify requirements compliance
console.log('\n📋 Checking requirements compliance...');

// Requirement 3.1: Same API endpoints
const apiFiles = ['api/chat.js', 'api/knowledge/index.js', 'api/knowledge/search.js', 'api/knowledge/[id].js'];
const allApiFilesExist = apiFiles.every(file => fs.existsSync(file));

checkResult(
  'Requirement 3.1 - API compatibility',
  allApiFilesExist,
  'All existing API endpoints preserved',
  'Some API endpoints missing'
);

// Requirement 3.2: Same request/response patterns
checkResult(
  'Requirement 3.2 - Request patterns',
  chatInterfaceContent.includes('POST') && chatInterfaceContent.includes('Content-Type'),
  'Same request patterns maintained',
  'Request patterns changed'
);

// Requirement 3.3: localStorage usage
checkResult(
  'Requirement 3.3 - localStorage',
  chatInterfaceContent.includes('localStorage.getItem') && chatInterfaceContent.includes('localStorage.setItem'),
  'localStorage usage maintained',
  'localStorage usage missing'
);

// Requirement 3.4: Vercel deployment
checkResult(
  'Requirement 3.4 - Vercel deployment',
  fs.existsSync('./vercel.json') && vercelConfig.buildCommand,
  'Vercel deployment configured',
  'Vercel deployment not configured'
);

// Requirement 3.5: Performance characteristics
checkResult(
  'Requirement 3.5 - Performance',
  vercelConfig.functions && vercelConfig.functions['api/**/*.js'].maxDuration,
  'Performance settings configured',
  'Performance settings missing'
);

// Summary
console.log('\n📊 Validation Summary:');
if (allChecksPass) {
  console.log('🎉 All deployment validation checks passed!');
  console.log('✅ React transformation is ready for production deployment');
  console.log('\n📝 Deployment checklist:');
  console.log('   ✅ Package.json configured for React build');
  console.log('   ✅ Vercel.json updated for SPA routing');
  console.log('   ✅ React components implemented');
  console.log('   ✅ API integration maintained');
  console.log('   ✅ localStorage functionality preserved');
  console.log('   ✅ All requirements satisfied');
  console.log('\n🚀 Ready to deploy with: npm run deploy');
  process.exit(0);
} else {
  console.log('❌ Some validation checks failed');
  console.log('   Please fix the issues above before deploying');
  process.exit(1);
}