<?php

namespace Drupal\dkan_client_setup\Commands;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\Entity\Node;
use Drupal\block\Entity\Block;
use Drupal\datastore\DatastoreService;
use Drupal\metastore\MetastoreService;
use Drupal\metastore\Storage\DataFactory;
use Drupal\metastore\DataDictionary\DataDictionaryDiscovery;
use Drupal\harvest\HarvestService;
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
   * The harvest service.
   *
   * @var \Drupal\harvest\HarvestService
   */
  protected $harvestService;

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
   * @param \Drupal\harvest\HarvestService $harvest_service
   *   The harvest service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    DatastoreService $datastore_service,
    MetastoreService $metastore_service,
    DataFactory $data_factory,
    DataDictionaryDiscovery $dictionary_discovery,
    HarvestService $harvest_service
  ) {
    parent::__construct();
    $this->entityTypeManager = $entity_type_manager;
    $this->datastoreService = $datastore_service;
    $this->metastoreService = $metastore_service;
    $this->dataFactory = $data_factory;
    $this->dictionaryDiscovery = $dictionary_discovery;
    $this->harvestService = $harvest_service;
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
    // Clear block plugin discovery cache to ensure newly enabled modules' plugins are available.
    \Drupal::service('plugin.manager.block')->clearCachedDefinitions();

    $blocks = [
      [
        'id' => 'dkan_client_vanilla_demo_block',
        'plugin' => 'dkan_client_demo_vanilla_dataset_search',
        'theme' => $this->getDefaultTheme(),
        'region' => 'content',
        'label' => 'DKAN Dataset Search (Vanilla)',
        'path' => '/vanilla-demo',
      ],
      [
        'id' => 'dkan_client_react_demo_block',
        'plugin' => 'dkan_client_demo_react_dataset_search',
        'theme' => $this->getDefaultTheme(),
        'region' => 'content',
        'label' => 'DKAN Dataset Search (React)',
        'path' => '/react-demo',
      ],
      [
        'id' => 'dkan_client_vue_demo_block',
        'plugin' => 'dkan_dataset_search_vue',
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
   * @option clean Remove existing demo content before setup.
   * @usage dkan-client:setup
   *   Runs complete demo setup (creates pages and places blocks).
   * @usage dkan-client:setup --clean
   *   Removes existing demo content and sample datasets, then runs setup.
   * @aliases dkan-client-demo-setup
   */
  public function setupDemo(array $options = ['clean' => FALSE]) {
    $this->logger()->notice('Starting DKAN Client Tools demo setup...');

    // Clean existing content if requested.
    if ($options['clean']) {
      $this->logger()->notice('Clean option enabled - removing existing content first...');
      $this->cleanAll();
    }

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
   * Remove all demo content and sample datasets.
   *
   * Cleans demo pages, blocks, data dictionaries, and sample datasets.
   */
  protected function cleanAll() {
    $this->logger()->notice('Removing all demo content and sample datasets...');

    // Clean in reverse order of dependencies.
    $this->cleanBlocks();
    $this->cleanDemoPages();
    $this->cleanDataDictionaries();
    $this->cleanSampleContent();

    $this->logger()->success('All demo content and sample datasets removed.');
  }

  /**
   * Remove demo pages created by setup.
   *
   * @return int
   *   Number of pages deleted.
   */
  protected function cleanDemoPages() {
    $deleted = 0;

    $page_titles = [
      'Vanilla JavaScript Demo',
      'React Demo',
      'Vue Demo',
    ];

    foreach ($page_titles as $title) {
      try {
        $nodes = $this->entityTypeManager
          ->getStorage('node')
          ->loadByProperties([
            'type' => 'page',
            'title' => $title,
          ]);

        if (!empty($nodes)) {
          foreach ($nodes as $node) {
            $node->delete();
            $deleted++;
            $this->logger()->success('Deleted page: ' . $title);
          }
        }
        else {
          $this->logger()->notice('Page not found (already deleted): ' . $title);
        }
      }
      catch (\Exception $e) {
        $this->logger()->error('Failed to delete page "' . $title . '": ' . $e->getMessage());
      }
    }

    $this->logger()->notice('Demo pages cleanup: ' . $deleted . ' deleted.');
    return $deleted;
  }

  /**
   * Remove demo blocks created by setup.
   *
   * @return int
   *   Number of blocks deleted.
   */
  protected function cleanBlocks() {
    $deleted = 0;

    $block_ids = [
      'dkan_client_vanilla_demo_block',
      'dkan_client_react_demo_block',
      'dkan_client_vue_demo_block',
    ];

    foreach ($block_ids as $block_id) {
      try {
        $block = Block::load($block_id);
        if ($block) {
          $label = $block->label();
          $block->delete();
          $deleted++;
          $this->logger()->success('Deleted block: ' . $label);
        }
        else {
          $this->logger()->notice('Block not found (already deleted): ' . $block_id);
        }
      }
      catch (\Exception $e) {
        $this->logger()->error('Failed to delete block "' . $block_id . '": ' . $e->getMessage());
      }
    }

    $this->logger()->notice('Demo blocks cleanup: ' . $deleted . ' deleted.');
    return $deleted;
  }

  /**
   * Remove data dictionaries created by setup.
   *
   * Removes all data dictionaries matching the *-dict pattern.
   *
   * @return int
   *   Number of dictionaries deleted.
   */
  protected function cleanDataDictionaries() {
    $deleted = 0;
    $errors = 0;

    try {
      $dict_storage = $this->dataFactory->getInstance('data-dictionary');

      // Get all data dictionaries.
      try {
        $dictionaries = $this->metastoreService->getAll('data-dictionary');
      }
      catch (\Exception $e) {
        $this->logger()->notice('No data dictionaries found to clean: ' . $e->getMessage());
        return 0;
      }

      if (empty($dictionaries)) {
        $this->logger()->notice('No data dictionaries found to clean.');
        return 0;
      }

      foreach ($dictionaries as $dictionary) {
        /** @var \RootedData\RootedJsonData $dictionary */
        $dict_id = $dictionary->get('$.identifier');
        $dict_title = $dictionary->get('$.data.title') ?? $dict_id;

        if (!$dict_id) {
          continue;
        }

        // Only delete dictionaries with -dict suffix (created by setup).
        if (str_ends_with($dict_id, '-dict')) {
          try {
            $dict_storage->remove($dict_id);
            $deleted++;
            $this->logger()->success('Deleted data dictionary: ' . $dict_title);
          }
          catch (\Exception $e) {
            $this->logger()->error('Failed to delete dictionary "' . $dict_title . '": ' . $e->getMessage());
            $errors++;
          }
        }
      }

      $this->logger()->notice('Data dictionaries cleanup: ' . $deleted . ' deleted, ' . $errors . ' errors.');
    }
    catch (\Exception $e) {
      $this->logger()->error('Error during data dictionary cleanup: ' . $e->getMessage());
    }

    return $deleted;
  }

  /**
   * Remove sample content datasets.
   *
   * Reverts and deregisters the sample_content harvest plan.
   *
   * @return int
   *   Number of items reverted.
   */
  protected function cleanSampleContent() {
    $harvest_id = 'sample_content';

    try {
      // Check if harvest plan exists.
      if (!$this->harvestService->getHarvestPlanObject($harvest_id)) {
        $this->logger()->notice('Sample content harvest plan not found (already removed).');
        return 0;
      }

      // Revert harvest (deletes all harvested datasets).
      $this->logger()->notice('Reverting sample content harvest...');
      $count = $this->harvestService->revertHarvest($harvest_id);
      $this->logger()->success('Reverted ' . $count . ' sample content items.');

      // Deregister harvest plan.
      $this->logger()->notice('Deregistering sample content harvest plan...');
      $this->harvestService->deregisterHarvest($harvest_id);
      $this->logger()->success('Sample content harvest plan deregistered.');

      return $count;
    }
    catch (\Exception $e) {
      $this->logger()->error('Error during sample content cleanup: ' . $e->getMessage());
      return 0;
    }
  }

  /**
   * Create DKAN API user with auto-generated secure password.
   *
   * Creates a dedicated user account for API access with minimal permissions.
   * Auto-generates a secure password and saves credentials to .env file.
   *
   * @command dkan-client:create-api-user
   * @option username The username for the API user.
   * @option save-to Path to save credentials (relative to Drupal root).
   * @option regenerate Regenerate password for existing user.
   * @usage dkan-client:create-api-user
   *   Creates API user and saves credentials to ../.env (project root)
   * @usage dkan-client:create-api-user --regenerate
   *   Regenerates password for existing API user.
   * @usage dkan-client:create-api-user --save-to=../.env.local
   *   Saves credentials to custom location.
   * @aliases dkan-api-user
   */
  public function createApiUser(array $options = [
    'username' => 'dkan-api-user',
    'save-to' => '../.env',
    'regenerate' => FALSE,
  ]) {
    $username = $options['username'];
    $save_path = $options['save-to'];
    $regenerate = $options['regenerate'];

    $this->logger()->notice("Creating DKAN API user: {$username}");

    try {
      // Resolve absolute path for .env file check
      $drupal_root = \Drupal::root();
      $raw_path = $drupal_root . '/' . $save_path;
      $absolute_path = $this->normalizePath($raw_path);

      // Check if .env file already exists with credentials
      $env_exists = file_exists($absolute_path);
      if ($env_exists) {
        $env_content = file_get_contents($absolute_path);
        $has_credentials = (strpos($env_content, 'DKAN_USER=') !== FALSE &&
                           strpos($env_content, 'DKAN_PASS=') !== FALSE);
      } else {
        $has_credentials = FALSE;
      }

      // Load or create user.
      $user_storage = $this->entityTypeManager->getStorage('user');
      $users = $user_storage->loadByProperties(['name' => $username]);
      $user = !empty($users) ? reset($users) : NULL;

      // Check if user exists and handle regeneration.
      if ($user) {
        // If user exists and .env has credentials, only regenerate if explicitly requested
        if ($has_credentials && !$regenerate) {
          $this->logger()->notice("User '{$username}' already exists with credentials in {$save_path}");
          $this->logger()->notice("Use --regenerate to update password.");
          return;
        }
        // If user exists but no .env credentials, force regeneration
        if (!$has_credentials) {
          $this->logger()->notice("User exists but credentials not found in .env - regenerating password");
          $regenerate = TRUE;
        }
        $this->logger()->notice("Regenerating password for existing user: {$username}");
      }
      else {
        $this->logger()->notice("Creating new user: {$username}");
      }

      // Generate secure random password (32 characters).
      $password = $this->generateSecurePassword(32);

      if (!$user) {
        // Create new user.
        $user = $user_storage->create([
          'name' => $username,
          'mail' => "{$username}@localhost",
          'pass' => $password,
          'status' => 1,
        ]);
        $user->save();
        $this->logger()->success("Created user: {$username}");
      }
      else {
        // Update existing user password.
        $user->setPassword($password);
        $user->save();
        $this->logger()->success("Updated password for user: {$username}");
      }

      // Assign authenticated user role (has API access by default).
      // DKAN APIs are generally accessible to authenticated users.
      // If specific permissions are needed, you can create a custom role here.
      $this->logger()->notice("User has 'authenticated' role with API access.");

      // Save credentials to .env file.
      $this->saveCredentials($save_path, $username, $password);

      $this->logger()->success('==============================================');
      $this->logger()->success('API User Created Successfully!');
      $this->logger()->success('==============================================');
      $this->logger()->notice("Username: {$username}");
      $this->logger()->notice("Password: [saved to {$save_path}]");
      $this->logger()->notice('');
      $this->logger()->notice('Credentials saved to: ' . $save_path);
      $this->logger()->notice('Use these credentials for API scripts and tools.');
      $this->logger()->success('==============================================');
    }
    catch (\Exception $e) {
      $this->logger()->error('Failed to create API user: ' . $e->getMessage());
      throw $e;
    }
  }

  /**
   * Generate a cryptographically secure random password.
   *
   * @param int $length
   *   The desired password length.
   *
   * @return string
   *   The generated password.
   */
  protected function generateSecurePassword($length = 32) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_=+';
    $characters_length = strlen($characters);
    $password = '';

    for ($i = 0; $i < $length; $i++) {
      $random_index = random_int(0, $characters_length - 1);
      $password .= $characters[$random_index];
    }

    return $password;
  }

  /**
   * Save API credentials to .env file.
   *
   * @param string $file_path
   *   Path to .env file (relative to Drupal root).
   * @param string $username
   *   The API username.
   * @param string $password
   *   The API password.
   */
  protected function saveCredentials($file_path, $username, $password) {
    // Resolve absolute path.
    $drupal_root = \Drupal::root();
    $raw_path = $drupal_root . '/' . $file_path;

    // Normalize path to resolve .. components manually
    // This is more reliable than realpath() when the file doesn't exist yet
    $absolute_path = $this->normalizePath($raw_path);

    $this->logger()->notice("Drupal root: {$drupal_root}");
    $this->logger()->notice("Raw path: {$raw_path}");
    $this->logger()->notice("Normalized path: {$absolute_path}");
    $this->logger()->notice("Saving credentials to: {$absolute_path}");

    // Backup existing file if it exists.
    if (file_exists($absolute_path)) {
      $backup_path = $absolute_path . '.backup';
      copy($absolute_path, $backup_path);
      $this->logger()->notice("Backed up existing file to: {$file_path}.backup");

      // Read existing file and update DKAN credentials.
      $existing_content = file_get_contents($absolute_path);
      $updated_content = $this->updateEnvContent($existing_content, $username, $password);
      file_put_contents($absolute_path, $updated_content);
    }
    else {
      // Create new .env file with credentials.
      $content = $this->createEnvContent($username, $password);
      file_put_contents($absolute_path, $content);
      $this->logger()->notice("Created new credentials file: {$file_path}");
    }

    // Set restrictive permissions (readable only by owner).
    chmod($absolute_path, 0600);
    $this->logger()->notice("Set file permissions to 0600 (owner read/write only)");
  }

  /**
   * Update existing .env file content with new credentials.
   *
   * @param string $content
   *   Existing .env file content.
   * @param string $username
   *   The API username.
   * @param string $password
   *   The API password.
   *
   * @return string
   *   Updated .env file content.
   */
  protected function updateEnvContent($content, $username, $password) {
    $lines = explode("\n", $content);
    $updated_lines = [];
    $found_user = FALSE;
    $found_pass = FALSE;

    foreach ($lines as $line) {
      if (strpos($line, 'DKAN_USER=') === 0) {
        $updated_lines[] = "DKAN_USER=\"{$username}\"";
        $found_user = TRUE;
      }
      elseif (strpos($line, 'DKAN_PASS=') === 0) {
        $updated_lines[] = "DKAN_PASS=\"{$password}\"";
        $found_pass = TRUE;
      }
      else {
        $updated_lines[] = $line;
      }
    }

    // Add missing credentials if not found.
    if (!$found_user) {
      $updated_lines[] = "DKAN_USER=\"{$username}\"";
    }
    if (!$found_pass) {
      $updated_lines[] = "DKAN_PASS=\"{$password}\"";
    }

    return implode("\n", $updated_lines);
  }

  /**
   * Create new .env file content with credentials.
   *
   * @param string $username
   *   The API username.
   * @param string $password
   *   The API password.
   *
   * @return string
   *   .env file content.
   */
  protected function createEnvContent($username, $password) {
    $content = <<<EOT
# DKAN Client Tools - API Credentials
# Auto-generated by dkan-client:create-api-user command
# DO NOT commit this file to version control

# DKAN API User (auto-generated)
DKAN_USER="{$username}"
DKAN_PASS="{$password}"

# DKAN site URL
DKAN_URL="https://dkan.ddev.site"

# Recording mode (optional)
READ_ONLY=false

# Cleanup mode (optional)
CLEANUP_ONLY=false
EOT;

    return $content;
  }

  /**
   * Normalize a file path by resolving . and .. components.
   *
   * @param string $path
   *   The path to normalize.
   *
   * @return string
   *   The normalized path.
   */
  protected function normalizePath($path) {
    // Replace backslashes with forward slashes
    $path = str_replace('\\', '/', $path);

    // Split path into parts
    $parts = explode('/', $path);
    $normalized = [];

    foreach ($parts as $part) {
      if ($part === '' || $part === '.') {
        // Skip empty parts and current directory references
        if ($part === '' && count($normalized) === 0) {
          // Keep leading slash for absolute paths
          $normalized[] = '';
        }
        continue;
      }
      elseif ($part === '..') {
        // Go up one directory
        if (count($normalized) > 0) {
          array_pop($normalized);
        }
      }
      else {
        // Regular directory/file name
        $normalized[] = $part;
      }
    }

    // Reconstruct the path
    $result = implode('/', $normalized);

    // Ensure absolute paths start with /
    if (isset($parts[0]) && $parts[0] === '' && $result[0] !== '/') {
      $result = '/' . $result;
    }

    return $result;
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
