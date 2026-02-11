-- Context Guardian - React Seed Data
-- Manually curated best practices for React (top priority library)

-- Insert React library metadata
INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'react',
    'npm',
    'https://react.dev',
    'https://github.com/facebook/react',
    'A JavaScript library for building user interfaces'
) ON CONFLICT (name) DO NOTHING;

-- Get the library ID for React (for use in subsequent inserts)
DO $$
DECLARE
    react_id UUID;
BEGIN
    SELECT id INTO react_id FROM libraries WHERE name = 'react';

    -- ========================================================================
    -- BEST PRACTICES
    -- ========================================================================

    -- React 18+ Concurrent Features
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
        'Use automatic batching in React 18+',
        'React 18 automatically batches state updates in event handlers, timeouts, and promises. You no longer need to wrap updates in unstable_batchedUpdates.',
        'performance',
        'medium',
        '>=18.0.0',
        E'// React 18+ - automatic batching\nfunction handleClick() {\n  setCount(c => c + 1);\n  setFlag(f => !f);\n  // Both updates batched automatically\n}',
        'https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
        'Avoid useId() in React versions below 18.3',
        'The useId() hook was added in React 18.3. If you''re on an earlier version, use a custom ID generation solution or upgrade.',
        'best-practice',
        'low',
        '>=18.0.0 <18.3.0',
        E'// Don''t use in React <18.3\n// const id = useId(); // ❌\n\n// Use custom solution instead\nconst id = useMemo(() => Math.random().toString(36), []);',
        'https://react.dev/reference/react/useId'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
        'Prefer useTransition for non-urgent updates',
        'Use startTransition to mark state updates as non-urgent, allowing React to keep the UI responsive during heavy renders.',
        'performance',
        'medium',
        '>=18.0.0',
        E'const [isPending, startTransition] = useTransition();\n\nfunction handleChange(value) {\n  startTransition(() => {\n    setSearchQuery(value); // Non-urgent update\n  });\n}',
        'https://react.dev/reference/react/useTransition'
    );

    -- React 17 and below
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
        'Avoid string refs (deprecated)',
        'String refs are deprecated and will be removed. Use callback refs or useRef instead.',
        'deprecation',
        'high',
        '<18.0.0',
        E'// ❌ Don''t use string refs\n<div ref="myDiv" />\n\n// ✅ Use callback ref or useRef\nconst myRef = useRef();\n<div ref={myRef} />',
        'https://react.dev/reference/react/Component#refs'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
        'Always use keys in lists',
        'When rendering lists, always provide a unique key prop to help React identify which items have changed, added, or removed.',
        'best-practice',
        'high',
        '>=16.0.0',
        E'// ✅ Good\nitems.map(item => <Item key={item.id} {...item} />)\n\n// ❌ Bad\nitems.map(item => <Item {...item} />)',
        'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key'
    );

    -- ========================================================================
    -- ANTI-PATTERNS
    -- ========================================================================

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        react_id,
        'Prop Drilling',
        'Passing props through multiple levels of components that don''t use them, just to reach a deeply nested child.',
        'Makes components tightly coupled, harder to refactor, and pollutes intermediate components with irrelevant props.',
        'Use Context API for global state, or component composition to avoid deep nesting.',
        '>=16.3.0',
        E'// ❌ Prop drilling\nfunction App() {\n  const user = {name: "Alice"};\n  return <Parent user={user} />;\n}\nfunction Parent({user}) {\n  return <Child user={user} />;\n}\nfunction Child({user}) {\n  return <GrandChild user={user} />;\n}',
        E'// ✅ Use Context\nconst UserContext = createContext();\n\nfunction App() {\n  const user = {name: "Alice"};\n  return (\n    <UserContext.Provider value={user}>\n      <Parent />\n    </UserContext.Provider>\n  );\n}\nfunction GrandChild() {\n  const user = useContext(UserContext);\n  return <div>{user.name}</div>;\n}',
        'https://react.dev/learn/passing-data-deeply-with-context'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        react_id,
        'Mutating State Directly',
        'Modifying state objects or arrays directly instead of creating new references.',
        'React relies on immutability to detect changes. Direct mutations won''t trigger re-renders.',
        'Always create new objects/arrays when updating state.',
        '>=16.0.0',
        E'// ❌ Mutating state\nconst [items, setItems] = useState([1, 2, 3]);\nitems.push(4); // Direct mutation\nsetItems(items); // Won''t re-render!',
        E'// ✅ Create new array\nconst [items, setItems] = useState([1, 2, 3]);\nsetItems([...items, 4]); // New reference',
        'https://react.dev/learn/updating-objects-in-state'
    );

    -- ========================================================================
    -- SECURITY ADVISORIES (Example)
    -- ========================================================================

    INSERT INTO security_advisories (library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)
    VALUES (
        react_id,
        'CVE-2024-EXAMPLE',
        'XSS vulnerability in dangerouslySetInnerHTML',
        'A cross-site scripting (XSS) vulnerability exists when using dangerouslySetInnerHTML with unsanitized user input. Always sanitize HTML before rendering.',
        'high',
        '>=16.0.0 <18.2.0',
        '18.2.0',
        'https://github.com/facebook/react/security/advisories',
        '2024-01-15 10:00:00+00'
    );

END $$;
