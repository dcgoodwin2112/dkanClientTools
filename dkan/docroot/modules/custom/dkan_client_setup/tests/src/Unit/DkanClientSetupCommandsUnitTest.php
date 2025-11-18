<?php

namespace Drupal\Tests\dkan_client_setup\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\dkan_client_setup\Commands\DkanClientSetupCommands;

/**
 * Unit tests for DKAN Client Setup Commands helper methods.
 *
 * @group dkan_client_setup
 * @coversDefaultClass \Drupal\dkan_client_setup\Commands\DkanClientSetupCommands
 */
class DkanClientSetupCommandsUnitTest extends UnitTestCase {

  /**
   * The command instance.
   *
   * @var \Drupal\dkan_client_setup\Commands\DkanClientSetupCommands
   */
  protected $command;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    // Create mock dependencies.
    $entity_type_manager = $this->createMock('Drupal\Core\Entity\EntityTypeManagerInterface');
    $datastore_service = $this->createMock('Drupal\datastore\DatastoreService');
    $metastore_service = $this->createMock('Drupal\metastore\MetastoreService');
    $data_factory = $this->createMock('Drupal\metastore\Storage\DataFactory');
    $dictionary_discovery = $this->createMock('Drupal\metastore\DataDictionary\DataDictionaryDiscovery');
    $harvest_service = $this->createMock('Drupal\harvest\HarvestService');

