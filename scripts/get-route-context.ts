/**
 * get-route-context.ts
 *
 * 用法：
 *   单页面模式：
 *     pnpm run run:route-params -- <platform> <page>
 *
 *   批量模式（一次进程处理多个页面，输出 JSON）：
 *     pnpm run run:route-params -- <platform> batch <page1> <page2> <page3> ...
 *
 *   导航地图模式：
 *     pnpm run run:route-params -- <platform> nav=true
 *
 * platform : 平台目录名，必填，对应 src/<platform>/route-params.ts
 *            例如：frontend、backend、mobile、admin …
 * page     : 页面 ID 或页面名称，大小写不敏感
 *            例如：F01、B03、Login、Dashboard、checkout
 * batch    : 批量模式关键字，后跟多个页面名，输出 JSON 格式 {"page1": "...", "page2": "..."}
 * nav=true : 可选，直接输出该平台完整的 NAVIGATION_MAP，忽略 page 参数
 *
 * 示例：
 *   pnpm run run:route-params -- frontend Login
 *   pnpm run run:route-params -- frontend batch Login Dashboard Checkout
 *   pnpm run run:route-params -- frontend nav=true
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

const argv = process.argv.slice(2).filter(a => a !== '--');

const navOnly = argv.includes('nav=true');
const batchMode = argv.length >= 2 && argv[1] === 'batch';

if (!navOnly && !batchMode && argv.length < 2) {
  console.error('用法: pnpm run run:route-params -- <platform> <page>');
  console.error('批量: pnpm run run:route-params -- <platform> batch <page1> <page2> ...');
  process.exit(1);
}

if (argv.length < 1) {
  console.error('用法: pnpm run run:route-params -- <platform> ...');
  process.exit(1);
}

const platform = argv[0];
const ROOT = path.resolve(__dirname, '..');
const routeFile = path.join(ROOT, 'src', platform, 'route-params.ts');

if (!existsSync(routeFile)) {
  console.error(`文件不存在: ${routeFile}`);
  process.exit(1);
}

// 动态加载对应平台的 route-params 模块
const { getRouteContextText, PAGE_ID_MAP, NAVIGATION_MAP } = require(routeFile) as {
  getRouteContextText: (pageIdOrName: string, fileContent: string) => string;
  PAGE_ID_MAP: Record<string, string>;
  NAVIGATION_MAP: Record<string, string[]>;
};

// nav=true：直接输出 NAVIGATION_MAP
if (navOnly) {
  console.log(JSON.stringify(NAVIGATION_MAP, null, 2));
  process.exit(0);
}

/**
 * 将页面名称解析为页面 ID（不区分大小写）。
 * 若已是 ID 格式则直接返回。
 */
function resolvePageId(pageIdOrName: string): string {
  if (/^[A-Z]\d+$/i.test(pageIdOrName)) return pageIdOrName.toUpperCase();

  const lowerInput = pageIdOrName.toLowerCase();
  const entry = Object.entries(PAGE_ID_MAP).find(
    ([, name]) => name.toLowerCase() === lowerInput
  );
  return entry ? entry[0] : pageIdOrName;
}

const fileContent = readFileSync(routeFile, 'utf8');

const header = `/**
 * 路由参数工具文件 (route-params.ts)
 * 
 * 导入路径：@/${platform}/route-params
 * 
 * 使用说明：
 * - 导入页面名称常量进行跳转：[NavigationPageName].navigateTo[xxx](router, { param_name: 'param_value' })
 * - 在页面组件中解析参数：const { param_value } = [CurrentPageName].getParams(searchParams)
 */`;

function getResultForPage(pageArg: string): string {
  const resolvedId = resolvePageId(pageArg);
  const result = getRouteContextText(resolvedId, fileContent);
  return `\n${header}\n\n${result}\n`;
}

// 批量模式：输出 JSON {"pageName": "routeContextText", ...}
if (batchMode) {
  const pages = argv.slice(2); // skip platform and "batch"
  if (pages.length === 0) {
    console.error('批量模式需要至少一个页面名');
    process.exit(1);
  }
  const results: Record<string, string> = {};
  for (const page of pages) {
    results[page] = getResultForPage(page);
  }
  console.log(JSON.stringify(results));
  process.exit(0);
}

// 单页面模式（向后兼容）
const pageArg = argv[1];
console.log(getResultForPage(pageArg));
