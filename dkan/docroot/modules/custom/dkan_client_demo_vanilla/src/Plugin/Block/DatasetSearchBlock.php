<?php

namespace Drupal\dkan_client_demo_vanilla\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Dataset Search' Block.
 *
 * @Block(
 *   id = "dkan_client_demo_vanilla_dataset_search",
 *   admin_label = @Translation("DKAN Dataset Search (Vanilla)"),
 *   category = @Translation("DKAN Client Demo"),
 * )
 */
class DatasetSearchBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    return [
      '#markup' => '<div class="dkan-dataset-search-widget"></div>',
      '#attached' => [
        'library' => [
          'dkan_client_demo_vanilla/dataset-search-widget',
        ],
        'drupalSettings' => [
          'dkanClientDemo' => [
            'baseUrl' => '/',
          ],
        ],
      ],
    ];
  }

}
