'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [shop, setShop] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shop) {
      // Redirect to auth endpoint
      window.location.href = `/api/auth?shop=${encodeURIComponent(shop)}`;
    }
  };

  return (
    <div className="index">
      <div className="content">
        <h1 className="heading">A short heading about [your app]</h1>
        <p className="text">
          A tagline about [your app] that describes your value proposition.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            <span>Shop domain</span>
            <input
              className="input"
              type="text"
              name="shop"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="my-shop-domain.myshopify.com"
            />
            <span>e.g: my-shop-domain.myshopify.com</span>
          </label>
          <button className="button" type="submit">
            Log in
          </button>
        </form>
        <ul className="list">
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
        </ul>
      </div>
    </div>
  );
}
