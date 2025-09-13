/**
 * Simple test script to verify API endpoints
 * Run with: node test-api.js
 * Make sure to start the dev server first: vercel dev
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing AI Customer Support Chatbot API...\n');

  try {
    // Test 1: Knowledge Base - Get all entries
    console.log('1. Testing GET /api/knowledge');
    const knowledgeResponse = await fetch(`${BASE_URL}/api/knowledge`);
    const knowledgeData = await knowledgeResponse.json();
    console.log(`✅ Status: ${knowledgeResponse.status}`);
    console.log(`📊 Found ${knowledgeData.entries?.length || 0} knowledge entries\n`);

    // Test 2: Knowledge Base - Search
    console.log('2. Testing GET /api/knowledge/search?q=pricing');
    const searchResponse = await fetch(`${BASE_URL}/api/knowledge/search?q=pricing`);
    const searchData = await searchResponse.json();
    console.log(`✅ Status: ${searchResponse.status}`);
    console.log(`🔍 Search results: ${searchData.results?.length || 0} entries\n`);

    // Test 3: Knowledge Base - Create new entry
    console.log('3. Testing POST /api/knowledge (create entry)');
    const createResponse = await fetch(`${BASE_URL}/api/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'Test Entry',
        value: 'This is a test entry created by the API test script.',
        tags: ['test', 'api']
      })
    });
    const createData = await createResponse.json();
    console.log(`✅ Status: ${createResponse.status}`);
    console.log(`📝 Created entry ID: ${createData.entry?.id}\n`);

    // Test 4: Chat API (will fail without GEMINI_API_KEY)
    console.log('4. Testing POST /api/chat');
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What are your pricing rates?',
        sessionId: 'test-session'
      })
    });
    const chatData = await chatResponse.json();
    console.log(`Status: ${chatResponse.status}`);
    
    if (chatResponse.status === 200) {
      console.log(`✅ Chat response received`);
      console.log(`🤖 Model used: ${chatData.modelUsed}`);
      console.log(`💬 Response preview: ${chatData.response?.substring(0, 100)}...`);
    } else {
      console.log(`⚠️  Chat API error (expected if GEMINI_API_KEY not set):`);
      console.log(`   ${chatData.message}`);
    }

    console.log('\n🎉 API testing completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Set GEMINI_API_KEY in .env.local for chat functionality');
    console.log('   2. Build the frontend chat interface');
    console.log('   3. Deploy to Vercel');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure to:');
    console.log('   1. Start the dev server: vercel dev');
    console.log('   2. Install dependencies: npm install');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with built-in fetch support');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

testAPI();