import { ASTAnalyzer } from '../src/index';
import * as path from 'path';

/**
 * Example: Analyze a React project and detect patterns
 */
async function main() {
  console.log('🔍 Context Guardian - AST Pattern Analyzer\n');

  const analyzer = new ASTAnalyzer();
  
  const projectPath = path.join(__dirname, 'sample-react-project/src');
  
  console.log(`Analyzing project: ${projectPath}\n`);

  try {
    const patterns = await analyzer.analyzeProject({
      rootDir: projectPath,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      excludeDirs: ['node_modules', 'dist', 'build', '.git'],
      maxFiles: 100,
    });

    console.log('✅ Analysis complete!\n');
    console.log('Detected Patterns:');
    console.log('─'.repeat(60));
    
    if (patterns.stateManagement) {
      console.log(`\n📦 State Management: ${patterns.stateManagement}`);
    }
    
    if (patterns.componentStyle) {
      console.log(`🎨 Component Style: ${patterns.componentStyle}`);
    }
    
    if (patterns.frameworks.length > 0) {
      console.log(`\n🚀 Frameworks:`);
      patterns.frameworks.forEach(fw => console.log(`  - ${fw}`));
    }
    
    console.log(`\n💡 Coding Patterns:`);
    console.log(`  - Uses Hooks: ${patterns.patterns.usesHooks ? '✓' : '✗'}`);
    console.log(`  - Uses Async/Await: ${patterns.patterns.usesAsync ? '✓' : '✗'}`);
    console.log(`  - Uses TypeScript: ${patterns.patterns.usesTypeScript ? '✓' : '✗'}`);
    console.log(`  - Uses JSX: ${patterns.patterns.usesJSX ? '✓' : '✗'}`);
    
    if (patterns.commonImports.length > 0) {
      console.log(`\n📂 Common Internal Imports:`);
      patterns.commonImports.slice(0, 5).forEach(imp => console.log(`  - ${imp}`));
    }

    console.log('\n' + '─'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
