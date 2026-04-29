const fs = require('fs');
let file = fs.readFileSync('src/routes/settings.tsx', 'utf8');

// The settings page uses standard cards that look bulky in minimal dark mode
file = file.replace(/<div className="flex flex-col gap-6">/g, '<div className="flex flex-col gap-2">');
file = file.replace(/<Card>/g, '<Card className="bg-transparent border-0 shadow-none rounded-none border-b border-white/5 last:border-0 pb-6">');
file = file.replace(/<CardHeader>/g, '<CardHeader className="px-0 pt-4">');
file = file.replace(/<CardContent>/g, '<CardContent className="px-0">');

fs.writeFileSync('src/routes/settings.tsx', file);

