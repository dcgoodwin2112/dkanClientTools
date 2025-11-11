# DKAN Client Demo Vanilla - Drupal Module

This is a Drupal module demonstrating how to integrate the `@dkan-client-tools/core` package into a Drupal site using vanilla JavaScript with Drupal Behaviors.

## Features Demonstrated

- **Drupal Block Plugin**: Provides a block that can be placed in any region
- **Drupal Behaviors**: Proper use of Drupal.behaviors pattern with `once` utility
- **DKAN Client Integration**: Uses shared DKAN Client Tools Core from `dkan_client_tools_core_base` module
- **Dataset Search**: Full-featured search with real-time filtering
- **Expandable Cards**: Click to expand cards and view additional metadata
- **Pagination**: Client-side pagination of search results
- **Drupal Settings**: Configuration passed via drupalSettings
- **Modern JavaScript**: ES6+ class-based architecture
- **No Framework Required**: Pure vanilla JavaScript with Drupal integration
- **Shared Dependencies**: Uses the base module for efficient library sharing

## Installation

### Option 1: Quick Install (Already in DKAN Site)

If you're working in the included DKAN development environment, the module is already present:

```bash
drush en dkan_client_demo_vanilla -y
```

This will automatically enable the required `dkan_client_tools_core_base` module as a dependency.

### Option 2: Install in Another Drupal Site

1. **Copy the base module** to your Drupal site:
   ```bash
   cp -r /path/to/dkanClientTools/examples/drupal-base-modules/core \
         modules/custom/dkan_client_tools_core_base
   ```

2. **Copy the demo module** to your Drupal site:
   ```bash
   cp -r /path/to/dkanClientTools/examples/drupal-demo-module-vanilla \
         modules/custom/dkan_client_demo_vanilla
   ```

3. **Enable the module**:
   ```bash
   drush en dkan_client_demo_vanilla -y
   ```

### Place the Block

1. Go to **Structure > Block layout** (`/admin/structure/block`)
2. Click **Place block** in your desired region
3. Find **DKAN Dataset Search (Vanilla)** and click **Place block**
4. Configure the block settings and save

## Module Structure

```
dkan_client_demo_vanilla/
├── dkan_client_demo_vanilla.info.yml          # Module definition
├── dkan_client_demo_vanilla.libraries.yml     # Library definitions
├── src/
│   └── Plugin/
│       └── Block/
│           └── DatasetSearchBlock.php         # Block plugin
├── js/
│   └── dataset-search-widget.js               # Widget implementation
├── css/
│   └── dataset-search-widget.css              # Widget styles
└── README.md                                   # This file
```

**Note**: This module uses the shared DKAN Client Tools Core library from the `dkan_client_tools_core_base` module.

## How It Works

### 1. Module Dependencies

The `.info.yml` file declares a dependency on `dkan_client_tools_core_base`, which provides the DKAN Client Tools Core library.

### 2. Library Definition

The module defines one library in `dkan_client_demo_vanilla.libraries.yml`:

- **dataset-search-widget**: The custom widget implementation that depends on `dkan_client_tools_core_base/dkan-client-core`

### 3. Block Plugin

`DatasetSearchBlock.php` provides a Drupal block that:
- Renders a container div with class `.dkan-dataset-search-widget`
- Attaches the widget library
- Passes configuration via drupalSettings

### 4. Drupal Behavior

`dataset-search-widget.js` implements a Drupal behavior that:
- Uses the `once` utility to prevent duplicate initialization
- Creates a `DatasetSearchWidget` class instance for each widget
- Initializes the DKAN client with proper configuration

### 5. Widget Class

The `DatasetSearchWidget` class:
- Manages widget state (search term, page, expanded cards)
- Uses `window.DkanClientTools` provided by the base module
- Renders the UI and handles all user interactions
- Fetches data from DKAN API
- Provides expandable card functionality

## Code Example

Here's how the widget uses the DKAN client:

```javascript
// Initialize QueryClient
const queryClient = new DkanClientTools.QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

// Initialize DkanClient
this.dkanClient = new DkanClientTools.DkanClient({
  queryClient,
  baseUrl: this.settings.baseUrl || '/api',
});

// Search datasets
const data = await this.dkanClient.searchDatasets({
  fulltext: searchTerm || undefined,
  page: page,
  'page-size': pageSize,
});
```

## Configuration

### Changing the DKAN API Base URL

Modify `src/Plugin/Block/DatasetSearchBlock.php` to change the base URL:

```php
'drupalSettings' => [
  'dkanClientDemo' => [
    'baseUrl' => 'https://your-dkan-site.com/api',
  ],
],
```

### Customizing Styles

Edit `css/dataset-search-widget.css` to customize the appearance. The module uses an orange color theme to distinguish it from other demo apps.

## Available DKAN Client Methods

The widget uses these methods from `@dkan-client-tools/core`:

- `searchDatasets(options)` - Search datasets with filters and pagination
- Full access to all 43+ methods in the core package

For the complete API reference, see:
- [DKAN Client Tools Core Base Module](../dkan_client_tools_core_base/README.md)
- [Core Package Documentation](../../../../../packages/dkan-client-tools-core/README.md)

## Drupal Best Practices

This module demonstrates several Drupal best practices:

1. **Module dependencies**: Uses Drupal's dependency system to ensure required libraries are available
2. **Library dependencies**: Declares library dependencies in `.libraries.yml`
3. **Use `once` utility**: Prevents duplicate initialization when Drupal behaviors re-run
4. **drupalSettings integration**: Passes configuration from PHP to JavaScript
5. **Block plugin pattern**: Makes the widget easily placeable in any region
6. **Namespaced CSS**: All CSS classes are prefixed to avoid conflicts
7. **XSS prevention**: HTML escaping for all dynamic content
8. **Modern JavaScript**: ES6+ classes while maintaining Drupal compatibility

## Testing

To test the widget:

1. Ensure your DKAN site is accessible at the configured base URL (default: `/api`)
2. Place the block in a region (see installation steps above)
3. Visit a page where the block appears
4. Try searching for datasets
5. Click cards to expand and view details
6. Test pagination if you have more than 10 datasets

## Troubleshooting

### Widget Not Appearing

- Check that both `dkan_client_tools_core_base` and `dkan_client_demo_vanilla` modules are enabled
- Check that the block is placed in a region
- Check browser console for JavaScript errors
- Verify the base module is properly installed

### API Errors

- Check that DKAN is accessible at the configured base URL
- Check browser network tab for failed requests
- Verify CORS settings if connecting to external DKAN instance
- Check Drupal logs for any PHP errors

### Styling Issues

- Clear Drupal cache: `drush cr`
- Check for CSS conflicts with your theme
- Verify the CSS file is being loaded in page source

### JavaScript Errors

- Ensure `window.DkanClientTools` is defined (provided by base module)
- Check that the base module's library is loading before the widget
- Verify library dependency order in `.libraries.yml`

## Extending the Module

You can extend this module by:

1. **Adding more widgets**: Create additional Drupal behaviors for different DKAN features
2. **Custom blocks**: Create additional block plugins with different configurations
3. **Form integration**: Add form elements to filter datasets
4. **Additional DKAN APIs**: Use other methods from DkanClient (datastore queries, data dictionaries, etc.)
5. **Enhanced UI**: Add more interactive features to the dataset display

## Learn More

- [DKAN Client Tools Core Base Module](../dkan_client_tools_core_base/README.md) - Base module providing the shared library
- [DKAN Client Tools Documentation](https://github.com/GetDKAN/dkan-client-tools) - Main repository
- [Drupal.org Behaviors Documentation](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview) - Drupal JavaScript API
