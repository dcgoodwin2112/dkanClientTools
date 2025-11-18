<?php

namespace Drupal\Tests\dkan_client_setup\Functional;

/**
 * Tests for DKAN Client Setup Drush commands.
 *
 * @group dkan_client_setup
 */
class DkanClientSetupCommandsTest extends DkanClientSetupTestBase {

  /**
   * Test the create-demo-pages command.
   */
  public function testCreateDemoPagesCommand() {
    // Verify no demo pages exist initially.
    $this->assertNull($this->getNodeIdByPath('/vanilla-demo'));
    $this->assertNull($this->getNodeIdByPath('/react-demo'));
    $this->assertNull($this->getNodeIdByPath('/vue-demo'));

    // Run create-demo-pages command.
    $this->drush('dkan-client:create-demo-pages');
    $output = $this->getOutput();

    // Verify output messages.
    $this->assertStringContainsString('Created page: Vanilla JavaScript Demo at /vanilla-demo', $output);
    $this->assertStringContainsString('Created page: React Demo at /react-demo', $output);
    $this->assertStringContainsString('Created page: Vue Demo at /vue-demo', $output);
    $this->assertStringContainsString('Demo pages creation complete.', $output);

    // Verify pages were created.
    $vanilla_nid = $this->getNodeIdByPath('/vanilla-demo');
    $react_nid = $this->getNodeIdByPath('/react-demo');
    $vue_nid = $this->getNodeIdByPath('/vue-demo');

    $this->assertNotNull($vanilla_nid, 'Vanilla demo page created');
    $this->assertNotNull($react_nid, 'React demo page created');
    $this->assertNotNull($vue_nid, 'Vue demo page created');

    // Verify page titles.
    $vanilla_node = \Drupal::entityTypeManager()->getStorage('node')->load($vanilla_nid);
    $react_node = \Drupal::entityTypeManager()->getStorage('node')->load($react_nid);
    $vue_node = \Drupal::entityTypeManager()->getStorage('node')->load($vue_nid);

    $this->assertEquals('Vanilla JavaScript Demo', $vanilla_node->getTitle());
    $this->assertEquals('React Demo', $react_node->getTitle());
    $this->assertEquals('Vue Demo', $vue_node->getTitle());

    // Verify pages are published.
    $this->assertTrue($vanilla_node->isPublished());
    $this->assertTrue($react_node->isPublished());
    $this->assertTrue($vue_node->isPublished());
  }

  /**
   * Test the create-demo-pages command is idempotent.
   */
  public function testCreateDemoPagesCommandIdempotency() {
    // Create pages first time.
    $this->drush('dkan-client:create-demo-pages');
    $first_vanilla_nid = $this->getNodeIdByPath('/vanilla-demo');
    $first_react_nid = $this->getNodeIdByPath('/react-demo');
    $first_vue_nid = $this->getNodeIdByPath('/vue-demo');

    // Run command again.
    $this->drush('dkan-client:create-demo-pages');
    $output = $this->getOutput();

    // Verify "already exists" messages.
    $this->assertStringContainsString('Page already exists: Vanilla JavaScript Demo', $output);
    $this->assertStringContainsString('Page already exists: React Demo', $output);
    $this->assertStringContainsString('Page already exists: Vue Demo', $output);

    // Verify same node IDs (no duplicates created).
    $second_vanilla_nid = $this->getNodeIdByPath('/vanilla-demo');
    $second_react_nid = $this->getNodeIdByPath('/react-demo');
    $second_vue_nid = $this->getNodeIdByPath('/vue-demo');

    $this->assertEquals($first_vanilla_nid, $second_vanilla_nid, 'No duplicate vanilla page created');
    $this->assertEquals($first_react_nid, $second_react_nid, 'No duplicate react page created');
    $this->assertEquals($first_vue_nid, $second_vue_nid, 'No duplicate vue page created');

    // Verify only 3 demo pages exist total.
    $all_pages = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->loadByProperties(['type' => 'page']);
    $this->assertCount(3, $all_pages, 'Exactly 3 demo pages exist');
  }

