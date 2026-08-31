import HeroSlider from "./components/HeroSlider";
import Link from "next/link";
import LoginButton from "./components/LoginButton";
import ThemeToggle from "./components/theme/ThemeToggle";
import AppLogo from "./components/AppLogo";

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: "Expert-Curated Content",
    description: "Learn from structured courses built by industry professionals, tailored for real-world skill development.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Learn at Your Own Pace",
    description: "Access all your course materials anytime. Study on your schedule — morning, evening, or weekend.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: "Track Your Progress",
    description: "Monitor course completion, quiz scores, and your overall learning journey through a clean dashboard.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "Assessments & Certificates",
    description: "Test your knowledge with module quizzes and earn certificates upon successful course completion.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    title: "Rich Multimedia Content",
    description: "Engage with videos, PDFs, presentations, and interactive assessments — all in one place.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: "Batch-Based Learning",
    description: "Join structured batches with defined timelines, ensuring a cohesive learning experience with your peers.",
  },
];

const STATS = [
  { value: "1000+", label: "Active Learners" },
  { value: "50+", label: "Courses" },
  { value: "24/7", label: "Access" },
  { value: "100%", label: "Online" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ── Navbar (DO NOT MODIFY) ───────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <AppLogo />
          <div className="flex items-center gap-4">
            <LoginButton />
            <Link
              href="/enroll"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Enroll
            </Link>
            <ThemeToggle variant="icon-button" />
          </div>
        </div>
      </nav>

      <main className="w-full">
        {/* ── 1. Hero / Banner Section ─────────────────────────────── */}
        <section aria-label="Banner">
          <HeroSlider />
        </section>

        {/* ── 2. Stats Strip ───────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <dt className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{s.value}</dt>
                  <dd className="text-sm text-slate-500 dark:text-slate-400">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── 3. Introduction / Welcome Section ───────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-3">
                Welcome to Skilvo
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-5 leading-tight">
                Advance Your Career with
                <span className="text-blue-600 dark:text-blue-400"> Professional Learning</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Skilvo is a modern Learning Management System built for organizations and individuals who
                value structured, accessible, and results-driven education.
              </p>
              <p className="text-slate-400 dark:text-slate-500 mb-8 leading-relaxed text-sm">
                From onboarding programs to advanced skill certifications, Skilvo gives your team the
                tools to grow — at their own pace, on any device.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/enroll"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Get Started
                </Link>
                <LoginButton />
              </div>
            </div>

            {/* Visual card */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
              <div className="space-y-4">
                {[
                  { label: "Course completion rate", value: 94, color: "bg-blue-500" },
                  { label: "Learner satisfaction", value: 97, color: "bg-emerald-500" },
                  { label: "Skill improvement", value: 88, color: "bg-violet-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">50+</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Courses available</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">1000+</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enrolled learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Features Section ──────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-3">
                Platform Features
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything You Need to Learn Effectively
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
                Skilvo brings together powerful tools for learners and administrators in one clean, intuitive platform.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature, idx) => (
                <div
                  key={idx}
                  className="group bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-500/40 hover:bg-slate-100 dark:hover:bg-slate-950 transition-all duration-200"
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-600/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. How It Works ──────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
              Get started in minutes — enroll, learn, and grow.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-8 left-[20%] right-[20%] h-px bg-slate-200 dark:bg-slate-800" />

            {[
              {
                step: "01",
                title: "Enroll",
                description: "Submit your enrollment request and get assigned to your learning batch.",
              },
              {
                step: "02",
                title: "Learn",
                description: "Access your course modules — videos, PDFs, presentations — at your own pace.",
              },
              {
                step: "03",
                title: "Achieve",
                description: "Complete quizzes, track your progress, and earn your course certificate.",
              },
            ].map((step) => (
              <div key={step.step} className="text-center relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-600/30 text-blue-600 dark:text-blue-400 font-bold text-lg mb-4 relative z-10">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. CTA Section ───────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm sm:text-base max-w-lg mx-auto">
              Join thousands of learners who are already advancing their skills and careers with Skilvo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/enroll"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Enroll Now — It's Free
              </Link>
              <LoginButton />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <AppLogo className="h-6 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Empowering learners worldwide with accessible, structured, quality education.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Browse Courses</Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Popular Topics</Link>
                </li>
                <li>
                  <Link href="/enroll" className="hover:text-slate-900 dark:hover:text-white transition-colors">Enroll</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Blog</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              &copy; {new Date().getFullYear()} Skilvo. All rights reserved.
            </p>
            <p className="text-slate-300 dark:text-slate-600 text-xs">
              Professional Learning Management Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
