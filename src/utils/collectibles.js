// @flow
import get from 'lodash.get';
import pick from 'lodash.pick';

import { convertAmountFromBigNumber } from './bignumber';
import { uniqBy } from './common';

/**
 * @desc parse unique tokens from opensea
 * @param data {Object}
 * @return {Array}
 */
export const parseAccountUniqueTokens = (data: Object) => {
  const categories = get(data, 'assets', [])
    .map(({ asset_contract: assetContract }) => ({
      ...pick(assetContract, [
        'address',
        'description',
        'external_link',
        'featured_image_url',
        'hidden',
        'image_url',
        'name',
        'nft_version',
        'schema_name',
        'short_description',
        'symbol',
        'total_supply',
        'wiki_link',
      ]),
    }));
  const uniqueCategories = uniqBy(categories, 'name');

  const assets = get(data, 'assets', [])
    .map(({
      asset_contract: assetContract,
      background_color: backgroundColor,
      token_id: tokenId,
      ...asset
    }) => ({
      ...pick(asset, [
        'animation_url',
        'current_price',
        'description',
        'external_link',
        'image_original_url',
        'image_preview_url',
        'image_thumbnail_url',
        'image_url',
        'name',
        'permalink',
        'traits',
      ]),
      assetContract: assetContract.name,
      background: backgroundColor ? `#${backgroundColor}` : null,
      id: tokenId,
      lastPrice:
        asset.last_sale
          ? Number(convertAmountFromBigNumber(asset.last_sale.total_price))
          : null,
    }));
  return { assets, categories: uniqueCategories };
};
