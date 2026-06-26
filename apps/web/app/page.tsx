// apps/web/app/page.tsx
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "📮",
    title: "Your own UK mailbox",
    body: "Get a personal mailbox code the moment you sign up. Shop any UK or US store and ship to us — we'll know exactly whose parcel it is.",
  },
  {
    icon: "📦",
    title: "We consolidate everything",
    body: "Ten parcels from ten retailers become one shipment. Pay to move one box, not ten — and save dramatically on freight.",
  },
  {
    icon: "🔔",
    title: "Notified at every step",
    body: "Email and WhatsApp alerts when each package arrives, when your quote is ready, and the moment your shipment is dispatched.",
  },
  {
    icon: "📸",
    title: "Photo proof on arrival",
    body: "Our warehouse team photographs every parcel on intake, so you can see exactly what's waiting in your mailbox.",
  },
];

const STEPS = [
  { n: 1, title: "Sign up & get your code", body: "Create a free account and we assign you a unique mailbox code (e.g. KLD-007)." },
  { n: 2, title: "Shop & ship to us", body: "Use your code when ordering online. Parcels arrive at our warehouse and we log them to you." },
  { n: 3, title: "Request a quote", body: "When you're ready, pick air, sea, or express. We price it by weight and destination instantly." },
  { n: 4, title: "Pay & we dispatch", body: "Pay securely online. We pack, consolidate, and send your box — then you track it to your door." },
];

const METHODS = [
  { name: "Sea Freight", tag: "Cheapest", blurb: "Best value for bulky, non-urgent orders.", accent: "text-brand-blue" },
  { name: "Air Freight", tag: "Balanced", blurb: "The sweet spot of speed and price.", accent: "text-brand-navy" },
  { name: "Express Air", tag: "Fastest", blurb: "Priority handling when you need it now.", accent: "text-brand-amber" },
];

export default async function LandingPage() {
  const session = await getSession();
  const primaryHref = session
    ? session.role === "CUSTOMER" ? "/dashboard" : "/clients"
    : "/register";
  const primaryLabel = session ? "Go to dashboard" : "Get your free mailbox";

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Nav */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo markClassName="h-8 w-auto" className="text-lg" />
          <nav className="flex items-center gap-3">
            {session ? (
              <Link href={primaryHref} className="btn-primary text-sm">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-blue-100 hover:text-white font-medium">Sign in</Link>
                <Link href="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 pb-16 pt-10 md:pt-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block text-xs font-mono tracking-widest uppercase text-brand-amber bg-white/5 border border-white/10 rounded-full px-3 py-1">
              Air & Sea Freight Consolidation
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 leading-tight">
              One mailbox.<br />Every parcel.<br />
              <span className="text-brand-sky">One shipment home.</span>
            </h1>
            <p className="text-blue-100 mt-4 text-lg max-w-md">
              Shop UK & US stores, ship to your free XPRESS CARGO mailbox, and we consolidate
              everything into a single box delivered to your door — for a fraction of the cost.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href={primaryHref} className="btn-primary text-base px-6 py-3">{primaryLabel} →</Link>
              <Link
                href="#how-it-works"
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                How it works
              </Link>
            </div>
            <p className="text-xs text-blue-300 mt-4">No subscription · Pay only when you ship</p>
          </div>

          {/* Mailbox card mock */}
          <div className="md:justify-self-end w-full max-w-sm">
            <div className="bg-white rounded-2xl p-5 shadow-xl text-brand-navy">
              <div className="flex items-center justify-between">
                <p className="text-xs text-brand-muted uppercase tracking-wide">Your mailbox</p>
                <span className="badge-received">3 waiting</span>
              </div>
              <p className="font-mono font-bold text-3xl tracking-widest text-brand-blue mt-1">KLD-007</p>
              <div className="mt-4 space-y-2">
                {[
                  { r: "Amazon", w: "1.2kg" },
                  { r: "ASOS", w: "0.6kg" },
                  { r: "Nike", w: "0.9kg" },
                ].map((p) => (
                  <div key={p.r} className="flex items-center gap-3 bg-brand-surface rounded-lg px-3 py-2">
                    <div className="w-9 h-9 rounded-lg bg-white border border-brand-border flex items-center justify-center">📦</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.r}</p>
                      <p className="text-xs text-brand-muted">Received · {p.w}</p>
                    </div>
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-brand-navy text-white rounded-lg px-4 py-3 text-sm">
                <span className="text-blue-200">Estimated to consolidate & ship: </span>
                <span className="font-bold text-brand-amber">£42.50</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6">
        {/* Features */}
        <section className="py-14">
          <h2 className="text-2xl font-bold text-brand-navy text-center">Why ship with XPRESS CARGO</h2>
          <p className="text-brand-muted text-center mt-2 max-w-xl mx-auto">
            Built for shoppers who buy abroad and want it home without the per-parcel pain.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="font-semibold text-brand-navy mt-3">{f.title}</h3>
                <p className="text-sm text-brand-muted mt-1">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-14 scroll-mt-6">
          <h2 className="text-2xl font-bold text-brand-navy text-center">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {STEPS.map((s) => (
              <div key={s.n} className="card relative">
                <div className="w-10 h-10 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="font-semibold text-brand-navy mt-3">{s.title}</h3>
                <p className="text-sm text-brand-muted mt-1">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Methods */}
        <section className="py-14">
          <h2 className="text-2xl font-bold text-brand-navy text-center">Choose your speed</h2>
          <p className="text-brand-muted text-center mt-2">
            Every quote is priced live by total weight and destination zone.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {METHODS.map((m) => (
              <div key={m.name} className="card text-center">
                <p className={`text-xs font-mono uppercase tracking-widest ${m.accent}`}>{m.tag}</p>
                <h3 className="font-bold text-brand-navy text-lg mt-1">{m.name}</h3>
                <p className="text-sm text-brand-muted mt-2">{m.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16">
          <div className="card bg-brand-navy text-white text-center py-10">
            <h2 className="text-2xl font-bold">Ready to stop overpaying on shipping?</h2>
            <p className="text-blue-100 mt-2 max-w-md mx-auto">
              Create your free mailbox in under a minute and start consolidating today.
            </p>
            <Link href={primaryHref} className="btn-primary inline-block mt-6 text-base px-6 py-3">
              {primaryLabel} →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-brand-muted">© {new Date().getFullYear()} XPRESS CARGO Consolidation</p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-brand-muted hover:text-brand-navy">Sign in</Link>
            <Link href="/register" className="text-brand-blue font-semibold hover:underline">Get your mailbox</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
