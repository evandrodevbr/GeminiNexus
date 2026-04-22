const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Extensões permitidas
const allowedExtensions = /\.(ts|tsx)$/;

function walkAndFix(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (['node_modules', '.git', 'dist', 'out'].includes(file)) continue;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkAndFix(fullPath);
    } else if (allowedExtensions.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const original = content;

      // Fix specific known broken identifiers
      content = content.replace(/closeGemini Nexus/g, 'closeGeminiNexus');
      content = content.replace(/startGemini Nexus/g, 'startGeminiNexus');
      content = content.replace(/Gemini NexusVersion/g, 'GeminiNexusVersion');
      content = content.replace(/Gemini NexusDb/g, 'GeminiNexusDb');
      content = content.replace(/Gemini NexusStorage/g, 'GeminiNexusStorage');
      content = content.replace(/Gemini NexusExecutable/g, 'GeminiNexusExecutable');
      content = content.replace(/Gemini NexusCoreFeatures/g, 'GeminiNexusCoreFeatures');
      content = content.replace(/getGemini Nexus/g, 'getGeminiNexus');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Fixed TS errors in: ${fullPath}`);
      }
    }
  }
}

walkAndFix(projectRoot);
console.log('Fix complete.');
