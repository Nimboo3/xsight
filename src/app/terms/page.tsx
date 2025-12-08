'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
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
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-600">Last updated: December 8, 2025</p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using XSight ("Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              XSight is a customer intelligence platform that connects to your Shopify store to provide 
              analytics, customer segmentation, and insights. The Service includes data synchronization, 
              RFM analysis, segment building, and dashboard visualizations.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">To use the Service, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account with a valid email address</li>
                <li>Be the authorized owner or administrator of the Shopify store you connect</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Shopify Integration</h2>
            <p className="text-gray-600 leading-relaxed">
              By connecting your Shopify store, you authorize XSight to access your store data including 
              customers, orders, and products. You represent that you have the necessary rights and 
              permissions to grant this access. You can revoke access at any time by disconnecting your 
              store from our Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use automated tools to scrape or access the Service</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Ownership</h2>
            <p className="text-gray-600 leading-relaxed">
              You retain all ownership rights to your Shopify store data. XSight only uses your data 
              to provide the Service. We do not claim ownership of your data and will not share it with 
              third parties without your consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
            <p className="text-gray-600 leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted access to the 
              Service. We may temporarily suspend access for maintenance, upgrades, or due to 
              circumstances beyond our control.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, XSIGHT SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, 
              OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              You may terminate your account at any time. We reserve the right to suspend or terminate 
              your access if you violate these terms. Upon termination, your data will be deleted in 
              accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these Terms from time to time. We will notify you of significant changes 
              via email or through the Service. Continued use of the Service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-5 w-5 text-primary" />
              <a href="mailto:legal@xsight.com" className="text-primary hover:underline">
                legal@xsight.com
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
