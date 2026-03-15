# Stream Validator

`scripts/stream-validator.js` — Node.js CLI utility that tests every URL in an M3U playlist and writes a new file containing only the streams that are reachable and playable.

---

## What It Does

1. **Parses** the input M3U file — reads each `#EXTINF` entry (title, `tvg-id`, `tvg-logo`, `group-title`) and the stream URL that follows it
2. **Tests each URL** with an HTTP `HEAD` request — checks status code, `Content-Type`, and optionally `Access-Control-Allow-Origin`
3. **Classifies the result** — a stream is valid if it returns HTTP 200 with a recognized streamable MIME type or a known media file extension
4. **Retries on failure** — timeouts and network errors retry up to `maxRetries` times with a 1s delay
5. **Runs concurrently** — processes `N` URLs in parallel batches with a short pause between batches
6. **Writes output** — generates a filtered M3U preserving all original `#EXTINF` attributes
7. **Prints stats** — total tested, valid %, invalid %, auth failures, timeouts, network errors

---

## Usage

```bash
node scripts/stream-validator.js <input-file> [output-file] [options]
```

If `output-file` is omitted it defaults to `<input>_filtered.m3u` in the same directory.

---

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--timeout=N` | `10000` | Request timeout in milliseconds |
| `--concurrency=N` | `5` | Number of parallel requests |
| `--retries=N` | `2` | Retry attempts per failed request |
| `--verbose` | off | Show URL, status, content-type per stream |
| `--no-content` | off | Skip MIME/content-type check — test reachability only |
| `--check-cors` | off | Require a valid `Access-Control-Allow-Origin` header |
| `--no-stats` | off | Suppress the summary statistics block |

---

## Commands

**Basic — validate and auto-save filtered output:**
```bash
node scripts/stream-validator.js playlist.m3u
# → playlist_filtered.m3u
```

**Specify output file:**
```bash
node scripts/stream-validator.js playlist.m3u clean.m3u
```

**Fast — skip MIME check, just test reachability:**
```bash
node scripts/stream-validator.js playlist.m3u clean.m3u --no-content
```

**Aggressive — high concurrency, short timeout, no retries:**
```bash
node scripts/stream-validator.js playlist.m3u clean.m3u --concurrency=20 --timeout=5000 --retries=0
```

**Thorough — low concurrency, long timeout, verbose output:**
```bash
node scripts/stream-validator.js playlist.m3u clean.m3u --concurrency=3 --timeout=15000 --verbose
```

**Web player compatibility — include CORS header validation:**
```bash
node scripts/stream-validator.js playlist.m3u clean.m3u --check-cors --verbose
```

**Recommended for large IPTV playlists (speed + accuracy balance):**
```bash
node scripts/stream-validator.js playlist.m3u clean.m3u --concurrency=10 --timeout=8000 --retries=1
```

---

## Tips

- **Start with `--concurrency=10 --timeout=8000`** for typical IPTV playlists — the default concurrency of 5 is conservative
- **Use `--no-content`** if you just want to prune dead URLs and don't care about MIME type — faster, fewer false negatives from servers with generic content-type headers
- **Avoid `--check-cors`** unless the output is for a browser-based player — many valid streams don't set CORS headers and will be incorrectly marked invalid
- **Pair `--verbose` with low concurrency** (`--concurrency=3`) — at high concurrency the per-stream output interleaves and becomes hard to read
- **401/403 responses** are counted separately as `authRequired` — these streams are technically alive but behind a paywall or geo-block

---

## Streamable MIME Types

The validator accepts the following content-types as valid:

- `application/vnd.apple.mpegurl` — HLS
- `application/x-mpegurl` — HLS (alternate)
- `application/dash+xml` — MPEG-DASH
- `video/mp4`
- `video/mp2t` — MPEG-TS
- `video/webm`
- `video/x-msvideo` — AVI
- `video/quicktime` — MOV
- `application/octet-stream` — generic binary (many streams use this)

URL extension fallback (`.m3u8`, `.mpd`, `.ts`, `.mp4`, `.webm`, `.avi`, `.mkv`, `.mov`) is checked when the content-type alone is insufficient.

---

## See Also

- `scripts/node-checker.js` — enhanced validator with HLS/DASH manifest validation, segment testing, and curl fallback
- `docs/WEB_WORKER_M3U_PARSER.md` — chunked M3U parsing used in the media-demo page
