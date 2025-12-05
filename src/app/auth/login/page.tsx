'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [shop, setShop] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shop) {
      setError('Please enter your shop domain to log in');
      return;
    }

    // Validate shop domain
    const shopDomain = shop.includes('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop: shopDomain }),
      });

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to log in. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Log in</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="shop">Shop domain</label>
            <input
              id="shop"
              name="shop"
              type="text"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="example.myshopify.com"
              autoComplete="on"
            />
            <span className="hint">example.myshopify.com</span>
            {error && <span className="error">{error}</span>}
          </div>
          <button type="submit" className="submit-button">
            Log in
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .login-container {
          max-width: 400px;
          width: 100%;
          padding: 2rem;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        h1 {
          margin: 0 0 1.5rem;
          text-align: center;
        }
        .form-field {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }
        input:focus {
          outline: none;
          border-color: #008060;
          box-shadow: 0 0 0 2px rgba(0, 128, 96, 0.2);
        }
        .hint {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #666;
        }
        .error {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #d82c0d;
        }
        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #008060;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        .submit-button:hover {
          background-color: #006e52;
        }
      `}</style>
    </div>
  );
}