    // Create command instance with mocked dependencies.
    $this->command = new DkanClientSetupCommands(
      $entity_type_manager,
      $datastore_service,
      $metastore_service,
      $data_factory,
      $dictionary_discovery,
      $harvest_service
    );
  }

  /**
   * Test mapFieldType() method with all supported Drupal types.
   *
   * @covers ::mapFieldType
   * @dataProvider providerMapFieldType
   */
  public function testMapFieldType($drupal_type, $expected_frictionless_type) {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('mapFieldType');
    $method->setAccessible(TRUE);

    $result = $method->invoke($this->command, $drupal_type);
    $this->assertEquals($expected_frictionless_type, $result,
      "Drupal type '{$drupal_type}' should map to Frictionless type '{$expected_frictionless_type}'");
  }

  /**
   * Data provider for testMapFieldType().
   *
   * @return array
   *   Test cases with [drupal_type, expected_frictionless_type].
   */
  public function providerMapFieldType() {
    return [
      // String types.
      ['varchar', 'string'],
      ['text', 'string'],
      ['blob', 'string'],

      // Integer types.
      ['int', 'integer'],
      ['integer', 'integer'],
      ['serial', 'integer'],

      // Number types.
      ['float', 'number'],
      ['numeric', 'number'],

      // Boolean type.
      ['boolean', 'boolean'],

      // Date types.
      ['date', 'date'],
      ['datetime', 'datetime'],

      // Unknown type (defaults to string).
      ['unknown_type', 'string'],
      ['', 'string'],
    ];
  }

  /**
   * Test generateFieldTitle() method with various field name formats.
   *
   * @covers ::generateFieldTitle
   * @dataProvider providerGenerateFieldTitle
   */
  public function testGenerateFieldTitle($field_name, $expected_title) {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('generateFieldTitle');
    $method->setAccessible(TRUE);

    $result = $method->invoke($this->command, $field_name);
    $this->assertEquals($expected_title, $result,
      "Field name '{$field_name}' should generate title '{$expected_title}'");
  }

  /**
   * Data provider for testGenerateFieldTitle().
   *
   * @return array
   *   Test cases with [field_name, expected_title].
   */
  public function providerGenerateFieldTitle() {
    return [
      // Single word.
      ['name', 'Name'],
      ['title', 'Title'],

      // Snake case (two words).
      ['first_name', 'First Name'],
      ['last_name', 'Last Name'],

      // Snake case (three words).
      ['created_at_timestamp', 'Created At Timestamp'],
      ['total_sales_amount', 'Total Sales Amount'],

      // All uppercase (should convert to title case).
      ['UPPERCASE', 'Uppercase'],
      ['ALL_CAPS', 'All Caps'],

      // Mixed case (should convert to title case).
      ['MixedCase', 'Mixedcase'],
      ['camelCase', 'Camelcase'],

      // Edge cases.
      ['a', 'A'],
      ['a_b', 'A B'],
      ['', ''],
    ];
  }

  /**
   * Test convertSchemaToFields() method.
   *
   * @covers ::convertSchemaToFields
   */
  public function testConvertSchemaToFields() {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('convertSchemaToFields');
    $method->setAccessible(TRUE);

    // Test with typical datastore schema.
    $schema_fields = [
      'id' => [
        'type' => 'serial',
        'description' => 'Unique identifier',
      ],
      'name' => [
        'type' => 'varchar',
      ],
      'age' => [
        'type' => 'int',
      ],
      'salary' => [
        'type' => 'numeric',
      ],
      'is_active' => [
        'type' => 'boolean',
      ],
      'created_date' => [
        'type' => 'date',
      ],
    ];

    $result = $method->invoke($this->command, $schema_fields);

    // Verify result is an array with correct count.
    $this->assertIsArray($result);
    $this->assertCount(6, $result);

    // Verify first field (id).
    $this->assertEquals('id', $result[0]['name']);
    $this->assertEquals('Id', $result[0]['title']);
    $this->assertEquals('integer', $result[0]['type']);
    $this->assertEquals('Unique identifier', $result[0]['description']);

    // Verify second field (name).
    $this->assertEquals('name', $result[1]['name']);
    $this->assertEquals('Name', $result[1]['title']);
    $this->assertEquals('string', $result[1]['type']);
    $this->assertArrayNotHasKey('description', $result[1]);

    // Verify third field (age).
    $this->assertEquals('age', $result[2]['name']);
    $this->assertEquals('Age', $result[2]['title']);
    $this->assertEquals('integer', $result[2]['type']);

    // Verify fourth field (salary).
    $this->assertEquals('salary', $result[3]['name']);
    $this->assertEquals('Salary', $result[3]['title']);
    $this->assertEquals('number', $result[3]['type']);

    // Verify fifth field (is_active).
    $this->assertEquals('is_active', $result[4]['name']);
    $this->assertEquals('Is Active', $result[4]['title']);
    $this->assertEquals('boolean', $result[4]['type']);

    // Verify sixth field (created_date) has date format.
    $this->assertEquals('created_date', $result[5]['name']);
    $this->assertEquals('Created Date', $result[5]['title']);
    $this->assertEquals('date', $result[5]['type']);
    $this->assertEquals('default', $result[5]['format']);
  }

  /**
   * Test convertSchemaToFields() with datetime field.
   *
   * @covers ::convertSchemaToFields
   */
  public function testConvertSchemaToFieldsWithDatetime() {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('convertSchemaToFields');
    $method->setAccessible(TRUE);

    $schema_fields = [
      'updated_at' => [
        'type' => 'datetime',
      ],
    ];

    $result = $method->invoke($this->command, $schema_fields);

    // Verify datetime field has format.
    $this->assertEquals('updated_at', $result[0]['name']);
    $this->assertEquals('Updated At', $result[0]['title']);
    $this->assertEquals('datetime', $result[0]['type']);
    $this->assertEquals('default', $result[0]['format']);
  }

  /**
   * Test convertSchemaToFields() with empty schema.
   *
   * @covers ::convertSchemaToFields
   */
  public function testConvertSchemaToFieldsEmpty() {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('convertSchemaToFields');
    $method->setAccessible(TRUE);

    $result = $method->invoke($this->command, []);

    $this->assertIsArray($result);
    $this->assertEmpty($result);
  }

  /**
   * Test convertSchemaToFields() with field missing type.
   *
   * @covers ::convertSchemaToFields
   */
  public function testConvertSchemaToFieldsWithMissingType() {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('convertSchemaToFields');
    $method->setAccessible(TRUE);

    $schema_fields = [
      'field_without_type' => [
        'description' => 'A field without a type specified',
      ],
    ];

    $result = $method->invoke($this->command, $schema_fields);

    // Verify field defaults to 'string' type.
    $this->assertEquals('field_without_type', $result[0]['name']);
    $this->assertEquals('Field Without Type', $result[0]['title']);
    $this->assertEquals('string', $result[0]['type']);
    $this->assertEquals('A field without a type specified', $result[0]['description']);
  }

  /**
   * Test convertSchemaToFields() preserves description when present.
   *
   * @covers ::convertSchemaToFields
   */
  public function testConvertSchemaToFieldsPreservesDescription() {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('convertSchemaToFields');
    $method->setAccessible(TRUE);

    $schema_fields = [
      'with_desc' => [
        'type' => 'varchar',
        'description' => 'This field has a description',
      ],
      'without_desc' => [
        'type' => 'varchar',
      ],
    ];

    $result = $method->invoke($this->command, $schema_fields);

    // Field with description.
    $this->assertArrayHasKey('description', $result[0]);
    $this->assertEquals('This field has a description', $result[0]['description']);

    // Field without description.
    $this->assertArrayNotHasKey('description', $result[1]);
  }

  /**
   * Test convertSchemaToFields() with complex real-world schema.
   *
   * @covers ::convertSchemaToFields
   */
  public function testConvertSchemaToFieldsComplexSchema() {
    $reflection = new \ReflectionClass($this->command);
    $method = $reflection->getMethod('convertSchemaToFields');
    $method->setAccessible(TRUE);

    // Simulate a real datastore schema.
    $schema_fields = [
      'record_id' => [
        'type' => 'serial',
        'description' => 'Auto-incrementing record ID',
      ],
      'employee_name' => [
        'type' => 'varchar',
        'description' => 'Full name of employee',
      ],
      'department_code' => [
        'type' => 'varchar',
      ],
      'annual_salary' => [
        'type' => 'numeric',
        'description' => 'Annual salary in USD',
      ],
      'hire_date' => [
        'type' => 'date',
      ],
      'last_updated' => [
        'type' => 'datetime',
      ],
      'is_full_time' => [
        'type' => 'boolean',
      ],
    ];

    $result = $method->invoke($this->command, $schema_fields);

    // Verify count.
    $this->assertCount(7, $result);

    // Verify all required fields present in each result.
    foreach ($result as $field) {
      $this->assertArrayHasKey('name', $field);
      $this->assertArrayHasKey('title', $field);
      $this->assertArrayHasKey('type', $field);
    }

    // Verify specific transformations.
    $this->assertEquals('Record Id', $result[0]['title']);
    $this->assertEquals('integer', $result[0]['type']);

    $this->assertEquals('Employee Name', $result[1]['title']);
    $this->assertEquals('string', $result[1]['type']);

    $this->assertEquals('Department Code', $result[2]['title']);

    $this->assertEquals('Annual Salary', $result[3]['title']);
    $this->assertEquals('number', $result[3]['type']);

    $this->assertEquals('Hire Date', $result[4]['title']);
    $this->assertEquals('date', $result[4]['type']);
    $this->assertEquals('default', $result[4]['format']);

    $this->assertEquals('Last Updated', $result[5]['title']);
    $this->assertEquals('datetime', $result[5]['type']);
    $this->assertEquals('default', $result[5]['format']);

    $this->assertEquals('Is Full Time', $result[6]['title']);
    $this->assertEquals('boolean', $result[6]['type']);
  }

}
