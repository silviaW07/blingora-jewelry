#!/usr/bin/env python3
import json
import statistics
import subprocess
import time
import urllib.error
import urllib.request

TARGETS = [
    ("fe-home", "http://127.0.0.1:3000/"),
    ("fe-categories", "http://127.0.0.1:3000/categories"),
    ("fe-productcategory", "http://127.0.0.1:3000/productcategory"),
    ("fe-adminlogin", "http://127.0.0.1:3000/adminlogin"),
    ("api-bootstrap", "http://127.0.0.1:3000/api/storefront/bootstrap?lang=en"),
    ("api-products", "http://127.0.0.1:3000/api/storefront/products?lang=en&page=1&page_size=60"),
    ("rpc-healthz", "http://127.0.0.1:3100/healthz"),
    ("pub-home", "https://www.sourcingjewelry.com/"),
    ("pub-bootstrap", "https://www.sourcingjewelry.com/api/storefront/bootstrap?lang=en"),
    ("pub-products", "https://www.sourcingjewelry.com/api/storefront/products?lang=en&page=1&page_size=60"),
]


def curl_once(url: str) -> dict:
    cmd = [
        "curl",
        "-sS",
        "-o",
        "/tmp/_bench-body.bin",
        "-w",
        "%{http_code} %{time_namelookup} %{time_connect} %{time_starttransfer} %{time_total} %{size_download}",
        "-H",
        "Accept: text/html,application/json,*/*",
        "-H",
        "User-Agent: load-bench/1.0",
        "--max-time",
        "25",
        "-L",
        url,
    ]
    out = subprocess.check_output(cmd, text=True).strip().split()
    code, namelookup, connect, ttfb, total, size = out
    return {
        "code": int(code),
        "dns": float(namelookup),
        "connect": float(connect),
        "ttfb": float(ttfb),
        "total": float(total),
        "bytes": int(size),
    }


def bench(name: str, url: str, rounds: int = 4) -> dict:
    rows = []
    for i in range(rounds):
        try:
            row = curl_once(url)
        except Exception as exc:
            row = {"code": 0, "dns": 0, "connect": 0, "ttfb": 0, "total": 0, "bytes": 0, "err": str(exc)}
        rows.append(row)
        if i == 0:
            time.sleep(0.15)
    ok = [r for r in rows if r.get("code") and r["code"] < 400]
    def avg(key):
        vals = [r[key] for r in ok]
        return round(statistics.mean(vals), 3) if vals else None
    def mx(key):
        vals = [r[key] for r in ok]
        return round(max(vals), 3) if vals else None
    return {
        "name": name,
        "url": url,
        "codes": [r.get("code") for r in rows],
        "bytes": ok[0]["bytes"] if ok else 0,
        "ttfb_avg": avg("ttfb"),
        "ttfb_max": mx("ttfb"),
        "total_avg": avg("total"),
        "total_max": mx("total"),
        "warm_ttfb": round(ok[-1]["ttfb"], 3) if ok else None,
        "warm_total": round(ok[-1]["total"], 3) if ok else None,
    }


def pm2():
    try:
        raw = subprocess.check_output(["pm2", "jlist"], text=True)
        apps = json.loads(raw)
        out = []
        for app in apps:
            if app.get("name") not in ("frontend", "rpc"):
                continue
            env = app.get("pm2_env") or {}
            mon = app.get("monit") or {}
            out.append({
                "name": app.get("name"),
                "status": env.get("status"),
                "uptime_s": int(time.time() - (env.get("pm_uptime", 0) / 1000)) if env.get("pm_uptime") else None,
                "restarts": env.get("restart_time"),
                "cpu": mon.get("cpu"),
                "mem_mb": round((mon.get("memory") or 0) / 1024 / 1024, 1),
            })
        return out
    except Exception as exc:
        return [{"error": str(exc)}]


def product_sample():
    try:
        with urllib.request.urlopen(
            "http://127.0.0.1:3000/api/storefront/products?lang=en&page=1&page_size=3",
            timeout=20,
        ) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        item = (data.get("list") or [None])[0] or {}
        slug = item.get("slug") or item.get("product_slug") or item.get("id")
        return {"slug": slug, "name": (item.get("name") or "")[:80], "keys": list(item.keys())[:12]}
    except Exception as exc:
        return {"error": str(exc)}


if __name__ == "__main__":
    sample = product_sample()
    slug = sample.get("slug")
    extra = []
    if slug:
        extra.append(("fe-pdp", f"http://127.0.0.1:3000/productdetail?slug={slug}"))
        extra.append(("pub-pdp", f"https://www.sourcingjewelry.com/productdetail?slug={slug}"))
    results = [bench(name, url) for name, url in TARGETS + extra]
    print(json.dumps({"pm2": pm2(), "sample": sample, "results": results}, ensure_ascii=False, indent=2))
