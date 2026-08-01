const fs = require('fs');
const path = 'C:/Users/25437/.cursor/projects/d-clash-Ver-AutoCoder-cc/agent-transcripts/d3e38853-fd8c-46b0-86d0-bffc95e8fad4/d3e38853-fd8c-46b0-86d0-bffc95e8fad4.jsonl';
const lines = fs.readFileSync(path, 'utf8').split(/\n/);
for (const line of lines) {
  if (!line.includes('productcategoryview-rba31c6c28c87ab61') || !line.includes('StrReplace')) continue;
  let o;
  try { o = JSON.parse(line); } catch { continue; }
  const content = o.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type !== 'tool_use' || c.name !== 'StrReplace') continue;
    const old = c.input?.old_string || '';
    if (old.includes('productcategoryview-rba31c6c28c87ab61') && old.includes('!showProductResults')) {
      fs.writeFileSync('D:/clash Ver/AutoCoder.cc/_pc_sidenav_block.txt', old);
      console.log('sidenav block', old.length);
    }
  }
}
