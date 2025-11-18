# DKAN Client Setup Tests

PHPUnit test suite for the dkan_client_setup module.

## Test Structure

```
tests/
├── src/
│   ├── Functional/          # Functional tests using BrowserTestBase
│   │   └── DkanClientSetupTestBase.php  # Base class for functional tests
│   └── Unit/                # Unit tests using UnitTestCase
└── README.md                # This file
```

## Running Tests

### All Tests

Run all tests from the module directory:

```bash
cd docroot/modules/custom/dkan_client_setup
ddev exec phpunit
```

### Functional Tests Only

```bash
ddev exec phpunit --testsuite functional
```

### Unit Tests Only

```bash
ddev exec phpunit --testsuite unit
```

### Specific Test File

```bash
ddev exec phpunit tests/src/Functional/DkanClientSetupCommandsTest.php
```

### With Coverage Report

```bash
ddev exec phpunit --coverage-html coverage/
```

## Test Suites

### Functional Tests

Tests complete Drush command execution using BrowserTestBase and DrushTestTrait.

- Full Drupal bootstrap
- Database interactions
- Command output verification
- Multi-step workflow testing

### Unit Tests

Tests individual helper methods in isolation using UnitTestCase.

- Field type mapping logic
- Title generation
- Data transformations
- No database required

## Base Test Class

`DkanClientSetupTestBase` provides:

- Required module installation
- Admin user creation with full permissions
- Helper methods for common operations:
  - `getNodeIdByPath()` - Find node by path alias
  - `blockExists()` - Check if block exists
  - `countMetastoreItems()` - Count metastore items by type
  - `getMetastoreItem()` - Retrieve metastore item by identifier
  - `sampleContentExists()` - Verify sample content imported

## Writing Tests

### Functional Test Example

```php
<?php

namespace Drupal\Tests\dkan_client_setup\Functional;

class MyCommandTest extends DkanClientSetupTestBase {

  public function testMyCommand() {
    $this->drush('dkan-client:my-command');
    $output = $this->getOutput();
    $this->assertStringContainsString('Success', $output);
  }

}
```

### Unit Test Example

```php
<?php

namespace Drupal\Tests\dkan_client_setup\Unit;

use Drupal\Tests\UnitTestCase;

class MyHelperTest extends UnitTestCase {

  public function testMyHelper() {
    $result = my_helper_function('input');
    $this->assertEquals('expected', $result);
  }

}
```

## Debugging Tests

### Enable Verbose Output

```bash
ddev exec phpunit -v
```

### Stop on First Failure

```bash
ddev exec phpunit --stop-on-failure
```

### Debug Specific Test

```bash
ddev exec phpunit --filter testMySpecificTest -v
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines with:

- No external dependencies
- Configurable via environment variables
- Fast execution times
- Clear pass/fail output
