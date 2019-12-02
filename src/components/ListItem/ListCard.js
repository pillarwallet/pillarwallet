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
import { CachedImage } from 'react-native-cached-image';

import ShadowedCard from 'components/ShadowedCard';
import { Note } from 'components/Note';
import { baseColors, fontStyles, spacing } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';

type Props = {
  iconSource?: string,
  fallbackIcon?: string,
  title: string,
  subtitle?: string,
  action?: Function,
  note?: Object,
  titleStyle?: Object,
  label?: string,
  contentWrapperStyle?: Object,
  disabled?: boolean,
  children?: React.Node,
}

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const CardImage = styled(CachedImage)`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${baseColors.darkGray};
  margin-right: 20px;
`;

const ContentWrapper = styled.View`
  flex: 1;
`;

const CardContent = styled.View`
  flex-direction: column;
  flex-wrap: wrap;
  width: 100%;
`;

const CardTitle = styled(MediumText)`
  color: ${baseColors.slateBlack};
  ${fontStyles.big};
`;

const CardSubtitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  ${fontStyles.medium};
  padding-right: 10%;
`;

const TitleWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled(BaseText)`
  color: ${baseColors.dodgerBlue};
  ${fontStyles.regular};
  text-align: right;
  padding-left: ${spacing.medium}px;
`;

export const ListCard = (props: Props) => {
  const {
    iconSource,
    title,
    subtitle,
    action,
    note,
    fallbackIcon,
    titleStyle,
    label,
    contentWrapperStyle,
    disabled,
    children,
  } = props;

  const wrapperStyle = { padding: 20, justifyContent: 'center' };

  return (
    <ShadowedCard
      wrapperStyle={{ marginBottom: 10, width: '100%' }}
      contentWrapperStyle={{ ...wrapperStyle, ...contentWrapperStyle }}
      onPress={action}
      disabled={disabled}
    >
      <CardRow>
        {(!!iconSource || !!fallbackIcon) && <CardImage source={iconSource} fallbackSource={fallbackIcon} />}
        <ContentWrapper>
          <CardContent>
            <TitleWrapper>
              <CardTitle style={titleStyle}>{title}</CardTitle>
              {!!label && <Label>{label}</Label>}
            </TitleWrapper>
            {!!subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </CardContent>
        </ContentWrapper>
      </CardRow>
      {!!note &&
      <Note {...note} containerStyle={{ marginTop: 14 }} />
      }
      {children}
    </ShadowedCard>
  );
};
