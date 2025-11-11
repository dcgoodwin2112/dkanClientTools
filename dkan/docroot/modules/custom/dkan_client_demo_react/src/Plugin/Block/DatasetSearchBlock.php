<?php

namespace Drupal\dkan_client_demo_react\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Dataset Search (React)' Block.
 *
 * @Block(
 *   id = "dkan_client_demo_react_dataset_search",
 *   admin_label = @Translation("DKAN Dataset Search (React)"),
 *   category = @Translation("DKAN Client Demo"),
 * )
 */
class DatasetSearchBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    return [
      '#markup' => '<div id="dkan-react-dataset-search-widget"></div>',
      '#attached' => [
        'library' => [
          'dkan_client_demo_react/dataset-search-widget',
        ],
        'drupalSettings' => [
          'dkanClientDemoReact' => [
            'baseUrl' => '/',
          ],
        ],
      ],
    ];
  }

}
