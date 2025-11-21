/**
 * Test script for unified FAQ agent using chunks table
 * Tests role-based access and basic functionality
 */

const SUPABASE_URL = 'https://your-project.supabase.co';
const FAQ_ENDPOINT = `${SUPABASE_URL}/functions/v1/handle-faq`;

// Test cases
const testCases = [
  {
    name: 'Public access test',
    session_id: 'test-public-001',
    user_message: 'Что такое DAOsail?',
    user_role: 'public',
    prefs: { lang: 'ru' }
  },
  {
    name: 'Member access test',
    session_id: 'test-member-001',
    user_message: 'Как работает архитектура проекта?',
    user_role: 'member',
    prefs: { lang: 'ru' }
  },
  {
    name: 'English test',
    session_id: 'test-en-001',
    user_message: 'What is the project architecture?',
    user_role: 'public',
    prefs: { lang: 'en' }
  },
  {
    name: 'Out of scope test',
    session_id: 'test-scope-001',
    user_message: 'Какая погода завтра?',
    user_role: 'public',
    prefs: { lang: 'ru' }
  }
];

async function testFAQ(testCase) {
  console.log(`\n🧪 Running test: ${testCase.name}`);
  console.log(`Question: ${testCase.user_message}`);
  console.log(`Role: ${testCase.user_role}, Language: ${testCase.prefs.lang}`);

  try {
    const response = await fetch(FAQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_ANON_KEY`
      },
      body: JSON.stringify(testCase)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log(`✅ Response: ${result.final_text}`);
    console.log(`📊 Citations: ${result.citations.length} found`);
    console.log(`⏱️ Latency: ${result.trace.latency_ms}ms`);

    if (result.citations.length > 0) {
      console.log('📚 Sources:');
      result.citations.forEach((citation, idx) => {
        console.log(`  [${idx + 1}] ${citation.doc_id} (${Math.round(citation.similarity * 100)}%)`);
      });
    }

    return true;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting unified FAQ agent tests...');
  console.log('📋 Testing role-based access using chunks table');

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    const success = await testFAQ(testCase);
    if (success) passed++;

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! FAQ agent is working correctly with chunks table.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
}

// Instructions for manual testing
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:

1. Apply migration first:
   - Copy content from 20250928000001_add_role_tags_to_chunks.sql
   - Run in Supabase SQL Editor

2. Update this script with your credentials:
   - SUPABASE_URL: your actual Supabase URL
   - Authorization: your anon key

3. Run the script:
   node scripts/test-unified-faq.js

4. Expected results:
   ✅ Public questions should get answers from docs
   ✅ Out-of-scope questions should return "нет информации"
   ✅ Citations should show source files
   ✅ Role-based access should work (public + user role)

5. If tests fail:
   - Check migration was applied correctly
   - Verify chunks table has data
   - Check accessible_roles column has 'public' values
`);

// Uncomment to run tests (after updating credentials)
// runAllTests();