const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Utility to create directories recursively
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Utility to move a file or folder
function moveItem(sourcePath, targetPath) {
  const fullSource = path.join(srcDir, sourcePath);
  const fullTarget = path.join(srcDir, targetPath);

  if (fs.existsSync(fullSource)) {
    // Ensure target directory exists
    ensureDir(path.dirname(fullTarget));
    
    fs.renameSync(fullSource, fullTarget);
    console.log(`Moved: ${sourcePath} -> ${targetPath}`);
  } else {
    console.log(`Warning: Source not found: ${sourcePath}`);
  }
}

// Utility to delete a file or folder
function deleteItem(itemPath) {
  const fullPath = path.join(srcDir, itemPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Deleted: ${itemPath}`);
  } else {
    console.log(`Warning: Could not delete, not found: ${itemPath}`);
  }
}

console.log('Starting Migration...');

// 1. Delete Essays and Voting (YAGNI)
console.log('\n--- Deleting Essays & Voting ---');
deleteItem('components/essays');
deleteItem('components/shared/VoteButton.tsx');
deleteItem('components/shared/ContentionView.tsx');
deleteItem('actions/essay.ts');
deleteItem('actions/vote.ts');
deleteItem('types/contention.ts');

// 2. Auth Migration
console.log('\n--- Migrating Auth ---');
moveItem('components/auth', 'features/auth/components');
moveItem('components/reset-password', 'features/auth/components/reset-password');
moveItem('actions/auth.ts', 'features/auth/actions.ts');
moveItem('hooks/useAuth.ts', 'features/auth/hooks/use-auth.ts');

// 3. Admin Migration
console.log('\n--- Migrating Admin ---');
moveItem('components/admin', 'features/admin/components');
moveItem('components/layout/AdminSidebarContent.tsx', 'features/admin/components/AdminSidebarContent.tsx');
moveItem('actions/admin.ts', 'features/admin/actions/admin.ts');
moveItem('actions/verification.ts', 'features/admin/actions/verification.ts');

// 4. Documents Migration
console.log('\n--- Migrating Documents ---');
moveItem('components/document', 'features/documents/components');
moveItem('actions/upload-document.ts', 'features/documents/actions/upload-document.ts');
moveItem('actions/validate-document.ts', 'features/documents/actions/validate-document.ts');
moveItem('types/ingestion.ts', 'features/documents/types.ts');

// 5. Knowledge Graph Migration
console.log('\n--- Migrating Knowledge Graph ---');
moveItem('actions/kg-extract.ts', 'features/knowledge-graph/actions/kg-extract.ts');

// 6. Profile / Historian / Reader Migration
console.log('\n--- Migrating Profile ---');
moveItem('components/profile', 'features/profile/components');
moveItem('components/layout/HistorianSidebarContent.tsx', 'features/profile/components/HistorianSidebarContent.tsx');
moveItem('components/layout/ReaderSidebarContent.tsx', 'features/profile/components/ReaderSidebarContent.tsx');
moveItem('actions/profile.ts', 'features/profile/actions/profile.ts');
moveItem('actions/historian-profile.ts', 'features/profile/actions/historian-profile.ts');

// 7. Chat Migration
console.log('\n--- Migrating Chat ---');
moveItem('components/chat', 'features/chat/components');
moveItem('components/layout/ConversationVault.tsx', 'features/chat/components/ConversationVault.tsx');
moveItem('actions/conversation.ts', 'features/chat/actions/conversation.ts');

// 8. Remaining domains
console.log('\n--- Migrating Remaining Domains ---');
const remainingDirs = ['dashboard', 'publications', 'paths', 'archive', 'contact', 'contribute', 'explore', 'settings'];
for (const dir of remainingDirs) {
  moveItem(`components/${dir}`, `features/${dir}/components`);
}

// Move specific actions corresponding to remaining domains
moveItem('actions/catalog.ts', 'features/publications/actions/catalog.ts');
moveItem('actions/knowledge-path.ts', 'features/paths/actions/knowledge-path.ts');

console.log('\nMigration script complete! Next step: Update import paths across the codebase.');
