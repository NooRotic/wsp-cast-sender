# 🚀 Static Deployment Guide - Cast Sender

This guide covers deploying the Cast Sender application to static web hosting.

## 📋 Quick Deployment Steps

### 1. Build for Production
```bash
npm run deploy:sender
```

This command will:
- Run ESLint checks
- Build the project with `NODE_ENV=production`
- Generate static files in `/out` directory
- Fix any absolute path issues

### 2. Deploy Static Files
Upload the entire contents of the `/out` directory to your web host.

**Important:** Deploy the *contents* of the `/out` folder, not the folder itself.

## 📁 Deployment Structure

After running `npm run deploy:sender`, you'll have:

```
/out/
├── index.html              # Main portfolio page
├── cast-debug.html          # Cast debug interface
├── _next/                   # Next.js assets
│   ├── static/             # Static assets
│   └── chunks/             # JavaScript chunks
├── images/                  # Optimized images
└── ...                     # Other static files
```

## 🔧 Alternative Commands

| Command | Purpose |
|---------|---------|
| `npm run build:production` | Build only (no deployment prep) |
| `npm run deploy:build` | Build + path fixes |
| `npm run deploy:test` | Build + test static files |
| `npm run deploy:clean` | Clean build artifacts |

## 🌐 Web Hosting Requirements

- **Static hosting** (HTML/CSS/JS files)
- **HTTPS required** for Cast functionality
- Support for **trailing slashes** (already configured)
- No server-side rendering needed

## ✅ Verification

After deployment:
1. Visit your deployed site
2. Check that `/cast-debug` page loads
3. Test Cast functionality with a Chromecast device
4. Verify console shows no 404 errors

## 🎯 Cast Integration

The sender will connect to your receiver app. Make sure:
- Receiver is deployed and accessible
- Both apps use HTTPS in production
- Cast namespace is consistent: `urn:x-cast:com.nrx.cast.skills`

## 🔍 Troubleshooting

**404 Errors:** Ensure trailing slashes are supported by your host
**Cast Issues:** Verify HTTPS is enabled on both sender and receiver
**Missing Assets:** Check that all files from `/out` were uploaded

---
*Generated for static web hosting deployment*
