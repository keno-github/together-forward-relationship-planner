// Script to clear localStorage cache
// This will force the app to reload data from database

console.log('🧹 Clearing localStorage cache...\n');

// List all items before clearing
console.log('📦 Current localStorage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`   - ${key}`);
}

console.log('\n🗑️ Clearing all localStorage...');
localStorage.clear();

console.log('✅ localStorage cleared!');
console.log('\n💡 Please refresh the page to reload data from database.');
