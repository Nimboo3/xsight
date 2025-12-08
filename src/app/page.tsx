'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Users, 
  BarChart3, 
  Target, 
  Zap, 
  TrendingUp,
  ArrowRight,
  Check,
  Github,
  ChevronDown,
  Sparkles,
  LineChart,
  PieChart,
  Activity,
  Store,
  Play,
  Layers,
  RefreshCw,
  Shield,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

gsap.registerPlugin(ScrollTrigger);

const GITHUB_REPO = 'https://github.com/Nimboo3/dshop';

const features = [
  {
    icon: Users,
    title: 'Customer Intelligence',
    description: 'Sync and analyze customer data with powerful RFM segmentation that identifies your most valuable customers.',
    highlight: 'RFM Analysis',
  },
  {
    icon: Target,
    title: 'Smart Segmentation',
    description: 'Create dynamic segments with our visual builder. Target champions, at-risk customers, and everyone in between.',
    highlight: '11 Segments',
  },
  {
    icon: BarChart3,
    title: 'Revenue Analytics',
    description: 'Visualize revenue trends, cohort retention, and customer lifetime value with interactive dashboards.',
    highlight: 'Real-time',
  },
  {
    icon: RefreshCw,
    title: 'Auto Sync',
    description: 'Webhooks and scheduled jobs keep your data fresh. Never worry about manual imports again.',
    highlight: 'Webhooks',
  },
  {
    icon: Layers,
    title: 'Multi-tenant',
    description: 'Built for agencies and multi-store owners. Each store gets isolated, secure data storage.',
    highlight: 'Secure',
  },
  {
    icon: TrendingUp,
    title: 'Churn Prediction',
    description: 'Our AI-powered churn model identifies at-risk customers before they leave, so you can act fast.',
    highlight: 'AI-Powered',
  },
];

const capabilities = [
  { label: 'Customer Sync', value: 'Real-time' },
  { label: 'Order Analytics', value: 'Advanced' },
  { label: 'RFM Segments', value: '11 Types' },
  { label: 'Data Isolation', value: 'Per Tenant' },
  { label: 'Webhook Events', value: '9 Types' },
  { label: 'Cache Strategy', value: 'Redis' },
];

