#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const ALLOWED_COMMANDS = new Set(['vercel', 'npm', 'pnpm', 'yarn']);
function log(msg) { console.error(msg); }
function commandExists(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) throw new Error(`Command not in whitelist: ${cmd}`);
  try {
    if (isWindows) { const r = spawnSync('where', [cmd], { stdio: 'ignore' }); return r.status === 0; }
    else { const r = spawnSync('sh', ['-c', `command -v "$1"`, '--', cmd], { stdio: 'ignore' }); return r.status === 0; }
  } catch { return false; }
}
function getCommandOutput(cmd, args) {
  try { const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe','pipe','ignore'], shell: isWindows }); return r.status === 0 ? (r.stdout || '').trim() : null; } catch { return null; }
}
function parseArgs(args) {
  const result = { projectPath: '.', prod: true, yes: false, skipBuild: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prod') result.prod = true;
    else if (args[i] === '--yes' || args[i] === '-y') result.yes = true;
    else if (args[i] === '--skip-build') result.skipBuild = true;
    else if (!args[i].startsWith('-')) result.projectPath = args[i];
  }
  return result;
}
function checkVercelInstalled() {
  if (!commandExists('vercel')) { log('Error: Vercel CLI not installed'); process.exit(1); }
  log(`Vercel CLI: ${getCommandOutput('vercel', ['--version']) || 'unknown'}`);
}
function checkLoginStatus() {
  try {
    const r = spawnSync('vercel', ['whoami'], { encoding: 'utf8', stdio: ['pipe','pipe','pipe'], shell: isWindows });
    const out = (r.stdout || '').trim();
    if (r.status === 0 && out && !out.includes('Error') && !out.includes('not logged in')) { log(`Logged in as: ${out}`); return true; }
  } catch {}
  return false;
}
function checkProject(projectPath) {
  const absPath = path.resolve(projectPath);
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) { log(`Error: not a directory: ${absPath}`); process.exit(1); }
  log(`Project: ${absPath}`);
  return absPath;
}
function detectPackageManager(projectPath) {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm';
  if (commandExists('pnpm')) return 'pnpm';
  if (commandExists('yarn')) return 'yarn';
  return 'npm';
}
function runBuildIfNeeded(projectPath) {
  const pkgJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) { log('No package.json, skipping build'); return true; }
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')); } catch (e) { return true; }
  if (!pkg.scripts || !pkg.scripts.build) { log('No build script, skipping'); return true; }
  const pm = detectPackageManager(projectPath);
  const nodeModules = path.join(projectPath, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    log('Installing dependencies...');
    const instArgs = pm === 'yarn' ? [] : ['install'];
    const r = spawnSync(pm, instArgs, { cwd: projectPath, stdio: 'inherit', shell: isWindows });
    if (r.status !== 0) { log('Install failed'); process.exit(1); }
  }
  log(`Building with ${pm}...`);
  const buildArgs = pm === 'npm' ? ['run', 'build'] : ['build'];
  const r = spawnSync(pm, buildArgs, { cwd: projectPath, stdio: 'inherit', shell: isWindows });
  if (r.status !== 0) { log('Build failed'); process.exit(1); }
  log('Build success!');
  return true;
}
function doDeploy(projectPath, options) {
  log('Deploying...');
  const cmdParts = ['vercel'];
  if (options.yes) cmdParts.push('--yes');
  if (options.prod) { cmdParts.push('--prod'); log('Mode: Production'); }
  const args = cmdParts.slice(1);
  try {
    const r = spawnSync('vercel', args, { cwd: projectPath, encoding: 'utf8', stdio: ['inherit','pipe','pipe'], timeout: 300000, shell: isWindows });
    const output = (r.stdout || '') + (r.stderr || '');
    log(output);
    if (r.status !== 0) throw new Error('Deploy failed');
    const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const deployMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const finalUrl = aliasedMatch ? aliasedMatch[1] : (deployMatch ? deployMatch[1] : null);
    if (finalUrl) { log(`Live at: ${finalUrl}`); console.log(JSON.stringify({status:'success',url:finalUrl})); }
    else { console.log(JSON.stringify({status:'success',message:'Deployed'})); }
  } catch (err) { log(`Deploy failed: ${err.message}`); process.exit(1); }
}
function main() {
  log('=== Vercel Deploy ===');
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  checkVercelInstalled();
  if (!checkLoginStatus()) { log('Not logged in'); process.exit(1); }
  const projectPath = checkProject(options.projectPath);
  if (!options.skipBuild) runBuildIfNeeded(projectPath);
  doDeploy(projectPath, options);
}
main();
