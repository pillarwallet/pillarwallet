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
import { Left, Body, Right } from 'native-base';
import { TextLink, BaseText } from 'components/Typography';
import { UIColors, baseColors, fontSizes, spacing } from 'utils/variables';
import { noop } from 'utils/common';
import Title from 'components/Title';
import styled from 'styled-components/native';
import IconButton from 'components/IconButton';

type Props = {
  onBack?: Function,
  onClose?: Function,
  noClose?: boolean,
  onCloseText?: string,
  onNextPress?: ?Function,
  onTitlePress?: Function,
  nextText?: string,
  nextIcon?: ?string,
  title?: string,
  fullWidthTitle?: boolean,
  noBlueDotOnTitle?: boolean,
  dotColor?: string,
  centerTitle?: boolean,
  noWrapTitle?: boolean,
  noPadding?: boolean,
  noMargin?: boolean,
  flexStart?: boolean,
  light?: boolean,
  style?: Object,
  headerRightFlex?: string,
  backIcon?: string,
  nextIconSize?: number,
  titleStyles?: ?Object,
  headerRightAddon?: React.Node,
  white?: boolean,
}

const Wrapper = styled.View`
  border-bottom-width: 0;
  padding: ${props => props.noPadding ? 0 : '0 16px'};
  z-index: 10;
  ${props => props.white
    ? `
      background-color: ${baseColors.white};
      border-bottom-width: 1px;
      border-bottom-color: ${baseColors.mediumLightGray};
    `
    : ''}
`;

const InnerWrapper = styled.View`
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
  margin-top: ${spacing.rhythm};
  margin-bottom: ${props => props.flexStart ? 'auto' : 4};
  height: ${({ noWrapTitle }) => noWrapTitle ? 'auto' : '50px'};
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
  color: ${props => props.light ? baseColors.white : baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
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

const HeaderLeft = styled(Left)`
  flex: ${props => props.showTitleLeft ? 2 : 1};
  justify-content: flex-start;
  align-items: flex-end;
`;

const HeaderBody = styled(Body)`
  flex: ${props => props.onCloseText ? 2 : 5};
`;

const HeaderRight = styled(Right)`
  flex: ${props => props.flex};
  justify-content: flex-end;
  align-items: flex-end;
`;

const Header = (props: Props) => {
  const {
    onBack,
    nextText,
    nextIcon,
    nextIconSize,
    onNextPress,
    onTitlePress,
    onClose,
    noClose,
    onCloseText,
    title,
    fullWidthTitle,
    noBlueDotOnTitle,
    dotColor,
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
    white,
  } = props;
  const showRight = nextText || nextIcon || onBack || onClose || centerTitle || headerRightAddon;
  const titleOnBack = title && onBack;
  const showTitleCenter = titleOnBack || centerTitle;
  const showTitleLeft = !onBack && !centerTitle;
  const onlyCloseIcon = onClose && !nextText && !onCloseText;

  const getHeaderRightFlex = () => {
    if (headerRightFlex) {
      return headerRightFlex;
    } else if (onlyCloseIcon) {
      return '0 0 44px';
    }
    return 1;
  };

  return (
    <Wrapper
      style={style}
      noPadding={noPadding}
      white={white}
    >
      <InnerWrapper flexStart={flexStart} noWrapTitle={noWrapTitle}>
        <HeaderLeft showTitleLeft={showTitleLeft}>
          {onBack &&
            <BackIcon
              icon={backIcon || 'back'}
              color={light ? baseColors.white : UIColors.defaultNavigationColor}
              onPress={() => onBack()}
              fontSize={fontSizes.extraLarge}
              horizontalAlign="flex-start"
            />
          }
          {showTitleLeft &&
            <Title
              noMargin
              title={title}
              noBlueDot={noBlueDotOnTitle}
              dotColor={dotColor}
              fullWidth={fullWidthTitle}
              titleStyles={titleStyles}
            />
          }
        </HeaderLeft>
        {showTitleCenter &&
          <HeaderBody onCloseText={onCloseText}>
            <Title
              align="center"
              noMargin
              title={title}
              onTitlePress={onTitlePress}
              noBlueDot={noBlueDotOnTitle}
              dotColor={dotColor}
              fullWidth={fullWidthTitle}
              titleStyles={titleStyles}
            />
          </HeaderBody>
        }
        {showRight && !noClose &&
          <HeaderRight flex={getHeaderRightFlex} onClose={onClose || noop}>
            {headerRightAddon}
            {nextText &&
              <TextLink onPress={onNextPress}>{nextText}</TextLink>
            }
            {nextIcon &&
              <IconWrapper>
                <NextIcon
                  icon={nextIcon}
                  color={light ? baseColors.white : UIColors.primary}
                  onPress={onNextPress}
                  fontSize={nextIconSize || fontSizes.small}
                  horizontalAlign="flex-end"
                />
              </IconWrapper>
            }
            {onClose &&
              <IconWrapper>
                {onCloseText &&
                  <CloseIconText light={light} >{onCloseText}</CloseIconText>
                }
                <NextIcon
                  icon="close"
                  color={light ? baseColors.white : UIColors.defaultNavigationColor}
                  onPress={onClose}
                  fontSize={fontSizes.small}
                  horizontalAlign="flex-end"
                />
              </IconWrapper>
            }
          </HeaderRight>
        }
      </InnerWrapper>
    </Wrapper>
  );
};

export default Header;
