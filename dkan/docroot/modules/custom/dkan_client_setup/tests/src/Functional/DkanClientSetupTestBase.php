<?php

namespace Drupal\Tests\dkan_client_setup\Functional;

use Drupal\Tests\BrowserTestBase;
use Drush\TestTraits\DrushTestTrait;

/**
 * Base class for DKAN Client Setup functional tests.
 *
 * Provides common setup and helper methods for testing the dkan_client_setup module.
 */
abstract class DkanClientSetupTestBase extends BrowserTestBase {

  use DrushTestTrait;

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'node',
    'block',
    'path',
    'dkan',
    'metastore',
    'metastore_admin',
    'metastore_search',
    'harvest',
    'sample_content',
    'dkan_client_setup',
  ];

  /**
   * Admin user with all permissions.
   *
   * @var \Drupal\user\UserInterface
   */
  protected $adminUser;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    // Create admin user with all permissions.
    $this->adminUser = $this->drupalCreateUser([], NULL, TRUE);
    $this->drupalLogin($this->adminUser);

    // Install default theme.
    \Drupal::service('theme_installer')->install(['olivero']);
    $this->config('system.theme')
      ->set('default', 'olivero')
      ->save();
  }

  /**
   * Helper method to verify a node exists by path.
   *
   * @param string $path
   *   The path to check (e.g., '/vanilla-demo').
   *
   * @return int|null
   *   The node ID if found, NULL otherwise.
   */
  protected function getNodeIdByPath(string $path): ?int {
    $alias_storage = \Drupal::service('path_alias.storage');
    $alias = $alias_storage->loadByProperties(['alias' => $path]);

    if (empty($alias)) {
      return NULL;
    }

    $alias = reset($alias);
    $system_path = $alias->getPath();

    if (preg_match('/node\/(\d+)/', $system_path, $matches)) {
      return (int) $matches[1];
    }

    return NULL;
  }

  /**
   * Helper method to verify a block exists.
   *
   * @param string $block_id
   *   The block ID to check.
   *
   * @return bool
   *   TRUE if block exists, FALSE otherwise.
   */
  protected function blockExists(string $block_id): bool {
    $block = \Drupal::entityTypeManager()
      ->getStorage('block')
      ->load($block_id);

    return $block !== NULL;
  }

  /**
   * Helper method to count metastore items by type.
   *
   * @param string $type
   *   The metastore item type (e.g., 'dataset', 'distribution').
   *
   * @return int
   *   The count of items.
   */
  protected function countMetastoreItems(string $type): int {
    $database = \Drupal::database();
    $query = $database->select('metastore', 'm')
      ->condition('m.data_type', $type)
      ->countQuery();

    return (int) $query->execute()->fetchField();
  }

  /**
   * Helper method to get a metastore item by identifier.
   *
   * @param string $identifier
   *   The metastore item identifier.
   *
   * @return object|null
   *   The metastore item data or NULL if not found.
   */
  protected function getMetastoreItem(string $identifier): ?object {
    $database = \Drupal::database();
    $query = $database->select('metastore', 'm')
      ->fields('m', ['data'])
      ->condition('m.identifier', $identifier)
      ->execute();

    $result = $query->fetchField();

    if ($result) {
      return json_decode($result);
    }

    return NULL;
  }

  /**
   * Helper method to verify sample content has been imported.
   *
   * @param int $min_count
   *   Minimum expected dataset count.
   *
   * @return bool
   *   TRUE if sample content exists, FALSE otherwise.
   */
  protected function sampleContentExists(int $min_count = 40): bool {
    $count = $this->countMetastoreItems('dataset');
    return $count >= $min_count;
  }

}
