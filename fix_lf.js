
const fs = require('fs');
const path = 'c:/Apps/TV_Corp/backend/supabase-docker/volumes/pooler/pooler.exs';
const content = fs.readFileSync(path, 'utf8');
const lfContent = content.replace(/\r\n/g, '\n');
fs.writeFileSync(path, lfContent, { encoding: 'utf8', newline: 'lf' });
console.log('Converted to LF');
