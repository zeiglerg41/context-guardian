import { analyzeDependencies } from '../src/index';
import * as path from 'path';

/**
 * Example: Parse dependencies from a project directory
 * 
 * Usage:
 *   npm run example
 * 
 * This will analyze the example-projects directory
 */

function main() {
  console.log('🔍 Context Guardian - Dependency Parser Example\n');

  // You can change this to any project path
  const projectPath = process.argv[2] || path.join(__dirname, '../examples/example-projects/react-app');

  console.log(`Analyzing project: ${projectPath}\n`);

  try {
    const manifest = analyzeDependencies(projectPath);

    console.log('✅ Analysis complete!\n');
    console.log('Package Manager:', manifest.packageManager);
    
    if (manifest.projectName) {
      console.log('Project Name:', manifest.projectName);
    }
    
    if (manifest.projectVersion) {
      console.log('Project Version:', manifest.projectVersion);
    }

    console.log('\nDependencies:');
    console.log('─'.repeat(60));

    const prodDeps = manifest.dependencies.filter(d => !d.isDev);
    const devDeps = manifest.dependencies.filter(d => d.isDev);

    if (prodDeps.length > 0) {
      console.log('\n📦 Production Dependencies:');
      prodDeps.forEach(dep => {
        console.log(`  ${dep.name.padEnd(30)} ${dep.version}`);
      });
    }

    if (devDeps.length > 0) {
      console.log('\n🛠️  Dev Dependencies:');
      devDeps.forEach(dep => {
        console.log(`  ${dep.name.padEnd(30)} ${dep.version}`);
      });
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`Total: ${manifest.dependencies.length} dependencies`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
