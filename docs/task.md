Xeno FDE Internship Assignment – 2025
Hi there! 👋
Thanks for applying to the Forward Deployed Engineer (FDE) Internship position at Xeno.
We’re excited to get to know you through this hands-on assignment that reflects the kind of
customer-facing engineering challenges our FDEs solve every day.

🚀 Assignment Goal
Build a multi-tenant Shopify Data Ingestion & Insights Service that simulates how Xeno
helps enterprise retailers onboard, integrate, and analyze their customer data.

📌 Scope of Work
✅ 1. Shopify Store Setup
● Create a free Shopify development store.
● Add dummy products, customers, and orders to it.

✅ 2. Data Ingestion Service
● Build a service that connects to Shopify APIs (Or other way round where your APIs are
hit by Shopify) and ingests:
○ Customers
○ Orders
○ Products
○ (Bonus) Custom events like cart abandoned, checkout started

● Store this data into your database (Use any RDBMS here as we’d ask SQL questions on
this during interviews)
● Ensure the service can be configured for multiple tenants (stores), with data isolated
using a tenant identifier.
Reference links for Shopify integration documentation
https://github.com/Shopify/shopify-app-template-remix
https://shopify.dev/docs/apps/build/cli-for-apps

✅ 3. Insights Dashboard
● Create a simple UI (backed by email authentication) to visualize ingested data like:
○ Total customers, orders, and revenue.
○ Orders by date (with date range filtering).
○ Top 5 customers by spend.
● Add different metrics and their trend charts to reflect business performance - go creative!

✅ 4. Documentation (2–3 Pages)
● Assumptions you made.
● High-level architecture diagram.
● APIs and data models used.
● Next steps to productionize your solution.

✅ Other asks

● Deploy the service (Heroku, Render, Railway, Vercel).
● Add a scheduler or webhooks to keep Shopify data in sync.
● Use an ORM (Sequelize, Prisma, Hibernate) for cleaner multi-tenant handling.
● Add basic authentication for tenant onboarding.

️ Preferred Tech Stack
● Backend: Node.js (Express.js) or Java (Spring Boot)
● Frontend: React.js or Next.js
● Database: MySQL or PostgreSQL
● Optional: Redis / RabbitMQ for async ingestion
● Optional: Charting library (Recharts, Chart.js or anything else) for dashboards

🧪 Evaluation Criteria
We’ll be assessing on:
● Problem Solving: Did you structure the solution to handle real-world complexity
(multi-tenancy, data sync)?
● Engineering Fluency: API integrations, DB schema design, and working dashboard.
● Communication: Clarity of documentation and demo explanation (Mandatory - In your
own voice and video).
● Ownership & Hustle: Completeness, deployability, and overall polish.

📦 Submission Requirements
✅ Public GitHub repo with clean, well-structured code.
✅ Deployed service (Heroku, Render, Railway, or Vercel).
✅ Demo video (max 7 mins) in your own voice and video explaining:
● Features implemented.
● How you approached the problem.
● Any trade-offs made.
✅ README.md including:
● Setup instructions.
● Architecture diagram.
● API endpoints and DB schema.
● Known limitations or assumptions.

✨ Let’s Go!
Curious what it’s like working with us? Check out what our past interns have to say 👀
This is your chance to show not just what you know — but how you integrate, adapt, and
deliver in real-world messy environments.
We’re excited to see what you build! 🚀
Check us out at: https://www.getxeno.com