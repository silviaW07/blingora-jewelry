const fs = require('fs');
const path = 'C:/Users/25437/.cursor/projects/d-clash-Ver-AutoCoder-cc/agent-transcripts/d3e38853-fd8c-46b0-86d0-bffc95e8fad4/d3e38853-fd8c-46b0-86d0-bffc95e8fad4.jsonl';
const lines = fs.readFileSync(path, 'utf8').split(/\n/);
let found = 0;
for (const line of lines) {
  if (!line.includes('首页左导航与横幅联动模块')) continue;
  let o;
  try { o = JSON.parse(line); } catch { continue; }
  const content = o.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    const text = JSON.stringify(c);
    if (!text.includes('首页左导航与横幅联动模块')) continue;
    // Prefer StrReplace old_string with the module
    if (c.type === 'tool_use' && c.name === 'StrReplace') {
      const old = c.input?.old_string || '';
      const neu = c.input?.new_string || '';
      if (old.includes('首页左导航与横幅联动模块') && old.includes('分类浏览')) {
        fs.writeFileSync('D:/clash Ver/AutoCoder.cc/_linked_module_old.txt', old);
        console.log('wrote old', old.length);
        found++;
      }
      if (neu.includes('首页左导航与横幅联动模块') && neu.includes('分类浏览')) {
        fs.writeFileSync('D:/clash Ver/AutoCoder.cc/_linked_module_new.txt', neu);
        console.log('wrote new', neu.length);
        found++;
      }
    }
  }
}
console.log('found', found);
