const fs = require('fs');
const path = 'C:/Users/25437/.cursor/projects/d-clash-Ver-AutoCoder-cc/agent-transcripts/d3e38853-fd8c-46b0-86d0-bffc95e8fad4/d3e38853-fd8c-46b0-86d0-bffc95e8fad4.jsonl';
const lines = fs.readFileSync(path, 'utf8').split(/\n/);
for (const line of lines) {
  if (!line.includes('首页横幅轮播区') || !line.includes('StrReplace')) continue;
  let o;
  try { o = JSON.parse(line); } catch { continue; }
  const content = o.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type !== 'tool_use' || c.name !== 'StrReplace') continue;
    const old = c.input?.old_string || '';
    const neu = c.input?.new_string || '';
    if (old.includes('首页横幅轮播区') && old.length > 500) {
      fs.writeFileSync('D:/clash Ver/AutoCoder.cc/_pc_banner_old.txt', old);
      console.log('banner old', old.length, 'path', c.input.path);
    }
    if (old.includes('左侧分类浏览模块') && old.includes('!showProductResults') && old.length > 1000) {
      fs.writeFileSync('D:/clash Ver/AutoCoder.cc/_pc_aside_old.txt', old);
      console.log('aside old', old.length);
    }
  }
}
