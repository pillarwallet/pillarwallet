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
import { Center } from 'native-base';
import styled, { withTheme } from 'styled-components/native';
import { TextLink, BaseText } from 'components/legacy/Typography';
import Title from 'components/legacy/Title';
import IconButton from 'components/IconButton';
import { fontSizes, spacing } from 'utils/variables';
import { noop } from 'utils/common';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  onBack?: Function,
  onClose?: Function,
  noClose?: boolean,
  onCloseText?: string,
  onNextPress?: ?Function,
  onTitlePress?: Function,
  nextText?: string,
  nextTextStyle?: Object,
  nextIcon?: ?string,
  title?: string,
  fullWidthTitle?: boolean,
  centerTitle?: boolean,
  noWrapTitle?: boolean,
  noPadding?: boolean,
  noMargin?: boolean,
  flexStart?: boolean,
  light?: boolean,
  style?: Object,
  headerRightFlex?: number,
  backIcon?: string,
  nextIconSize?: number,
  titleStyles?: ?Object,
  headerRightAddon?: React.Node,
  pushRightAddonToTheSide?: boolean,
  white?: boolean,
  theme: Theme,
};

const Wrapper = styled.View`
  border-bottom-width: 0;
  padding: ${(props) => (props.noPadding ? 0 : `0 ${spacing.layoutSides}px`)};
  z-index: 10;
  ${({ white, theme }) =>
    white
      ? `
      background-color: ${theme.colors.basic050};
      border-bottom-width: 1px;
      border-bottom-color: ${theme.colors.basic080};
    `
      : ''}
`;

const InnerWrapper = styled.View`
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
  margin-top: ${spacing.rhythm}px;
  margin-bottom: ${(props) => (props.flexStart ? 'auto' : '4px')};
  height: ${({ noWrapTitle }) => (noWrapTitle ? 'auto' : '50px')};
`;

const BackIcon = styled(IconButton)`
  position: relative;
  align-self: flex-start;
  height: 44px;
  width: 44px;
  padding-left: 10px;
  margin-left: -10px;
`;

const CloseIconText = styled(BaseText)`
  color: ${({ light, theme }) => (light ? theme.colors.basic005 : theme.colors.basic010)};
  font-size: ${fontSizes.small}px;
`;

const IconWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const NextIcon = styled(IconButton)`
  height: 44px;
  width: 44px;
  padding-right: 10px;
  margin-right: -10px;
  align-items: flex-end;
`;

const CloseIcon = styled(IconButton)`
  height: 44px;
  width: 58px;
  margin-right: -20px;
  align-items: center;
`;

const HeaderLeft = styled.View`
  flex: ${(props) => (props.flex ? props.flex : 1)};
  justify-content: flex-start;
  align-items: flex-end;
`;

const HeaderBody = styled(Center)`
  flex: ${(props) => (props.onCloseText ? 2 : 5)};
`;

const HeaderRight = styled.View`
  flex: ${(props) => props.flex};
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
`;

const Header = (props: Props) => {
  const {
    onBack,
    nextText,
    nextTextStyle,
    nextIcon,
    nextIconSize,
    onNextPress,
    onTitlePress,
    onClose,
    noClose,
    onCloseText,
    title,
    fullWidthTitle,
    centerTitle,
    noWrapTitle,
    noPadding,
    style,
    light,
    headerRightFlex,
    flexStart,
    backIcon,
    titleStyles,
    headerRightAddon,
    pushRightAddonToTheSide,
    white,
    theme,
  } = props;
  const showRight = nextText || nextIcon || onBack || onClose || centerTitle || headerRightAddon;
  const titleOnBack = title && onBack;
  const showTitleCenter = titleOnBack || centerTitle;
  const showTitleLeft = !onBack && !centerTitle;
  const onlyCloseIcon = onClose && !nextText && !onCloseText;
  const colors = getThemeColors(theme);

  const getHeaderRightFlex = () => {
    if (headerRightFlex) {
      return headerRightFlex;
    } else if (onlyCloseIcon) {
      return '0 0 44px';
    }
    return 1;
  };

  const getHeaderLeftFlex = () => {
    if (showTitleLeft) {
      return 2;
    } else if (headerRightFlex && !showTitleLeft && !!title && !!showTitleCenter) {
      return headerRightFlex;
    }
    return 1;
  };

  return (
    <Wrapper style={style} noPadding={noPadding} white={white}>
      <InnerWrapper flexStart={flexStart} noWrapTitle={noWrapTitle}>
        <HeaderLeft showTitleLeft={showTitleLeft} flex={getHeaderLeftFlex}>
          {onBack && (
            <BackIcon
              icon={backIcon || 'back'}
              color={light ? colors.basic005 : colors.basic010}
              onPress={() => onBack()}
              fontSize={fontSizes.large}
              horizontalAlign="flex-start"
            />
          )}
          {showTitleLeft && <Title noMargin title={title} fullWidth={fullWidthTitle} titleStyles={titleStyles} />}
        </HeaderLeft>
        {showTitleCenter && (
          <HeaderBody onCloseText={onCloseText}>
            <Title
              align="center"
              noMargin
              title={title}
              onTitlePress={onTitlePress}
              fullWidth={fullWidthTitle}
              titleStyles={titleStyles}
            />
          </HeaderBody>
        )}
        {showRight && !noClose && (
          <HeaderRight flex={getHeaderRightFlex} onClose={onClose || noop}>
            {!pushRightAddonToTheSide && headerRightAddon}
            {nextText && (
              <TextLink style={nextTextStyle} onPress={onNextPress}>
                {nextText}
              </TextLink>
            )}
            {nextIcon && (
              <IconWrapper>
                <NextIcon
                  icon={nextIcon}
                  color={light ? colors.basic005 : colors.basic000}
                  onPress={onNextPress}
                  fontSize={nextIconSize || fontSizes.medium}
                  horizontalAlign="flex-end"
                />
              </IconWrapper>
            )}
            {pushRightAddonToTheSide && headerRightAddon}
            {onClose && (
              <IconWrapper>
                {onCloseText && <CloseIconText light={light}>{onCloseText}</CloseIconText>}
                <CloseIcon
                  icon="close"
                  color={light ? colors.basic005 : colors.basic010}
                  onPress={onClose}
                  fontSize={fontSizes.medium}
                  horizontalAlign="center"
                />
              </IconWrapper>
            )}
          </HeaderRight>
        )}
      </InnerWrapper>
    </Wrapper>
  );
};

export default withTheme(Header);
