import { MarkdownFormatter, PlaybookInput } from '../src';
import * as fs from 'fs';

/**
 * Example: Generate a playbook from sample data
 */
function main() {
  console.log('📝 Generating sample playbook...\n');

  // Sample input data
  const input: PlaybookInput = {
    dependencies: [
      { name: 'react', version: '18.2.0' },
      { name: 'next', version: '14.0.0' },
      { name: 'zustand', version: '4.5.0' },
    ],
    patterns: {
      frameworks: ['React', 'Next.js'],
      stateManagement: ['Zustand'],
      componentStyle: 'functional',
      patterns: ['hooks', 'async', 'typescript'],
    },
    rules: [
      {
        id: 1,
        library_id: 1,
        type: 'security',
        title: 'Avoid dangerouslySetInnerHTML without sanitization',
        description:
          'Using dangerouslySetInnerHTML without sanitizing user input can lead to XSS attacks. Always sanitize HTML content before rendering.',
        category: 'security',
        severity: 'critical',
        code_example: `// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Good
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />`,
        source_url: 'https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html',
        library_name: 'react',
        min_version: '16.0.0',
      },
      {
        id: 2,
        library_id: 1,
        type: 'best_practice',
        title: 'Use React.memo for expensive components',
        description:
          'Wrap components that render frequently with React.memo to prevent unnecessary re-renders when props haven\'t changed.',
        category: 'performance',
        severity: 'high',
        code_example: `const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
  return <div>{data}</div>;
});`,
        source_url: 'https://react.dev/reference/react/memo',
        library_name: 'react',
        min_version: '16.6.0',
      },
      {
        id: 3,
        library_id: 2,
        type: 'best_practice',
        title: 'Use Next.js Image component for optimization',
        description:
          'The Next.js Image component automatically optimizes images for performance with lazy loading, responsive sizes, and modern formats.',
        category: 'performance',
        severity: 'medium',
        code_example: `import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Photo"
  width={500}
  height={300}
  priority={false}
/>`,
        source_url: 'https://nextjs.org/docs/app/api-reference/components/image',
        library_name: 'next',
        min_version: '10.0.0',
      },
      {
        id: 4,
        library_id: 3,
        type: 'best_practice',
        title: 'Keep Zustand stores small and focused',
        description:
          'Create multiple small stores instead of one large store for better performance and maintainability.',
        category: 'architecture',
        severity: 'low',
        library_name: 'zustand',
      },
    ],
    generatedAt: new Date().toISOString(),
    offline: false,
  };

  // Create formatter
  const formatter = new MarkdownFormatter();

  // Generate base playbook
  console.log('Generating base playbook...');
  const baseOutput = formatter.generate(input, {
    projectName: 'My Awesome App',
    projectType: 'web',
    cursorCompatible: false,
  });

  fs.writeFileSync('./examples/.guardian.md', baseOutput.markdown);
  console.log('✓ Saved to examples/.guardian.md');
  console.log(`  - ${baseOutput.metadata.ruleCount} rules`);
  console.log(`  - ${baseOutput.metadata.criticalCount} critical`);
  console.log(`  - ${baseOutput.metadata.securityCount} security\n`);

  // Generate Cursor-compatible playbook
  console.log('Generating Cursor-compatible playbook...');
  const cursorOutput = formatter.generate(input, {
    projectName: 'My Awesome App',
    cursorCompatible: true,
  });

  fs.writeFileSync('./examples/.cursorrules', cursorOutput.markdown);
  console.log('✓ Saved to examples/.cursorrules\n');

  // Generate offline mode example
  console.log('Generating offline mode playbook...');
  const offlineInput = { ...input, offline: true };
  const offlineOutput = formatter.generate(offlineInput, {
    projectName: 'My Awesome App',
  });

  fs.writeFileSync('./examples/.guardian-offline.md', offlineOutput.markdown);
  console.log('✓ Saved to examples/.guardian-offline.md\n');

  console.log('✅ All playbooks generated successfully!');
}

main();
