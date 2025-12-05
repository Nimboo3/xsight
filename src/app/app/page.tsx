'use client';

import { useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

interface ProductData {
  product: {
    id: string;
    title: string;
    handle: string;
    status: string;
    variants: {
      edges: Array<{
        node: {
          id: string;
          price: string;
          barcode: string;
          createdAt: string;
        };
      }>;
    };
  };
  variant?: Array<{
    id: string;
    price: string;
    barcode: string;
    createdAt: string;
  }>;
}

export default function AppIndexPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  
  let shopify: any;
  try {
    shopify = useAppBridge();
  } catch {
    shopify = null;
  }

  useEffect(() => {
    if (productData?.product?.id && shopify) {
      shopify.toast.show('Product created');
    }
  }, [productData?.product?.id, shopify]);

  const generateProduct = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop': new URLSearchParams(window.location.search).get('shop') || '',
        },
      });
      const data = await response.json();
      setProductData(data);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const editProduct = () => {
    if (shopify && productData?.product?.id) {
      shopify.intents.invoke?.('edit:shopify/Product', {
        value: productData.product.id,
      });
    }
  };

  return (
    <div className="app-page">
      <header className="page-header">
        <h1>Shopify app template</h1>
        <button className="primary-button" onClick={generateProduct}>
          Generate a product
        </button>
      </header>

      <section className="section">
        <h2>Congrats on creating a new Shopify app 🎉</h2>
        <p>
          This embedded app template uses{' '}
          <a
            href="https://shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
            rel="noopener noreferrer"
          >
            App Bridge
          </a>{' '}
          interface examples like an{' '}
          <a href="/app/additional">additional page in the app nav</a>, as well
          as an{' '}
          <a
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
            rel="noopener noreferrer"
          >
            Admin GraphQL
          </a>{' '}
          mutation demo, to provide a starting point for app development.
        </p>
      </section>

      <section className="section">
        <h2>Get started with products</h2>
        <p>
          Generate a product with GraphQL and get the JSON output for that
          product. Learn more about the{' '}
          <a
            href="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
            target="_blank"
            rel="noopener noreferrer"
          >
            productCreate
          </a>{' '}
          mutation in our API references.
        </p>
        <div className="button-group">
          <button
            className="button"
            onClick={generateProduct}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Generate a product'}
          </button>
          {productData?.product && (
            <button className="button secondary" onClick={editProduct}>
              Edit product
            </button>
          )}
        </div>

        {productData?.product && (
          <div className="output-section">
            <h3>productCreate mutation</h3>
            <div className="code-box">
              <pre>
                <code>{JSON.stringify(productData.product, null, 2)}</code>
              </pre>
            </div>

            {productData.variant && (
              <>
                <h3>productVariantsBulkUpdate mutation</h3>
                <div className="code-box">
                  <pre>
                    <code>{JSON.stringify(productData.variant, null, 2)}</code>
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <aside className="aside">
        <section className="section">
          <h2>App template specs</h2>
          <p>
            <span>Framework: </span>
            <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer">
              Next.js 14 (App Router)
            </a>
          </p>
          <p>
            <span>Backend: </span>
            <a href="https://expressjs.com/" target="_blank" rel="noopener noreferrer">
              Express.js
            </a>
          </p>
          <p>
            <span>Database: </span>
            <a href="https://www.prisma.io/" target="_blank" rel="noopener noreferrer">
              Prisma + PostgreSQL
            </a>
          </p>
        </section>
      </aside>

      <style jsx>{`
        .app-page {
          padding: 1rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .page-header h1 {
          margin: 0;
        }
        .primary-button {
          background-color: #008060;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .primary-button:hover {
          background-color: #006e52;
        }
        .section {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f6f6f7;
          border-radius: 8px;
        }
        .section h2 {
          margin-top: 0;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .button {
          background-color: #008060;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .button:hover {
          background-color: #006e52;
        }
        .button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .button.secondary {
          background-color: transparent;
          color: #008060;
          border: 1px solid #008060;
        }
        .button.secondary:hover {
          background-color: #f0fdf9;
        }
        .output-section {
          margin-top: 1.5rem;
        }
        .output-section h3 {
          margin-bottom: 0.5rem;
        }
        .code-box {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        .code-box pre {
          margin: 0;
        }
        .aside {
          margin-top: 2rem;
        }
        a {
          color: #008060;
        }
      `}</style>
    </div>
  );
}