  /**
   * Test the place-blocks command.
   */
  public function testPlaceBlocksCommand() {
    // Create demo pages first (blocks need pages to be visible on).
    $this->drush('dkan-client:create-demo-pages');

    // Verify no blocks exist initially.
    $this->assertFalse($this->blockExists('dkan_client_vanilla_demo_block'));
    $this->assertFalse($this->blockExists('dkan_client_react_demo_block'));
    $this->assertFalse($this->blockExists('dkan_client_vue_demo_block'));

    // Run place-blocks command.
    $this->drush('dkan-client:place-blocks');
    $output = $this->getOutput();

    // Verify output messages.
    $this->assertStringContainsString('Placed block: DKAN Dataset Search (Vanilla) on /vanilla-demo', $output);
    $this->assertStringContainsString('Placed block: DKAN Dataset Search (React) on /react-demo', $output);
    $this->assertStringContainsString('Placed block: DKAN Dataset Search (Vue) on /vue-demo', $output);
    $this->assertStringContainsString('Block placement complete.', $output);

    // Verify blocks were created.
    $this->assertTrue($this->blockExists('dkan_client_vanilla_demo_block'), 'Vanilla block created');
    $this->assertTrue($this->blockExists('dkan_client_react_demo_block'), 'React block created');
    $this->assertTrue($this->blockExists('dkan_client_vue_demo_block'), 'Vue block created');

    // Verify block visibility settings.
    $vanilla_block = \Drupal::entityTypeManager()->getStorage('block')->load('dkan_client_vanilla_demo_block');
    $visibility = $vanilla_block->getVisibility();
    $this->assertArrayHasKey('request_path', $visibility);
    $this->assertEquals('/vanilla-demo', $visibility['request_path']['pages']);
  }

  /**
   * Test the place-blocks command is idempotent.
   */
  public function testPlaceBlocksCommandIdempotency() {
    // Create pages and blocks first time.
    $this->drush('dkan-client:create-demo-pages');
    $this->drush('dkan-client:place-blocks');

    // Run command again.
    $this->drush('dkan-client:place-blocks');
    $output = $this->getOutput();

    // Verify "already exists" messages.
    $this->assertStringContainsString('Block already exists: DKAN Dataset Search (Vanilla)', $output);
    $this->assertStringContainsString('Block already exists: DKAN Dataset Search (React)', $output);
    $this->assertStringContainsString('Block already exists: DKAN Dataset Search (Vue)', $output);

    // Verify only 3 demo blocks exist.
    $this->assertTrue($this->blockExists('dkan_client_vanilla_demo_block'));
    $this->assertTrue($this->blockExists('dkan_client_react_demo_block'));
    $this->assertTrue($this->blockExists('dkan_client_vue_demo_block'));
  }

  /**
   * Test the create-data-dictionaries command.
   */
  public function testCreateDataDictionariesCommand() {
    // Enable sample_content module and create sample datasets.
    \Drupal::service('module_installer')->install(['sample_content']);
    $this->drush('dkan:sample-content:create');

    // Run cron to allow datastore imports to complete.
    $this->drush('cron');
    $this->drush('cron');

    // Run create-data-dictionaries command.
    $this->drush('dkan-client:create-data-dictionaries');
    $output = $this->getOutput();

    // Verify output contains summary.
    $this->assertStringContainsString('Creating data dictionaries from datastore schemas...', $output);
    $this->assertStringContainsString('Data Dictionary Creation Summary:', $output);
    $this->assertStringContainsString('Created:', $output);
    $this->assertStringContainsString('Skipped:', $output);
    $this->assertStringContainsString('Errors:', $output);

    // Verify at least some distributions were processed.
    $this->assertStringContainsString('Found', $output);
    $this->assertStringContainsString('distributions to process', $output);
  }

