-- Context Guardian - Next.js Seed Data
-- Manually curated best practices for Next.js

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'next',
    'npm',
    'https://nextjs.org/docs',
    'https://github.com/vercel/next.js',
    'The React Framework for Production'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    next_id UUID;
BEGIN
    SELECT id INTO next_id FROM libraries WHERE name = 'next';

    -- App Router (Next.js 13+)
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        next_id,
        'Use Server Components by default in App Router',
        'In Next.js 13+ App Router, components are Server Components by default. Only add "use client" when you need interactivity, browser APIs, or hooks.',
        'performance',
        'high',
        '>=13.0.0',
        E'// ✅ Server Component (default)\nexport default function Page() {\n  const data = await fetchData(); // Can fetch directly\n  return <div>{data}</div>;\n}\n\n// Only use "use client" when needed\n"use client";\nexport function InteractiveButton() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}',
        'https://nextjs.org/docs/app/building-your-application/rendering/server-components'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        next_id,
        'Avoid mixing Pages Router and App Router patterns',
        'Next.js 13+ supports both routers, but mixing them creates confusion. Choose one routing paradigm per project.',
        'maintainability',
        'medium',
        '>=13.0.0',
        E'// ❌ Don''t mix\n// /pages/index.js (Pages Router)\n// /app/about/page.js (App Router)\n\n// ✅ Pick one\n// Either use /app for everything (recommended)\n// Or stay on /pages until ready to migrate',
        'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration'
    );

    -- Pages Router (Next.js 12 and below)
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        next_id,
        'Use getStaticProps for static generation',
        'For pages that can be pre-rendered at build time, use getStaticProps instead of getServerSideProps to improve performance.',
        'performance',
        'high',
        '>=9.3.0 <13.0.0',
        E'export async function getStaticProps() {\n  const data = await fetchData();\n  return { props: { data }, revalidate: 60 };\n}',
        'https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props'
    );

    -- Anti-patterns
    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        next_id,
        'Client-side data fetching in Server Components',
        'Using useEffect to fetch data in a Server Component (App Router).',
        'Server Components can fetch data directly during render. Using useEffect forces client-side fetching, losing SSR benefits.',
        'Fetch data directly in the Server Component using async/await.',
        '>=13.0.0',
        E'// ❌ Don''t use useEffect in Server Components\n"use client";\nexport default function Page() {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch("/api/data").then(r => r.json()).then(setData);\n  }, []);\n  return <div>{data}</div>;\n}',
        E'// ✅ Fetch directly (Server Component)\nexport default async function Page() {\n  const data = await fetch("/api/data").then(r => r.json());\n  return <div>{data}</div>;\n}',
        'https://nextjs.org/docs/app/building-your-application/data-fetching/fetching'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        next_id,
        'Not optimizing images with next/image',
        'Using standard <img> tags instead of Next.js Image component.',
        'Misses automatic optimization, lazy loading, and responsive sizing. Hurts performance and Core Web Vitals.',
        'Use next/image for all images.',
        '>=10.0.0',
        E'// ❌ Standard img tag\n<img src="/photo.jpg" alt="Photo" />',
        E'// ✅ Use next/image\nimport Image from "next/image";\n<Image src="/photo.jpg" alt="Photo" width={500} height={300} />',
        'https://nextjs.org/docs/app/building-your-application/optimizing/images'
    );

END $$;
