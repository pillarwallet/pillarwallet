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
import { Note } from 'components/Note';
import Image from 'components/Image';
import { fontStyles, spacing, fontSizes } from 'utils/variables';
import { BaseText, MediumText } from 'components/legacy/Typography';
import { LabelBadge } from 'components/LabelBadge';

type Props = {
  iconSource?: string,
  fallbackIcon?: string,
  title: string | (string | React.Node)[],
  subtitle?: string,
  action?: Function,
  note?: Object,
  titleStyle?: Object,
  label?: string,
  contentWrapperStyle?: Object,
  disabled?: boolean,
  children?: React.Node,
  labelBadge?: {
    label: string,
    color?: string,
  },
  customIcon?: React.Node,
}

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const CardImage = styled(Image)`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${({ theme }) => theme.colors.basic080};
  margin-right: 20px;
`;

const CardContent = styled.View`
  flex-direction: column;
  flex-wrap: wrap;
  width: 100%;
`;

const MainTitleWrapper = styled.View`
  flex: 1;
  flex-direction: row;
`;

const CardTitle = styled(MediumText)`
  color: ${({ theme }) => theme.colors.basic010};
  ${fontStyles.big};
`;

const CardSubtitleView = styled.View`
  padding-right: 10%;
`;

const CardSubtitle = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  ${fontStyles.regular};
  padding-right: 25%;
`;

const TitleWithImagesWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  color: ${({ theme }) => theme.colors.basic010};
  ${fontStyles.big};
`;

const ImageWrapper = styled.View`
  height: 16px;
  justify-content: flex-end;
`;

const TitleWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
`;

const LabelWrapper = styled.View`
  padding-left: 10px;
`;

const Label = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic000};
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
    labelBadge,
    customIcon,
  } = props;

  const wrapperStyle = { padding: 20, justifyContent: 'center' };

  const getTitle = () => {
    if (typeof title === 'string') return <CardTitle style={titleStyle}>{title}</CardTitle>;
    // hack to avoid inline images because of iOS13 issue. Likely can be dropped in RN 0.62
    return (
      <TitleWithImagesWrapper>
        {title.map((item, idx) => {
          if (typeof item === 'string') return <CardTitle key={idx}>{item}</CardTitle>;
        return <ImageWrapper key={idx}>{item}</ImageWrapper>;
        })}
      </TitleWithImagesWrapper>
    );
  };

  return (
    <ShadowedCard
      wrapperStyle={{ marginBottom: 8, width: '100%' }}
      contentWrapperStyle={{ ...wrapperStyle, ...contentWrapperStyle }}
      onPress={action}
      disabled={disabled}
    >
      <CardRow>
        {(!!iconSource || !!fallbackIcon) && <CardImage source={iconSource} fallbackSource={fallbackIcon} />}
        {customIcon}
        <CardContent>
          <TitleWrapper>
            <MainTitleWrapper>
              {getTitle()}
            </MainTitleWrapper>
            {(!!label || !!labelBadge) &&
            <LabelWrapper>
              {!!label && <Label>{label}</Label>}
              {!!labelBadge && (
                <LabelBadge
                  label={labelBadge.label}
                  labelStyle={{ fontSize: fontSizes.regular }}
                  color={labelBadge.color}
                />
              )}
            </LabelWrapper>}
          </TitleWrapper>
          {!!subtitle && (
            <CardSubtitleView>
              <CardSubtitle>{subtitle}</CardSubtitle>
            </CardSubtitleView>
          )}
        </CardContent>
      </CardRow>
      {!!note &&
      <Note {...note} containerStyle={{ marginTop: 14 }} />
      }
      {children}
    </ShadowedCard>
  );
};
