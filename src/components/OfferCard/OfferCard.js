// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import * as React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

// components
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';

// utils
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

import type { ExternalButtonProps } from 'components/Button';

type ImageObject = {
  uri: string,
};

type Props = {
  isDisabled?: boolean,
  onPress: () => void,
  labelTop: string,
  valueTop: string | number,
  cardImageSource?: string | ImageObject,
  cardButton: ExternalButtonProps,
  labelBottom: string,
  valueBottom: string | number,
  cardNote?: string,
  additionalCardButton: ?ExternalButtonProps,
};

const CardWrapper = styled.TouchableOpacity`
  width: 100%;
`;

const CardRow = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: ${props => props.alignTop ? 'flex-start' : 'flex-end'};
  padding: 10px 0;
  ${({ withBorder, theme }) => withBorder
    ? `border-bottom-width: 1px;
       border-bottom-color: ${theme.colors.border};`
    : ''
}
`;

const CardInnerRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-left: 10px;
  flex-wrap: wrap;
`;

const CardColumn = styled.View`
  flex-direction: column;
  align-items: ${props => props.alignRight ? 'flex-end' : 'flex-start'};
  justify-content: flex-start;
`;

const CardText = styled(BaseText)`
  ${fontStyles.regular};
  letter-spacing: 0.18px;
  color: ${({ label, theme }) => label ? theme.colors.text : theme.colors.secondaryText};
  flex-wrap: wrap;
  width: 100%;
`;

const ProviderIcon = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const CardNote = styled(BaseText)`
  flex-direction: row;
  align-items: center;
  padding: 4px 0;
  margin-left: 10px;
  color: ${themedColors.primary};
  ${fontStyles.regular};
`;

const OfferCard = (props: Props) => {
  const {
    isDisabled,
    onPress,
    labelTop,
    valueTop,
    cardImageSource,
    labelBottom,
    valueBottom,
    cardNote,
    cardButton,
    additionalCardButton,
  } = props;

  return (
    <ShadowedCard
      contentWrapperStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
      isAnimated
      spacingAfterAnimation={10}
    >
      <CardWrapper
        disabled={isDisabled}
        onPress={onPress}
      >
        <CardRow withBorder alignTop>
          <CardColumn>
            <CardText label>{labelTop}</CardText>
            <CardText>{valueTop}</CardText>
          </CardColumn>
          <CardInnerRow style={{ flexShrink: 1 }}>
            {!!cardImageSource && <ProviderIcon source={cardImageSource} resizeMode="contain" />}
            {!!cardNote && <CardNote>{cardNote}</CardNote>}
          </CardInnerRow>
        </CardRow>

        <CardRow>
          <CardColumn style={{ flex: 1 }}>
            {!additionalCardButton
              ? (
                <React.Fragment>
                  <CardText label>{labelBottom}</CardText>
                  <View style={{ flexDirection: 'row' }}>
                    <CardText>{valueBottom}</CardText>
                  </View>
                </React.Fragment>)
              :
                <Button
                  {...additionalCardButton}
                  small
                  positive
                  horizontalPaddings={8}
                />
            }
          </CardColumn>
          <CardColumn>
            <Button
              {...cardButton}
              small
              horizontalPaddings={8}
            />
          </CardColumn>
        </CardRow>
      </CardWrapper>
    </ShadowedCard>
  );
};

export default OfferCard;
