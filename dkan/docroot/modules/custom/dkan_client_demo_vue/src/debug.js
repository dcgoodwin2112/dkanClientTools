/**
 * @file
 * Debug script to check what's available.
 */

(function () {
  console.log('=== DKAN Vue Debug ===');
  console.log('window.DkanClientToolsVue:', typeof window.DkanClientToolsVue);

  if (window.DkanClientToolsVue) {
    console.log('Available exports:', Object.keys(window.DkanClientToolsVue));
    console.log('Vue:', typeof window.DkanClientToolsVue.Vue);
    console.log('DkanClient:', typeof window.DkanClientToolsVue.DkanClient);
    console.log('useDatasetSearch:', typeof window.DkanClientToolsVue.useDatasetSearch);
  } else {
    console.error('window.DkanClientToolsVue is not defined!');
  }

  console.log('DatasetSearchWidgetTemplate:', typeof window.DatasetSearchWidgetTemplate);
  console.log('Drupal:', typeof Drupal);
  console.log('once:', typeof once);
})();
