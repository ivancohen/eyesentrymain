
/**
 * Test script to verify that the import issues in AuthContext.tsx are fixed
 */

import { exec } from 'child_process';

// Run TypeScript check on the file
exec('npx tsc --noEmit src/contexts/AuthContext.tsx', (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript check failed:');
    console.error(stdout || stderr);
    process.exit(1);
  } else {
    console.log('TypeScript check passed! No duplicate import errors.');
    process.exit(0);
  }
});
