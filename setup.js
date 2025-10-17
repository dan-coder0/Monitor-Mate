#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Monitor Mate project...');

// Create missing directories
const directories = [
    'android/app/src/main/res/values',
    'ios/MobileMonitor/Images.xcassets/AppIcon.appiconset'
];

directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Check Android manifest permissions
const manifestPath = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    const requiredPermissions = [
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.PACKAGE_USAGE_STATS'
    ];
    
    const hasAllPermissions = requiredPermissions.every(perm => manifest.includes(perm));
    if (hasAllPermissions) {
        console.log('✅ Android permissions configured correctly');
    } else {
        console.log('⚠️  Android permissions may need updating');
    }
}

// Check if native module is properly registered
const mainAppPath = path.join(__dirname, 'android/app/src/main/java/com/mobilemonitor/MainApplication.kt');
if (fs.existsSync(mainAppPath)) {
    const mainApp = fs.readFileSync(mainAppPath, 'utf8');
    if (mainApp.includes('InstalledAppsPackage')) {
        console.log('✅ Native module registered correctly');
    } else {
        console.log('⚠️  Native module may not be registered');
    }
}

// Check dependencies
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = [
        '@react-navigation/native',
        '@react-navigation/native-stack',
        'react-native-safe-area-context',
        'react-native-screens'
    ];
    
    const hasAllDeps = requiredDeps.every(dep => 
        packageJson.dependencies[dep] || packageJson.devDependencies[dep]
    );
    
    if (hasAllDeps) {
        console.log('✅ All required dependencies are installed');
    } else {
        console.log('⚠️  Some dependencies may be missing');
    }
}

console.log('\n🚀 Setup complete! You can now run:');
console.log('   npm run android  # For Android');
console.log('   npm run ios      # For iOS (macOS only)');
console.log('\n📝 Next steps:');
console.log('   1. Enable "Apps with usage access" permission in device settings');
console.log('   2. Test app monitoring functionality');
console.log('   3. Review security alerts and permissions');