  /**
   * Test the create-data-dictionaries command is idempotent.
   */
  public function testCreateDataDictionariesCommandIdempotency() {
    // Enable sample_content and create datasets.
    \Drupal::service('module_installer')->install(['sample_content']);
    $this->drush('dkan:sample-content:create');
    $this->drush('cron');
    $this->drush('cron');

    // Run command first time.
    $this->drush('dkan-client:create-data-dictionaries');
    $first_output = $this->getOutput();

    // Run command again.
    $this->drush('dkan-client:create-data-dictionaries');
    $second_output = $this->getOutput();

    // Verify "already exists" messages on second run.
    $this->assertStringContainsString('Dictionary already exists for:', $second_output);

    // Verify no new dictionaries created on second run.
    $this->assertStringContainsString('Created: 0', $second_output);
    $this->assertStringContainsString('Skipped:', $second_output);
  }

  /**
   * Test the setup command (full setup).
   */
  public function testSetupCommand() {
    // Enable sample_content module first.
    \Drupal::service('module_installer')->install(['sample_content']);
    $this->drush('dkan:sample-content:create');
    $this->drush('cron');

    // Run setup command.
    $this->drush('dkan-client:setup');
    $output = $this->getOutput();

    // Verify setup completed message.
    $this->assertStringContainsString('Starting DKAN Client Tools demo setup...', $output);
    $this->assertStringContainsString('DKAN Client Tools demo setup complete!', $output);

    // Verify all operations mentioned in output.
    $this->assertStringContainsString('Demo pages creation complete.', $output);
    $this->assertStringContainsString('Block placement complete.', $output);
    $this->assertStringContainsString('Data Dictionary Creation Summary:', $output);

    // Verify demo pages created.
    $this->assertNotNull($this->getNodeIdByPath('/vanilla-demo'));
    $this->assertNotNull($this->getNodeIdByPath('/react-demo'));
    $this->assertNotNull($this->getNodeIdByPath('/vue-demo'));

    // Verify blocks created.
    $this->assertTrue($this->blockExists('dkan_client_vanilla_demo_block'));
    $this->assertTrue($this->blockExists('dkan_client_react_demo_block'));
    $this->assertTrue($this->blockExists('dkan_client_vue_demo_block'));

    // Verify demo page URLs listed in output.
    $this->assertStringContainsString('Demo pages available at:', $output);
    $this->assertStringContainsString('/vanilla-demo', $output);
    $this->assertStringContainsString('/react-demo', $output);
    $this->assertStringContainsString('/vue-demo', $output);
  }

  /**
   * Test the setup --clean command (clean refresh).
   */
  public function testSetupCleanCommand() {
    // Enable sample_content and create initial content.
    \Drupal::service('module_installer')->install(['sample_content']);
    $this->drush('dkan:sample-content:create');
    $this->drush('cron');

    // Run setup first time to create content.
    $this->drush('dkan-client:setup');

    // Verify content exists.
    $vanilla_nid_before = $this->getNodeIdByPath('/vanilla-demo');
    $this->assertNotNull($vanilla_nid_before);
    $this->assertTrue($this->blockExists('dkan_client_vanilla_demo_block'));
    $initial_dataset_count = $this->countMetastoreItems('dataset');
    $this->assertGreaterThan(0, $initial_dataset_count, 'Sample datasets exist');

    // Run setup with --clean flag.
    $this->drush('dkan-client:setup', [], ['clean' => TRUE]);
    $output = $this->getOutput();

    // Verify clean mode messages.
    $this->assertStringContainsString('Clean option enabled - removing existing content first...', $output);
    $this->assertStringContainsString('Removing all demo content and sample datasets...', $output);

    // Verify cleanup operations executed.
    $this->assertStringContainsString('Demo blocks cleanup:', $output);
    $this->assertStringContainsString('Demo pages cleanup:', $output);
    $this->assertStringContainsString('Data dictionaries cleanup:', $output);
    $this->assertStringContainsString('Reverted', $output);
    $this->assertStringContainsString('sample content items', $output);

    // Verify all demo content removed then recreated.
    $this->assertStringContainsString('All demo content and sample datasets removed.', $output);
    $this->assertStringContainsString('DKAN Client Tools demo setup complete!', $output);

    // Note: Content will be recreated by the setup command after cleaning,
    // so we can't verify deletion - only that clean process ran.
    // Pages and blocks should exist again after clean + setup.
    $vanilla_nid_after = $this->getNodeIdByPath('/vanilla-demo');
    $this->assertNotNull($vanilla_nid_after, 'Demo pages recreated after clean');
    $this->assertTrue($this->blockExists('dkan_client_vanilla_demo_block'), 'Blocks recreated after clean');
  }

