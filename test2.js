const { execSync } = require('child_process');
try {
  const result = execSync('gh api repos/Vestcodes/status-dashboard/pulls/4/comments', { encoding: 'utf-8' });
  console.log(result);
} catch (e) {
  console.error(e);
}
