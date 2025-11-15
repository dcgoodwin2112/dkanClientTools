# Drupal 10 Platform Reference

Reference documentation for Drupal 10 architecture and development patterns.

**Last Updated**: 2025-11-15
**Related Documentation**:
- [DKAN Features](./DKAN_FEATURES.md)
- [DKAN API](./DKAN_API.md)
- [Drupal Integration](../docs/DRUPAL_INTEGRATION.md)

## Quick Reference

**Current Version**: Drupal 10.5.6 (in this project)

**Core Concepts**:
- Entity API - Data modeling (nodes, users, custom entities)
- Configuration Management - YAML-based config export/import
- Service Container - Symfony dependency injection
- Hook System - Event-driven extensibility
- Plugin System - Reusable, discoverable components

**Common Drush Commands**:
- `drush cr` - Clear cache
- `drush en module_name` - Enable module
- `drush updb` - Run database updates
- `drush cex` - Export configuration
- `drush cim` - Import configuration

**File Structure**:
- `docroot/core/` - Drupal core
- `docroot/modules/` - Contributed and custom modules
- `docroot/themes/` - Themes
- `docroot/sites/default/` - Site configuration and files

**API Paths**:
- REST API: `/api/1/` (DKAN)
- JSON:API: `/jsonapi/` (Drupal core)
- Admin UI: `/admin/`

---

## Table of Contents

