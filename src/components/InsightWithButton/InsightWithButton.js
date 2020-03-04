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
import styled from 'styled-components/native';
import ShadowedCard from 'components/ShadowedCard';
import { MediumText, BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import type { Props as ButtonProps } from 'components/Button';

type Props = {
  title?: string,
  itemsList?: string[],
  buttonTitle: string,
  description?: string,
  buttonProps?: $Shape<ButtonProps>,
  onButtonPress: () => void,
  spinner?: boolean,
};

const MainContainer = styled.View`
  padding: 22px ${spacing.large}px 30px;
`;

const ItemContainer = styled.View`
  flex-direction: row;
  padding: ${spacing.small}px 0;
`;

const ItemText = styled(BaseText)`
  flex: 1;
  color: ${themedColors.secondaryText};
`;

const CheckIcon = styled(Icon)`
  margin-right: ${spacing.small}px;
  color: ${themedColors.positive};
  ${fontStyles.medium}
`;

const ItemsContainer = styled.View`
  margin-bottom: ${spacing.large}px;
`;

const TitleText = styled(MediumText)`
margin-bottom: ${spacing.large}px;
`;

const DescriptionText = styled(BaseText)`
  margin-bottom: ${spacing.large};
`;

const InsightWrapper = styled.View`
  margin: 30px ${spacing.layoutSides}px 0px;
`;

const SpinnerWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
  align-items: center;
`;


const Item = ({ text }) => {
  return (
    <ItemContainer>
      <CheckIcon name="tick-circle" />
      <ItemText regular>{text}</ItemText>
    </ItemContainer>
  );
};

const InsightWithButton = ({
  title, itemsList, buttonTitle, description, buttonProps, onButtonPress, spinner,
}: Props) => {
  return (
    <InsightWrapper>
      <ShadowedCard borderRadius={30}>
        <MainContainer>
          {title && (
            <TitleText large center>
              {title}
            </TitleText>
          )}
          {description && <DescriptionText medium center>{description}</DescriptionText>}
          {itemsList && (
            <ItemsContainer>
              {itemsList.map(item => <Item text={item} key={item} />)}
            </ItemsContainer>
          )}
          { spinner ?
            <SpinnerWrapper>
              <Spinner />
            </SpinnerWrapper>
          :
            <Button small title={buttonTitle} onPress={onButtonPress} {...buttonProps} />
          }
        </MainContainer>
      </ShadowedCard>
    </InsightWrapper>
  );
};

export default InsightWithButton;
