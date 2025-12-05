export default function AdditionalPage() {
  return (
    <div className="app-page">
      <header className="page-header">
        <h1>Additional page</h1>
      </header>

      <section className="section">
        <h2>Multiple pages</h2>
        <p>
          The app template comes with an additional page which demonstrates how
          to create multiple pages within app navigation using{' '}
          <a
            href="https://shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
            rel="noopener noreferrer"
          >
            App Bridge
          </a>
          .
        </p>
        <p>
          To create your own page and have it show up in the app navigation, add
          a page inside <code>src/app/app</code>, and a link to it in the{' '}
          <code>&lt;nav&gt;</code> component found in{' '}
          <code>src/app/app/layout.tsx</code>.
        </p>
      </section>

      <aside className="aside">
        <section className="section">
          <h2>Resources</h2>
          <ul>
            <li>
              <a
                href="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                target="_blank"
                rel="noopener noreferrer"
              >
                App nav best practices
              </a>
            </li>
          </ul>
        </section>
      </aside>

      <style jsx>{`
        .app-page {
          padding: 1rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-header h1 {
          margin: 0;
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
        code {
          background: #e4e5e7;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
        }
        a {
          color: #008060;
        }
        ul {
          padding-left: 1.5rem;
        }
        li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
