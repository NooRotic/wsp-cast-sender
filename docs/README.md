# AI Agent Knowledge Base Documentation

This directory contains comprehensive documentation for AI agents working on the Cast Implementation project. The documents capture detailed technical knowledge, architectural decisions, and session histories to enable rapid onboarding and confident development.

## Document Structure

### Primary Knowledge Base Documents

#### 1. AI_AGENT_KNOWLEDGE_BASE.md
- **Focus**: Original Cast Application Framework (CAF) implementation and build system fixes
- **Session Date**: July 16, 2025
- **Key Topics**: CAF patterns, path resolution, build system architecture
- **Status**: Foundational knowledge for Cast implementation

#### 2. AI_AGENT_KNOWLEDGE_BASE_ADDENDUM.md
- **Focus**: Build system overhaul and webpack chunk resolution
- **Session Date**: July 16, 2025 (later session)
- **Key Topics**: Next.js static export fixes, font loading, deployment pipeline
- **Status**: Critical build system knowledge

#### 3. AI_AGENT_KNOWLEDGE_BASE_CAST_DEMO_SESSION.md
- **Focus**: Cast portfolio demonstration system and critical bug fixes
- **Session Date**: July 21, 2025
- **Key Topics**: Professional Cast demo implementation, CastButton fixes, Next.js 14+ compatibility
- **Status**: Most recent implementation - production-ready Cast demonstration

### Supporting Documentation

#### CAST_DEMO_GUIDE.md
- Comprehensive guide for using the Cast demonstration system
- User instructions and technical implementation details

#### Various API and deployment guides
- API_SYNCHRONIZATION.md
- DEPLOYMENT_GUIDE.md
- DEVELOPMENT_SETUP.md
- ENVIRONMENT_CONFIGURATION.md

## Quick Start for New AI Agents

### Immediate Context Assessment

1. **Start with the latest session**: `AI_AGENT_KNOWLEDGE_BASE_CAST_DEMO_SESSION.md`
2. **Review current build status**: Check Next.js compatibility fixes and static export configuration
3. **Understand Cast architecture**: Review CastContext implementation and message protocols

### Key Technical Areas

#### Cast Implementation
- **CastContext**: Core session management and message handling
- **CastButton**: UI component with Google Cast menu integration
- **Message Protocol**: Structured communication between sender and receiver
- **Portfolio Demo**: Professional presentation system via Chromecast

#### Build System
- **Next.js Static Export**: Compatible with GitHub Pages deployment
- **Path Resolution**: Fixed subdirectory asset loading issues
- **API Routes**: Static export compatible with force-static configuration
- **Metadata**: Next.js 14+ viewport and themeColor compliance

#### Current Status (July 21, 2025)
- ✅ Production-ready Cast demonstration system
- ✅ All Next.js warnings resolved
- ✅ Build system stable and reliable
- ✅ Professional portfolio presentation capabilities

### Common Issues and Solutions

#### Cast Integration
- **Google Cast Menu**: Use CastContext.requestSession() for reliable menu opening
- **Message Protocol**: Follow structured message format with proper typing
- **Session Management**: Implement proper session restoration and error handling

#### Build and Deployment
- **Static Export**: Ensure API routes have `dynamic = 'force-static'` configuration
- **Metadata**: Use separate `viewport` export for Next.js 14+ compatibility
- **Path Resolution**: Build system automatically handles subdirectory path corrections

### Architecture Overview

```
Cast System Architecture:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Sender App    │    │   Cast Context   │    │  Receiver App   │
│  (portfolio)    │◄──►│  (messages)      │◄──►│  (presentation) │
│                 │    │                  │    │                 │
│ - Cast Demo     │    │ - Session Mgmt   │    │ - Portfolio     │
│ - Controls      │    │ - Message Proto  │    │   Cards         │
│ - UI/UX         │    │ - Error Handling │    │ - Animations    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Development Workflow

### For New Feature Development
1. Review latest session documentation
2. Understand existing Cast message protocols
3. Follow established UI/UX patterns (Matrix glass theme)
4. Test with both cast-debug and cast-demo pages
5. Validate build system compatibility

### For Bug Fixes
1. Check recent session documents for similar issues
2. Review CastContext and CastButton implementations
3. Test with real Cast devices when possible
4. Update knowledge base documentation

### For Build Issues
1. Review build system addendum documentation
2. Check static export configuration
3. Validate path resolution for subdirectories
4. Test deployment pipeline

## Knowledge Base Maintenance

### When to Update Documentation
- Major architectural changes
- Critical bug fixes
- New feature implementations
- Build system modifications
- Deployment pipeline changes

### Documentation Standards
- Include comprehensive code examples
- Document both successful solutions and failed approaches
- Provide context for architectural decisions
- Include testing and validation steps
- Reference related files and dependencies

---

*This knowledge base enables AI agents to quickly understand project context, architectural decisions, and current implementation status for confident and effective development work.*
