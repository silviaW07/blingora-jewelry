import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  generateEntry,
  scanActionFiles,
  extractModuleName,
} from '../entry-generator';

// Create a unique temp directory for each test run
function createTempOutDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'entry-gen-test-'));
  return tmpDir;
}

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('scanActionFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempOutDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should return action .js files and exclude _common.js and PROJ_*.js', () => {
    // Create fake files
    fs.writeFileSync(path.join(tmpDir, '_common.js'), '// common');
    fs.writeFileSync(path.join(tmpDir, 'PROJ_abc123.js'), '// entry');
    fs.writeFileSync(path.join(tmpDir, 'src.backend.actions.Register.js'), '// action');
    fs.writeFileSync(path.join(tmpDir, 'src.frontend.actions.Login.js'), '// action');
    fs.writeFileSync(path.join(tmpDir, '.entry-gen.lock'), '');

    const files = scanActionFiles(tmpDir);

    expect(files).toContain('src.backend.actions.Register.js');
    expect(files).toContain('src.frontend.actions.Login.js');
    expect(files).not.toContain('_common.js');
    expect(files).not.toContain('PROJ_abc123.js');
    expect(files).not.toContain('.entry-gen.lock');
  });

  it('should return files sorted alphabetically', () => {
    fs.writeFileSync(path.join(tmpDir, 'src.frontend.actions.Zebra.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'src.backend.actions.Alpha.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'src.app.actions.Middle.js'), '');

    const files = scanActionFiles(tmpDir);

    expect(files).toEqual([
      'src.app.actions.Middle.js',
      'src.backend.actions.Alpha.js',
      'src.frontend.actions.Zebra.js',
    ]);
  });

  it('should return empty array for non-existent directory', () => {
    const files = scanActionFiles('/nonexistent/path');
    expect(files).toEqual([]);
  });

  it('should return empty array for directory with only special files', () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), '');
    fs.writeFileSync(path.join(tmpDir, 'PROJ_test.js'), '');

    const files = scanActionFiles(tmpDir);
    expect(files).toEqual([]);
  });
});

describe('extractModuleName', () => {
  it('should strip .js extension', () => {
    expect(extractModuleName('src.backend.actions.Register.js')).toBe(
      'src.backend.actions.Register'
    );
  });

  it('should handle frontend action files', () => {
    expect(extractModuleName('src.frontend.actions.Login.js')).toBe(
      'src.frontend.actions.Login'
    );
  });

  it('should handle app action files', () => {
    expect(extractModuleName('src.app.actions.Dashboard.js')).toBe(
      'src.app.actions.Dashboard'
    );
  });
});


