import fs from 'node:fs';
import path from 'node:path';

const apphostingDir = path.join(process.cwd(), '.apphosting');
if (!fs.existsSync(apphostingDir)) {
  fs.mkdirSync(apphostingDir, { recursive: true });
}

const bundleYamlContent = `version: v1
runConfig:
  runCommand: node dist/server.cjs
`;

fs.writeFileSync(path.join(apphostingDir, 'bundle.yaml'), bundleYamlContent, 'utf8');

const targetDir = process.env.FIREBASE_OUTPUT_BUNDLE_DIR;
if (targetDir) {
  console.log(`Copying build output to FIREBASE_OUTPUT_BUNDLE_DIR: ${targetDir}`);
  
  const targetAppHostingDir = path.join(targetDir, '.apphosting');
  fs.mkdirSync(targetAppHostingDir, { recursive: true });
  fs.writeFileSync(path.join(targetAppHostingDir, 'bundle.yaml'), bundleYamlContent, 'utf8');

  const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(path.join(process.cwd(), 'dist'), path.join(targetDir, 'dist'));
  if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    fs.copyFileSync(path.join(process.cwd(), 'package.json'), path.join(targetDir, 'package.json'));
  }
  console.log('Successfully copied build artifacts to FIREBASE_OUTPUT_BUNDLE_DIR');
}
