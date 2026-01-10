'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="layout-container flex h-full grow flex-col">
        {/* TopNavBar */}
        <div className="flex flex-1 justify-center border-b border-border-light dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1">
            <header className="flex items-center justify-between whitespace-nowrap px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-3">
                <div className="size-6 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-text-light dark:text-text-dark text-xl font-bold">Uruti</h2>
              </div>
              <div className="hidden md:flex flex-1 justify-end gap-8">
                <div className="flex items-center gap-6">
                  <a className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium" href="#personal-loans">Personal Loans</a>
                  <a className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium" href="#business-loans">Business Loans</a>
                  <a className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium" href="#how-it-works">How It Works</a>
                  <a className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium" href="#about">About Us</a>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold">
                      <span className="truncate">Log In</span>
                    </button>
                  </Link>
                  <Link href="/loan-applications/new">
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90">
                      <span className="truncate">Apply Now</span>
                    </button>
                  </Link>
                </div>
              </div>
              <button 
                className="md:hidden flex items-center justify-center rounded-lg h-10 w-10 border border-border-light dark:border-border-dark"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="material-symbols-outlined text-text-light dark:text-text-dark">menu</span>
              </button>
            </header>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-border-light dark:border-border-dark bg-white dark:bg-background-dark px-4 py-4 space-y-3">
                <Link href="#personal-loans" className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium">
                  Personal Loans
                </Link>
                <Link href="#business-loans" className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium">
                  Business Loans
                </Link>
                <Link href="#how-it-works" className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium">
                  How It Works
                </Link>
                <Link href="#about" className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium">
                  About Us
                </Link>
                <div className="pt-2 space-y-2">
                  <Link href="/login">
                    <button className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold">
                      Log In
                    </button>
                  </Link>
                  <Link href="/loan-applications/new">
                    <button className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90">
                      Apply Now
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
            {/* HeroSection */}
            <div className="@container py-16 md:py-24">
              <div className="flex flex-col-reverse gap-12 @[864px]:flex-row @[864px]:items-center">
                <div className="flex flex-col gap-6 text-center @[864px]:text-left @[864px]:w-1/2">
                  <div className="flex flex-col gap-4">
                    <h1 className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-tighter @[480px]:text-5xl @[864px]:text-6xl">
                      Simple, Fast, and Reliable Lending Solutions
                    </h1>
                    <p className="text-subtext-light dark:text-subtext-dark text-base font-normal leading-normal @[480px]:text-lg">
                      Get the funds you need with our competitive rates and a quick, hassle-free application process.
                    </p>
                  </div>
                  <Link href="/loan-applications/new">
                    <button className="flex self-center @[864px]:self-start w-fit cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-base font-bold hover:bg-primary/90">
                      <span className="truncate">Check Your Rate</span>
                    </button>
                  </Link>
                </div>
                <div 
                  className="w-full @[864px]:w-1/2 bg-center bg-no-repeat aspect-video bg-cover rounded-xl" 
                  style={{
                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqnEavpv0b_-BGaBLMKWcUO1Deg-oODboRScdaLmx0U9L4ztL_XAmphM5IWLQWNbhAM_WioYxlrbO9hGEsDtLtQEnOaEC4Motb85tNHRd4fcd4xxZYJOMZ9vCCQiz1kvxh08pcDFVct7Cp6xTCcAc4rlF6UYk_tkgw5VrbU9lnAaWwI8PK4zv0_9R9gDuK7DdUKYSq2EBv1fW3iS0ksGCzMv-sanOrr4CdPl0wqEIE8AViETNSK4t75XSwyfFH8lNnjTN84wYAL9E")'
                  }}
                />
              </div>
            </div>

            {/* FeatureSection */}
            <div className="flex flex-col gap-10 py-16 md:py-24 @container">
              <div className="flex flex-col gap-4 text-center">
                <h2 className="text-text-light dark:text-text-dark text-3xl font-bold leading-tight tracking-tight @[480px]:text-4xl">
                  Why Choose Uruti Lending?
                </h2>
                <p className="text-subtext-light dark:text-subtext-dark text-base font-normal leading-normal max-w-3xl mx-auto">
                  We provide a straightforward lending experience with benefits designed for you.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-0">
                <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6 flex-col">
                  <div className="text-secondary">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Fast Approval</h3>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">
                      Get a decision in minutes, not days. Our streamlined process gets you funded faster.
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6 flex-col">
                  <div className="text-secondary">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Competitive Rates</h3>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">
                      We offer some of the most competitive rates in the market to help you save.
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6 flex-col">
                  <div className="text-secondary">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Flexible Terms</h3>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">
                      Choose a repayment plan that fits your budget and financial goals.
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6 flex-col">
                  <div className="text-secondary">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-text-light dark:text-text-dark text-lg font-bold">Dedicated Support</h3>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">
                      Our team of experts is here to help you every step of the way.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <div id="how-it-works" className="flex flex-col gap-10 py-16 md:py-24">
              <div className="flex flex-col gap-4 text-center">
                <h2 className="text-text-light dark:text-text-dark text-3xl font-bold leading-tight tracking-tight @[480px]:text-4xl">
                  How It Works in 3 Simple Steps
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start gap-8 md:gap-4">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center justify-center size-16 rounded-full bg-primary/20 text-primary">
                    <span className="material-symbols-outlined text-3xl">edit_document</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-text-light dark:text-text-dark text-lg font-bold">1. Apply Online</p>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm">Fill out our simple and secure online application in minutes.</p>
                  </div>
                </div>
                <div className="hidden md:block h-16 border-r-2 border-dashed border-border-light dark:border-border-dark mt-8"></div>
                {/* Step 2 */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center justify-center size-16 rounded-full bg-primary/20 text-primary">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-text-light dark:text-text-dark text-lg font-bold">2. Get Approved</p>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm">Receive a quick decision and review your personalized loan offer.</p>
                  </div>
                </div>
                <div className="hidden md:block h-16 border-r-2 border-dashed border-border-light dark:border-border-dark mt-8"></div>
                {/* Step 3 */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center justify-center size-16 rounded-full bg-primary/20 text-primary">
                    <span className="material-symbols-outlined text-3xl">payments</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-text-light dark:text-text-dark text-lg font-bold">3. Receive Funds</p>
                    <p className="text-subtext-light dark:text-subtext-dark text-sm">Once you accept, funds are deposited directly into your account.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials Section */}
            <div className="flex flex-col gap-10 py-16 md:py-24">
              <div className="flex flex-col gap-4 text-center">
                <h2 className="text-text-light dark:text-text-dark text-3xl font-bold leading-tight tracking-tight @[480px]:text-4xl">
                  Trusted by Thousands of Customers
                </h2>
                <p className="text-subtext-light dark:text-subtext-dark text-base font-normal leading-normal max-w-3xl mx-auto">
                  Hear what our satisfied clients have to say about their experience with Uruti.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6">
                  <p className="text-subtext-light dark:text-subtext-dark text-base">
                    &quot;The process was incredibly fast and easy. I had the funds I needed in less than 24 hours. Highly recommend Uruti to anyone!&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-full bg-cover bg-center"
                      style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDsfN3wCZw8r9_cHFyL7bOvHX6_iRnVzKeb9SWY7Lzg7fVoJtq1o_KFqzRnb0qJQPtCoS-llR4mAXzdFtzqMq6bWG4mRWHLhVZjaVE72suWRGLCUdAJiMcX6Iuv0kWPdnuTpZOVM4UP7VCRDC5czEyyoDaPDKJCzm3S66xaS9qw4iaHD9E4iLBAPDNl0umG8WHOvoKVDpoyDk9pqpmI5QlqR_J_-iuYy5JEuk1ciLoz9joDP0_8UCOimxwekS_7IQAgJMMETNnrNm8")'
                      }}
                    />
                    <div>
                      <p className="font-bold text-text-light dark:text-text-dark">Jane D.</p>
                      <p className="text-sm text-subtext-light dark:text-subtext-dark">Personal Loan Customer</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6">
                  <p className="text-subtext-light dark:text-subtext-dark text-base">
                    &quot;Uruti offered the best rates for my small business loan. Their team was professional and supportive throughout the entire process.&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-full bg-cover bg-center"
                      style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDH2Qt9yLNPZXTZRRyse9QYq_xn8KZuxcyKAyJ_flxPNpORz9M0IyxBidKVN0xrjXLun4c4nGwE9T5aCTV2gU1tRhvwuOE_0vnmyIsR1EmF4IaLTczCRx9hIx3_kWFvTpi2GSoJfZ7AiPGr5QDCeZQsaEy9dtmcynpAQiJek3LlJfqw6SRPJcqRFRjO3BZXS7ll4e2BDfyaR2AHV0zxqRO13bOmgN4JFgBY88cunScgHMWTO90r5nzV23XI3dM2Eaq6QhsOn-Y81lM")'
                      }}
                    />
                    <div>
                      <p className="font-bold text-text-light dark:text-text-dark">John S.</p>
                      <p className="text-sm text-subtext-light dark:text-subtext-dark">Business Loan Customer</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-background-dark p-6">
                  <p className="text-subtext-light dark:text-subtext-dark text-base">
                    &quot;I was hesitant about online lending, but Uruti&apos;s transparent terms and excellent customer service made me feel secure. A great experience.&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-full bg-cover bg-center"
                      style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCq7z4ggKw9KCxV1DQrLRsHGlEb3NsgjmuPyMeSqTaL0zwmdqoeYLmp_wocOQKV33j_wMNlRnWfoareXdmc9GKRcgOBmEHVxhhZEqfp677-wdrGZxn_cVtfrvWtgGHRSIge8MKxEJARc5mj56LMv0JbclAyv6w_2jZDYP18eAGSZHDFDC0kni89xUG_IzN4EfVxneolrkueQ21Al4nwSMSijLRrZpGnED0frE4LJPjenJ6MCBEbB2T0tXBeWjqO760fUbAy4j-O6ig")'
                      }}
                    />
                    <div>
                      <p className="font-bold text-text-light dark:text-text-dark">Sarah K.</p>
                      <p className="text-sm text-subtext-light dark:text-subtext-dark">Personal Loan Customer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust/Security Badges Section */}
            <div className="flex flex-col items-center gap-6 py-16 md:py-24 text-center">
              <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Your Security is Our Priority</h3>
              <div className="flex flex-wrap items-center justify-center gap-8 text-subtext-light dark:text-subtext-dark">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">verified_user</span>
                  <span className="text-sm font-medium">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">lock</span>
                  <span className="text-sm font-medium">256-Bit Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">shield</span>
                  <span className="text-sm font-medium">Data Privacy Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-center border-t border-border-light dark:border-border-dark">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-sm text-subtext-light dark:text-subtext-dark">© 2024 Uruti Lending. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a className="text-sm text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white" href="#">Privacy Policy</a>
              <a className="text-sm text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white" href="#">Terms of Service</a>
              <a className="text-sm text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white" href="#">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
