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

// components
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import DynamicSizeImage from 'components/DynamicSizeImage';

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
  cardImageSource: string | ImageObject,
  cardButton: ExternalButtonProps,
  labelBottom: string,
  valueBottom: string | number,
  cardNote?: string,
  additionalCardButton: ?ExternalButtonProps,
};

type LeftSideProps = {
  label: string,
  value: string | number,
  buttonProps: ?ExternalButtonProps,
  note?: string,
}

const CardWrapper = styled.TouchableOpacity`
  width: 100%;
`;

const CardRow = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: ${props => props.alignTop ? 'flex-start' : 'center'};
  padding: 10px 0;
  ${({ withBorder, theme }) => withBorder
    ? `border-bottom-width: 1px;
       border-bottom-color: ${theme.colors.border};`
    : ''}
  min-height: 68px;
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
  ${({ label }) => label ? fontStyles.regular : fontStyles.big};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
  flex-wrap: wrap;
  width: 100%;
`;

const CardNote = styled(BaseText)`
  padding: 4px 0;
  color: ${themedColors.primary};
  ${fontStyles.regular};
`;

const LeftSide = (props: LeftSideProps) => {
  const {
    label,
    value,
    buttonProps,
    note,
  } = props;

  if (note) {
    return (
      <CardNote>{note}</CardNote>
    );
  }

  if (buttonProps) {
    return (
      <Button
        {...buttonProps}
        small
        positive
        horizontalPaddings={8}
      />
    );
  }

  return (
    <React.Fragment>
      <CardText label>{label}</CardText>
      <View style={{ flexDirection: 'row' }}>
        <CardText>{value}</CardText>
      </View>
    </React.Fragment>
  );
};

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
            {!!cardImageSource &&
            <DynamicSizeImage
              imageSource={cardImageSource}
              style={{ marginTop: 4 }}
              fallbackWidth={130}
              fallbackHeight={33}
            />}
          </CardInnerRow>
        </CardRow>
        <CardRow>
          <CardColumn style={{ flex: 1 }}>
            <LeftSide
              label={labelBottom}
              value={valueBottom}
              buttonProps={additionalCardButton}
              note={cardNote}
            />
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