  /**
   * Test the setup command is idempotent.
   */
  public function testSetupCommandIdempotency() {
    // Enable sample_content module.
    \Drupal::service('module_installer')->install(['sample_content']);
    $this->drush('dkan:sample-content:create');
    $this->drush('cron');

    // Run setup three times.
    $this->drush('dkan-client:setup');
    $first_vanilla_nid = $this->getNodeIdByPath('/vanilla-demo');

    $this->drush('dkan-client:setup');
    $second_vanilla_nid = $this->getNodeIdByPath('/vanilla-demo');

    $this->drush('dkan-client:setup');
    $output = $this->getOutput();
    $third_vanilla_nid = $this->getNodeIdByPath('/vanilla-demo');

    // Verify no duplicates created.
    $this->assertEquals($first_vanilla_nid, $second_vanilla_nid, 'No duplicate pages after second run');
    $this->assertEquals($second_vanilla_nid, $third_vanilla_nid, 'No duplicate pages after third run');

    // Verify "already exists" messages on third run.
    $this->assertStringContainsString('Page already exists:', $output);
    $this->assertStringContainsString('Block already exists:', $output);

    // Verify setup still completes successfully.
    $this->assertStringContainsString('DKAN Client Tools demo setup complete!', $output);
  }

  /**
   * Test command aliases work correctly.
   */
  public function testCommandAliases() {
    // Test dkan-client-pages alias.
    $this->drush('dkan-client-pages');
    $output = $this->getOutput();
    $this->assertStringContainsString('Demo pages creation complete.', $output);
    $this->assertNotNull($this->getNodeIdByPath('/vanilla-demo'));

    // Clean up for next test.
    $this->drush('sql-query', ['DELETE FROM node WHERE type = \'page\'']);
    $this->drush('sql-query', ['DELETE FROM path_alias']);

    // Test dkan-client-blocks alias.
    $this->drush('dkan-client-pages');  // Need pages first.
    $this->drush('dkan-client-blocks');
    $output = $this->getOutput();
    $this->assertStringContainsString('Block placement complete.', $output);
    $this->assertTrue($this->blockExists('dkan_client_vanilla_demo_block'));

    // Test dkan-client-dictionaries alias.
    \Drupal::service('module_installer')->install(['sample_content']);
    $this->drush('dkan:sample-content:create');
    $this->drush('cron');
    $this->drush('dkan-client-dictionaries');
    $output = $this->getOutput();
    $this->assertStringContainsString('Data Dictionary Creation Summary:', $output);

    // Test dkan-client-demo-setup alias.
    $this->drush('sql-query', ['DELETE FROM node WHERE type = \'page\'']);
    $this->drush('sql-query', ['DELETE FROM path_alias']);
    $this->drush('sql-query', ['DELETE FROM block']);
    $this->drush('dkan-client-demo-setup');
    $output = $this->getOutput();
    $this->assertStringContainsString('DKAN Client Tools demo setup complete!', $output);
    $this->assertNotNull($this->getNodeIdByPath('/vanilla-demo'));
  }

}
