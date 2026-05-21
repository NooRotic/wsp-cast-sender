import { ImageResponse } from 'next/og';

// Build-time OG image generation via Satori. `dynamic = 'force-static'` makes
// it compatible with `output: 'export'` — the PNG is baked into out/ at build
// time and served as a plain static asset by IONOS.
export const dynamic = 'force-static';

// Next.js Metadata API conventions — these constants populate alt + size + type
// in the generated OG meta tags automatically.
export const alt = 'Walter S. Pollard Jr. | Senior Software Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BRAND_GREEN = '#39FF14';
const TEXT_WHITE = '#ffffff';
const TEXT_MUTED = '#a3a3a3';
const BG_DARK = '#000000';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: BG_DARK,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          color: TEXT_WHITE,
        }}
      >
        {/* Top — eyebrow with name in brand color */}
        <div
          style={{
            fontSize: 30,
            color: BRAND_GREEN,
            fontWeight: 600,
            letterSpacing: 3,
          }}
        >
          WALTER S. POLLARD JR.
        </div>

        {/* Middle — primary title + supporting tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: 92,
              color: TEXT_WHITE,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Senior Software Engineer
          </div>
          <div
            style={{
              fontSize: 30,
              color: TEXT_MUTED,
              lineHeight: 1.4,
              maxWidth: 1000,
            }}
          >
            25+ years building for the web. 13 years on Comcast Xfinity Stream: streaming video, Chromecast, and now AI-native development.
          </div>
        </div>

        {/* Bottom — URL with brand-color marker */}
        <div
          style={{
            fontSize: 26,
            color: BRAND_GREEN,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: BRAND_GREEN,
              borderRadius: '50%',
            }}
          />
          walter.pollardjr.com
        </div>
      </div>
    ),
    { width: size.width, height: size.height }
  );
}
