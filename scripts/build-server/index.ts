import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { compileAction } from './action-compiler';
import { buildCommonBundle } from './common-bundle';
import { generateEntry } from './entry-generator';

// ─── Types ───────────────────────────────────────────────────────────

export interface BuildOptions {
  /** Single file mode: only compile specified file */
  file?: string;
  /** Full build mode: compile all actions (default) */
  all?: boolean;
  /** Force rebuild _common.js */
  rebuildCommon?: boolean;
  /** Project ID */
  projectId: string;
}

export interface BuildResult {
  success: boolean;
  /** Successfully compiled files */
  compiled: string[];
  /** Failed files with errors */
  failed: Array<{ file: string; errors: string[] }>;
  /** Total duration in ms */
  duration: number;
  /** Whether _common.js was rebuilt */
  commonRebuilt: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_OUT_DIR = 'server-action-generated';

const ACTION_PATTERNS = [
  'src/*/actions/*.ts',
  'src/actions/**/*.ts',
];

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Discover all action source files using glob patterns.
 * Excludes files starting with __test_ (test temp files).
 */
async function discoverActionFiles(projectRoot: string): Promise<string[]> {
  const files: string[] = [];
  for (const pattern of ACTION_PATTERNS) {
    const matches = await glob(pattern, {
      cwd: projectRoot,
      nodir: true,
    });
    files.push(...matches);
  }
  // Deduplicate and filter out test temp files
  const unique = [...new Set(files)].filter(
    (f) => !path.basename(f).startsWith('__test_')
  );
  return unique.sort();
}

/**
 * Extract projectId from existing PROJ_*.js files in outDir.
 */
function extractProjectIdFromOutDir(absOutDir: string): string | null {
  if (!fs.existsSync(absOutDir)) return null;
  const files = fs.readdirSync(absOutDir);
  for (const f of files) {
    const match = f.match(/^PROJ_(.+)\.js$/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract projectId from parent directory name.
 * Directory structure: .../PROJ_{id}/aigcode-demo
 * So from cwd (aigcode-demo), parent dir name is PROJ_{id}.
 */
function extractProjectIdFromParentDir(cwd: string): string | null {
  const parentDir = path.basename(path.dirname(cwd));
  const match = parentDir.match(/^PROJ_(.+)$/);
  return match ? match[1] : null;
}

/**
 * Clean old webpack artifacts: a single PROJ_*.js that is much larger than expected.
 * Incremental build produces small entry files; webpack produced large bundles.
 */
function cleanOldWebpackArtifacts(absOutDir: string): void {
  if (!fs.existsSync(absOutDir)) return;
  const files = fs.readdirSync(absOutDir);
  for (const f of files) {
    if (!f.match(/^PROJ_.*\.js$/)) continue;
    const filePath = path.join(absOutDir, f);
    try {
      const stat = fs.statSync(filePath);
      // Old webpack bundles are typically > 100KB; new entry files are < 10KB
      if (stat.size > 100 * 1024) {
        fs.unlinkSync(filePath);
      }
    } catch {
      /* ignore */
    }
  }
}

/**
 * Get default action_utils paths for all platforms.
 */
function getActionUtilsPaths(): Record<string, string> {
  return {
    frontend: 'src/frontend/action_utils.ts',
    backend: 'src/backend/action_utils.ts',
    app: 'src/app/action_utils.ts',
  };
}

/**
 * Check if _common.js is up-to-date by comparing its mtime against all source
 * files that contribute to it. Returns true if the bundle can be reused.
 *
 * Source files checked:
 *   src/tools/prisma.ts, src/@base/BaseActionFun.ts, src/utils/serializer.ts,
 *   prisma-generated/client/ (directory mtime), and each platform action_utils.
 */
function isCommonBundleUpToDate(projectRoot: string, absOutDir: string): boolean {
  const commonPath = path.join(absOutDir, '_common.js');
  if (!fs.existsSync(commonPath)) return false;

  let commonMtime: number;
  try {
    commonMtime = fs.statSync(commonPath).mtimeMs;
  } catch {
    return false;
  }

  const sourcesToCheck = [
    'src/tools/prisma.ts',
    'src/@base/BaseActionFun.ts',
    'src/utils/serializer.ts',
    'prisma-generated/client',
    ...Object.values(getActionUtilsPaths()),
  ];

  for (const rel of sourcesToCheck) {
    const abs = path.resolve(projectRoot, rel);
    try {
      const stat = fs.statSync(abs);
      if (stat.mtimeMs > commonMtime) return false;
    } catch {
      // File doesn't exist — not a reason to force rebuild
    }
  }

  return true;
}

// ─── Build Function ──────────────────────────────────────────────────

/**
 * Execute build with the given options.
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const startTime = performance.now();
  const projectRoot = process.cwd();
  const outDir = DEFAULT_OUT_DIR;
  const absOutDir = path.resolve(projectRoot, outDir);

  const compiled: string[] = [];
  const failed: Array<{ file: string; errors: string[] }> = [];
  let commonRebuilt = false;

  // Ensure output directory exists
  fs.mkdirSync(absOutDir, { recursive: true });

  // ── Rebuild common only mode ───────────────────────────────────────
  if (options.rebuildCommon) {
    const commonResult = await buildCommonBundle({
      projectRoot,
      outDir,
      actionUtilsPaths: getActionUtilsPaths(),
    });

    commonRebuilt = commonResult.success;

    if (!commonResult.success) {
      return {
        success: false,
        compiled,
        failed: [{ file: '_common.js', errors: commonResult.errors ?? [] }],
        duration: Math.round(performance.now() - startTime),
        commonRebuilt: false,
      };
    }

    // Touch PROJ_{projectId}.js to trigger Worker hot reload
    const projFile = path.join(absOutDir, `PROJ_${options.projectId}.js`);
    if (fs.existsSync(projFile)) {
      const now = new Date();
      fs.utimesSync(projFile, now, now);
    }

    return {
      success: true,
      compiled,
      failed,
      duration: Math.round(performance.now() - startTime),
      commonRebuilt: true,
    };
  }

  // ── Single file mode ───────────────────────────────────────────────
  if (options.file) {
    // Check if _common.js exists, build it if not
    const commonPath = path.join(absOutDir, '_common.js');
    if (!fs.existsSync(commonPath)) {
      const commonResult = await buildCommonBundle({
        projectRoot,
        outDir,
        actionUtilsPaths: getActionUtilsPaths(),
      });
      commonRebuilt = commonResult.success;
      if (!commonResult.success) {
        return {
          success: false,
          compiled,
          failed: [{ file: '_common.js', errors: commonResult.errors ?? [] }],
          duration: Math.round(performance.now() - startTime),
          commonRebuilt: false,
        };
      }
    }

    // Compile the specified file
    const result = await compileAction({
      sourceFile: options.file,
      outDir,
      projectRoot,
    });

    if (result.success) {
      compiled.push(result.outputFile ? path.basename(result.outputFile) : options.file);
    } else {
      failed.push({
        file: options.file,
        errors: (result.errors ?? []).map((e) => e.message),
      });
    }

    // Regenerate entry file
    await generateEntry({
      projectId: options.projectId,
      outDir,
      projectRoot,
    });

    return {
      success: failed.length === 0,
      compiled,
      failed,
      duration: Math.round(performance.now() - startTime),
      commonRebuilt,
    };
  }

  // ── Full build mode (default) ──────────────────────────────────────

  // Clean old webpack artifacts on first incremental build
  cleanOldWebpackArtifacts(absOutDir);

  // 1. Build Common_Bundle — skip if already up-to-date
  if (!isCommonBundleUpToDate(projectRoot, absOutDir)) {
    const commonResult = await buildCommonBundle({
      projectRoot,
      outDir,
      actionUtilsPaths: getActionUtilsPaths(),
    });

    commonRebuilt = commonResult.success;

    if (!commonResult.success) {
      return {
        success: false,
        compiled,
        failed: [{ file: '_common.js', errors: commonResult.errors ?? [] }],
        duration: Math.round(performance.now() - startTime),
        commonRebuilt: false,
      };
    }
  }

  // 2. Discover and compile all action files in parallel
  const actionFiles = await discoverActionFiles(projectRoot);

  const compileResults = await Promise.all(
    actionFiles.map(async (sourceFile) => {
      const result = await compileAction({
        sourceFile,
        outDir,
        projectRoot,
      });
      return { sourceFile, result };
    })
  );

  for (const { sourceFile, result } of compileResults) {
    if (result.success) {
      compiled.push(result.outputFile ? path.basename(result.outputFile) : sourceFile);
    } else {
      failed.push({
        file: sourceFile,
        errors: (result.errors ?? []).map((e) => e.message),
      });
    }
  }

  // 3. Generate entry file
  await generateEntry({
    projectId: options.projectId,
    outDir,
    projectRoot,
  });

  return {
    success: failed.length === 0,
    compiled,
    failed,
    duration: Math.round(performance.now() - startTime),
    commonRebuilt,
  };
}

// ─── CLI Entry Point ─────────────────────────────────────────────────

export function parseCliArgs(args: string[]): BuildOptions {
  const options: BuildOptions = {
    projectId: '',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        options.file = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--rebuild-common':
        options.rebuildCommon = true;
        break;
      case '--project-id':
        options.projectId = args[++i];
        break;
    }
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);

  // If no projectId provided, try to extract from existing PROJ_*.js or parent dir
  if (!options.projectId) {
    const absOutDir = path.resolve(process.cwd(), DEFAULT_OUT_DIR);
    const extracted = extractProjectIdFromOutDir(absOutDir)
      ?? extractProjectIdFromParentDir(process.cwd());
    if (extracted) {
      options.projectId = extracted;
    } else {
      console.error('Error: --project-id is required');
      process.exit(1);
    }
  }

  // Default to full build if no specific mode
  if (!options.file && !options.rebuildCommon) {
    options.all = true;
  }

  const result = await build(options);

  // Output JSON result to stdout
  console.log(JSON.stringify(result));

  process.exit(result.success ? 0 : 1);
}

// Run CLI when executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
