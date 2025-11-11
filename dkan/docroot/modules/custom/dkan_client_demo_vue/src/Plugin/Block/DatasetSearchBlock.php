<?php

namespace Drupal\dkan_client_demo_vue\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'DKAN Dataset Search (Vue)' block.
 *
 * @Block(
 *   id = "dkan_dataset_search_vue",
 *   admin_label = @Translation("DKAN Dataset Search (Vue)"),
 *   category = @Translation("DKAN")
 * )
 */
class DatasetSearchBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    // Get the base URL for the DKAN API
    $base_url = \Drupal::request()->getSchemeAndHttpHost();

    return [
      '#markup' => '<div id="dkan-dataset-search-vue" data-base-url="' . $base_url . '"></div>',
      '#attached' => [
        'library' => [
          'dkan_client_demo_vue/dataset-search-widget',
        ],
      ],
    ];
  }

}
