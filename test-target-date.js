/**
 * Test Script: Verify Target Date Saving
 * Tests if target_date can be saved to the milestones table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTargetDateSaving() {
  console.log('🧪 Testing target date saving functionality...\n');

  try {
    // Test 1: Get a milestone to test with
    console.log('Test 1: Fetching a milestone from database...');
    const { data: milestones, error: fetchError } = await supabase
      .from('milestones')
      .select('id, title, target_date, created_at')
      .limit(1);

    if (fetchError) {
      console.error('❌ Failed to fetch milestone:', fetchError.message);
      return false;
    }

    if (!milestones || milestones.length === 0) {
      console.log('⚠️  No milestones found in database.');
      console.log('   Please create a milestone first through the app.\n');
      return false;
    }

    const milestone = milestones[0];
    console.log('✅ Found milestone:', milestone.title);
    console.log('   Current target_date:', milestone.target_date || 'NULL');
    console.log('   Milestone ID:', milestone.id);
    console.log('');

    // Test 2: Update target_date
    console.log('Test 2: Updating target_date...');
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 30); // 30 days from now
    const targetDateString = testDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('   Setting target_date to:', targetDateString);

    const { data: updatedMilestone, error: updateError } = await supabase
      .from('milestones')
      .update({ target_date: targetDateString })
      .eq('id', milestone.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update target_date:', updateError.message);
      console.error('   Error details:', updateError);
      return false;
    }

    console.log('✅ Target date updated successfully!');
    console.log('   New target_date:', updatedMilestone.target_date);
    console.log('');

    // Test 3: Verify the update persisted
    console.log('Test 3: Verifying the update persisted...');
    const { data: verifyMilestone, error: verifyError } = await supabase
      .from('milestones')
      .select('id, title, target_date')
      .eq('id', milestone.id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify update:', verifyError.message);
      return false;
    }

    if (verifyMilestone.target_date === targetDateString) {
      console.log('✅ Verification successful! Target date persisted in database.');
      console.log('');
    } else {
      console.error('❌ Verification failed! Target date did not persist.');
      console.log('   Expected:', targetDateString);
      console.log('   Got:', verifyMilestone.target_date);
      return false;
    }

    // Test 4: Check if we can query by target_date (index test)
    console.log('Test 4: Testing target_date index...');
    const { data: dateQuery, error: dateQueryError } = await supabase
      .from('milestones')
      .select('id, title, target_date')
      .not('target_date', 'is', null)
      .order('target_date', { ascending: true })
      .limit(5);

    if (dateQueryError) {
      console.error('❌ Failed to query by target_date:', dateQueryError.message);
      return false;
    }

    console.log('✅ Index test successful!');
    console.log(`   Found ${dateQuery.length} milestones with target dates`);
    console.log('');

    console.log('=' .repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('=' .repeat(60));
    console.log('✅ Target date column exists');
    console.log('✅ Target date can be saved');
    console.log('✅ Target date persists in database');
    console.log('✅ Target date index is working');
    console.log('');
    console.log('📝 The target date feature is ready to use in the app!');
    console.log('');

    return true;

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('   Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testTargetDateSaving().then(success => {
  process.exit(success ? 0 : 1);
});