export default function HomePage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      const tl = gsap.timeline();
      tl.from('.hero-text', {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out'
      })
      .from('.hero-cta', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)'
      }, '-=0.5');

      // Dashboard Preview Animation
      gsap.from('.dashboard-preview', {
        scrollTrigger: {
          trigger: '.dashboard-preview',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        },
        y: 100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });

      // Counters Animation
      gsap.utils.toArray('.counter').forEach((counter: any) => {
        const endValue = parseInt(counter.getAttribute('data-value') || '0');
        gsap.to(counter, {
          scrollTrigger: {
            trigger: counter,
            start: 'top 85%',
            once: true
          },
          innerText: endValue,
          duration: 2,
          snap: { innerText: 1 },
          ease: 'power1.inOut'
        });
      });

      // Features Animation
      gsap.fromTo('.feature-card', 
        { y: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '#features',
            start: 'top 85%',
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out'
        }
      );

      // Capabilities Animation
      gsap.fromTo('.capability-item', 
        { x: -50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '#capabilities',
            start: 'top 85%'
          },
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out'
        }
      );

      gsap.fromTo('.architecture-visual', 
        { x: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '#capabilities',
            start: 'top 85%'
          },
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          delay: 0.2
        }
      );

      // CTA Animation
      gsap.from('.cta-section', {
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 80%'
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)'
      });

    }, mainRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={mainRef} className="min-h-screen text-gray-900 overflow-x-hidden relative">
      {/* Background Image - Lowest layer */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/bg-landing.webp)' }}
        />
      </div>
      
      {/* Overlay to tint the image */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-slate-50/90 via-white/80 to-slate-50/90" />
      
      {/* Animated Gradient Layer */}
      <div className="fixed inset-0 z-[2] opacity-60">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      
      {/* Subtle Pattern on top */}
      <div className="fixed inset-0 z-[3]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Content - Highest layer */}
      <div className="relative z-10">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        navScrolled 
          ? "bg-white/90 backdrop-blur-lg border-b shadow-sm" 
          : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl text-gray-900">XSight</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Features
              </a>
              <a href="#capabilities" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Capabilities
              </a>
              <a 
                href={GITHUB_REPO} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {!authLoading && user ? (
                <Link href="/app">
                  <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-medium">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-medium">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="min-h-[90vh] flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Headline */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
              <span className="block text-gray-900 hero-text">Customer Intelligence</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-primary bg-300% animate-gradient pb-4 hero-text">Reimagined.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed font-light tracking-wide hero-text">
              The CRM that transforms raw data into actionable insights.
              <br className="hidden sm:block" />
              Designed for the modern merchant.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center hero-cta">
              {!authLoading && user ? (
                <Link href="/app">
                  <Button size="lg" className="rounded-full text-lg px-10 h-14 bg-gray-900 hover:bg-gray-800 text-white shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <LayoutDashboard className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" className="rounded-full text-lg px-10 h-14 bg-gray-900 hover:bg-gray-800 text-white shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    Get Started
                  </Button>
                </Link>
              )}
              <a href="#dashboard-preview">
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="rounded-full text-lg px-10 h-14 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 backdrop-blur-sm transition-all duration-300"
                >
                  View Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section 
        id="dashboard-preview"
        className="py-16 px-4 sm:px-6 lg:px-8 mt-20 dashboard-preview"
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Dashboard Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200 overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white rounded-lg border text-sm text-gray-500 flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-green-500" />
                    app.xsight.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
                    <p className="text-sm text-gray-500">Last synced: Just now</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg">
                      Last 30 days
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Revenue', value: 124590, prefix: '$', icon: LineChart, trend: '+12.5%', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Customers', value: 2847, prefix: '', icon: Users, trend: '+8.2%', color: 'text-blue-600 bg-blue-50' },
                    { label: 'Orders', value: 12439, prefix: '', icon: Activity, trend: '+15.3%', color: 'text-violet-600 bg-violet-50' },
                  ].map((stat, i) => (
                    <div 
                      key={i} 
                      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("p-2 rounded-lg", stat.color)}>
                          <stat.icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.prefix}
                        <span className="counter" data-value={stat.value}>0</span>
                      </p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Revenue Chart */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-900">Revenue Trend</span>
                      <PieChart className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {[35, 50, 40, 65, 45, 75, 55, 80, 60, 85, 70, 95].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Jan</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  {/* Segments Chart */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-900">Customer Segments</span>
                      <Target className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Champions', value: 32, color: 'bg-emerald-500' },
                        { name: 'Loyal', value: 28, color: 'bg-blue-500' },
                        { name: 'Promising', value: 18, color: 'bg-violet-500' },
                        { name: 'At Risk', value: 12, color: 'bg-amber-500' },
                      ].map((seg, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-24">{seg.name}</span>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", seg.color)}
                              style={{ width: `${seg.value * 3}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-10">{seg.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to
              <br />understand your customers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From data ingestion to actionable insights — XSight gives you the complete 
              toolkit for customer intelligence.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 feature-card"
              >
                {/* Highlight Badge */}
                <div className="absolute top-6 right-6">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {feature.highlight}
                  </span>
                </div>

                {/* Icon */}
                <div className="h-12 w-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="h-6 w-6 text-gray-600 group-hover:text-primary transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 capability-item">
                Production-ready
                <br />infrastructure
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed capability-item">
                XSight is built with enterprise-grade architecture. Multi-tenant data isolation, 
                async job processing with BullMQ, and Redis caching ensure your data is always 
                secure and fast.
              </p>

              {/* Capabilities Grid */}
              <div className="grid grid-cols-2 gap-4">
                {capabilities.map((cap, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm capability-item"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm text-gray-500">{cap.label}</p>
                      <p className="font-semibold text-gray-900">{cap.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Architecture Visual */}
            <div className="architecture-visual">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-violet-500/10 rounded-3xl blur-2xl" />
                <div className="relative bg-gray-900 rounded-2xl p-6 shadow-2xl overflow-hidden">
                  {/* Terminal Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-gray-500 text-sm ml-2">Architecture</span>
                  </div>

                  {/* Architecture Diagram */}
                  <div className="font-mono text-sm space-y-3">
                    <div className="text-gray-400">
                      <span className="text-emerald-400">Shopify</span> → Webhooks → <span className="text-blue-400">BullMQ</span>
                    </div>
                    <div className="text-gray-400 pl-4">
                      └── <span className="text-yellow-400">customer-sync</span>
                    </div>
                    <div className="text-gray-400 pl-4">
                      └── <span className="text-yellow-400">order-sync</span>
                    </div>
                    <div className="text-gray-400 pl-4">
                      └── <span className="text-yellow-400">rfm-calculation</span>
                    </div>
                    <div className="text-gray-400 mt-4">
                      <span className="text-blue-400">Workers</span> → <span className="text-violet-400">PostgreSQL</span>
                    </div>
                    <div className="text-gray-400 pl-4">
                      └── <span className="text-emerald-400">Prisma ORM</span> (Multi-tenant)
                    </div>
                    <div className="text-gray-400 mt-4">
                      <span className="text-red-400">Redis</span> → Cache Layer
                    </div>
                    <div className="text-gray-400 pl-4">
                      └── TTL: 60s / 5min / 1hr / 24hr
                    </div>
                  </div>

                  {/* Animated Cursor */}
                  <div className="mt-4 flex items-center gap-1 text-gray-400">
                    <span className="text-emerald-400">$</span>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 rounded-3xl blur-2xl" />
            <div className="relative bg-white border border-gray-200 rounded-3xl p-12 sm:p-16 shadow-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Get Started Today
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Ready to understand your
                <br />customers better?
              </h2>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Connect your Shopify store in minutes. Get actionable insights 
                about your customers and grow your business with data.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {!authLoading && user ? (
                  <Link href="/app">
                    <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-base px-8 h-12">
                      <LayoutDashboard className="h-5 w-5" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup">
                    <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-base px-8 h-12">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 text-base px-8 h-12 gap-2"
                  >
                    <Github className="h-5 w-5" />
                    View on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">XSight</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-600">
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
              <a href="mailto:support@xsight.com" className="hover:text-gray-900 transition-colors">
                Support
              </a>
              <a 
                href={GITHUB_REPO} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} XSight. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