- [Overview](#overview)
- [Drupal 10 Architecture](#drupal-10-architecture)
  - [Core Architecture Overview](#core-architecture-overview)
  - [Request Lifecycle](#request-lifecycle)
  - [Entity System](#entity-system)
  - [Configuration Management System](#configuration-management-system)
  - [Database Layer and Schema API](#database-layer-and-schema-api)
  - [Dependency Injection Container](#dependency-injection-container)
  - [Service Architecture](#service-architecture)
  - [Hook System and Event System](#hook-system-and-event-system)
- [Module System](#module-system)
  - [Module Structure and Anatomy](#module-structure-and-anatomy)
  - [Module Lifecycle](#module-lifecycle)
  - [Hook System](#hook-system)
  - [Event Subscribers](#event-subscribers)
  - [Plugin System](#plugin-system)
  - [Module Dependencies](#module-dependencies)
  - [Custom Module Development](#custom-module-development)
- [DKAN Integration](#dkan-integration)
  - [How DKAN Modules Integrate with Drupal](#how-dkan-modules-integrate-with-drupal)
  - [DKAN's Use of Drupal Entities](#dkans-use-of-drupal-entities)
  - [Metastore Module Architecture](#metastore-module-architecture)
  - [Datastore Module Architecture](#datastore-module-architecture)
  - [DKAN's REST API Endpoints via Drupal Routing](#dkans-rest-api-endpoints-via-drupal-routing)
- [Entity System](#entity-system-1)
  - [Entity Types](#entity-types)
  - [Core Entity Types](#core-entity-types)
  - [Entity Fields and Field API](#entity-fields-and-field-api)
  - [Entity Reference Fields](#entity-reference-fields)
  - [Entity Query API](#entity-query-api)
  - [Entity Storage](#entity-storage)
- [Configuration Management](#configuration-management)
  - [Configuration vs Content](#configuration-vs-content)
  - [Configuration Storage](#configuration-storage)
  - [Configuration Workflow](#configuration-workflow)
  - [Settings.php and Environment Configuration](#settingsphp-and-environment-configuration)
  - [Development vs Production Settings](#development-vs-production-settings)
- [Database Layer](#database-layer)
  - [Database Abstraction Layer](#database-abstraction-layer)
  - [Schema API](#schema-api)
  - [Query Builders](#query-builders)
- [Drush Command-Line Tool](#drush-command-line-tool)
  - [Drush Basics](#drush-basics)
  - [Common Drush Commands](#common-drush-commands)
  - [DKAN-Specific Drush Commands](#dkan-specific-drush-commands)
  - [Custom Drush Commands](#custom-drush-commands)
- [REST API and JSON:API](#rest-api-and-jsonapi)
  - [Drupal's REST Module](#drupals-rest-module)
  - [JSON:API Module](#jsonapi-module)
  - [Authentication and Permissions](#authentication-and-permissions)
- [Theming System](#theming-system)
- [DDEV Development Environment](#ddev-development-environment)
- [Routing System](#routing-system)
- [Service Container](#service-container)
- [Drupal 10 vs Drupal 11](#drupal-10-vs-drupal-11)
- [Best Practices](#best-practices)
- [Common Tasks](#common-tasks)
- [References](#references)

---

## Overview

Drupal is an open-source content management system (CMS) and application framework written in PHP. Drupal 10 is the foundation for DKAN 2.x, providing the entity system, API framework, and module architecture that DKAN builds upon.

**Why Drupal?**
- Enterprise-grade CMS with proven scalability
- Powerful entity and field system
- Comprehensive REST APIs (REST module, JSON:API)
- Modular architecture with 50,000+ contributed modules
- Strong security track record and practices
- Active community and extensive documentation

**DKAN on Drupal:**
- DKAN 2.21 runs on Drupal 10.5.6 (actual version in this project)
- Uses Drupal entities for datasets and resources
- Leverages Drupal's REST APIs for data access
- Extends Drupal with custom modules (metastore, datastore, harvest)
- Benefits from Drupal's configuration management
- Integrates with Drupal's theming and rendering system

**In This Project:**
- Local DDEV development environment (`/dkan` directory)
- Drupal 10.5.6 with DKAN 2.21 installed
- Sample datasets via DKAN modules
- Access at https://dkan.ddev.site
- Drush for command-line management

---

## Drupal 10 Architecture

### Core Architecture Overview

Drupal follows a layered architecture pattern:

```
User Request (HTTP)
    ↓
Web Server (nginx/Apache)
    ↓
index.php (Bootstrap)
    ↓
Kernel (HTTP/Console)
    ↓
Routing System
    ↓
Access Control
    ↓
Controller/Page Callback
    ↓
Business Logic (Entities, Services)
    ↓
Render System
    ↓
Theme Layer (Twig)
    ↓
HTTP Response
```

**Key Components:**
- **Bootstrap**: Initialize Drupal environment
- **Kernel**: Handle HTTP requests (Symfony HttpKernel)
- **Routing**: Match URLs to controllers
- **Dependency Injection**: Service container (Symfony DI)
- **Entity System**: Data modeling and storage
- **Render System**: Build renderable arrays
- **Theme System**: Twig templates for output

---

### Request Lifecycle

**Detailed Request Flow:**

```
1. index.php
   - Load autoloader (Composer)
   - Create Drupal kernel
   - Handle request

2. Bootstrap Phase
   - Load settings.php
   - Initialize database connection
   - Load configuration
   - Initialize service container
   - Discover modules and themes

3. Routing Phase
   - Match URL to route
   - Load route definition
   - Check access requirements
   - Determine controller

4. Controller Phase
   - Instantiate controller
   - Inject dependencies
   - Execute controller method
   - Return render array or response

5. Render Phase
   - Process render arrays
   - Apply theme hooks
   - Render Twig templates
   - Apply CSS/JS assets

6. Response Phase
   - Create HTTP response
   - Apply response event subscribers
   - Set headers (caching, CORS, etc.)
   - Send response to client
```

**Example Route to Response:**

```yaml
# mymodule.routing.yml
mymodule.dataset_view:
  path: '/dataset/{uuid}'
  defaults:
    _controller: '\Drupal\mymodule\Controller\DatasetController::view'
    _title: 'View Dataset'
  requirements:
    _permission: 'access content'
    uuid: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
```

```php
<?php
namespace Drupal\mymodule\Controller;

use Drupal\Core\Controller\ControllerBase;

class DatasetController extends ControllerBase {
  public function view($uuid) {
    // Load dataset entity
    $dataset = \Drupal::entityTypeManager()
      ->getStorage('dataset')
      ->loadByUuid($uuid);

    // Return render array
    return [
      '#theme' => 'dataset',
      '#dataset' => $dataset,
      '#cache' => ['tags' => $dataset->getCacheTags()],
    ];
  }
}
```

---

### Entity System

**Entity Types:**

Drupal uses entities as its primary data model. Entities are structured, fieldable data objects.

**Entity Type Categories:**

1. **Content Entities** (store content in database)
   - node (basic page, article, dataset)
   - user
   - taxonomy_term
   - file
   - comment
   - Custom content entities

2. **Configuration Entities** (store config in YAML)
   - node_type (content type definition)
   - view
   - field_storage_config
   - Custom config entities

**Core Entity Types:**

| Entity Type | Machine Name | Purpose |
|-------------|--------------|---------|
| Node | `node` | Primary content type (articles, pages, datasets) |
| User | `user` | User accounts |
| Taxonomy Term | `taxonomy_term` | Classification/tagging |
| File | `file` | Uploaded files (images, documents) |
| Comment | `comment` | User comments on content |
| Media | `media` | Media assets (images, videos, documents) |

**Entity Structure:**

```php
<?php
// Load entity
$node = \Drupal::entityTypeManager()
  ->getStorage('node')
  ->load($nid);

// Entity properties
$node->id();              // Entity ID
$node->uuid();            // UUID
$node->bundle();          // Bundle (content type)
$node->label();           // Human-readable label
$node->isPublished();     // Published status

// Field values
$node->get('title')->value;
$node->get('body')->value;
$node->get('field_dataset')->entity;  // Referenced entity

// Save entity
$node->save();
```

---

### Configuration Management System

**Configuration vs Content:**

| Configuration | Content |
|---------------|---------|
| Site structure and settings | User-generated data |
| Stored in YAML files | Stored in database |
| Versioned with code | Managed through UI |
| Examples: content types, views, field definitions | Examples: nodes, users, files |

**Configuration Storage:**

```
sites/default/files/config_[hash]/sync/
├── core.extension.yml          # Enabled modules/themes
├── system.site.yml             # Site name, email, etc.
├── node.type.dataset.yml       # Dataset content type
├── field.storage.node.field_*.yml  # Field storage
├── views.view.datasets.yml     # Views configuration
└── ...
```

**Configuration Workflow:**

```bash
# Export current config
ddev drush config:export

# Import config from files
ddev drush config:import

# Show config differences
ddev drush config:status

# Export single config item
ddev drush config:get system.site

# Import single config item
ddev drush config:set system.site name "My DKAN Site"
```

---

### Database Layer and Schema API

**Database Abstraction:**

Drupal provides a database-agnostic layer supporting MySQL, PostgreSQL, SQLite.

**Query API:**

```php
<?php
// Select query
$query = \Drupal::database()->select('node_field_data', 'n');
$query->fields('n', ['nid', 'title', 'created']);
$query->condition('n.type', 'dataset');
$query->condition('n.status', 1);
$query->orderBy('n.created', 'DESC');
$query->range(0, 10);
$results = $query->execute()->fetchAll();

// Insert query
\Drupal::database()->insert('mytable')
  ->fields(['name', 'value'])
  ->values(['Dataset 1', 'value1'])
  ->execute();

// Update query
\Drupal::database()->update('mytable')
  ->fields(['value' => 'new_value'])
  ->condition('name', 'Dataset 1')
  ->execute();

// Delete query
\Drupal::database()->delete('mytable')
  ->condition('name', 'Dataset 1')
  ->execute();
```

**Schema API:**

```php
<?php
// Define schema in mymodule.install
function mymodule_schema() {
  $schema['mymodule_datasets'] = [
    'description' => 'Stores dataset metadata',
    'fields' => [
      'id' => [
        'type' => 'serial',
        'not null' => TRUE,
        'description' => 'Primary key',
      ],
      'uuid' => [
        'type' => 'varchar',
        'length' => 128,
        'not null' => TRUE,
        'description' => 'UUID',
      ],
      'title' => [
        'type' => 'varchar',
        'length' => 255,
        'not null' => TRUE,
        'description' => 'Dataset title',
      ],
      'data' => [
        'type' => 'text',
        'size' => 'big',
        'description' => 'JSON data',
      ],
    ],
    'primary key' => ['id'],
    'unique keys' => [
      'uuid' => ['uuid'],
    ],
    'indexes' => [
      'title' => ['title'],
    ],
  ];

  return $schema;
}
```

---

### Dependency Injection Container

**Service Container:**

Drupal uses Symfony's dependency injection container for managing services.

**Defining Services:**

```yaml
# mymodule.services.yml
services:
  mymodule.dataset_manager:
    class: Drupal\mymodule\DatasetManager
    arguments: ['@entity_type.manager', '@config.factory', '@logger.factory']
```

**Service Class:**

```php
<?php
namespace Drupal\mymodule;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;

class DatasetManager {

  protected $entityTypeManager;
  protected $configFactory;
  protected $logger;

  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('mymodule');
  }

  public function getDataset($uuid) {
    return $this->entityTypeManager
      ->getStorage('node')
      ->loadByProperties(['uuid' => $uuid]);
  }
}
```

**Using Services:**

```php
<?php
// In procedural code (avoid if possible)
$dataset_manager = \Drupal::service('mymodule.dataset_manager');

// In OOP (dependency injection - preferred)
class MyController extends ControllerBase {

  protected $datasetManager;

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('mymodule.dataset_manager')
    );
  }

  public function __construct(DatasetManager $dataset_manager) {
    $this->datasetManager = $dataset_manager;
  }

  public function view($uuid) {
    $dataset = $this->datasetManager->getDataset($uuid);
    // ...
  }
}
```

---

### Service Architecture

**Common Core Services:**

| Service | Purpose |
|---------|---------|
| `entity_type.manager` | Manage entity types and storage |
| `config.factory` | Access configuration |
| `database` | Database queries |
| `cache.default` | Cache bin |
| `logger.factory` | Logging channels |
| `current_user` | Current user session |
| `path.matcher` | URL path matching |
| `module_handler` | Module information and hooks |
| `theme.manager` | Theme information |
| `renderer` | Render arrays to HTML |

**Service Tags:**

```yaml
services:
  mymodule.event_subscriber:
    class: Drupal\mymodule\EventSubscriber\MyEventSubscriber
    tags:
      - { name: event_subscriber }

  mymodule.access_check:
    class: Drupal\mymodule\Access\DatasetAccessCheck
    tags:
      - { name: access_check, applies_to: _dataset_access }
```

---

### Hook System and Event System

**Drupal Hooks:**

Hooks allow modules to alter or extend Drupal's behavior.

**Common Hooks:**

```php
<?php
/**
 * Implements hook_form_alter().
 */
function mymodule_form_alter(&$form, $form_state, $form_id) {
  if ($form_id == 'node_dataset_form') {
    $form['title']['#description'] = 'Enter dataset title';
  }
}

/**
 * Implements hook_entity_presave().
 */
function mymodule_entity_presave($entity) {
  if ($entity->getEntityTypeId() == 'node' && $entity->bundle() == 'dataset') {
    // Modify entity before saving
    $entity->set('field_modified', time());
  }
}

/**
 * Implements hook_preprocess_HOOK().
 */
function mymodule_preprocess_node(&$variables) {
  if ($variables['node']->bundle() == 'dataset') {
    $variables['dataset_metadata'] = _mymodule_get_metadata($variables['node']);
  }
}

/**
 * Implements hook_cron().
 */
function mymodule_cron() {
  // Run periodic tasks
  $manager = \Drupal::service('mymodule.dataset_manager');
  $manager->updateStatistics();
}
```

**Event Subscribers (Symfony Events):**

```php
<?php
namespace Drupal\mymodule\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class MyEventSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents() {
    $events[KernelEvents::REQUEST][] = ['onRequest', 100];
    return $events;
  }

  public function onRequest(RequestEvent $event) {
    $request = $event->getRequest();
    // Modify request
  }
}
```

---

## Module System

### Module Structure and Anatomy

**Basic Module Structure:**

```
mymodule/
├── mymodule.info.yml          # Module metadata
├── mymodule.module             # Hook implementations
├── mymodule.install            # Install/update hooks
├── mymodule.services.yml       # Service definitions
├── mymodule.routing.yml        # Route definitions
├── mymodule.permissions.yml    # Permissions
├── config/
│   ├── install/                # Default config on install
│   │   └── mymodule.settings.yml
│   └── schema/                 # Config schema definitions
│       └── mymodule.schema.yml
├── src/
│   ├── Controller/             # Controllers
│   │   └── DatasetController.php
│   ├── Entity/                 # Custom entities
│   │   └── Dataset.php
│   ├── Form/                   # Forms
│   │   └── DatasetForm.php
│   ├── Plugin/                 # Plugins (blocks, fields, etc.)
│   │   └── Block/
│   │       └── DatasetBlock.php
│   └── Service/                # Services
│       └── DatasetManager.php
└── templates/                  # Twig templates
    └── dataset.html.twig
```

**mymodule.info.yml:**

```yaml
name: My Module
description: Custom module for dataset management
type: module
core_version_requirement: ^10
package: Custom

dependencies:
  - drupal:node
  - drupal:field
  - dkan:metastore

configure: mymodule.settings

version: '1.0.0'
```

---

### Module Lifecycle

**Installation:**

```php
<?php
/**
 * Implements hook_install().
 */
function mymodule_install() {
  // Create default configuration
  \Drupal::configFactory()
    ->getEditable('mymodule.settings')
    ->set('api_key', '')
    ->save();

  // Create sample content
  $node = Node::create([
    'type' => 'dataset',
    'title' => 'Sample Dataset',
  ]);
  $node->save();
}

/**
 * Implements hook_uninstall().
 */
function mymodule_uninstall() {
  // Clean up on uninstall
  \Drupal::configFactory()
    ->getEditable('mymodule.settings')
    ->delete();

  // Delete custom tables
  \Drupal::database()->schema()->dropTable('mymodule_data');
}
```

**Updates:**

```php
<?php
/**
 * Add new field to dataset content type.
 */
function mymodule_update_10001() {
  $field_storage = FieldStorageConfig::create([
    'field_name' => 'field_license',
    'entity_type' => 'node',
    'type' => 'string',
  ]);
  $field_storage->save();

  $field = FieldConfig::create([
    'field_storage' => $field_storage,
    'bundle' => 'dataset',
    'label' => 'License',
  ]);
  $field->save();
}

/**
 * Update existing datasets with new field.
 */
function mymodule_update_10002(&$sandbox) {
  // Initialize sandbox for batch processing
  if (!isset($sandbox['progress'])) {
    $sandbox['progress'] = 0;
    $sandbox['max'] = \Drupal::entityQuery('node')
      ->condition('type', 'dataset')
      ->count()
      ->execute();
  }

  // Process batch of 50
  $nids = \Drupal::entityQuery('node')
    ->condition('type', 'dataset')
    ->range($sandbox['progress'], 50)
    ->execute();

  foreach ($nids as $nid) {
    $node = Node::load($nid);
    $node->set('field_license', 'CC0');
    $node->save();
    $sandbox['progress']++;
  }

  $sandbox['#finished'] = $sandbox['progress'] / $sandbox['max'];
}
```

---

### Hook System

**Hook Discovery:**

Drupal automatically discovers hooks by looking for functions named `{module}_{hook}`.

**Alter Hooks:**

```php
<?php
/**
 * Implements hook_form_alter().
 */
function mymodule_form_alter(&$form, $form_state, $form_id) {
  // Alter any form
}

/**
 * Implements hook_form_FORM_ID_alter().
 */
function mymodule_form_node_dataset_form_alter(&$form, $form_state, $form_id) {
  // Alter specific form
}

/**
 * Implements hook_entity_view_alter().
 */
function mymodule_entity_view_alter(&$build, $entity, $display) {
  if ($entity->getEntityTypeId() == 'node') {
    $build['#attached']['library'][] = 'mymodule/dataset-viewer';
  }
}
```

**Important Hooks:**

| Hook | Purpose |
|------|---------|
| `hook_install()` | Module installation |
| `hook_uninstall()` | Module uninstallation |
| `hook_schema()` | Define database schema |
| `hook_update_N()` | Database updates |
| `hook_form_alter()` | Modify forms |
| `hook_entity_presave()` | Before entity save |
| `hook_entity_insert()` | After entity insert |
| `hook_entity_update()` | After entity update |
| `hook_entity_delete()` | After entity delete |
| `hook_cron()` | Periodic tasks |
| `hook_theme()` | Define theme hooks |
| `hook_preprocess_HOOK()` | Modify template variables |
| `hook_page_attachments()` | Add CSS/JS to pages |

---

### Event Subscribers

**Creating Event Subscriber:**

```php
<?php
namespace Drupal\mymodule\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class DatasetEventSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents() {
    return [
      KernelEvents::REQUEST => ['onRequest', 100],
      KernelEvents::RESPONSE => ['onResponse', -100],
    ];
  }

  public function onRequest(RequestEvent $event) {
    $request = $event->getRequest();

    // Add custom header
    if (str_starts_with($request->getPathInfo(), '/api/datasets')) {
      $request->headers->set('X-Dataset-API', '1.0');
    }
  }

  public function onResponse(ResponseEvent $event) {
    $response = $event->getResponse();

    // Add CORS headers
    $response->headers->set('Access-Control-Allow-Origin', '*');
  }
}
```

**Register Event Subscriber:**

```yaml
# mymodule.services.yml
services:
  mymodule.dataset_event_subscriber:
    class: Drupal\mymodule\EventSubscriber\DatasetEventSubscriber
    tags:
      - { name: event_subscriber }
```

---

### Plugin System

**Plugin Types:**

- Blocks
- Fields (field types, widgets, formatters)
- Views plugins
- Actions
- Conditions
- Filters
- Image effects

**Block Plugin Example:**

```php
<?php
namespace Drupal\mymodule\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Dataset Stats' block.
 *
 * @Block(
 *   id = "dataset_stats_block",
 *   admin_label = @Translation("Dataset Statistics"),
 *   category = @Translation("DKAN")
 * )
 */
class DatasetStatsBlock extends BlockBase {

  public function build() {
    $count = \Drupal::entityQuery('node')
      ->condition('type', 'dataset')
      ->condition('status', 1)
      ->count()
      ->execute();

    return [
      '#theme' => 'dataset_stats',
      '#count' => $count,
      '#cache' => [
        'tags' => ['node_list:dataset'],
        'max-age' => 3600,
      ],
    ];
  }
}
```

**Field Type Plugin:**

```php
<?php
namespace Drupal\mymodule\Plugin\Field\FieldType;

use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldStorageDefinitionInterface;

/**
 * Defines the 'dataset_identifier' field type.
 *
 * @FieldType(
 *   id = "dataset_identifier",
 *   label = @Translation("Dataset Identifier"),
 *   description = @Translation("UUID identifier for datasets"),
 *   default_widget = "string_textfield",
 *   default_formatter = "string"
 * )
 */
class DatasetIdentifier extends FieldItemBase {

  public static function schema(FieldStorageDefinitionInterface $field) {
    return [
      'columns' => [
        'value' => [
          'type' => 'varchar',
          'length' => 128,
        ],
      ],
      'indexes' => [
        'value' => ['value'],
      ],
    ];
  }

  public static function propertyDefinitions(FieldStorageDefinitionInterface $field) {
    $properties['value'] = DataDefinition::create('string')
      ->setLabel(t('UUID'));

    return $properties;
  }
}
```

---

### Module Dependencies

**Declaring Dependencies:**

```yaml
# mymodule.info.yml
dependencies:
  - drupal:node               # Core module
  - drupal:field
  - dkan:metastore            # Contrib module
  - myothermodule:myothermodule  # Custom module (namespace:name)
```

**Dependency Management:**

- Modules are enabled in dependency order
- Uninstalling removes dependent modules first
- Configuration dependencies tracked automatically

---

### Custom Module Development

**Creating a Custom Module:**

```bash
# Create module directory
mkdir -p web/modules/custom/mymodule

# Create .info.yml
cat > web/modules/custom/mymodule/mymodule.info.yml <<EOF
name: My Module
type: module
description: Custom dataset functionality
core_version_requirement: ^10
package: Custom
EOF

# Enable module via Drush
ddev drush en mymodule
```

**Module Generator (Drush):**

```bash
# Generate module skeleton
ddev drush generate module

# Generate plugin
ddev drush generate plugin:block

# Generate service
ddev drush generate service
```

---

## DKAN Integration

### How DKAN Modules Integrate with Drupal

**DKAN Architecture on Drupal:**

DKAN is a suite of Drupal modules that extend Drupal's core functionality to create a data catalog platform. For DKAN-specific APIs and endpoints, see [DKAN API](./DKAN_API.md) and [DKAN Features](./DKAN_FEATURES.md).

**DKAN Modules:**

```
dkan/
├── modules/
│   ├── metastore/          # Dataset metadata management
│   │   ├── metastore.info.yml
│   │   ├── src/
│   │   │   ├── MetastoreService.php
│   │   │   ├── Controller/
│   │   │   ├── Entity/
│   │   │   └── Storage/
│   │   └── metastore.routing.yml
│   ├── datastore/          # Data storage and querying
│   ├── harvest/            # Harvesting external catalogs
│   ├── sample_content/     # Sample dataset generator
│   └── common/             # Shared utilities
```

**Integration Points:**

1. **Entities**: DKAN uses custom entities or extends nodes
2. **Routes**: Custom REST API endpoints (`/api/1/metastore/...`)
3. **Services**: Business logic in DI services
4. **Configuration**: DKAN-specific config entities
5. **Database**: Custom tables for datastore
6. **Hooks**: Integrates with Drupal's hook system

---

### DKAN's Use of Drupal Entities

**Dataset Storage:**

DKAN can store datasets as:
- Custom content entities
- Nodes with custom content type
- JSON in custom tables

**Example Dataset Entity:**

```php
<?php
namespace Drupal\metastore\Entity;

use Drupal\Core\Entity\ContentEntityBase;

/**
 * Defines the Dataset entity.
 *
 * @ContentEntityType(
 *   id = "dataset",
 *   label = @Translation("Dataset"),
 *   base_table = "metastore_dataset",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "label" = "title"
 *   }
 * )
 */
class Dataset extends ContentEntityBase {

  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);

    $fields['title'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Title'))
      ->setRequired(TRUE);

    $fields['data'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Metadata'))
      ->setDescription(t('JSON metadata following DCAT-US schema'));

    return $fields;
  }
}
```

---

### Metastore Module Architecture

**Purpose**: Manages dataset metadata following DCAT-US schema.

**Key Components:**

```php
<?php
// Metastore Service
namespace Drupal\metastore;

class MetastoreService {

  // Store dataset metadata
  public function post($data, $identifier = NULL) {
    // Validate against DCAT-US schema
    $this->validateSchema($data);

    // Store in database
    $storage = $this->getStorage();
    return $storage->store($data, $identifier);
  }

  // Retrieve dataset
  public function get($identifier) {
    $storage = $this->getStorage();
    return $storage->retrieve($identifier);
  }

  // List all datasets
  public function getAll() {
    $storage = $this->getStorage();
    return $storage->retrieveAll();
  }
}
```

**REST Endpoints:**

```
POST   /api/1/metastore/schemas/dataset/items
GET    /api/1/metastore/schemas/dataset/items/{uuid}
PUT    /api/1/metastore/schemas/dataset/items/{uuid}
PATCH  /api/1/metastore/schemas/dataset/items/{uuid}
DELETE /api/1/metastore/schemas/dataset/items/{uuid}
```

---

### Datastore Module Architecture

**Purpose**: Stores and queries actual data referenced by datasets.

**Key Components:**

1. **Datastore Service**: Manages data import and storage
2. **Query Service**: SQL-like queries on stored data
3. **Import Service**: Background data import from CSV/JSON
4. **Database Tables**: Custom tables for each resource

**Datastore Query Example:**

```php
<?php
$datastore = \Drupal::service('dkan.datastore.service');

$result = $datastore->query(
  'dataset-uuid',
  0,  // Resource index
  [
    'conditions' => [
      ['property' => 'state', 'value' => 'VA'],
      ['property' => 'year', 'value' => '2024', 'operator' => '>='],
    ],
    'limit' => 100,
    'offset' => 0,
    'sort' => [
      ['property' => 'date', 'order' => 'desc'],
    ],
  ]
);
```

---

### DKAN's REST API Endpoints via Drupal Routing

**Routing Configuration:**

```yaml
# metastore.routing.yml
metastore.get:
  path: '/api/1/metastore/schemas/dataset/items/{identifier}'
  defaults:
    _controller: '\Drupal\metastore\Controller\MetastoreController::get'
  methods: [GET]
  requirements:
    _permission: 'access content'

metastore.post:
  path: '/api/1/metastore/schemas/dataset/items'
  defaults:
    _controller: '\Drupal\metastore\Controller\MetastoreController::post'
  methods: [POST]
  requirements:
    _permission: 'create dataset'

datastore.query:
  path: '/api/1/datastore/query/{identifier}/{index}'
  defaults:
    _controller: '\Drupal\datastore\Controller\QueryController::query'
  methods: [POST]
  requirements:
    _permission: 'access content'
```

**Controller:**

```php
<?php
namespace Drupal\metastore\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class MetastoreController extends ControllerBase {

  protected $metastore;

  public function get($identifier) {
    $data = $this->metastore->get($identifier);

    if (!$data) {
      return new JsonResponse(['error' => 'Not found'], 404);
    }

    return new JsonResponse($data);
  }

  public function post(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    $identifier = $this->metastore->post($data);

    return new JsonResponse([
      'identifier' => $identifier,
      'endpoint' => "/api/1/metastore/schemas/dataset/items/{$identifier}",
    ], 201);
  }
}
```

---

## Entity System

### Entity Types

**Content Entity Classes:**

```php
<?php
namespace Drupal\mymodule\Entity;

use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;

/**
 * Defines the Dataset entity.
 *
 * @ContentEntityType(
 *   id = "my_dataset",
 *   label = @Translation("Dataset"),
 *   base_table = "my_dataset",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "label" = "title"
 *   },
 *   handlers = {
 *     "view_builder" = "Drupal\Core\Entity\EntityViewBuilder",
 *     "list_builder" = "Drupal\mymodule\DatasetListBuilder",
 *     "form" = {
 *       "add" = "Drupal\mymodule\Form\DatasetForm",
 *       "edit" = "Drupal\mymodule\Form\DatasetForm",
 *       "delete" = "Drupal\Core\Entity\ContentEntityDeleteForm"
 *     },
 *     "access" = "Drupal\mymodule\DatasetAccessControlHandler"
 *   },
 *   links = {
 *     "canonical" = "/dataset/{my_dataset}",
 *     "add-form" = "/dataset/add",
 *     "edit-form" = "/dataset/{my_dataset}/edit",
 *     "delete-form" = "/dataset/{my_dataset}/delete"
 *   }
 * )
 */
class Dataset extends ContentEntityBase {

  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);

    $fields['title'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Title'))
      ->setDescription(t('Dataset title'))
      ->setRequired(TRUE)
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 0,
      ]);

    $fields['description'] = BaseFieldDefinition::create('text_long')
      ->setLabel(t('Description'))
      ->setDisplayOptions('form', [
        'type' => 'text_textarea',
        'weight' => 10,
      ]);

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'));

    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'));

    return $fields;
  }
}
```

---

### Core Entity Types

**Node Entity:**

```php
<?php
// Load node
$node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);

// Create node
$node = Node::create([
  'type' => 'dataset',
  'title' => 'My Dataset',
  'body' => ['value' => 'Description', 'format' => 'basic_html'],
  'field_custom' => 'value',
]);
$node->save();

// Query nodes
$nids = \Drupal::entityQuery('node')
  ->condition('type', 'dataset')
  ->condition('status', 1)
  ->sort('created', 'DESC')
  ->range(0, 10)
  ->execute();

$nodes = Node::loadMultiple($nids);
```

**User Entity:**

```php
<?php
// Current user
$current_user = \Drupal::currentUser();
$uid = $current_user->id();
$account = User::load($uid);

// Create user
$user = User::create([
  'name' => 'johndoe',
  'mail' => 'john@example.com',
  'pass' => 'password',
  'status' => 1,
]);
$user->save();

// Check permissions
if ($current_user->hasPermission('create dataset')) {
  // User can create datasets
}
```

---

### Entity Fields and Field API

**Field Types:**

- text (short, long, formatted)
- number (integer, decimal, float)
- entity_reference (reference other entities)
- boolean
- datetime
- link
- file
- image
- email
- telephone

**Creating Fields Programmatically:**

```php
<?php
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// Create field storage (shared across bundles)
$field_storage = FieldStorageConfig::create([
  'field_name' => 'field_license',
  'entity_type' => 'node',
  'type' => 'list_string',
  'settings' => [
    'allowed_values' => [
      'cc0' => 'CC0 Public Domain',
      'cc-by' => 'CC-BY Attribution',
      'odc-pddl' => 'ODC PDDL',
    ],
  ],
]);
$field_storage->save();

// Create field instance (bundle-specific)
$field = FieldConfig::create([
  'field_storage' => $field_storage,
  'bundle' => 'dataset',
  'label' => 'License',
  'required' => TRUE,
]);
$field->save();

// Configure form display
$form_display = \Drupal::entityTypeManager()
  ->getStorage('entity_form_display')
  ->load('node.dataset.default');

$form_display->setComponent('field_license', [
  'type' => 'options_select',
  'weight' => 10,
])->save();

// Configure view display
$view_display = \Drupal::entityTypeManager()
  ->getStorage('entity_view_display')
  ->load('node.dataset.default');

$view_display->setComponent('field_license', [
  'type' => 'list_default',
  'label' => 'above',
])->save();
```

---

### Entity Reference Fields

**Referencing Entities:**

```php
<?php
// Create reference field
$field_storage = FieldStorageConfig::create([
  'field_name' => 'field_publisher',
  'entity_type' => 'node',
  'type' => 'entity_reference',
  'settings' => [
    'target_type' => 'taxonomy_term',
  ],
]);
$field_storage->save();

$field = FieldConfig::create([
  'field_storage' => $field_storage,
  'bundle' => 'dataset',
  'label' => 'Publisher',
  'settings' => [
    'handler' => 'default',
    'handler_settings' => [
      'target_bundles' => ['publisher'],
    ],
  ],
]);
$field->save();

// Set reference value
$node->set('field_publisher', ['target_id' => $term_id]);
$node->save();

// Get referenced entity
$publisher = $node->get('field_publisher')->entity;
if ($publisher) {
  $name = $publisher->getName();
}
```

---

### Entity Query API

**Entity Query:**

```php
<?php
// Basic query
$query = \Drupal::entityQuery('node')
  ->condition('type', 'dataset')
  ->condition('status', 1);

// Conditions
$query->condition('title', 'Test%', 'LIKE');
$query->condition('created', strtotime('-1 month'), '>');

// Field conditions
$query->condition('field_theme', ['health', 'education'], 'IN');
$query->exists('field_distribution');

// Sorting
$query->sort('created', 'DESC');
$query->sort('title', 'ASC');

// Range (pagination)
$query->range(0, 10);  // LIMIT 0, 10

// Count
$count = $query->count()->execute();

// Access check (optional, defaults to TRUE)
$query->accessCheck(FALSE);

// Execute
$nids = $query->execute();
$nodes = Node::loadMultiple($nids);

// OR conditions
$or_group = $query->orConditionGroup()
  ->condition('field_status', 'published')
  ->condition('field_status', 'archived');
$query->condition($or_group);

// Complex nested conditions
$and_group = $query->andConditionGroup()
  ->condition('field_year', 2024)
  ->condition('field_state', 'VA');

$or_group = $query->orConditionGroup()
  ->condition('field_theme', 'health')
  ->condition($and_group);

$query->condition($or_group);
```

---

### Entity Storage

**Storage Interface:**

```php
<?php
// Get entity storage
$storage = \Drupal::entityTypeManager()->getStorage('node');

// Load single
$node = $storage->load($nid);
$node = $storage->loadByProperties(['uuid' => $uuid]);

// Load multiple
$nodes = $storage->loadMultiple([$nid1, $nid2, $nid3]);
$nodes = $storage->loadByProperties(['type' => 'dataset']);

// Create
$node = $storage->create([
  'type' => 'dataset',
  'title' => 'New Dataset',
]);

// Save
$storage->save($node);

// Delete
$storage->delete([$node]);
```

---

## Configuration Management

### Configuration vs Content

**Configuration:**
- Site structure, not user data
- Exported to YAML files in `sites/default/files/config_*/sync/`
- Versioned with code (Git)
- Deployed across environments

**Examples:**
- Content types, fields, views
- Module settings
- User roles and permissions
- Taxonomy vocabularies (structure, not terms)

**Content:**
- User-generated data
- Stored in database
- Managed through UI or API

**Examples:**
- Nodes, comments, files
- Users
- Taxonomy terms

---

### Configuration Storage

**File Structure:**

```
sites/default/files/config_[hash]/sync/
├── core.extension.yml
├── system.site.yml
├── node.type.dataset.yml
├── field.storage.node.field_title.yml
├── field.field.node.dataset.field_title.yml
├── views.view.datasets.yml
└── ...
```

**Example Configuration File:**

```yaml
# node.type.dataset.yml
uuid: 123e4567-e89b-12d3-a456-426614174000
langcode: en
status: true
dependencies:
  module:
    - menu_ui
third_party_settings:
  menu_ui:
    available_menus:
      - main
    parent: 'main:'
name: Dataset
type: dataset
description: 'A dataset following DCAT-US schema'
help: ''
new_revision: true
preview_mode: 1
display_submitted: false
```

---

### Configuration Workflow

**Export Configuration:**

```bash
# Export all active configuration
ddev drush config:export
# Alias: ddev drush cex

# Export to custom directory
ddev drush config:export --destination=/path/to/config

# Export single config item
ddev drush config:get system.site
ddev drush config:get views.view.datasets

# Export to file
ddev drush config:get views.view.datasets > /tmp/datasets.yml
```

**Import Configuration:**

```bash
# Import all configuration from sync directory
ddev drush config:import
# Alias: ddev drush cim

# Import from custom directory
ddev drush config:import --source=/path/to/config

# Import single config item
ddev drush config:set system.site name "My DKAN Site"

# Import from file
ddev drush config:import --partial --source=/tmp/

# Show differences before import
ddev drush config:status
```

**Configuration Status:**

```bash
# Check for config differences
ddev drush config:status

# Output:
# Collection  Config                          Operation
# ----------------------------------------------------
#             system.site                     Update
#             views.view.datasets             Create
#             field.field.node.dataset.title  Delete
```

---

### Settings.php and Environment Configuration

**sites/default/settings.php:**

```php
<?php
/**
 * Database configuration
 */
$databases['default']['default'] = [
  'database' => 'db',
  'username' => 'db',
  'password' => 'db',
  'host' => 'db',
  'port' => '3306',
  'driver' => 'mysql',
  'prefix' => '',
];

/**
 * Salt for one-time login links, cancel links, form tokens, etc.
 */
$settings['hash_salt'] = 'random-hash-here';

/**
 * Configuration sync directory
 */
$settings['config_sync_directory'] = '../config/sync';

/**
 * Trusted host patterns
 */
$settings['trusted_host_patterns'] = [
  '^dkan\.ddev\.site$',
  '^localhost$',
];

/**
 * Environment-specific settings
 */
if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
  include $app_root . '/' . $site_path . '/settings.local.php';
}
```

**settings.local.php (development):**

```php
<?php
/**
 * Development settings
 */
assert_options(ASSERT_ACTIVE, TRUE);

$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';

// Disable caching
$config['system.performance']['css']['preprocess'] = FALSE;
$config['system.performance']['js']['preprocess'] = FALSE;

// Enable verbose error messages
$config['system.logging']['error_level'] = 'verbose';

// Disable CSS/JS aggregation
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['page'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';

// Enable Twig debugging
$settings['twig_debug'] = TRUE;
$settings['twig_cache'] = FALSE;
$settings['twig_auto_reload'] = TRUE;
```

---

### Development vs Production Settings

**Development:**
- Verbose error messages
- Twig debugging enabled
- CSS/JS aggregation disabled
- Caching disabled
- Assert statements active

**Production:**
- Error logging only
- Twig debugging disabled
- CSS/JS aggregation enabled
- Full caching enabled
- Assert statements inactive

---

## Database Layer

### Database Abstraction Layer

**Database Connection:**

```php
<?php
// Get default database
$database = \Drupal::database();

// Get specific database
$database = Database::getConnection('default', 'migrate');

// Database info
$database->databaseType();  // 'mysql', 'pgsql', 'sqlite'
$database->version();       // Database version
```

---

### Schema API

**Defining Schema:**

```php
<?php
/**
 * Implements hook_schema().
 */
function mymodule_schema() {
  $schema['mymodule_datasets'] = [
    'description' => 'Stores dataset information',
    'fields' => [
      'id' => [
        'type' => 'serial',
        'unsigned' => TRUE,
        'not null' => TRUE,
        'description' => 'Primary key',
      ],
      'uuid' => [
        'type' => 'varchar',
        'length' => 128,
        'not null' => TRUE,
        'description' => 'Dataset UUID',
      ],
      'title' => [
        'type' => 'varchar',
        'length' => 255,
        'not null' => TRUE,
        'description' => 'Dataset title',
      ],
      'data' => [
        'type' => 'blob',
        'size' => 'big',
        'description' => 'Serialized dataset data',
      ],
      'created' => [
        'type' => 'int',
        'not null' => TRUE,
        'description' => 'Timestamp',
      ],
    ],
    'primary key' => ['id'],
    'unique keys' => [
      'uuid' => ['uuid'],
    ],
    'indexes' => [
      'title' => ['title'],
      'created' => ['created'],
    ],
  ];

  return $schema;
}
```

**Schema Operations:**

```php
<?php
$schema = \Drupal::database()->schema();

// Check if table exists
$schema->tableExists('mymodule_datasets');

// Create table
$table_schema = [/* schema definition */];
$schema->createTable('mymodule_datasets', $table_schema);

// Drop table
$schema->dropTable('mymodule_datasets');

// Check if field exists
$schema->fieldExists('mymodule_datasets', 'title');

// Add field
$schema->addField('mymodule_datasets', 'modified', [
  'type' => 'int',
  'description' => 'Modified timestamp',
]);

// Drop field
$schema->dropField('mymodule_datasets', 'modified');

// Add index
$schema->addIndex('mymodule_datasets', 'title', ['title']);

// Drop index
$schema->dropIndex('mymodule_datasets', 'title');
```

---

### Query Builders

**Select Query:**

```php
<?php
$query = \Drupal::database()->select('mymodule_datasets', 'd');
$query->fields('d', ['id', 'uuid', 'title', 'created']);
$query->condition('d.title', '%climate%', 'LIKE');
$query->orderBy('d.created', 'DESC');
$query->range(0, 10);

$results = $query->execute()->fetchAll();
```

**Join Query:**

```php
<?php
$query = \Drupal::database()->select('node_field_data', 'n');
$query->fields('n', ['nid', 'title']);
$query->join('users_field_data', 'u', 'n.uid = u.uid');
$query->fields('u', ['name']);
$query->condition('n.type', 'dataset');

$results = $query->execute()->fetchAll();
```

**Insert Query:**

```php
<?php
// Single insert
$id = \Drupal::database()->insert('mymodule_datasets')
  ->fields([
    'uuid' => 'abc-123',
    'title' => 'Dataset 1',
    'data' => serialize($data),
    'created' => time(),
  ])
  ->execute();

// Multiple insert
\Drupal::database()->insert('mymodule_datasets')
  ->fields(['uuid', 'title', 'created'])
  ->values(['abc-123', 'Dataset 1', time()])
  ->values(['def-456', 'Dataset 2', time()])
  ->execute();
```

**Update Query:**

```php
<?php
$num_updated = \Drupal::database()->update('mymodule_datasets')
  ->fields([
    'title' => 'Updated Title',
    'modified' => time(),
  ])
  ->condition('uuid', 'abc-123')
  ->execute();
```

**Delete Query:**

```php
<?php
$num_deleted = \Drupal::database()->delete('mymodule_datasets')
  ->condition('created', strtotime('-1 year'), '<')
  ->execute();
```

**Merge Query (Upsert):**

```php
<?php
\Drupal::database()->merge('mymodule_datasets')
  ->key(['uuid' => 'abc-123'])
  ->fields([
    'title' => 'Dataset Title',
    'data' => serialize($data),
    'modified' => time(),
  ])
  ->execute();
```

---

## Drush Command-Line Tool

### Drush Basics

**Installation:**

Drush is included in the DKAN composer dependencies.

**Running Drush via DDEV:**

```bash
# DDEV wrapper
ddev drush <command>

# SSH into container
ddev ssh
drush <command>
```

---

### Common Drush Commands

**Cache Management:**

```bash
# Clear all caches
ddev drush cache:rebuild
ddev drush cr

# Clear specific cache bin
ddev drush cache:clear render
ddev drush cache:clear views

# Get cache bins
ddev drush cache:bins
```

**Configuration:**

```bash
# Export configuration
ddev drush config:export
ddev drush cex

# Import configuration
ddev drush config:import
ddev drush cim

# Check configuration status
ddev drush config:status

# Get config value
ddev drush config:get system.site name

# Set config value
ddev drush config:set system.site name "My DKAN Site"
```

**Module Management:**

```bash
# Enable module
ddev drush pm:enable dkan_sample_content
ddev drush en dkan_sample_content

# Uninstall module
ddev drush pm:uninstall dkan_sample_content
ddev drush pmu dkan_sample_content

# List modules
ddev drush pm:list --type=module

# Module status
ddev drush pm:list --status=enabled
```

**Database:**

```bash
# Run database updates
ddev drush updatedb
ddev drush updb

# Check update status
ddev drush updatedb:status

# Drop and import database
ddev drush sql:drop
ddev drush sql:cli < /path/to/dump.sql

# Dump database
ddev drush sql:dump > /tmp/dump.sql

# Execute SQL
ddev drush sql:query "SELECT * FROM users_field_data LIMIT 5"
```

**User Management:**

```bash
# Create user
ddev drush user:create johndoe --mail="john@example.com" --password="pass"

# Login link
ddev drush user:login
ddev drush uli

# Change password
ddev drush user:password admin "newpass"

# Block user
ddev drush user:block johndoe

# Unblock user
ddev drush user:unblock johndoe
```

**Content:**

```bash
# List content types
ddev drush entity:types

# Delete nodes
ddev drush entity:delete node --bundle=dataset

# Generate test content
ddev drush devel:generate:content 50 --bundles=dataset
```

---

### DKAN-Specific Drush Commands

**Sample Content:**

```bash
# Create sample datasets
ddev drush dkan:sample-content:create

# Remove sample datasets
ddev drush dkan:sample-content:remove
```

**Harvest:**

```bash
# List harvest plans
ddev drush dkan:harvest:list

# Run harvest
ddev drush dkan:harvest:run sample_content

# Show harvest status
ddev drush dkan:harvest:status sample_content

# Deregister harvest plan
ddev drush dkan:harvest:deregister sample_content
```

**Datastore:**

```bash
# Import datastore
ddev drush dkan:datastore:import {dataset-uuid}

# Drop datastore
ddev drush dkan:datastore:drop {dataset-uuid}

# Show import status
ddev drush dkan:datastore:import-status
```

**Dataset Info:**

```bash
# Show dataset information
ddev drush dkan:dataset-info {uuid}
```

---

### Custom Drush Commands

**Creating Custom Command:**

```php
<?php
namespace Drupal\mymodule\Commands;

use Drush\Commands\DrushCommands;

/**
 * Drush commands for mymodule.
 */
class MyModuleCommands extends DrushCommands {

  /**
   * Count datasets.
   *
   * @command mymodule:count-datasets
   * @aliases mcd
   * @usage mymodule:count-datasets
   *   Count all datasets.
   */
  public function countDatasets() {
    $count = \Drupal::entityQuery('node')
      ->condition('type', 'dataset')
      ->count()
      ->execute();

    $this->output()->writeln("Total datasets: $count");
  }

  /**
   * Import dataset from JSON.
   *
   * @param string $file
   *   Path to JSON file.
   *
   * @command mymodule:import-dataset
   * @aliases mid
   * @usage mymodule:import-dataset /path/to/dataset.json
   *   Import dataset from JSON file.
   */
  public function importDataset($file) {
    if (!file_exists($file)) {
      $this->logger()->error("File not found: $file");
      return;
    }

    $data = json_decode(file_get_contents($file), TRUE);

    $node = Node::create([
      'type' => 'dataset',
      'title' => $data['title'],
      // ... other fields
    ]);
    $node->save();

    $this->logger()->success("Dataset imported: {$node->id()}");
  }
}
```

---

## REST API and JSON:API

### Drupal's REST Module

**Enabling REST Resources:**

```bash
# Enable REST UI module (easier configuration)
ddev drush en restui

# Enable core REST module
ddev drush en rest serialization
```

**REST Resource Configuration:**

```yaml
# rest.resource.entity.node.yml
id: entity:node
plugin_id: 'entity:node'
granularity: resource
configuration:
  methods:
    - GET
    - POST
    - PATCH
    - DELETE
  formats:
    - json
    - xml
  authentication:
    - basic_auth
    - cookie
```

**REST Endpoints:**

```bash
# GET node
GET /node/{nid}?_format=json

# POST node (create)
POST /entity/node?_format=json
Content-Type: application/json
{
  "type": [{"target_id": "dataset"}],
  "title": [{"value": "New Dataset"}]
}

# PATCH node (update)
PATCH /node/{nid}?_format=json
Content-Type: application/json
{
  "title": [{"value": "Updated Title"}]
}

# DELETE node
DELETE /node/{nid}?_format=json
```

---

### JSON:API Module

**Enabling JSON:API:**

```bash
ddev drush en jsonapi
```

**JSON:API Endpoints:**

```bash
# List all datasets (nodes of type dataset)
GET /jsonapi/node/dataset

# Get single dataset
GET /jsonapi/node/dataset/{uuid}

# Create dataset
POST /jsonapi/node/dataset
Content-Type: application/vnd.api+json
{
  "data": {
    "type": "node--dataset",
    "attributes": {
      "title": "New Dataset"
    }
  }
}

# Update dataset
PATCH /jsonapi/node/dataset/{uuid}
Content-Type: application/vnd.api+json
{
  "data": {
    "type": "node--dataset",
    "id": "{uuid}",
    "attributes": {
      "title": "Updated Title"
    }
  }
}

# Delete dataset
DELETE /jsonapi/node/dataset/{uuid}
```

**JSON:API Features:**

- Auto-generated from entity definitions
- Follows JSON:API specification (jsonapi.org)
- Supports filtering, sorting, pagination
- Includes/sparse fieldsets
- Relationship management

**Example with Includes:**

```bash
# Include referenced publisher
GET /jsonapi/node/dataset/{uuid}?include=field_publisher

# Response includes publisher data in 'included' array
```

---

### Authentication and Permissions

**Authentication Methods:**

1. **Cookie Authentication** (default for logged-in users)
2. **Basic Authentication**
3. **OAuth 2.0** (requires contrib module)

**Basic Authentication:**

```bash
# Enable basic_auth module
ddev drush en basic_auth

# Make request
curl -X GET \
  https://dkan.ddev.site/node/1?_format=json \
  -H "Authorization: Basic $(echo -n 'user:pass' | base64)"
```

**Permissions:**

Configure permissions at `/admin/people/permissions`:
- RESTful Web Services permissions
- JSON:API permissions
- Content permissions

---

### Custom REST Endpoints

**Creating REST Resource Plugin:**

```php
<?php
namespace Drupal\mymodule\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Provides a Dataset Resource.
 *
 * @RestResource(
 *   id = "dataset_resource",
 *   label = @Translation("Dataset Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/dataset/{uuid}",
 *     "create" = "/api/dataset"
 *   }
 * )
 */
class DatasetResource extends ResourceBase {

  /**
   * Responds to GET requests.
   *
   * @param string $uuid
   *   Dataset UUID.
   *
   * @return \Drupal\rest\ResourceResponse
   *   Response.
   */
  public function get($uuid) {
    $dataset = $this->loadDataset($uuid);

    if (!$dataset) {
      throw new NotFoundHttpException('Dataset not found');
    }

    return new ResourceResponse($dataset, 200);
  }

  /**
   * Responds to POST requests.
   *
   * @param array $data
   *   Dataset data.
   *
   * @return \Drupal\rest\ResourceResponse
   *   Response.
   */
  public function post(array $data) {
    $dataset = $this->createDataset($data);

    return new ResourceResponse([
      'identifier' => $dataset['uuid'],
      'endpoint' => "/api/dataset/{$dataset['uuid']}",
    ], 201);
  }
}
```

---

## Theming System

### Twig Templating Engine

**Twig Basics:**

```twig
{# Comment #}

{# Variables #}
{{ variable }}
{{ node.title.value }}
{{ content.field_description }}

{# Filters #}
{{ title|upper }}
{{ body|striptags }}
{{ date|date('Y-m-d') }}

{# Control structures #}
{% if node.bundle == 'dataset' %}
  <div class="dataset">
    {{ content }}
  </div>
{% endif %}

{% for item in items %}
  <li>{{ item.title }}</li>
{% endfor %}

{# Set variables #}
{% set custom_var = 'value' %}

{# Include templates #}
{% include 'mymodule:dataset-metadata.html.twig' %}

{# Extends base template #}
{% extends '@classy/node.html.twig' %}

{% block content %}
  {{ parent() }}
  <div>Additional content</div>
{% endblock %}
```

---

### Theme Structure

**Theme Directory:**

```
mytheme/
├── mytheme.info.yml           # Theme metadata
├── mytheme.libraries.yml      # Asset libraries
├── mytheme.theme              # Preprocess functions
├── css/
│   └── style.css
├── js/
│   └── script.js
├── templates/
│   ├── page.html.twig
│   ├── node--dataset.html.twig
│   └── block--dataset-stats.html.twig
└── images/
    └── logo.png
```

**mytheme.info.yml:**

```yaml
name: My Theme
type: theme
description: Custom theme for DKAN
core_version_requirement: ^10
base theme: classy

libraries:
  - mytheme/global-styling

regions:
  header: Header
  primary_menu: Primary menu
  content: Content
  sidebar_first: Sidebar first
  footer: Footer
```

---

### Theme Hooks and Preprocess Functions

**Preprocess Functions:**

```php
<?php
/**
 * Implements template_preprocess_HOOK().
 */
function mytheme_preprocess_node(&$variables) {
  $node = $variables['node'];

  if ($node->bundle() == 'dataset') {
    // Add custom variable
    $variables['dataset_metadata'] = [
      'created' => $node->getCreatedTime(),
      'modified' => $node->getChangedTime(),
      'publisher' => $node->get('field_publisher')->entity->getName(),
    ];
  }
}

/**
 * Implements template_preprocess_HOOK() for dataset nodes specifically.
 */
function mytheme_preprocess_node__dataset(&$variables) {
  $node = $variables['node'];

  // Add custom classes
  $variables['attributes']['class'][] = 'dataset-' . $node->get('field_theme')->value;
}

/**
 * Implements template_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  // Add site-wide variables
  $variables['site_slogan'] = \Drupal::config('system.site')->get('slogan');
}
```

**Template File:**

```twig
{# templates/node--dataset.html.twig #}
<article{{ attributes.addClass('dataset') }}>
  <header>
    <h1{{ title_attributes }}>{{ label }}</h1>

    {% if dataset_metadata %}
      <div class="metadata">
        <span>Publisher: {{ dataset_metadata.publisher }}</span>
        <span>Modified: {{ dataset_metadata.modified|date('Y-m-d') }}</span>
      </div>
    {% endif %}
  </header>

  <div{{ content_attributes }}>
    {{ content }}
  </div>
</article>
```

---

### Asset Libraries

**mytheme.libraries.yml:**

```yaml
global-styling:
  version: 1.0
  css:
    theme:
      css/style.css: {}
      css/print.css: { media: print }
  js:
    js/script.js: {}
  dependencies:
    - core/jquery
    - core/drupal

dataset-viewer:
  version: 1.0
  js:
    js/dataset-viewer.js: {}
  dependencies:
    - mytheme/global-styling
    - core/drupalSettings
```

**Attaching Libraries:**

```php
<?php
// In preprocess function
function mytheme_preprocess_node__dataset(&$variables) {
  $variables['#attached']['library'][] = 'mytheme/dataset-viewer';
}

// In render array
$build = [
  '#markup' => '<div>Content</div>',
  '#attached' => [
    'library' => ['mytheme/dataset-viewer'],
  ],
];
```

**In Template:**

```twig
{{ attach_library('mytheme/dataset-viewer') }}
```

---

### Integrating React/Vue in Themes

**Adding React Component:**

```yaml
# mytheme.libraries.yml
react-dataset-viewer:
  version: 1.0
  js:
    https://unpkg.com/react@18/umd/react.production.min.js: { type: external, minified: true }
    https://unpkg.com/react-dom@18/umd/react-dom.production.min.js: { type: external, minified: true }
    js/dataset-viewer-react.js: {}
  dependencies:
    - core/drupalSettings
```

```javascript
// js/dataset-viewer-react.js
(function (Drupal) {
  'use strict';

  Drupal.behaviors.reactDatasetViewer = {
    attach: function (context, settings) {
      const container = context.querySelector('#react-dataset-viewer');

      if (container && !container.dataset.reactMounted) {
        const datasetId = container.dataset.datasetId;

        // Mount React component
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(DatasetViewer, { datasetId }));

        container.dataset.reactMounted = 'true';
      }
    }
  };
})(Drupal);
```

```twig
{# templates/node--dataset.html.twig #}
{{ attach_library('mytheme/react-dataset-viewer') }}

<div id="react-dataset-viewer" data-dataset-id="{{ node.uuid.value }}"></div>
```

**Using dkanClientTools in Theme:**

```yaml
# mytheme.libraries.yml
dkan-client-tools:
  version: 1.0
  js:
    /modules/custom/dkan_demo/dist/dkan-client-tools-react.global.js: {}
  dependencies:
    - mytheme/react-dataset-viewer
```

---

### Drupal Behaviors for JavaScript

**Drupal.behaviors Pattern:**

```javascript
(function ($, Drupal, drupalSettings) {
  'use strict';

  /**
   * Attach behavior to dataset elements.
   */
  Drupal.behaviors.datasetBehavior = {
    attach: function (context, settings) {
      // Run once per element
      $('.dataset', context).once('dataset-processed').each(function () {
        const $dataset = $(this);
        const datasetId = $dataset.data('dataset-id');

        // Initialize
        initializeDataset($dataset, datasetId);
      });
    },

    detach: function (context, settings, trigger) {
      // Cleanup when element removed
      if (trigger === 'unload') {
        $('.dataset', context).each(function () {
          // Remove event listeners, etc.
        });
      }
    }
  };

  function initializeDataset($element, id) {
    // Access Drupal settings
    const apiUrl = drupalSettings.mymodule.apiUrl;

    // Fetch and render dataset
    fetch(`${apiUrl}/datasets/${id}`)
      .then(r => r.json())
      .then(data => {
        $element.find('.title').text(data.title);
      });
  }

})(jQuery, Drupal, drupalSettings);
```

**Passing Settings from PHP:**

```php
<?php
$build = [
  '#markup' => '<div class="dataset" data-dataset-id="abc-123"></div>',
  '#attached' => [
    'library' => ['mytheme/dataset-viewer'],
    'drupalSettings' => [
      'mymodule' => [
        'apiUrl' => 'https://dkan.ddev.site/api',
        'datasetId' => 'abc-123',
      ],
    ],
  ],
];
```

---

## DDEV Development Environment

### DDEV Overview

DDEV is a Docker-based development environment for Drupal, WordPress, and other PHP applications.

**Architecture:**

```
DDEV Project
├── web (nginx) - Port 80/443 → 8080/8443
├── db (MariaDB) - Port 3306
├── ddev-ssh-agent
└── mailhog (optional)
```

---

### DDEV Configuration

**.ddev/config.yaml:**

```yaml
name: dkan
type: drupal10
docroot: docroot
php_version: "8.3"
webserver_type: nginx-fpm
router_http_port: "80"
router_https_port: "443"
xdebug_enabled: false
additional_hostnames: []
additional_fqdns: []
database:
  type: mariadb
  version: "10.11"
nodejs_version: "20"
```

**Custom Configuration:**

```yaml
# .ddev/config.local.yaml
# Git-ignored, for local overrides
php_version: "8.2"
xdebug_enabled: true
```

---

### Starting/Stopping DDEV

**Basic Commands:**

```bash
# Start project
ddev start

# Stop project
ddev stop

# Restart project
ddev restart

# Remove project containers (keeps database)
ddev stop --remove-data=false

# Remove project completely
ddev delete

# Project status
ddev describe

# List all projects
ddev list

# Power off all DDEV projects
ddev poweroff
```

**First Time Setup:**

```bash
cd /path/to/dkanClientTools/dkan

# Initialize DDEV (already done in this project)
# ddev config --project-type=drupal10 --docroot=docroot

# Start
ddev start

# Install Drupal (already done)
# ddev drush site:install

# Access site
open https://dkan.ddev.site
```

---

### Accessing Drupal via DDEV

**URLs:**

- Site: https://dkan.ddev.site
- Admin: https://dkan.ddev.site/user/login
- Credentials: admin / admin (from project setup)

**Launch Commands:**

```bash
# Open site in browser
ddev launch

# Open admin interface
ddev launch /admin

# Open specific path
ddev launch /admin/content
```

---

### Database Access

**MySQL Client:**

```bash
# MySQL CLI
ddev mysql

# Execute SQL
ddev mysql -e "SELECT * FROM users_field_data LIMIT 5"

# Import database
ddev import-db --src=/path/to/dump.sql
ddev import-db --src=/path/to/dump.sql.gz

# Export database
ddev export-db > /tmp/dump.sql
ddev export-db --gzip=false > /tmp/dump.sql
```

**Database Credentials:**

```
Host: db (from container) or 127.0.0.1 (from host)
Port: 3306
Database: db
Username: db
Password: db
```

**Connecting via GUI:**

```bash
# Get connection info
ddev describe

# Use Sequel Pro, TablePlus, etc.
# Host: 127.0.0.1
# Port: (from ddev describe, e.g. 32768)
# User: db
# Pass: db
# Database: db
```

---

### Running Commands in Containers

**SSH into Container:**

```bash
# SSH into web container
ddev ssh

# Run command and exit
ddev ssh -c "ls -la /var/www/html"
```

**Execute Commands:**

```bash
# Drush
ddev drush status

# Composer
ddev composer require drupal/admin_toolbar

# PHP
ddev php -v

# Node/npm
ddev npm install
ddev node -v

# Custom command
ddev exec ls -la docroot/sites
```

---

### DDEV Services

**Web Server (nginx):**

```bash
# Web container logs
ddev logs -f

# nginx config
ddev ssh
cat /etc/nginx/sites-enabled/ddev.conf
```

**PHP:**

```bash
# PHP version
ddev php -v

# PHP config
ddev ssh
php -i | grep memory_limit
```

**Database (MariaDB):**

```bash
# Database version
ddev mysql -e "SELECT VERSION()"

# Database logs
ddev logs -s db
```

**Additional Services:**

```bash
# Add Redis
# .ddev/docker-compose.redis.yaml
version: '3.6'
services:
  redis:
    image: redis:7
    container_name: ddev-${DDEV_SITENAME}-redis
```

---

## Routing System

### Routing in Drupal

**Route Definition:**

```yaml
# mymodule.routing.yml
mymodule.dataset_list:
  path: '/datasets'
  defaults:
    _controller: '\Drupal\mymodule\Controller\DatasetController::list'
    _title: 'Datasets'
  requirements:
    _permission: 'access content'

mymodule.dataset_view:
  path: '/dataset/{uuid}'
  defaults:
    _controller: '\Drupal\mymodule\Controller\DatasetController::view'
  requirements:
    _permission: 'access content'
    uuid: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  options:
    parameters:
      uuid:
        type: string
```

---

### Route Parameters

**Upcasting Parameters:**

```yaml
mymodule.dataset_edit:
  path: '/dataset/{node}/edit'
  defaults:
    _form: '\Drupal\mymodule\Form\DatasetEditForm'
    _title: 'Edit Dataset'
  requirements:
    _entity_access: 'node.update'
  options:
    parameters:
      node:
        type: entity:node  # Auto-load node entity
```

**Controller with Upcasted Parameter:**

```php
<?php
use Drupal\node\NodeInterface;

public function edit(NodeInterface $node) {
  // $node is already loaded
  return [
    '#markup' => $node->getTitle(),
  ];
}
```

---

### Route Requirements

**Access Control:**

```yaml
# Permission-based
requirements:
  _permission: 'administer nodes'

# Role-based
requirements:
  _role: 'administrator+content_editor'  # OR
  _role: 'administrator,content_editor'  # AND

# Entity access
requirements:
  _entity_access: 'node.update'

# Custom access check
requirements:
  _custom_access: '\Drupal\mymodule\Access\DatasetAccess::access'

# Multiple requirements (AND)
requirements:
  _permission: 'access content'
  _custom_access: '\Drupal\mymodule\Access\DatasetAccess::access'
```

---

### Controller Classes

**Basic Controller:**

```php
<?php
namespace Drupal\mymodule\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DatasetController extends ControllerBase {

  /**
   * List datasets.
   */
  public function list() {
    $datasets = $this->loadDatasets();

    return [
      '#theme' => 'dataset_list',
      '#datasets' => $datasets,
    ];
  }

  /**
   * View dataset.
   */
  public function view($uuid) {
    $dataset = $this->loadDataset($uuid);

    if (!$dataset) {
      throw new NotFoundHttpException();
    }

    return [
      '#theme' => 'dataset',
      '#dataset' => $dataset,
    ];
  }

  /**
   * JSON response.
   */
  public function json(Request $request) {
    $data = [
      'title' => 'Dataset Title',
      'count' => 42,
    ];

    return new JsonResponse($data);
  }
}
```

---

## Service Container

### Dependency Injection

**Service Definition:**

```yaml
# mymodule.services.yml
services:
  mymodule.dataset_manager:
    class: Drupal\mymodule\DatasetManager
    arguments:
      - '@entity_type.manager'
      - '@database'
      - '@logger.factory'
    tags:
      - { name: backend_overridable }
```

**Service Class:**

```php
<?php
namespace Drupal\mymodule;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;

class DatasetManager {

  protected $entityTypeManager;
  protected $database;
  protected $logger;

  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    Connection $database,
    LoggerChannelFactoryInterface $logger_factory
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->database = $database;
    $this->logger = $logger_factory->get('mymodule');
  }

  public function getDatasets() {
    $nids = $this->entityTypeManager
      ->getStorage('node')
      ->getQuery()
      ->condition('type', 'dataset')
      ->execute();

    return $this->entityTypeManager
      ->getStorage('node')
      ->loadMultiple($nids);
  }
}
```

---

### Accessing Services

**In Controllers (Dependency Injection):**

```php
<?php
use Symfony\Component\DependencyInjection\ContainerInterface;

class DatasetController extends ControllerBase {

  protected $datasetManager;

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('mymodule.dataset_manager')
    );
  }

  public function __construct(DatasetManager $dataset_manager) {
    $this->datasetManager = $dataset_manager;
  }

  public function list() {
    $datasets = $this->datasetManager->getDatasets();
    // ...
  }
}
```

**In Procedural Code (Service Locator):**

```php
<?php
// Use sparingly - DI preferred
$dataset_manager = \Drupal::service('mymodule.dataset_manager');
```

---

### Common Core Services

```php
<?php
// Entity type manager
$entity_manager = \Drupal::entityTypeManager();

// Config factory
$config = \Drupal::config('system.site');

// Database
$database = \Drupal::database();

// Cache
$cache = \Drupal::cache();

// Logger
$logger = \Drupal::logger('mymodule');

// Current user
$current_user = \Drupal::currentUser();

// Renderer
$renderer = \Drupal::service('renderer');

// Module handler
$module_handler = \Drupal::moduleHandler();

// State
$state = \Drupal::state();

// Request stack
$request = \Drupal::request();
```

---

## Drupal 10 vs Drupal 11

### Key Differences

**PHP Version:**
- Drupal 10: PHP 8.1 - 8.3
- Drupal 11: PHP 8.3+ (8.1, 8.2 dropped)

**Symfony Version:**
- Drupal 10: Symfony 6.2
- Drupal 11: Symfony 7.1

**jQuery:**
- Drupal 10: jQuery 3.6
- Drupal 11: jQuery 3.7 (optional removal)

**Deprecations Removed:**
- Drupal 11 removes many Drupal 9 deprecations
- APIs marked @deprecated in D9 are gone in D11

**CKEditor:**
- Drupal 10: CKEditor 4 removed, CKEditor 5 default
- Drupal 11: Only CKEditor 5

**Claro Admin Theme:**
- Improvements and refinements in D11
- Better accessibility

---

### Why DKAN Uses Drupal 10

**Reasons:**

1. **Stability**: Drupal 10 is mature and stable
2. **Long-term Support**: Supported until mid-2026
3. **Community Adoption**: Most contrib modules support D10
4. **PHP Compatibility**: Works with PHP 8.1+ (broader compatibility)
5. **DKAN 2.x Compatibility**: DKAN 2.21 tested on Drupal 10

**Migration Considerations:**

- DKAN will upgrade to Drupal 11 in future releases
- Drupal 10 → 11 upgrade path is smoother than 9 → 10
- Most contrib modules will support both D10 and D11

---

## Best Practices

### Drupal Coding Standards

**PHP CodeSniffer:**

```bash
# Install Drupal coding standards
composer require --dev drupal/coder

# Register standards
vendor/bin/phpcs --config-set installed_paths vendor/drupal/coder/coder_sniffer

# Check code
vendor/bin/phpcs --standard=Drupal web/modules/custom/mymodule

# Fix automatically
vendor/bin/phpcbf --standard=Drupal web/modules/custom/mymodule
```

**Key Standards:**

- Indentation: 2 spaces
- Line length: 80 characters
- Opening braces on same line
- Use strict typing: `declare(strict_types=1);`
- Document all public methods with PHPDoc
- Use type hints and return types

---

### Security Best Practices

**Input Sanitization:**

```php
<?php
// Use placeholders for database queries
$result = \Drupal::database()->query(
  "SELECT * FROM {node} WHERE title = :title",
  [':title' => $user_input]
);

// Don't concatenate user input!
// BAD: $query = "SELECT * FROM node WHERE title = '$user_input'";

// Sanitize output
use Drupal\Component\Utility\Html;
use Drupal\Component\Utility\Xss;

$safe = Html::escape($user_input);  // Escapes all HTML
$safe = Xss::filter($user_input);   // Allows safe HTML tags

// In Twig (automatic escaping)
{{ user_input }}  // Auto-escaped
{{ user_input|raw }}  // Skip escaping (dangerous!)
```

**Access Control:**

```php
<?php
// Always check permissions
if (!\Drupal::currentUser()->hasPermission('administer nodes')) {
  throw new AccessDeniedHttpException();
}

// Use entity access checks
$node = Node::load($nid);
if (!$node->access('update')) {
  throw new AccessDeniedHttpException();
}
```

**CSRF Protection:**

```php
<?php
// Use Form API (CSRF protection built-in)
$form = \Drupal::formBuilder()->getForm('Drupal\mymodule\Form\MyForm');

// For custom forms, use token
use Drupal\Core\Access\CsrfTokenGenerator;

$token = \Drupal::service('csrf_token')->get('mymodule_action');

// Validate token
if (!\Drupal::service('csrf_token')->validate($token, 'mymodule_action')) {
  throw new AccessDeniedHttpException();
}
```

---

### Performance Optimization

**Caching:**

```php
<?php
// Cache render arrays
$build = [
  '#markup' => '<div>Content</div>',
  '#cache' => [
    'tags' => ['node:1', 'node_list:dataset'],
    'contexts' => ['user', 'url.path'],
    'max-age' => 3600,  // 1 hour
  ],
];

// Invalidate cache tags
\Drupal\Core\Cache\Cache::invalidateTags(['node:1']);

// Get cached data
$cache = \Drupal::cache()->get('mymodule:data');
if ($cache) {
  $data = $cache->data;
} else {
  $data = expensive_operation();
  \Drupal::cache()->set('mymodule:data', $data, time() + 3600);
}
```

**Database Optimization:**

```php
<?php
// Use entity query (better than DB query for entities)
$nids = \Drupal::entityQuery('node')
  ->condition('type', 'dataset')
  ->range(0, 10)
  ->execute();

// Batch loading
$nodes = Node::loadMultiple($nids);  // Single query

// Avoid loading in loops
// BAD:
foreach ($nids as $nid) {
  $node = Node::load($nid);  // N queries!
}

// GOOD:
$nodes = Node::loadMultiple($nids);  // 1 query
foreach ($nodes as $node) {
  // process
}
```

---

### Testing Patterns

**PHPUnit Tests:**

```php
<?php
namespace Drupal\Tests\mymodule\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\mymodule\DatasetManager;

class DatasetManagerTest extends UnitTestCase {

  public function testGetDatasets() {
    $manager = new DatasetManager();
    $datasets = $manager->getDatasets();

    $this->assertIsArray($datasets);
    $this->assertNotEmpty($datasets);
  }
}
```

**Run Tests:**

```bash
# Unit tests
ddev exec vendor/bin/phpunit web/modules/custom/mymodule/tests/src/Unit

# Kernel tests
ddev exec vendor/bin/phpunit web/modules/custom/mymodule/tests/src/Kernel

# Functional tests
ddev exec vendor/bin/phpunit web/modules/custom/mymodule/tests/src/Functional
```

---

## Common Tasks

### Creating Custom Module

```bash
# Create module directory
mkdir -p web/modules/custom/mymodule

# Create .info.yml
cat > web/modules/custom/mymodule/mymodule.info.yml <<EOF
name: My Module
type: module
description: Custom functionality
core_version_requirement: ^10
package: Custom
EOF

# Enable module
ddev drush en mymodule
```

---

### Creating Custom Entity

```bash
# Generate entity with Drush
ddev drush generate entity:content

# Or manually create entity class
# See Entity System section above
```

---

### Implementing Hooks

```php
<?php
// web/modules/custom/mymodule/mymodule.module

/**
 * Implements hook_form_alter().
 */
function mymodule_form_alter(&$form, $form_state, $form_id) {
  if ($form_id == 'node_dataset_form') {
    $form['title']['widget'][0]['value']['#description'] = t('Enter dataset title');
  }
}

/**
 * Implements hook_cron().
 */
function mymodule_cron() {
  $manager = \Drupal::service('mymodule.dataset_manager');
  $manager->updateStatistics();
}
```

---

### Cache Management

```bash
# Clear all caches
ddev drush cr

# Clear specific cache
ddev drush cache:clear render

# Rebuild cache (faster than cr for development)
ddev drush cache:rebuild
```

---

## References

- [Drupal.org Official Documentation](https://www.drupal.org/documentation) - Official Drupal docs
- [Drupal API Reference](https://api.drupal.org/api/drupal/10) - Complete API documentation
- [DKAN Documentation](https://dkan.readthedocs.io/) - DKAN platform docs
- [DKAN GitHub Repository](https://github.com/GetDKAN/dkan) - Source code
- [DDEV Documentation](https://ddev.readthedocs.io/) - DDEV local development
- [Drush Documentation](https://www.drush.org/) - Drush command-line tool
- [Drupal Coding Standards](https://www.drupal.org/docs/develop/standards) - Coding standards
- [Symfony Documentation](https://symfony.com/doc/current/index.html) - Symfony components
- [Twig Documentation](https://twig.symfony.com/doc/3.x/) - Twig templating
- [JSON:API Specification](https://jsonapi.org/) - JSON:API standard
