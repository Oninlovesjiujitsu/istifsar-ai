const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);

const replacements = [
  // Auth
  { regex: /@\/src\/components\/auth/g, replace: '@/src/features/auth/components' },
  { regex: /@\/src\/components\/reset-password/g, replace: '@/src/features/auth/components/reset-password' },
  { regex: /@\/src\/actions\/auth/g, replace: '@/src/features/auth/actions' },
  { regex: /@\/src\/hooks\/useAuth/g, replace: '@/src/features/auth/hooks/use-auth' },

  // Admin
  { regex: /@\/src\/components\/admin/g, replace: '@/src/features/admin/components' },
  { regex: /@\/src\/components\/layout\/AdminSidebarContent/g, replace: '@/src/features/admin/components/AdminSidebarContent' },
  { regex: /@\/src\/actions\/admin/g, replace: '@/src/features/admin/actions/admin' },
  { regex: /@\/src\/actions\/verification/g, replace: '@/src/features/admin/actions/verification' },

  // Documents
  { regex: /@\/src\/components\/document/g, replace: '@/src/features/documents/components' },
  { regex: /@\/src\/actions\/upload-document/g, replace: '@/src/features/documents/actions/upload-document' },
  { regex: /@\/src\/actions\/validate-document/g, replace: '@/src/features/documents/actions/validate-document' },
  { regex: /@\/src\/types\/ingestion/g, replace: '@/src/features/documents/types' },

  // Knowledge Graph
  { regex: /@\/src\/actions\/kg-extract/g, replace: '@/src/features/knowledge-graph/actions/kg-extract' },

  // Profile / Historian / Reader
  { regex: /@\/src\/components\/profile/g, replace: '@/src/features/profile/components' },
  { regex: /@\/src\/components\/layout\/HistorianSidebarContent/g, replace: '@/src/features/profile/components/HistorianSidebarContent' },
  { regex: /@\/src\/components\/layout\/ReaderSidebarContent/g, replace: '@/src/features/profile/components/ReaderSidebarContent' },
  { regex: /@\/src\/actions\/profile/g, replace: '@/src/features/profile/actions/profile' },
  { regex: /@\/src\/actions\/historian-profile/g, replace: '@/src/features/profile/actions/historian-profile' },

  // Chat
  { regex: /@\/src\/components\/chat/g, replace: '@/src/features/chat/components' },
  { regex: /@\/src\/components\/layout\/ConversationVault/g, replace: '@/src/features/chat/components/ConversationVault' },
  { regex: /@\/src\/actions\/conversation/g, replace: '@/src/features/chat/actions/conversation' },

  // Remaining Domains (dashboard, publications, paths, archive, contact, contribute, explore, settings)
  { regex: /@\/src\/components\/(dashboard|publications|paths|archive|contact|contribute|explore|settings)/g, replace: '@/src/features/$1/components' },
  
  // Remaining Actions
  { regex: /@\/src\/actions\/catalog/g, replace: '@/src/features/publications/actions/catalog' },
  { regex: /@\/src\/actions\/knowledge-path/g, replace: '@/src/features/paths/actions/knowledge-path' },

  // Cleanup potential essays/voting imports that we deleted, just in case they were missed
  // The compiler will flag these if they exist, but we deleted the feature entirely.
];

let filesModified = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  for (const { regex, replace } of replacements) {
    newContent = newContent.replace(regex, replace);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated imports in: ${path.relative(srcDir, filePath)}`);
    filesModified++;
  }
}

console.log(`\nImport update complete! Modified ${filesModified} files.`);
