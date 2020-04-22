// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import BadgeImage from 'components/BadgeImage';
import type { Badge } from 'models/Badge';
import { spacing } from 'utils/variables';

type Props = {
  data: Badge,
  onPress: () => void,
  style?: Object,
};

const BadgesItem = styled.TouchableOpacity`
  align-items: center;
  margin-bottom: ${spacing.medium};
`;

const BadgeTouchableItem = ({ data: badge, onPress, style }: Props) => {
  return (
    <BadgesItem key={badge.id} onPress={onPress} style={style}>
      <BadgeImage data={badge} />
    </BadgesItem>
  );
};

export default BadgeTouchableItem;
