import CastDebugPanel from '@/components/CastDebugPanel';
import ContactSection from '@/components/ContactSection';

export default function CastDebugPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cast Debug Interface
          </h1>
          <p className="text-muted-foreground">
            Test Google Cast functionality and send messages to connected receivers
          </p>
        </div>

        <CastDebugPanel />
        
                  {/* Footer Section */}
                  <ContactSection />
                  <footer className="pt-10 text-center text-gray-400 relative z-10">
                    <div className="max-w-4xl mx-auto px-4">
                      <p>
                        &copy; 2025 WSP - Senior Software Engineer. All rights reserved.
                      </p>
                      <p className="m-2 text-sm">
                        Built with Next.js, TypeScript, GSAP, and Tailwind CSS
                      </p>
                    </div>
                  </footer>
      </div>
    </div>
  );
}
