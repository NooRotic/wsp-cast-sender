# AI Agent Knowledge Base - Complete Project Guide

## 📋 **Project Overview**
**Cast Sender Application** - Professional portfolio demonstration system with Google Cast SDK integration

### **🎯 Current Status (August 2025)**
- ✅ Production-ready Cast demonstration system
- ✅ Complete VideoMediaCard with real-time controls
- ✅ Google Cast SDK PlayerManager integration
- ✅ Professional UI with responsive design
- ✅ Multi-format video support (YouTube, Vimeo, HLS, DASH, MP4)

---

## **🚨 CRITICAL PROJECT CONSTRAINTS**

### **Static Hosting Requirement**
- **Hosting Environment**: 100% static hosting - **NO SERVER-SIDE RENDERING (SSR) SUPPORT**
- **Next.js Configuration**: MUST use `output: 'export'` for **PRODUCTION BUILDS ONLY**
- **Development Requirement**: **NO static export in development** (breaks Cast API, hot reload, API routes)
- **Deployment Target**: Static files only (HTML, CSS, JS, assets)
- **Build Command**: `npm run build` creates static files in `/out` directory

### **Next.js Configuration Requirements**
```javascript
// next.config.js - MANDATORY SETTINGS
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  // CONDITIONAL static export - CRITICAL: Only for production!
  ...(isDev ? {} : { 
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true }
  }),
  
  experimental: {
    esmExternals: 'loose'
  }
};
```

---

## **🏗️ ARCHITECTURE**

### **Core Components**
1. **VideoMediaCard** - Main video casting interface with real-time controls
2. **CastContext** - Google Cast SDK integration and message handling
3. **Cast Demo Page** - Professional portfolio demonstration system
4. **UI Components** - Shadcn/ui based design system

### **Cast Integration**
- Google Cast SDK v3 with PlayerManager framework
- Real-time bidirectional communication
- Media control synchronization
- Multi-device support

---

## **🚀 DEPLOYMENT**

### **Build Process**
```bash
# Development
npm run dev

# Production Build
npm run build  # Creates static files in /out

# Deployment
# Upload entire /out directory to static host
```

### **Environment Configuration**
- Development: Full Next.js with API routes, hot reload
- Production: Static export with optimized bundles
- Cast Receiver: Must be served over HTTPS

---

## **🐛 KNOWN ISSUES & SOLUTIONS**

### **Build System**
- ✅ **Resolved**: Webpack chunk loading errors
- ✅ **Resolved**: AssetPrefix validation failures
- ✅ **Resolved**: Next.js 14+ metadata warnings

### **Cast Integration**
- ✅ **Resolved**: Google Cast button menu issues
- ✅ **Resolved**: PlayerManager framework integration
- ✅ **Resolved**: Real-time media control synchronization

---

## **📚 PROJECT HISTORY**

### **Major Milestones**
- **July 2025**: Initial Cast integration and build system
- **August 2025**: VideoMediaCard implementation with PlayerManager
- **Current**: Production-ready portfolio demonstration system

### **Key Sessions**
1. **Build System Overhaul**: Resolved webpack chunk loading and deployment pipeline
2. **Cast Demo Implementation**: Professional portfolio presentation system
3. **VideoMediaCard Development**: Complete media controls with Cast integration

---

## **🔧 MAINTENANCE NOTES**

### **For Future AI Agents**
1. **Never change Next.js config** without understanding static hosting constraints
2. **Always test builds** after making configuration changes
3. **Keep Cast SDK integration** updated with Google's latest recommendations
4. **Maintain TypeScript strict mode** for type safety

### **Common Tasks**
- Adding new video formats: Update `getVideoTypeInfo()` function
- UI changes: Use existing Shadcn/ui components
- Cast features: Extend CastContext message handling
- Deployment: Always use `npm run build` for production

---

*Last Updated: August 3, 2025*
*Status: Active Development - VideoMediaCard System Complete*
