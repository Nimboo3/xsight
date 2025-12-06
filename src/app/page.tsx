'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  BarChart3, 
  Target, 
  Zap, 
  Shield, 
  TrendingUp,
  ArrowRight,
  Check,
  Play,
  Github,
  ChevronDown,
  Sparkles,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const GITHUB_REPO = 'https://github.com/Nimboo3/dshop';

const features = [
  {
    icon: Users,
    title: 'Customer Intelligence',
    description: 'Automatically sync and analyze customer data from your Shopify store with powerful RFM segmentation.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Visualize revenue trends, customer behavior, and segment performance with interactive dashboards.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Smart Segmentation',
    description: 'Create dynamic customer segments based on purchase history, behavior, and custom attributes.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Keep your data up-to-date with automatic webhooks and scheduled synchronization.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with encrypted data storage and SOC 2 compliant infrastructure.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Growth Insights',
    description: 'Identify your most valuable customers and discover opportunities to increase lifetime value.',
    color: 'from-indigo-500 to-purple-500',
  },
];

const stats = [
  { value: '10K+', label: 'Active Stores' },
  { value: '50M+', label: 'Customers Analyzed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Rating' },
];

const benefits = [
  'Automatic customer data sync from Shopify',
  'RFM analysis to identify high-value customers',
  'Custom segment builder with flexible rules',
  'Revenue and order analytics dashboard',
  'Real-time webhook updates',
  'Export segments for marketing campaigns',
];

// Custom hook for intersection observer (scroll animations)
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isInView] as const;
}

export default function HomePage() {
  const [heroRef, heroInView] = useInView();
  const [featuresRef, featuresInView] = useInView();
  const [statsRef, statsInView] = useInView();
  const [benefitsRef, benefitsInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl">ShopSight</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="text-sm text-slate-400 hover:text-white transition-colors">Benefits</a>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={cn(
              "space-y-8 transition-all duration-1000",
              heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Built for Shopify merchants
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Turn customer data into{' '}
                <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  growth insights
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                ShopSight automatically syncs your Shopify customers and orders, 
                providing powerful RFM analytics and segmentation to help you 
                understand and grow your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-base px-8">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-white/5 hover:text-white text-base px-8"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    View Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-slate-500 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Free 14-day trial
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  No credit card required
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className={cn(
              "relative transition-all duration-1000 delay-300",
              heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-sm text-slate-500">ShopSight Dashboard</span>
                </div>
                
                {/* Mini Dashboard */}
                <div className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Revenue', value: '$124,590', icon: LineChart, trend: '+12%' },
                      { label: 'Customers', value: '2,847', icon: Users, trend: '+8%' },
                      { label: 'Orders', value: '1,234', icon: Activity, trend: '+15%' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <stat.icon className="h-4 w-4 text-slate-500" />
                          <span className="text-xs text-green-400">{stat.trend}</span>
                        </div>
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">Revenue Trend</span>
                      <PieChart className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex items-end gap-1 h-20">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t transition-all duration-500"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Segments Preview */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <span className="text-sm text-slate-400 mb-3 block">Customer Segments</span>
                    <div className="space-y-2">
                      {[
                        { name: 'Champions', value: 85, color: 'bg-green-500' },
                        { name: 'Loyal', value: 60, color: 'bg-blue-500' },
                        { name: 'At Risk', value: 25, color: 'bg-orange-500' },
                      ].map((seg, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-20">{seg.name}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-1000", seg.color)}
                              style={{ width: heroInView ? `${seg.value}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8">{seg.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center mt-16 animate-bounce">
            <a href="#stats" className="text-slate-500 hover:text-white transition-colors">
              <ChevronDown className="h-8 w-8" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" ref={statsRef} className="py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className={cn(
            "grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000",
            statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={cn(
            "text-center mb-16 transition-all duration-1000",
            featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything you need to understand your customers
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Powerful features designed specifically for Shopify merchants who want 
              to make data-driven decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={cn(
                  "bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl group",
                  featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className={cn(
                    "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110",
                    feature.color
                  )}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" ref={benefitsRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={cn(
              "transition-all duration-1000",
              benefitsInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            )}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6">
                <Check className="h-4 w-4" />
                Why Choose ShopSight
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-8">
                Why Shopify merchants love ShopSight
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all duration-500 hover:bg-slate-800 hover:border-slate-600",
                      benefitsInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                    )}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/auth/signup">
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Animated Preview */}
            <div className={cn(
              "relative transition-all duration-1000 delay-300",
              benefitsInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            )}>
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-sm text-slate-500 mb-6">Customer Segment Performance</div>
                <div className="space-y-6">
                  {['Champions', 'Loyal Customers', 'Potential Loyalists', 'New Customers', 'At Risk'].map((segment, i) => {
                    const values = [85, 60, 45, 35, 25];
                    return (
                      <div key={segment} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{segment}</span>
                          <span className="text-sm text-slate-400">{values[i]}%</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out",
                              i === 0 ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                              i === 1 ? "bg-gradient-to-r from-blue-500 to-cyan-400" :
                              i === 2 ? "bg-gradient-to-r from-purple-500 to-pink-400" :
                              i === 3 ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
                              "bg-gradient-to-r from-red-500 to-orange-400"
                            )}
                            style={{ 
                              width: benefitsInView ? `${values[i]}%` : '0%',
                              transitionDelay: `${i * 150}ms`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "max-w-4xl mx-auto text-center transition-all duration-1000",
          ctaInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-12 sm:p-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Start Today
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to understand your customers better?
              </h2>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Join thousands of Shopify merchants using ShopSight to grow their business 
                with data-driven customer insights.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-base px-8">
                    Start Your Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white text-base px-8"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-semibold">ShopSight</span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
              <a href={`${GITHUB_REPO}#readme`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href={`${GITHUB_REPO}#readme`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms of Service</a>
              <a href={`${GITHUB_REPO}#readme`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Support</a>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} ShopSight. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
