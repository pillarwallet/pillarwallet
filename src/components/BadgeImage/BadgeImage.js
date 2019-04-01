// @flow
import * as React from 'react';
import { CachedImage } from 'react-native-cached-image';
import type { Badge } from 'models/Badge';

type Props = {
  data: Badge,
  size?: number,
};

const defaultBadge = require('assets/images/defaultBadge.png');

const BadgeImage = ({ data: badge, size = 96 }: Props) => {
  size = parseInt(size, 10);
  const badgeUri = badge.imageUrl ? `${badge.imageUrl}?t=${badge.updatedAt || 0}` : '';
  return (
    <CachedImage
      useQueryParamsInCacheKey
      key={badgeUri}
      style={{
        height: size,
        width: size,
      }}
      source={{ uri: badgeUri }}
      resizeMode="contain"
      fallbackSource={defaultBadge}
    />
  );
};

export default BadgeImage;
