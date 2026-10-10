#!/usr/bin/env node
/**
 * Usage: node scripts/archive-feature.mjs <filename>
 *
 * Moves .kanban/boards/features/<filename> to
 * project-management/archived/<next-number>-<filename>,
 * where <next-number> is one more than the highest existing archive number.
 *
 * The source file must have status: "in-progress" in its YAML frontmatter.
 * YAML frontmatter is stripped before writing to the archive (archived files
 * are plain markdown).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KANBAN_IN_PROGRESS = path.join(ROOT, '.kanban', 'boards', 'features', 'in-progress');
const ARCHIVED_DIR = path.join(ROOT, 'project-management', 'archived');

const filename = process.argv[2];

if (!filename) {
  console.error('Usage: node scripts/archive-feature.mjs <filename>');
  process.exit(1);
}

const sourcePath = path.join(KANBAN_IN_PROGRESS, filename);

if (!fs.existsSync(sourcePath)) {
  console.error(`Not found: ${sourcePath}`);
  process.exit(1);
}

const rawContent = fs.readFileSync(sourcePath, 'utf8');

// Strip YAML frontmatter block (everything between opening --- and closing ---)
function stripFrontmatter(content) {
  if (!content.startsWith('---\n')) return content;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return content;
  return content.slice(end + 5).replace(/^\n/, '');
}

const archivedContent = stripFrontmatter(rawContent);

fs.mkdirSync(ARCHIVED_DIR, { recursive: true });
const existing = fs.readdirSync(ARCHIVED_DIR);
const highest = existing.reduce((max, name) => {
  const m = name.match(/^(\d+)/);
  return m ? Math.max(max, parseInt(m[1], 10)) : max;
}, 0);

const nextNumber = highest + 1;
const destName = `${nextNumber}-${filename}`;
const destPath = path.join(ARCHIVED_DIR, destName);

fs.writeFileSync(destPath, archivedContent, 'utf8');
fs.unlinkSync(sourcePath);

console.log(`Archived as project-management/archived/${destName}`);
