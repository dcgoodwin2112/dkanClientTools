<?php

namespace Drupal\dkan_client_setup\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\Entity\Node;
use Drupal\block\Entity\Block;
use Drupal\datastore\DatastoreService;
use Drupal\metastore\MetastoreService;
use Drupal\metastore\Storage\DataFactory;
use Drupal\metastore\DataDictionary\DataDictionaryDiscovery;
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
   * The datastore service.
   *
   * @var \Drupal\datastore\DatastoreService
   */
  protected $datastoreService;

  /**
   * The metastore service.
   *
   * @var \Drupal\metastore\MetastoreService
   */
  protected $metastoreService;

  /**
   * The metastore data factory.
   *
   * @var \Drupal\metastore\Storage\DataFactory
   */
  protected $dataFactory;

  /**
   * The data dictionary discovery service.
   *
   * @var \Drupal\metastore\DataDictionary\DataDictionaryDiscovery
   */
  protected $dictionaryDiscovery;

  /**
   * JSONPath for extracting resource ID from distribution reference.
   *
   * Used when downloadURL is a %Ref:downloadURL reference to a resource.
   */
  const JSONPATH_REF_DOWNLOAD_URL = '$[data]["%Ref:downloadURL"][0][data][identifier]';

  /**
   * JSONPath for extracting resource ID from direct downloadURL field.
   *
   * Used when downloadURL is a direct string URL (non-referenced resources).
   */
  const JSONPATH_DIRECT_DOWNLOAD_URL = '$.data.downloadURL';

  /**
   * Constructs a DkanClientSetupCommands object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\datastore\DatastoreService $datastore_service
   *   The datastore service.
   * @param \Drupal\metastore\MetastoreService $metastore_service
   *   The metastore service.
   * @param \Drupal\metastore\Storage\DataFactory $data_factory
   *   The metastore data factory.
   * @param \Drupal\metastore\DataDictionary\DataDictionaryDiscovery $dictionary_discovery
   *   The data dictionary discovery service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    DatastoreService $datastore_service,
    MetastoreService $metastore_service,
    DataFactory $data_factory,
    DataDictionaryDiscovery $dictionary_discovery
  ) {
    parent::__construct();
    $this->entityTypeManager = $entity_type_manager;
    $this->datastoreService = $datastore_service;
    $this->metastoreService = $metastore_service;
    $this->dataFactory = $data_factory;
    $this->dictionaryDiscovery = $dictionary_discovery;
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
   * Create data dictionaries for datastore resources.
   *
   * Analyzes existing datastore schemas and creates data dictionaries
   * with field definitions based on the actual table structure.
   *
   * @command dkan-client:create-data-dictionaries
   * @usage dkan-client:create-data-dictionaries
   *   Creates data dictionaries for all datastore resources.
   * @aliases dkan-client-dictionaries
   */
  public function createDataDictionaries() {
    $this->logger()->notice('Creating data dictionaries from datastore schemas...');

    $created = 0;
    $skipped = 0;
    $errors = 0;

    try {
      // Get all distributions from metastore.
      try {
        $distributions = $this->metastoreService->getAll('distribution');
      }
      catch (\Exception $e) {
        $this->logger()->error('Failed to retrieve distributions from metastore: ' . $e->getMessage());
        return;
      }

      if (empty($distributions)) {
        $this->logger()->warning('No distributions found in metastore.');
        return;
      }

      $this->logger()->notice('Found ' . count($distributions) . ' distributions to process.');

      // Get data dictionary storage instance once (reused in loop).
      $dict_storage = $this->dataFactory->getInstance('data-dictionary');

      foreach ($distributions as $distribution) {
        // Distribution is a RootedJsonData object.
        /** @var \RootedData\RootedJsonData $distribution */
        $dist_id = $distribution->get('$.identifier');
        $dist_title = $distribution->get('$.data.title') ?? $dist_id;

        if (!$dist_id) {
          continue;
        }

        // Get resource UUID from downloadURL reference.
        // downloadURL can be a string URL or a %Ref:downloadURL reference.
        $resource_id = $distribution->get(self::JSONPATH_REF_DOWNLOAD_URL);
        if (!$resource_id) {
          // Try direct downloadURL field (for non-referenced resources).
          $resource_id = $distribution->get(self::JSONPATH_DIRECT_DOWNLOAD_URL);
        }

        if (!$resource_id) {
          continue;
        }

        // Check if this resource has a datastore table.
        try {
          $storage = $this->datastoreService->getStorage($resource_id);
          if (!$storage) {
            continue;
          }
        }
        catch (\Exception $e) {
          // No datastore for this resource, skip, but log for debugging.
          $this->logger()->debug('  No datastore for resource: ' . $resource_id . ' (' . $dist_title . '): ' . $e->getMessage());
          continue;
        }

        // Get datastore schema.
        try {
          $schema = $storage->getSchema();
          if (empty($schema['fields'])) {
            $this->logger()->warning('  No fields in schema for: ' . $dist_title);
            $errors++;
            continue;
          }

          // Convert schema fields to data dictionary format.
          $fields = $this->convertSchemaToFields($schema['fields']);

          // Create data dictionary.
          $dict_id = $dist_id . '-dict';

          // Check if dictionary already exists.
          try {
            $existing = $dict_storage->retrieve($dict_id);
            if ($existing) {
              $this->logger()->notice('  Dictionary already exists for: ' . $dist_title);
              $skipped++;
              continue;
            }
          }
          catch (\Exception $e) {
            // Dictionary doesn't exist, proceed with creation.
          }

          $dict_data = [
            'title' => 'Data Dictionary for ' . $dist_title,
            'fields' => $fields,
          ];

          // Store via DataFactory.
          try {
            $dict_storage->store(json_encode(['data' => $dict_data], JSON_THROW_ON_ERROR), $dict_id);
          }
          catch (\JsonException $je) {
            $this->logger()->error('  JSON encoding failed for dictionary "' . $dist_title . '": ' . $je->getMessage());
            $errors++;
            continue;
          }

          $this->logger()->success('  Created dictionary for: ' . $dist_title);
          $created++;
        }
        catch (\Exception $e) {
          $this->logger()->error('  Failed to create dictionary for ' . $dist_title . ': ' . $e->getMessage());
          $errors++;
        }
      }

      // Summary.
      $this->logger()->notice('');
      $this->logger()->notice('Data Dictionary Creation Summary:');
      $this->logger()->notice('  Created: ' . $created);
      $this->logger()->notice('  Skipped: ' . $skipped);
      $this->logger()->notice('  Errors: ' . $errors);

      if ($created > 0) {
        $this->logger()->success('Data dictionaries created successfully!');
      }
    }
    catch (\Exception $e) {
      $this->logger()->error('Error creating data dictionaries: ' . $e->getMessage());
    }
  }

  /**
   * Convert Drupal schema fields to Frictionless data dictionary fields.
   *
   * @param array $schema_fields
   *   Drupal Schema API field definitions.
   *
   * @return array
   *   Frictionless Table Schema field definitions.
   */
  protected function convertSchemaToFields(array $schema_fields) {
    $fields = [];

    foreach ($schema_fields as $field_name => $field_def) {
      // Map Drupal schema type to Frictionless type.
      $type = $this->mapFieldType($field_def['type'] ?? 'varchar');

      // Generate human-readable title.
      $title = $this->generateFieldTitle($field_name);

      $field = [
        'name' => $field_name,
        'title' => $title,
        'type' => $type,
      ];

      // Add format for date types.
      if ($type === 'date' || $type === 'datetime') {
        $field['format'] = 'default';
      }

      // Add description if available from schema.
      if (!empty($field_def['description'])) {
        $field['description'] = $field_def['description'];
      }

      $fields[] = $field;
    }

    return $fields;
  }

  /**
   * Map Drupal schema field type to Frictionless type.
   *
   * @param string $drupal_type
   *   Drupal schema field type.
   *
   * @return string
   *   Frictionless field type.
   */
  protected function mapFieldType($drupal_type) {
    $type_map = [
      'varchar' => 'string',
      'text' => 'string',
      'int' => 'integer',
      'integer' => 'integer',
      'serial' => 'integer',
      'float' => 'number',
      'numeric' => 'number',
      'boolean' => 'boolean',
      'date' => 'date',
      'datetime' => 'datetime',
      'blob' => 'string',
    ];

    return $type_map[$drupal_type] ?? 'string';
  }

  /**
   * Generate human-readable title from field name.
   *
   * @param string $field_name
   *   The field name (typically snake_case).
   *
   * @return string
   *   Human-readable title (Title Case).
   */
  protected function generateFieldTitle($field_name) {
    // Split on underscores and capitalize each word.
    $words = explode('_', $field_name);
    $title_words = array_map('ucfirst', array_map('strtolower', $words));
    return implode(' ', $title_words);
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

    // Create data dictionaries.
    $this->createDataDictionaries();

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
