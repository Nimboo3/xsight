'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Building2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">XSight</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: December 8, 2025</p>
        </div>

        {/* Policy Content */}
        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              XSight ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              customer intelligence platform for Shopify merchants.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and password when you register</li>
                <li><strong>Shopify Store Data:</strong> Customer data, order information, and product data synced from your connected Shopify store</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform</li>
                <li><strong>Technical Data:</strong> IP address, browser type, and device information</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and analyze your Shopify store data to generate insights</li>
                <li>Create customer segments and RFM analysis reports</li>
                <li>Send you service-related notifications</li>
                <li>Respond to your inquiries and support requests</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption 
              in transit (TLS) and at rest, secure authentication, and regular security audits. Your 
              Shopify store data is isolated per tenant and never shared between accounts.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide you 
              services. If you disconnect your Shopify store or delete your account, we will delete 
              your synced data within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              We integrate with Shopify to access your store data. Please review Shopify's privacy 
              policy to understand how they handle your information. We do not sell your data to 
              any third parties.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Disconnect your Shopify store at any time</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-5 w-5 text-primary" />
              <a href="mailto:privacy@xsight.com" className="text-primary hover:underline">
                privacy@xsight.com
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} XSight. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
