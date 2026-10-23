import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function importPR(url) {
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)\/?$/.exec(url);
  if (!match) throw new Error('Enter a GitHub PR URL: https://github.com/owner/repo/pull/123');
  const [, owner, repo, number] = match;
  const gh = args => execFileSync('gh', args, { encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024 });
  const endpoint = `repos/${owner}/${repo}/pulls/${number}`;
  const pr = JSON.parse(gh(['api', endpoint]));
  const pages = JSON.parse(gh(['api', `${endpoint}/files?per_page=100`, '--paginate', '--slurp']));
  const files = pages.flat().map(file => ({ path: file.filename, previousPath: file.previous_filename, status: file.status, additions: file.additions, deletions: file.deletions, patch: file.patch ?? null }));
  return { schema: 1, url, repository: `${owner}/${repo}`, number: Number(number), title: pr.title, body: pr.body ?? '', base: pr.base.sha, head: pr.head.sha, importedAt: new Date().toISOString(), completeFileList: files.length === pr.changed_files, files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = importPR(process.argv[2]);
  if (!process.argv[3]) throw new Error('Provide an output JSON path. Keep private PR data out of Git.');
  writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
  console.log(`Imported ${result.repository}#${result.number}: ${result.files.length} files; head ${result.head}`);
}
