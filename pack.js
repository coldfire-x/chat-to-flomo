const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build the extension using webpack
console.log('Building extension with webpack...');
execSync('npm run build', { stdio: 'inherit' });

// Files and directories to include in the package
const filesToInclude = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'icons',
  'images',
  'dist'
];

// Create a directory for the packaged extension
const packageDir = path.join(__dirname, 'package');
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true, force: true });
}
fs.mkdirSync(packageDir);

// Copy files to the package directory
console.log('Copying files to package directory...');
filesToInclude.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(packageDir, file);
  
  if (fs.statSync(srcPath).isDirectory()) {
    // Copy directory recursively
    fs.mkdirSync(destPath, { recursive: true });
    copyDirRecursive(srcPath, destPath);
  } else {
    // Copy file
    fs.copyFileSync(srcPath, destPath);
  }
});

// Function to copy directory recursively
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create a zip file for the extension
console.log('Creating ZIP file...');
const zipOutput = fs.createWriteStream(path.join(__dirname, 'saveme.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(zipOutput);
archive.directory(packageDir, false);
archive.finalize();

zipOutput.on('close', () => {
  console.log(`Extension packaged successfully: ${archive.pointer()} total bytes`);
  console.log('ZIP file created at:', path.join(__dirname, 'saveme.zip'));
  
  console.log('\nTo load the unpacked extension in Chrome:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the "package" directory');
  
  console.log('\nTo create a .crx file using Chrome:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Enable "Developer mode" (toggle in the top-right corner)');
  console.log('3. Click "Pack extension" button');
  console.log('4. For "Extension root directory", select the "package" directory created by this script');
  console.log('5. Leave "Private key file" empty (for first-time packaging) or select your existing .pem file (for updates)');
  console.log('6. Click "Pack Extension" button');
  console.log('7. Chrome will create two files:');
  console.log('   - package.crx: The packaged extension file you can distribute');
  console.log('   - package.pem: The private key file you should keep secure for future updates');
}); 