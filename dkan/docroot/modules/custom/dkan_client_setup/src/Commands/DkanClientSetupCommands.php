<?php

namespace Drupal\dkan_client_setup\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\Entity\Node;
use Drupal\block\Entity\Block;
use Drush\Commands\DrushCommands;

/**
 * Drush commands for DKAN Client Tools setup automation.
 */
class DkanClientSetupCommands extends DrushCommands {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a DkanClientSetupCommands object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager) {
    parent::__construct();
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Create demo pages for DKAN Client Tools.
   *
   * @command dkan-client:create-demo-pages
   * @usage dkan-client:create-demo-pages
   *   Creates vanilla, react, and vue demo pages.
   * @aliases dkan-client-pages
   */
  public function createDemoPages() {
    $pages = [
      [
        'title' => 'Vanilla JavaScript Demo',
        'path' => '/vanilla-demo',
        'nid' => NULL,
      ],
      [
        'title' => 'React Demo',
        'path' => '/react-demo',
        'nid' => NULL,
      ],
      [
        'title' => 'Vue Demo',
        'path' => '/vue-demo',
        'nid' => NULL,
      ],
    ];

    foreach ($pages as &$page) {
      // Check if page already exists with this path.
      $existing = $this->entityTypeManager
        ->getStorage('node')
        ->loadByProperties([
          'type' => 'page',
          'title' => $page['title'],
        ]);

      if (!empty($existing)) {
        $node = reset($existing);
        $page['nid'] = $node->id();
        $this->logger()->notice('Page already exists: ' . $page['title'] . ' (node/' . $node->id() . ')');
      }
      else {
        // Create new page.
        $node = Node::create([
          'type' => 'page',
          'title' => $page['title'],
          'status' => 1,
          'promote' => 0,
          'path' => ['alias' => $page['path']],
        ]);
        $node->save();
        $page['nid'] = $node->id();
        $this->logger()->success('Created page: ' . $page['title'] . ' at ' . $page['path']);
      }
    }

    $this->logger()->success('Demo pages creation complete.');
    return $pages;
  }

  /**
   * Place dataset search blocks on demo pages.
   *
   * @command dkan-client:place-blocks
   * @usage dkan-client:place-blocks
   *   Places blocks on vanilla, react, and vue demo pages.
   * @aliases dkan-client-blocks
   */
  public function placeBlocks() {
    $blocks = [
      [
        'id' => 'dkan_client_vanilla_demo_block',
        'plugin' => 'dkan_client_demo_vanilla_block',
        'theme' => $this->getDefaultTheme(),
        'region' => 'content',
        'label' => 'DKAN Dataset Search (Vanilla)',
        'path' => '/vanilla-demo',
      ],
      [
        'id' => 'dkan_client_react_demo_block',
        'plugin' => 'dkan_client_demo_react_block',
        'theme' => $this->getDefaultTheme(),
        'region' => 'content',
        'label' => 'DKAN Dataset Search (React)',
        'path' => '/react-demo',
      ],
      [
        'id' => 'dkan_client_vue_demo_block',
        'plugin' => 'dkan_client_demo_vue_block',
        'theme' => $this->getDefaultTheme(),
        'region' => 'content',
        'label' => 'DKAN Dataset Search (Vue)',
        'path' => '/vue-demo',
      ],
    ];

    foreach ($blocks as $block_config) {
      // Check if block already exists.
      $existing_block = Block::load($block_config['id']);

      if ($existing_block) {
        $this->logger()->notice('Block already exists: ' . $block_config['label']);
      }
      else {
        // Create and place block.
        $block = Block::create([
          'id' => $block_config['id'],
          'plugin' => $block_config['plugin'],
          'theme' => $block_config['theme'],
          'region' => $block_config['region'],
          'weight' => 0,
          'settings' => [
            'label' => $block_config['label'],
            'label_display' => '0',
          ],
          'visibility' => [
            'request_path' => [
              'id' => 'request_path',
              'negate' => FALSE,
              'pages' => $block_config['path'],
            ],
          ],
        ]);

        try {
          $block->save();
          $this->logger()->success('Placed block: ' . $block_config['label'] . ' on ' . $block_config['path']);
        }
        catch (\Exception $e) {
          $this->logger()->error('Failed to create block ' . $block_config['id'] . ': ' . $e->getMessage());
        }
      }
    }

    $this->logger()->success('Block placement complete.');
  }

  /**
   * Complete DKAN Client Tools demo setup.
   *
   * @command dkan-client:setup
   * @usage dkan-client:setup
   *   Runs complete demo setup (creates pages and places blocks).
   * @aliases dkan-client-demo-setup
   */
  public function setupDemo() {
    $this->logger()->notice('Starting DKAN Client Tools demo setup...');

    // Create demo pages.
    $this->createDemoPages();

    // Place blocks.
    $this->placeBlocks();

    $this->logger()->success('DKAN Client Tools demo setup complete!');
    $this->logger()->notice('Demo pages available at:');
    $this->logger()->notice('  - /vanilla-demo');
    $this->logger()->notice('  - /react-demo');
    $this->logger()->notice('  - /vue-demo');
  }

  /**
   * Get the default theme.
   *
   * @return string
   *   The machine name of the default theme.
   */
  protected function getDefaultTheme() {
    $config = \Drupal::config('system.theme');
    return $config->get('default');
  }

}
