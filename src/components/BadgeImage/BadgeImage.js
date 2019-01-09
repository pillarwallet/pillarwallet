// @flow
import * as React from 'react';
import { CachedImage } from 'react-native-cached-image';

type Props = {
  data: Object,
};

const defaultBadge = require('assets/images/defaultBadge.png');

const BadgeImage = ({ data: badge }: Props) => {
  const badgeUri = badge.url ? `${badge.url}?t=${badge.updatedAt || 0}` : '';
  return (
    <CachedImage
      useQueryParamsInCacheKey
      key={badgeUri}
      style={{
        height: 96,
        width: 96,
      }}
      source={{ uri: badgeUri }}
      resizeMode="contain"
      fallbackSource={defaultBadge}
    />
  );
};

export default BadgeImage;
