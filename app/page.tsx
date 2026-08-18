import HeroSlider from "./components/HeroSlider";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">Skilvo</div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/enroll"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Enroll
            </Link>
          </div>
        </div>
      </nav>

      <main className="w-full">
        {/* Hero Slider */}
        <section>
          <HeroSlider />
        </section>

        {/* About Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Learn at Your Own Pace
              </h2>
              <p className="text-lg text-slate-300 mb-6">
                Access world-class learning programs designed for professionals and students who want to grow their skills and advance their careers.
              </p>
              <p className="text-base text-slate-400 mb-8">
                Join thousands of learners already transforming their futures with our comprehensive online courses and certifications.
              </p>
              <Link
                href="/enroll"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Get Started Today
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-slate-800 rounded-lg p-8 border border-slate-700">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">1000+</div>
                  <p className="text-slate-300">Active Learners</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">50+</div>
                  <p className="text-slate-300">Courses</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">24/7</div>
                  <p className="text-slate-300">Support</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
                  <p className="text-slate-300">Online</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Why Choose Us?</h2>
              <p className="text-lg text-slate-400">
                Everything you need to succeed in your learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Expert Instructors",
                  description: "Learn from industry professionals with years of experience",
                  icon: "👨‍🏫",
                },
                {
                  title: "Flexible Schedule",
                  description: "Study whenever and wherever you want, at your own pace",
                  icon: "⏰",
                },
                {
                  title: "Certifications",
                  description: "Earn recognized certificates upon course completion",
                  icon: "🎓",
                },
                {
                  title: "Interactive Content",
                  description: "Engage with videos, quizzes, and real-world projects",
                  icon: "🎬",
                },
                {
                  title: "Community Support",
                  description: "Connect with fellow learners and get peer support",
                  icon: "👥",
                },
                {
                  title: "Career Growth",
                  description: "Boost your resume and advance your career prospects",
                  icon: "📈",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500/50 transition-colors"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Join our community and begin your journey to success
          </p>
          <Link
            href="/enroll"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Enroll Now
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Skilvo</h3>
              <p className="text-slate-400 text-sm">
                Empowering learners worldwide with accessible, quality education.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Courses</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">Browse Courses</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Popular Topics</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">View All</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            <p>&copy; 2026 Skilvo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
