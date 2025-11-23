/**
 * Supabase Migration Runner
 * Applies the roadmap-task integration migration to the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_task_roadmap_phase_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 Supabase URL:', supabaseUrl);
    console.log('\n⚠️  NOTE: This script uses the anon key, which may not have permissions to run DDL statements.');
    console.log('    If migration fails, please run the SQL manually in Supabase SQL Editor.\n');

    // Try to execute the migration
    console.log('🔄 Executing migration SQL...\n');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Supabase JS client doesn't support DDL, so we'll use the REST API
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`   ❌ Error:`, error.message);
          failCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error:`, err.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${failCount}`);
    console.log('='.repeat(60) + '\n');

    if (failCount > 0) {
      console.log('⚠️  Some statements failed. This is expected with the anon key.');
      console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:');
      console.log('1. Go to: https://app.supabase.com/project/djguquclcyhwqijnobcp/sql/new');
      console.log('2. Copy the contents of: migrations/add_task_roadmap_phase_columns.sql');
      console.log('3. Paste into the SQL Editor');
      console.log('4. Click "Run" to execute the migration\n');
    } else {
      console.log('🎉 Migration completed successfully!\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:');
    console.log('1. Go to: https://app.supabase.com/project/djguquclcyhwqijnobcp/sql/new');
    console.log('2. Copy the contents of: migrations/add_task_roadmap_phase_columns.sql');
    console.log('3. Paste into the SQL Editor');
    console.log('4. Click "Run" to execute the migration\n');
    process.exit(1);
  }
}

// Run the migration
runMigration();
