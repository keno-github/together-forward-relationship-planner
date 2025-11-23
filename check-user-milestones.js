// Script to check milestones for user with email newuser@mail.com
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkUserMilestones() {
  try {
    console.log('🔍 Searching for user with email: newuser@mail.com\n');

    // First, get the user from auth.users table (need service role for this)
    // Since we only have anon key, let's query roadmaps and join with users
    const { data: roadmaps, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .order('created_at', { ascending: false });

    if (roadmapError) {
      console.error('Error fetching roadmaps:', roadmapError);
      return;
    }

    console.log(`📊 Found ${roadmaps.length} total roadmaps in database\n`);

    // For each roadmap, get milestones
    for (const roadmap of roadmaps) {
      const { data: milestones, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('roadmap_id', roadmap.id)
        .order('order_index', { ascending: true });

      if (!milestoneError && milestones.length > 0) {
        console.log(`\n📋 Roadmap: ${roadmap.title || 'Untitled'} (ID: ${roadmap.id})`);
        console.log(`   User ID: ${roadmap.user_id}`);
        console.log(`   Created: ${new Date(roadmap.created_at).toLocaleString()}`);
        console.log(`   Milestones (${milestones.length}):`);
        milestones.forEach((m, idx) => {
          console.log(`     ${idx + 1}. ${m.title} (ID: ${m.id})`);
          if (m.budget_amount) console.log(`        Budget: $${m.budget_amount}`);
        });
      }
    }

    console.log('\n\n🎯 Summary:');
    console.log('To identify the correct user, please check the Supabase dashboard');
    console.log('or provide the user_id if you know it.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserMilestones();
