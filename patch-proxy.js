const fs = require('fs');
let file = fs.readFileSync('src/routes/proxy.tsx', 'utf8');

// The Proxy layout also uses heavy cards
file = file.replace(/<Card>/g, '<Card className="bg-background border border-white/5 shadow-none">');

fs.writeFileSync('src/routes/proxy.tsx', file);

