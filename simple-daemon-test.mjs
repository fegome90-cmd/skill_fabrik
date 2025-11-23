import { createApp } from './packages/daemon/dist/app.js';

async function testDaemon() {
  try {
    console.log('🚀 Starting daemon...');
    const app = await createApp();
    
    console.log('✅ Daemon created successfully');
    
    // Test the routes that were causing issues
    console.log('📊 Testing routes that might have duplication...');
    
    // Test /metrics route
    try {
      console.log('Testing /metrics route...');
      const metricsResponse = await app.inject({ method: 'GET', url: '/metrics' });
      console.log('✅ /metrics route works (status:', metricsResponse.statusCode, ')');
    } catch (e) {
      console.log('❌ /metrics route failed:', e.message);
      if (e.code === 'FST_ERR_DUPLICATED_ROUTE') {
        console.log('🎯 Found the route duplication issue!');
      }
    }
    
    // Test /metrics/system route  
    try {
      console.log('Testing /metrics/system route...');
      const metricsSystemResponse = await app.inject({ method: 'GET', url: '/metrics/system' });
      console.log('✅ /metrics/system route works (status:', metricsSystemResponse.statusCode, ')');
    } catch (e) {
      console.log('❌ /metrics/system route failed:', e.message);
      if (e.code === 'FST_ERR_DUPLICATED_ROUTE') {
        console.log('🎯 Found the route duplication issue!');
      }
    }
    
    console.log('🎉 Route testing completed!');
    
    // Close app
    await app.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Daemon test failed:', error.message);
    if (error.code === 'FST_ERR_DUPLICATED_ROUTE') {
      console.log('🎯 Route duplication confirmed:', error.message);
    }
    process.exit(1);
  }
}

testDaemon();