describe('generateEntry', () => {
  let tmpDir: string;
  // Use tmpDir as both projectRoot and outDir (outDir relative to projectRoot)
  const projectRoot = os.tmpdir();

  beforeEach(() => {
    tmpDir = createTempOutDir();
  });

  afterEach(() => {
    cleanDir(tmpDir);
  });

  it('should generate PROJ_{projectId}.js with correct require statements', async () => {
    // Create fake action files and _common.js
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');
    fs.writeFileSync(
      path.join(tmpDir, 'src.backend.actions.Register.js'),
      'module.exports = { register: function() {} };'
    );
    fs.writeFileSync(
      path.join(tmpDir, 'src.frontend.actions.Login.js'),
      'module.exports = { login: function() {} };'
    );

    const result = await generateEntry({
      projectId: 'test123',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    expect(result.success).toBe(true);
    expect(result.outputFile).toContain('PROJ_test123.js');
    expect(fs.existsSync(result.outputFile)).toBe(true);

    const content = fs.readFileSync(result.outputFile, 'utf-8');

    // Should contain require statements for action files
    expect(content).toContain("require('./src.backend.actions.Register')");
    expect(content).toContain("require('./src.frontend.actions.Login')");

    // Should require _common
    expect(content).toContain("require('./_common')");

    // Should have the correct PROJECT_ID
    expect(content).toContain("const PROJECT_ID = 'PROJ_test123'");

    // Should export path and router
    expect(content).toContain('module.exports = { path:');
    expect(content).toContain('/rpc/');
  });

  it('should exclude _common.js and PROJ_*.js from action list', async () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(tmpDir, 'PROJ_old.js'), '// old entry');
    fs.writeFileSync(
      path.join(tmpDir, 'src.backend.actions.Register.js'),
      'module.exports = {};'
    );

    const result = await generateEntry({
      projectId: 'test456',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    expect(result.success).toBe(true);
    expect(result.actionFiles).toContain('src.backend.actions.Register.js');
    expect(result.actionFiles).not.toContain('_common.js');
    expect(result.actionFiles).not.toContain('PROJ_old.js');

    const content = fs.readFileSync(result.outputFile, 'utf-8');
    // Should NOT have require for _common.js as an action (it's required separately)
    expect(content).not.toContain("'_common': require");
    // Should NOT have require for PROJ_old.js as an action
    expect(content).not.toContain("'PROJ_old': require");
  });

  it('should generate entry with sorted action files for deterministic output', async () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(tmpDir, 'src.frontend.actions.Zebra.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(tmpDir, 'src.backend.actions.Alpha.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(tmpDir, 'src.app.actions.Middle.js'), 'module.exports = {};');

    const result = await generateEntry({
      projectId: 'sorted',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    expect(result.success).toBe(true);

    const content = fs.readFileSync(result.outputFile, 'utf-8');

    // Verify order: Alpha < Middle < Zebra (alphabetical by full module name)
    const alphaIdx = content.indexOf('src.app.actions.Middle');
    const middleIdx = content.indexOf('src.backend.actions.Alpha');
    const zebraIdx = content.indexOf('src.frontend.actions.Zebra');

    expect(alphaIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(zebraIdx);
  });

  it('should handle empty outDir (no action files)', async () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');

    const result = await generateEntry({
      projectId: 'empty',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    expect(result.success).toBe(true);
    expect(result.actionFiles).toEqual([]);

    const content = fs.readFileSync(result.outputFile, 'utf-8');
    expect(content).toContain("require('./_common')");
    expect(content).toContain("const PROJECT_ID = 'PROJ_empty'");
  });

  it('should contain getAuthModule function with correct logic', async () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');
    fs.writeFileSync(
      path.join(tmpDir, 'src.backend.actions.Test.js'),
      'module.exports = {};'
    );

    const result = await generateEntry({
      projectId: 'auth',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    const content = fs.readFileSync(result.outputFile, 'utf-8');

    // Should contain getAuthModule function
    expect(content).toContain('function getAuthModule(actionName)');
    expect(content).toContain('.frontend.');
    expect(content).toContain('.app.');
    expect(content).toContain('common.frontendAuth');
    expect(content).toContain('common.appAuth');
    expect(content).toContain('common.backendAuth');
  });

  it('should contain RPC route with error handling', async () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');
    fs.writeFileSync(
      path.join(tmpDir, 'src.backend.actions.Test.js'),
      'module.exports = {};'
    );

    const result = await generateEntry({
      projectId: 'rpc',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    const content = fs.readFileSync(result.outputFile, 'utf-8');

    // Should contain RPC route
    expect(content).toContain("router.post('/'");
    // Should contain error handling
    expect(content).toContain('UnauthorizedError');
    expect(content).toContain('ForbiddenError');
    expect(content).toContain('X-Auth-Role');
    // Should contain serializer usage
    expect(content).toContain('serializer.deserialize');
    expect(content).toContain('serializer.serialize');
  });

  it('should use file lock and handle lock file in outDir', async () => {
    fs.writeFileSync(path.join(tmpDir, '_common.js'), 'module.exports = {};');
    fs.writeFileSync(
      path.join(tmpDir, 'src.backend.actions.Test.js'),
      'module.exports = {};'
    );

    const result = await generateEntry({
      projectId: 'lock',
      outDir: path.relative(projectRoot, tmpDir),
      projectRoot,
    });

    expect(result.success).toBe(true);

    // Lock file should have been created in outDir
    expect(fs.existsSync(path.join(tmpDir, '.entry-gen.lock'))).toBe(true);
  });
});
