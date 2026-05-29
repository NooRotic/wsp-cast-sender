import type { Metadata } from 'next';
import NowLastUpdated from '@/components/NowLastUpdated';

// Walter — bump this whenever you edit the content below. The badge at the
// top of the page reads from this constant.
const LAST_UPDATED = '2026-05-29';

export const metadata: Metadata = {
  title: 'Now | Walter S. Pollard Jr.',
  description: 'What I am working on, building, and reading right now. Updated whenever priorities shift.',
  openGraph: {
    title: 'Now | Walter S. Pollard Jr.',
    description: 'What I am working on, building, and reading right now.',
    type: 'website',
    url: '/now',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Now | Walter S. Pollard Jr.',
    description: 'What I am working on, building, and reading right now.',
  },
};

export default function NowPage() {
  return (
    <main className="relative min-h-screen pt-24 pb-20 px-6">
      <article className="max-w-[700px] mx-auto" style={{ fontSize: '1.0625rem', lineHeight: 1.75 }}>
        <header className="mb-12">
          <div className="mb-6">
            <NowLastUpdated date={LAST_UPDATED} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            What I&apos;m doing now
          </h1>
          <p className="text-gray-400" style={{ fontSize: '1rem' }}>
            A snapshot of my current focus, inspired by the{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#39FF14] hover:underline"
            >
              /now page convention
            </a>
            . This file gets a small edit whenever priorities shift.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#39FF14] mb-4">
            Job search
          </h2>
          <p className="text-gray-200 mb-4">
            Open to senior software engineer roles in streaming video,
            AI-native development, and Chromecast / CAF work. Currently
            exploring contract engagements alongside full-time
            opportunities. Remote.
          </p>
          <p className="text-gray-200">
            If you&apos;re reading this and the shape sounds right, reach
            me at{' '}
            <a href="mailto:walter@pollardjr.com" className="text-[#39FF14] hover:underline">
              walter@pollardjr.com
            </a>
            .
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#39FF14] mb-4">
            Building
          </h2>
          <ul className="text-gray-200 space-y-3" style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <strong className="text-white">walter.pollardjr.com</strong>:
              this site. Next.js 15 with a static export to IONOS, doubles
              as a Chromecast sender for the companion receiver app.
            </li>
            <li>
              <strong className="text-white">JobTrackr</strong>: a
              SvelteKit 5 dashboard I built to keep the application
              pipeline coherent across listings, drafts, and outreach.
            </li>
            <li>
              <strong className="text-white">RipTheAI</strong>: a Twitch
              chatbot with dual AI personalities and contextual response
              routing. Side project; learning ground for agentic patterns.
            </li>
            <li>
              <strong className="text-white">Daily agentic workflows</strong>:
              Claude Code as primary editor, chaining sub-agents for
              research, build, and review across these projects.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#39FF14] mb-4">
            Experimenting with
          </h2>
          <ul className="text-gray-200 space-y-3" style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <strong className="text-white">Multi-machine memory sync</strong>:
              figuring out a flow for sharing my Claude memory state
              across workstations so a session started on one picks up
              cleanly on another.
            </li>
            <li>
              <strong className="text-white">ComfyUI as a Claude target</strong>:
              testing how far an agent can actually drive multi-node
              graph editing, custom node authoring, and image
              generation pipelines. The ultimate Claude application as
              far as I&apos;m concerned.
            </li>
            <li>
              <strong className="text-white">Plan, draft, spec, handoff, implement, review</strong>:
              shaping multi-agent flows around that sequence, with me
              sitting between each step instead of letting the chain
              run unattended. The friction points are usually at the
              seams, not inside any one step.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#39FF14] mb-4">
            Reading and learning
          </h2>
          <ul className="text-gray-200 space-y-3" style={{ listStyle: 'none', padding: 0 }}>
            <li>
              Local LLM workflows and prompt engineering as a daily
              practice, not a one-off curiosity.
            </li>
            <li>
              Chromecast CAF internals revisited. Last touched these at
              Comcast on Xfinity Stream; the sender side of this portfolio
              is where I&apos;m working through them again.
            </li>
            <li>
              Re-evaluating my old Polymer and Lit work for what still
              translates to modern React patterns and what is genuinely
              new ground.
            </li>
          </ul>
        </section>

        <hr className="border-gray-700/40 my-12" />

        <footer className="text-gray-500" style={{ fontSize: '0.9375rem' }}>
          <p>
            Last edited{' '}
            <time dateTime={LAST_UPDATED}>{LAST_UPDATED}</time>. If
            something here looks out of date, that&apos;s on me. Ping me
            and I&apos;ll fix it.
          </p>
        </footer>
      </article>
    </main>
  );
}
