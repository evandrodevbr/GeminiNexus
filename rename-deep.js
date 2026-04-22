const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Extensões permitidas
const allowedExtensions = /\.(ts|tsx|js|jsx|json|md|html|jsonc|yml|yaml|css)$/;

// Arquivos/Pastas a ignorar (já curados ou irrelevantes)
const ignoreDirs = ['node_modules', '.git', '.gemini', 'dist', 'out', 'build', 'images', 'docs', '.planning'];
const ignoreFiles = ['README.md', 'README.pt-BR.md', 'CHANGELOG.md', 'forge.config.ts', 'package.json', 'rename.js', 'rename-deep.js', 'task.md', 'walkthrough.md'];

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (ignoreDirs.includes(file)) continue;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkAndReplace(fullPath);
      
      // Rename directory if it contains 'antigravity'
      if (file.toLowerCase().includes('antigravity')) {
        const newName = file.replace(/antigravity/gi, (match) => {
          if (match === 'antigravity') return 'geminiNexus';
          if (match === 'Antigravity') return 'GeminiNexus';
          return 'geminiNexus';
        });
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed directory: ${fullPath} -> ${newPath}`);
      }
    } else {
      if (ignoreFiles.includes(file)) continue;

      if (allowedExtensions.test(file)) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        const originalContent = content;

        // Save original GitHub links
        const repoUrlRegex = /github\.com\/Draculabo\/AntigravityManager/gi;
        const tempUrlMarker = '___TEMP_GITHUB_URL___';
        content = content.replace(repoUrlRegex, tempUrlMarker);

        // 1. Strings exact match "Antigravity" -> "Gemini Nexus"
        content = content.replace(/['"]Antigravity['"]/g, (match) => {
          return match[0] + 'Gemini Nexus' + match[0];
        });

        // 2. String "Antigravity " -> "Gemini Nexus "
        content = content.replace(/Antigravity /g, 'Gemini Nexus ');
        
        // 3. String " Antigravity" -> " Gemini Nexus"
        content = content.replace(/ Antigravity/g, ' Gemini Nexus');

        // 4. Identifiers Antigravity -> GeminiNexus
        content = content.replace(/Antigravity/g, 'GeminiNexus');

        // 5. Identifiers antigravity -> geminiNexus
        content = content.replace(/antigravity/g, 'geminiNexus');

        // Restore GitHub links
        content = content.replace(new RegExp(tempUrlMarker, 'g'), 'github.com/Draculabo/AntigravityManager');

        // Cleanup any double replacements
        content = content.replace(/GeminiNexus Nexus/g, 'Gemini Nexus');

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf-8');
          console.log(`Updated file content: ${fullPath}`);
        }
        
        // Rename file if it contains 'antigravity'
        if (file.toLowerCase().includes('antigravity')) {
          const newName = file.replace(/antigravity/gi, (match) => {
            if (match === 'antigravity') return 'geminiNexus'; // For files like antigravityVersion.ts -> geminiNexusVersion.ts
            if (match === 'Antigravity') return 'GeminiNexus';
            return 'geminiNexus';
          });
          const newPath = path.join(dir, newName);
          fs.renameSync(fullPath, newPath);
          console.log(`Renamed file: ${fullPath} -> ${newPath}`);
        }
      }
    }
  }
}

console.log('Starting global deep rename of Antigravity to GeminiNexus...');
walkAndReplace(projectRoot);
console.log('Rename complete.');
