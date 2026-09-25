// Adds a content fingerprint (?v=<hash>) to every local CSS/JS link in index.html, plus a build id,
// so browsers never mix a new page with old cached files. Run before every commit:
//   node scripts/stamp-assets.mjs          (rewrite index.html)
//   node scripts/stamp-assets.mjs --check  (exit 1 if index.html is out of date)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'index.html');
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 10);

export function stamp(html) {
  const seen = [];
  const out = html.replace(/(<(?:script|link)\b[^>]*?\s(?:src|href)=")((?!https?:|data:)[^"?#]+\.(?:js|css))(?:\?v=[a-f0-9]+)?(")/g,
    (m, pre, path, post) => {
      const v = hash(readFileSync(join(root, path)));
      seen.push(`${path}:${v}`);
      return `${pre}${path}?v=${v}${post}`;
    });
  const build = hash(seen.join('|'));
  return out.replace(/<meta name="build" content="[^"]*">/, `<meta name="build" content="${build}">`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const html = readFileSync(indexPath, 'utf8');
  const next = stamp(html);
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('index.html asset versions are out of date. Run: node scripts/stamp-assets.mjs'); process.exit(1); }
    console.log('index.html asset versions are current.');
  } else {
    writeFileSync(indexPath, next);
    console.log(next === html ? 'index.html already current.' : 'index.html asset versions updated.');
  }
}
