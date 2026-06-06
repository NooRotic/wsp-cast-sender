/**
 * Unit tests for the static-export asset-path rewriter.
 *
 * Regression guard for the blog-detail CSS bug: pages nested two directories
 * deep (out/blog/<slug>/index.html) must climb "../../" to reach out/_next/.
 * The original logic used a single "../" for every non-root page, so depth-2
 * detail pages requested out/blog/_next/* (404) and rendered unstyled/blank.
 */

const path = require('path');
const { computePrefix } = require('@/js/build/fix-absolute-paths');

describe('computePrefix', () => {
  it('uses ./ for root-level files', () => {
    expect(computePrefix('index.html')).toBe('./');
    expect(computePrefix('404.html')).toBe('./');
  });

  it('uses ../ for pages one directory deep', () => {
    expect(computePrefix('blog/index.html')).toBe('../');
    expect(computePrefix('cast-debug/index.html')).toBe('../');
    expect(computePrefix('404/index.html')).toBe('../');
  });

  it('uses ../../ for blog detail pages two directories deep', () => {
    expect(computePrefix('blog/2026-05-21-hello-blog/index.html')).toBe('../../');
  });

  it('handles Windows-style separators from path.relative', () => {
    // path.relative on win32 returns backslash-delimited paths.
    expect(computePrefix(['blog', 'some-slug', 'index.html'].join(path.sep)))
      .toBe('../../');
  });
});
