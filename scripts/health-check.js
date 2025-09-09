#!/usr/bin/env node

/**
 * Health Check Script for Bay Area Cleaning Pros Multi-Host Setup
 * 
 * This script tests all health endpoints across different hosts to ensure
 * the multi-host routing is working correctly.
 * 
 * Usage: npm run health-check
 */

const https = require('https');
const http = require('http');

// Health endpoints to test
const HEALTH_ENDPOINTS = [
  {
    name: 'Admin Portal',
    url: 'https://admin.bayareacleaningpros.com/health/admin',
    fallback: 'http://localhost:8080/health/admin'
  },
  {
    name: 'Booking Portal',
    url: 'https://book.bayareacleaningpros.com/health/book',
    fallback: 'http://localhost:8080/health/book'
  },
  {
    name: 'Contractor Portal',
    url: 'https://contractor.bayareacleaningpros.com/health/sub',
    fallback: 'http://localhost:8080/health/sub'
  },
  {
    name: 'Customer Portal',
    url: 'https://portal.bayareacleaningpros.com/health/portal',
    fallback: 'http://localhost:8080/health/portal'
  }
];

/**
 * Make HTTP request and return promise
 */
function makeRequest(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const request = client.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Health-Check-Script/1.0'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          success: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode,
          data: data,
          url: url
        });
      });
    });
    
    request.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        url: url
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        url: url
      });
    });
  });
}

/**
 * Test a single endpoint with fallback
 */
async function testEndpoint(endpoint) {
  console.log(`Testing ${endpoint.name}...`);
  
  // Try production URL first
  let result = await makeRequest(endpoint.url);
  
  // If production fails, try localhost fallback
  if (!result.success && endpoint.fallback) {
    console.log(`  Production failed, trying localhost...`);
    result = await makeRequest(endpoint.fallback);
    result.isLocalhost = true;
  }
  
  return { ...result, name: endpoint.name };
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  console.log('🏥 Bay Area Cleaning Pros - Multi-Host Health Check');
  console.log('================================================\n');
  
  const results = [];
  
  // Test all endpoints
  for (const endpoint of HEALTH_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      const hostType = result.isLocalhost ? '(localhost)' : '(production)';
      console.log(`✅ ${result.name} ${hostType}`);
      console.log(`   Status: ${result.statusCode}`);
    } else {
      console.log(`❌ ${result.name}`);
      console.log(`   Error: ${result.error || 'HTTP ' + result.statusCode}`);
      console.log(`   URL: ${result.url}`);
    }
    console.log('');
  }
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('Summary:');
  console.log(`${successCount}/${totalCount} endpoints healthy`);
  
  if (successCount === totalCount) {
    console.log('🎉 All systems operational!');
    process.exit(0);
  } else {
    console.log('⚠️  Some endpoints are down. Check DNS and deployment status.');
    process.exit(1);
  }
}

// Run the health check
if (require.main === module) {
  runHealthCheck().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, testEndpoint };