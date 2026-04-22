# Testing Infrastructure Guide

> Comprehensive guide to testing practices, infrastructure, and quality standards for Blocklet Server

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Testing Frameworks](#testing-frameworks)
- [Test Organization](#test-organization)
- [Test Configuration](#test-configuration)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Quality Standards](#quality-standards)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Blocklet Server uses a **multi-layered testing infrastructure** built around:

- **Bun Test** - Primary test runner for unit and integration tests
- **Cypress** - End-to-end testing framework
- **GitHub Actions** - CI/CD automation

### Test Statistics

- **442 unit test files** across 31 directories
- **15+ E2E test suites** covering full user workflows
- **Process isolation** for test reliability
- **Intelligent categorization** for optimal execution

### Quality Targets

| Metric | Target | Status |
|--------|--------|--------|
| Flaky test ratio | < 1% | 🟡 In progress |
| Single file execution | < 15s | 🟡 Monitoring |
| CI execution time | < 3min | 🟢 Achieved |
| New code coverage | ≥ 80% | 🔴 Tracking disabled |
| Mock usage rate | ≥ 90% | 🟡 ~70% estimated |

## Quick Start

### Running Tests Locally

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (specific package)
cd core/util
bun test --watch

# Run E2E tests
npm run e2e

# Run tests with retry (CI simulation)
npm run test --retry=3

# Run specific test categories
npm run test:fast    # Fast tests only
npm run test:slow    # Slow tests only
```

### Running Specific Tests

```bash
# Run single test file
bun test path/to/test.spec.js

# Run tests matching pattern
bun test --grep "authentication"

# Run with increased timeout
bun test --timeout 120000
```

## Testing Frameworks

### Bun Test (Primary)

**Location**: `tools/bun-test-isolated.js` (541 lines)

Bun Test is our primary test runner, chosen for:
- Native TypeScript support
- Fast execution (built-in V8)
- Process isolation
- Built-in mocking capabilities

**Key Features**:
- Each test file runs in isolated process
- Automatic test categorization by naming
- Parallel execution optimized for CPU cores
- Signal handling for graceful shutdown

**Test API**:
```javascript
import { test, describe, expect, mock, beforeEach, afterAll } from 'bun:test';

describe('Feature Name', () => {
  let mockFn;

  beforeEach(() => {
    mockFn = mock();
  });

  test('should do something', async () => {
    mockFn.mockResolvedValue({ success: true });
    const result = await myFunction(mockFn);
    expect(result).toEqual({ success: true });
    expect(mockFn).toHaveBeenCalledWith(expectedArgs);
  });

  afterAll(() => {
    mock.restore();
    mock.clearAllMocks();
  });
});
```

### Cypress (E2E)

**Location**: `core/webapp/cypress/`

Cypress provides end-to-end testing with:
- Real browser automation
- Time-travel debugging
- Automatic waiting
- Network stubbing
- Screenshot/video capture

**Configuration**:
```javascript
// cypress.config.js
{
  viewportWidth: 1400,
  viewportHeight: 1000,
  defaultCommandTimeout: 40000,
  video: process.env.E2E_ENABLE_VIDEO === 'true',
  env: {
    FAIL_FAST_STRATEGY: 'run',
    FAIL_FAST_BAIL: 1
  }
}
```

## Test Organization

### File Naming Conventions

Tests are automatically categorized by filename:

| Pattern | Category | Execution | Timeout | Concurrency |
|---------|----------|-----------|---------|-------------|
| `*.first-spec.js` | Priority | Serial | 60s | 1 |
| `*.spawn-spec.js` | Process spawn | Serial | 60s | 1 |
| `serial/*.spec.js` | Serial tests | Serial | 60s | 1 |
| `*.spec.js` | Normal tests | Parallel | 60s | CPU-2 |
| `*.browser-spec.js` | Browser tests | Parallel | 60s | CPU-2 |
| `*.slow-spec.js` | Slow tests | Parallel | 600s | 2 |

**Shared resource tests** (special handling):
```
blocklet/manager/disk-*.spec.js  (except disk-blue-green)
// These share port 9090 and run serially
```

### Directory Structure

```
blocklet/
├── meta/tests/              # Metadata parsing & validation
├── node-sdk/tests/          # Backend SDK tests
├── js-sdk/src/libs/*.spec.ts # Frontend SDK (embedded)
├── images/tests/            # Image validation tests
└── store/tests/             # Store integration tests

core/
├── util/tests/              # 63 utility test files
├── models/tests/            # Database model tests
├── auth/tests/              # Authentication tests
├── blocklet-services/tests/ # Service integration tests
└── webapp/
    ├── cypress/e2e/         # E2E test suites
    └── src/__tests__/       # Component tests

tools/
├── bun-test-isolated.js     # Test orchestrator
├── bun-test-worker.js       # Worker execution
└── bun-test-preload.js      # Global test setup
```

### E2E Test Suite Organization

E2E tests use numerical prefixes for execution order:

```
00-node-setup.cy.js                  # Setup & initialization
01-did-dns.cy.js                     # DID & DNS resolution
02-blocklet-list.cy.js               # Blocklet discovery
03-blocklet-lifecycle.cy.js          # Start/stop/manage
04-node-routing.cy.js                # Node routing
05-node-team.cy.js                   # Team management
06-blocklet-routing.cy.js            # Per-blocklet routing
07-blocklet-config.cy.js             # Configuration UI
08-router-add-certificate.cy.js      # SSL/TLS management
09-node-setting-basic.cy.js          # Node settings
10-node-setting-integrations.cy.js   # Integration settings
11-node-setting-access-keys.cy.js    # Access key management
12-node-setting-audit-logs.cy.js     # Audit log viewing
13-node-logs-monitor.cy.js           # Log monitoring
14-node-notifications.cy.js          # Notification system
15-launch-free-with-session.cy.js    # Launch flow
```

## Test Configuration

### Unit Test Configuration

**Global Environment** (`tools/bun-test-preload.js`):

```javascript
// Environment setup
process.env.NODE_ENV = 'test';
process.env.ABT_NODE_HOME = path.join(os.homedir(), '.arcblock');
process.env.PM2_HOME = path.join(process.env.ABT_NODE_HOME, 'abtnode-test');

// Mock external dependencies
mock.module('@aigne/aigne-hub', () => ({
  AIGNEHubChatModel: mock(),
}));

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
```

**Execution Parameters**:
```javascript
{
  timeout: 60000,              // 60 seconds
  bail: true,                  // Stop on first failure
  concurrency: Math.max(1, Math.min(cpus - 2, 10)),
  color: !isCI,                // Colored output in terminal
}
```

### E2E Test Configuration

**Cypress Settings** (`core/webapp/cypress.config.js`):

```javascript
{
  // Viewport
  viewportWidth: 1400,
  viewportHeight: 1000,

  // Timeouts
  defaultCommandTimeout: 40000,
  pageLoadTimeout: 60000,
  requestTimeout: 15000,

  // Performance
  numTestsKeptInMemory: isCI ? 30 : 1,
  videoCompression: 1,

  // Behavior
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: true,
  video: process.env.E2E_ENABLE_VIDEO === 'true',

  // Environment
  env: {
    FAIL_FAST_STRATEGY: 'run',
    FAIL_FAST_BAIL: 1,
    FAIL_FAST_PLUGIN: true,
    'static-server-url': 'http://127.0.0.1:9090'
  }
}
```

## Writing Tests

### Unit Test Patterns

#### Basic Test Structure

```javascript
import { test, describe, expect, beforeEach, afterAll } from 'bun:test';

describe('MyModule', () => {
  describe('myFunction', () => {
    test('should handle success case', async () => {
      const result = await myFunction({ input: 'value' });
      expect(result).toEqual({ success: true });
    });

    test('should handle error case', async () => {
      await expect(myFunction({ invalid: true }))
        .rejects
        .toThrow('Invalid input');
    });
  });
});
```

#### Mocking External Dependencies

```javascript
import { mock } from 'bun:test';

// Mock entire module
mock.module('fs-extra', () => ({
  existsSync: mock(() => true),
  readFileSync: mock(() => 'file contents'),
}));

// Use in tests
import { existsSync } from 'fs-extra';

test('should check file existence', () => {
  const result = checkFile('/path/to/file');
  expect(existsSync).toHaveBeenCalledWith('/path/to/file');
});
```

#### Async Mock Patterns

```javascript
test('should handle async operations', async () => {
  const mockApi = mock();

  // Success path
  mockApi.mockResolvedValue({ data: 'success' });
  const result = await fetchData(mockApi);
  expect(result).toEqual({ data: 'success' });

  // Failure path
  mockApi.mockRejectedValue(new Error('Network error'));
  await expect(fetchData(mockApi)).rejects.toThrow('Network error');
});
```

#### Mock Call Assertions

```javascript
test('should track function calls', () => {
  const mockFn = mock();

  processData(mockFn);

  // Assert called
  expect(mockFn).toHaveBeenCalled();

  // Assert called with specific args
  expect(mockFn).toHaveBeenCalledWith({ key: 'value' });

  // Assert call count
  expect(mockFn).toHaveBeenCalledTimes(2);

  // Assert nth call
  expect(mockFn).toHaveBeenNthCalledWith(1, firstArgs);
  expect(mockFn).toHaveBeenNthCalledWith(2, secondArgs);
});
```

#### Cleanup Patterns

```javascript
describe('Feature', () => {
  let mockFn;

  beforeEach(() => {
    mockFn = mock();
  });

  afterAll(() => {
    // Restore all mocks
    mock.restore();
    mock.clearAllMocks();
  });

  test('should use mock', () => {
    // Test implementation
  });
});
```

### E2E Test Patterns

#### Authentication

```javascript
describe('Protected Feature', () => {
  beforeEach(() => {
    // Login before each test
    cy.login();
  });

  it('should access protected resource', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});
```

#### GraphQL Testing

```javascript
import { createClient } from '../support/client';

describe('GraphQL API', () => {
  it('should fetch data', () => {
    cy.window().then(async (win) => {
      const client = createClient();
      const result = await client.query({ query: MY_QUERY });
      expect(result.data).to.have.property('users');
    });
  });
});
```

#### Custom Commands

```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', () => {
  cy.visit('/login');
  cy.get('input[name="username"]').type('admin');
  cy.get('input[name="password"]').type('password');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Use in tests
cy.login();
```

#### Network Stubbing

```javascript
it('should handle API errors', () => {
  cy.intercept('POST', '/api/data', {
    statusCode: 500,
    body: { error: 'Server error' }
  }).as('apiCall');

  cy.visit('/page');
  cy.wait('@apiCall');
  cy.contains('Error occurred').should('be.visible');
});
```

## Running Tests

### Local Development

```bash
# Run all tests
npm run test

# Run with retry (CI simulation)
npm run test --retry=3

# Run fast tests only
npm run test:fast

# Run slow tests only
npm run test:slow

# Run E2E tests
npm run e2e

# Run E2E in headed mode (see browser)
npm run turbo:e2e-headed

# Open Cypress UI
npm run turbo:e2e-open
```

### Package-Specific Testing

```bash
# Test specific package
cd core/util
bun test

# Test with watch mode
bun test --watch

# Test specific file
bun test tests/security.spec.js

# Test with pattern matching
bun test --grep "authentication"
```

### CI Testing

Tests run automatically in GitHub Actions:

**Unit Tests** (`.github/workflows/unit-tests.yml`):
- Timeout: 60 minutes
- Runner: ubuntu-latest-m (8+ cores)
- Redis: 6379 (Docker)
- Node: v22
- Retry: 3 attempts

**E2E Tests** (`.github/workflows/e2e-tests.yml`):
- Timeout: 35 minutes
- Runner: ubuntu-latest-m
- Browser: Chrome
- Video: Optional (E2E_ENABLE_VIDEO)
- Dashboard: Cypress Cloud recording

## CI/CD Integration

### Unit Test Pipeline

```yaml
name: unit-tests
timeout-minutes: 60
runs-on: ubuntu-latest-m

steps:
  - Checkout code
  - Setup Node.js v22 + cache
  - Install dependencies (make github-init)
  - Setup Nginx
  - Lint packages (npm run turbo:lint)
  - Run unit tests (npm run test --retry=3)
  - Upload coverage (DISABLED - see issue #1)

env:
  TEST_REDIS_URL: redis://127.0.0.1:40409
  NODE_OPTIONS: --max_old_space_size=6144
```

### E2E Test Pipeline

```yaml
name: e2e-tests
timeout-minutes: 35
runs-on: ubuntu-latest-m

steps:
  - Checkout code
  - Install Nginx (with ngx_stream_module)
  - Install Cypress binary (cached)
  - Build project (turbo build)
  - Run E2E tests (npm run e2e)
  - Record to Cypress Dashboard
  - Upload artifacts (screenshots, videos)

env:
  CLUSTER_SIZE: 2
  E2E_ENABLE_VIDEO: false
```

### Trigger Conditions

```yaml
on:
  pull_request:
    branches: [master, dev, next, release]

# Skip if:
if: "! contains(toJSON(github.event.commits.*.message), '[skip ci]')"
```

## Quality Standards

### Test Quality Metrics

| Aspect | Rating | Evidence |
|--------|--------|----------|
| Test Isolation | ⭐⭐⭐⭐⭐ | Process isolation via Bun Workers |
| Test Organization | ⭐⭐⭐⭐⭐ | Intelligent categorization |
| E2E Coverage | ⭐⭐⭐⭐ | 15+ comprehensive workflows |
| Mock Usage | ⭐⭐⭐ | Good patterns, incomplete coverage |
| Error Handling | ⭐⭐⭐⭐ | Comprehensive in most tests |
| CI/CD Integration | ⭐⭐⭐⭐⭐ | Sophisticated workflows |
| Performance | ⭐⭐⭐⭐ | 3min target achieved |

### Known Issues

#### 1. Coverage Reporting Disabled (HIGH)

**Status**: Known issue since Bun isolated test migration
**Impact**: No coverage metrics available
**Target**: ≥80% for new code
**Fix**: Waiting for official Bun support or implement aggregation

```yaml
# From unit-tests.yml
# FIXME: 临时停掉 coverage 报告, 因为现在测试变成单个文件的维度，报告会变得很碎
# 等 bun test 官方支持 isolated 后，再启用
```

#### 2. Incomplete Mock Coverage (MEDIUM)

**Target**: ≥90% mock usage
**Current**: ~70% estimated
**Issue**: Some tests use real I/O (DB, filesystem, network)
**Action**: Ongoing audit and remediation

#### 3. Flakiness Tracking (MEDIUM)

**Target**: <1% flaky test ratio
**Current**: Not tracked
**Issue**: Retry 3x without categorizing failures
**Action**: Implement retry tracking with failure categorization

## Best Practices

### DO ✅

1. **Use Process Isolation**
   ```javascript
   // Tests run in isolated processes automatically
   // No need for manual cleanup between test files
   ```

2. **Mock External Dependencies**
   ```javascript
   mock.module('external-api', () => ({
     fetchData: mock(() => ({ success: true }))
   }));
   ```

3. **Use Descriptive Test Names**
   ```javascript
   test('should return null when access key not found', async () => {
     // Clear, specific test name
   });
   ```

4. **Clean Up After Tests**
   ```javascript
   afterAll(() => {
     mock.restore();
     mock.clearAllMocks();
   });
   ```

5. **Test Error Cases**
   ```javascript
   test('should handle network errors', async () => {
     mockApi.mockRejectedValue(new Error('Network timeout'));
     await expect(fetchData()).rejects.toThrow('Network timeout');
   });
   ```

6. **Use Naming Conventions**
   ```javascript
   // For slow tests (>15s)
   my-feature.slow-spec.js

   // For priority tests
   my-feature.first-spec.js

   // For process spawn tests
   my-feature.spawn-spec.js
   ```

### DON'T ❌

1. **Don't Use Real I/O in Unit Tests**
   ```javascript
   // BAD
   test('should read file', () => {
     const data = fs.readFileSync('/real/file.txt');
   });

   // GOOD
   mock.module('fs', () => ({
     readFileSync: mock(() => 'mocked contents')
   }));
   ```

2. **Don't Retry Without Investigation**
   ```javascript
   // BAD - masks real issues
   test.retry(3)('flaky test', () => {
     // Test that sometimes fails
   });

   // GOOD - fix the root cause
   test('reliable test', () => {
     // Deterministic test with proper mocks
   });
   ```

3. **Don't Share State Between Tests**
   ```javascript
   // BAD
   let sharedState = {};
   test('modifies state', () => {
     sharedState.value = 'changed';
   });

   // GOOD
   test('isolated state', () => {
     const localState = {};
     localState.value = 'changed';
   });
   ```

4. **Don't Skip Tests Without Documentation**
   ```javascript
   // BAD
   test.skip('broken test', () => {});

   // GOOD
   test.skip('broken test - TODO: fix timing issue (#1234)', () => {});
   ```

5. **Don't Exceed Timeout Limits**
   ```javascript
   // If your test needs >15s, use .slow-spec.js naming
   // Don't increase timeout in individual tests
   ```

### Test Patterns

#### Testing Async Operations

```javascript
test('should handle async operations', async () => {
  const mockFn = mock();
  mockFn.mockResolvedValue({ data: 'result' });

  const result = await asyncFunction(mockFn);

  expect(result).toEqual({ data: 'result' });
  expect(mockFn).toHaveBeenCalled();
});
```

#### Testing Error Conditions

```javascript
test('should handle errors', async () => {
  const mockFn = mock();
  mockFn.mockRejectedValue(new Error('Failed'));

  await expect(asyncFunction(mockFn))
    .rejects
    .toThrow('Failed');
});
```

#### Testing Multiple Scenarios

```javascript
describe('checkAccessKeySource', () => {
  test('should return node access key when exists', async () => {
    node.getAccessKey.mockResolvedValue(mockAccessKey);
    const result = await checkAccessKeySource({ keyId });
    expect(result.source).toBe('node');
  });

  test('should fallback to blocklet when node fails', async () => {
    node.getAccessKey.mockRejectedValue(new Error('not found'));
    blocklet.getAccessKey.mockResolvedValue(mockAccessKey);
    const result = await checkAccessKeySource({ keyId });
    expect(result.source).toBe('blocklet');
  });

  test('should return null when both fail', async () => {
    node.getAccessKey.mockRejectedValue(new Error('not found'));
    blocklet.getAccessKey.mockRejectedValue(new Error('not found'));
    const result = await checkAccessKeySource({ keyId });
    expect(result.accessKey).toBeNull();
  });
});
```

## Troubleshooting

### Common Issues

#### Test Timeouts

**Problem**: Test exceeds 60s timeout

**Solution**:
```bash
# Rename file to use slow-spec naming
mv my-test.spec.js my-test.slow-spec.js

# Or optimize test to run faster:
# - Mock expensive operations
# - Reduce test data size
# - Split into multiple tests
```

#### Flaky Tests

**Problem**: Test passes/fails intermittently

**Causes**:
1. Network timing issues
2. Race conditions
3. Shared state between tests
4. Real I/O operations

**Solution**:
```javascript
// 1. Add proper awaits
await page.waitForSelector('[data-testid="element"]');

// 2. Mock network calls
mock.module('axios', () => ({
  get: mock(() => Promise.resolve({ data: 'mocked' }))
}));

// 3. Clean up state
afterEach(() => {
  mock.clearAllMocks();
});

// 4. Use isolated test environment
// (Already handled by process isolation)
```

#### Mock Not Working

**Problem**: Mock not replacing real implementation

**Solution**:
```javascript
// Import mock before module
import { mock } from 'bun:test';

// Mock module at top level
mock.module('my-module', () => ({
  myFunction: mock()
}));

// Then import module
import { myFunction } from 'my-module';

// Use in test
test('should use mock', () => {
  myFunction.mockReturnValue('mocked');
  const result = useFunction();
  expect(myFunction).toHaveBeenCalled();
});
```

#### E2E Test Fails Locally

**Problem**: E2E test passes in CI but fails locally

**Checks**:
```bash
# 1. Check Node.js version
node --version  # Should be v22

# 2. Check Nginx installation
nginx -v

# 3. Check environment variables
echo $ABT_NODE_HOME

# 4. Rebuild project
npm run clean
npm run build

# 5. Clear Cypress cache
npx cypress cache clear
npm run prepare:e2e
```

#### Coverage Not Generated

**Status**: Known issue - coverage reporting disabled

**Workaround**: None available currently

**Tracking**: Waiting for Bun official support for isolated test coverage

### Getting Help

1. **Check Documentation**
   - This guide
   - [Architecture docs](../architecture/)

2. **Search Issues**
   - [GitHub Issues](https://github.com/blocklet/blocklet-server/issues)
   - Search for test-related issues

3. **Ask Team**
   - Check with team members
   - Review similar tests in codebase

4. **Debug Tests**
   ```bash
   # Run single test file
   bun test path/to/failing-test.spec.js

   # Add debug output
   console.log('Debug:', variable);

   # Use Cypress debug mode
   npm run turbo:e2e-headed
   ```

## Additional Resources

### Documentation

- [Architecture Overview](../architecture/overview.md)
- [Database Schema](../architecture/database.md)
- [API Documentation](../reference/)
- [Contributing Guide](./README.md)

### Tools & Links

- [Bun Test Documentation](https://bun.sh/docs/test/overview)
- [Cypress Documentation](https://docs.cypress.io/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Blocklet Server Repository](https://github.com/blocklet/blocklet-server)

### Key Files

```
Testing Infrastructure:
├── tools/bun-test-isolated.js      # Test orchestrator
├── tools/bun-test-worker.js        # Worker execution
├── tools/bun-test-preload.js       # Global setup
├── core/webapp/cypress.config.js   # Cypress config
└── .github/workflows/              # CI/CD workflows
    ├── unit-tests.yml
    └── e2e-tests.yml

Test Suites:
├── blocklet/*/tests/               # Package tests
├── core/*/tests/                   # Core tests
└── core/webapp/cypress/e2e/        # E2E tests
```

---

*Last updated: 2026-01-09*
*Testing infrastructure based on Bun Test + Cypress*
