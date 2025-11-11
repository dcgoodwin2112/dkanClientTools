# DKAN Client Tools React Base

Simple Drupal module that provides React and ReactDOM as shared libraries for other modules to use.

## What's Included

Two Drupal libraries with official React production builds:

- **`dkan_client_tools_react_base/react`** - React 18.3.1 (~11KB)
- **`dkan_client_tools_react_base/react-dom`** - React DOM 18.3.1 (~129KB)

Both are loaded from vendored files in `js/vendor/` and expose globals:
- `window.React`
- `window.ReactDOM`

## Installation

Just enable the module:

```bash
drush en dkan_client_tools_react_base
```

No build step required!

## Usage in Other Modules

Declare dependencies in your `*.libraries.yml`:

```yaml
my_module_app:
  js:
    js/my-app.js: {}
  dependencies:
    - dkan_client_tools_react_base/react
    - dkan_client_tools_react_base/react-dom
```

Then attach your library:

```php
$build['#attached']['library'][] = 'my_module/my_module_app';
```

Drupal automatically loads React before ReactDOM.

## Updating React

To update to a new React version:

1. Download new builds:
   ```bash
   cd js/vendor
   curl -o react.production.min.js https://unpkg.com/react@VERSION/umd/react.production.min.js
   curl -o react-dom.production.min.js https://unpkg.com/react-dom@VERSION/umd/react-dom.production.min.js
   ```

2. Update version in `dkan_client_tools_react_base.libraries.yml`

3. Clear cache: `drush cr`

## File Structure

```
dkan_client_tools_react_base/
├── dkan_client_tools_react_base.info.yml
├── dkan_client_tools_react_base.libraries.yml
├── js/vendor/
│   ├── react.production.min.js         # 11KB
│   ├── react-dom.production.min.js     # 129KB
│   ├── LICENSE-react.txt
│   └── README.md
└── README.md
```

## Why This Approach?

- **Simple**: No build tools, no npm, no complexity
- **Official**: Uses React's official UMD builds
- **Small**: Just 140KB total for both libraries
- **Standard**: Follows Drupal best practices for vendored libraries
- **Reliable**: Direct download from unpkg.com (React's CDN)

## License

React is MIT licensed (Facebook, Inc.). See `js/vendor/LICENSE-react.txt`.
