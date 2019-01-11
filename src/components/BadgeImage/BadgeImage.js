// @flow
import * as React from 'react';
import { CachedImage } from 'react-native-cached-image';
import type { Badge } from 'models/Badge';

type Props = {
  data: Badge,
};

const defaultBadge = require('assets/images/defaultBadge.png');

const BadgeImage = ({ data: badge }: Props) => {
  const badgeUri = badge.imageUrl ? `${badge.imageUrl}?t=${badge.updatedAt || 0}` : '';
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
