from pathlib import Path

src_path = Path("/etc/nginx/conf.d/sourcingjewelry.com.conf")
text = src_path.read_text()
needle = "        proxy_read_timeout 300s;\n    }\n}"
insert = (
    "        proxy_read_timeout 300s;\n"
    "        proxy_hide_header Cache-Control;\n"
    '        add_header Cache-Control "private, no-cache, must-revalidate" always;\n'
    "    }\n}"
)
if "proxy_hide_header Cache-Control" in text:
    print("already patched")
elif needle not in text:
    raise SystemExit("needle not found")
else:
    out = Path("/tmp/sourcingjewelry.com.conf.patched")
    out.write_text(text.replace(needle, insert, 1))
    print("wrote", out)
