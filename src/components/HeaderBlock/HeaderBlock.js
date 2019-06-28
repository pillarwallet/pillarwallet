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
import { StatusBar, Platform } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import TankAssetBalance from 'components/TankAssetBalance';
import Animation from 'components/Animation';

type Props = {
  style?: Object,
  color?: string,
  title?: string,
  subtitle?: string,
  fontColor?: string,
  onClose?: Function,
  subtitleAddon?: React.Node,
  rightSideAddon?: React.Node,
  headerToggle?: React.Node,
  balanceInfo?: Object[],
}

type State = {
  isMoreContentVisible: boolean,
}

const Wrapper = styled.View`
  width: 100%;
  background-color: ${props => props.color || 'transparent'};
`;

const HeaderContentWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.large}px 0;
`;

const SafeArea = styled(SafeAreaView)`
  ${props => props.androidStatusbarHeight ? `margin-top: ${props.androidStatusbarHeight}px` : ''};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: ${spacing.large}px;
`;

const TitleWrapper = styled.View`
  flex: 1;
`;

const RightSide = styled.View`
`;

const SubtitleRow = styled.View`
  flex-direction: row;
  margin-top: ${props => props.marginTop ? '4px' : 0};
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
`;

const Title = styled(BaseText)`
  width: 100%;
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.fontColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
`;

const SubTitle = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.fontColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
  opacity: ${Platform.select({
    ios: 0.5,
    android: 0.4,
  })};
  marginRight: ${props => props.marginRight ? `${spacing.medium}px` : 0}
`;

const HeaderIcon = styled(IconButton)`
  height: 40px;
  width: 40px;
  padding-right: 10px;
  margin-right: -10px;
  margin-top: -12px;
`;

const HeaderToggle = styled.TouchableOpacity`
`;

const HeaderContent = styled.View`
`;

const HeaderListItemWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0
`;

const ItemColumn = styled.View`
`;

const StyledList = styled.FlatList`
  border-top-width: 1px;
  border-top-color: ${UIColors.headerContentBorder};
`;

const Separator = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${UIColors.headerContentBorder};
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  flex: 1;
`;

const LIValue = styled(BaseText)`
  width: 100%;
  line-height: ${fontSizes.large};
  font-size: ${fontSizes.mediumLarge}px;
  color: ${props => props.fontColor};
  font-weight: ${Platform.select({
    ios: '600',
    android: '500',
  })};
`;

const LIText = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.fontColor};
`;

const ButtonText = styled(BaseText)`
  width: 100%;
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.fontColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
`;

const ListButton = styled.TouchableOpacity`
  min-width: 100px;
  padding: 10px 30px;
  border-radius: 4px;
  background-color: ${props => props.color || baseColors.electricBlue};
  margin-left: ${spacing.large}px;
`;

const ToggleWrapper = styled.View`
  border-radius: 20px;
  padding: 4px 12px 4px 6px;
  border: 1px solid ${UIColors.headerContentBorder};
`;

const IconHolder = styled.View`
  position: absolute;
  top: -6px;
  right: -7px;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${baseColors.fruitSalad};
  position: absolute;
  top: 7px;
  left: 7px;
`;

const animationSource = require('assets/animations/livePulsatingAnimation.json');

// const CustomLayoutAnimation = {
//   duration: 300,
//   create: {
//     type: LayoutAnimation.Types.linear,
//     property: LayoutAnimation.Properties.opacity,
//   },
//   update: {
//     type: LayoutAnimation.Types.curveEaseInEaseOut,
//     property: LayoutAnimation.Properties.opacity,
//   },
//   delete: {
//     type: LayoutAnimation.Types.curveEaseInEaseOut,
//     property: LayoutAnimation.Properties.opacity,
//   },
// };

// for android support
// UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

export default class HeaderBlock extends React.Component<Props, State> {
  state = {
    isMoreContentVisible: false,
  };

  toggleContent = () => {
    const { isMoreContentVisible } = this.state;
    // LayoutAnimation.configureNext(CustomLayoutAnimation);
    this.setState({ isMoreContentVisible: !isMoreContentVisible });
  };

  renderBalanceListItem = ({ item }: Object) => {
    const { fontColor = baseColors.white } = this.props;
    const {
      balanceInFiat,
      amountInTank,
      buttonAction,
      buttonLabel,
      buttonColor,
      balance,
      symbol = '',
    } = item;
    return (
      <HeaderListItemWrapper>
        <ItemColumn>
          <LIValue fontColor={fontColor}>
            {balanceInFiat}
          </LIValue>
          <LIText fontColor={fontColor}>
            Balance
          </LIText>
        </ItemColumn>
        <ItemRow>
          {!!amountInTank &&
          <TankAssetBalance
            amount={`${amountInTank} ${symbol}`}
            fillColor={fontColor}
            textStyle={{ fontSize: fontSizes.extraSmall, color: fontColor, fontWeight: '400' }}
          />}
          {!!balance &&
          <LIText fontColor={fontColor}>
            {`${balance} ${symbol}`}
          </LIText>}
          <ListButton onPress={buttonAction} color={buttonColor}>
            <ButtonText fontColor={fontColor}>
              {buttonLabel}
            </ButtonText>
          </ListButton>
        </ItemRow>
      </HeaderListItemWrapper>
    );
  };

  render() {
    const {
      style,
      color,
      title,
      subtitle,
      fontColor = baseColors.white,
      onClose,
      subtitleAddon,
      rightSideAddon,
      headerToggle,
      balanceInfo = [{}],
    } = this.props;

    const { isMoreContentVisible } = this.state;
    const visibleBalanceInfo = isMoreContentVisible
      ? [...balanceInfo].reverse()
      : [balanceInfo[0]];

    return (
      <Wrapper style={style} color={color}>
        <SafeArea forceInset={{ bottom: 'never' }} androidStatusbarHeight={StatusBar.currentHeight}>
          <HeaderContentWrapper>
            <HeaderRow>
              <TitleWrapper>
                <Title fontColor={fontColor}>{title}</Title>
                <SubtitleRow marginTop={!!subtitle || !!subtitleAddon}>
                  {!!subtitle && <SubTitle fontColor={fontColor} marginRight={!!subtitleAddon}>{subtitle}</SubTitle>}
                  {subtitleAddon}
                </SubtitleRow>
              </TitleWrapper>
              <RightSide>
                {!isMoreContentVisible &&
                  <HeaderToggle onPress={this.toggleContent}>
                    {headerToggle}
                    { /* TODO: move to separate tank indicator item  */}
                    <ToggleWrapper>
                      <TankAssetBalance
                        amount="336"
                        fillColor={fontColor}
                        textStyle={{ fontSize: fontSizes.extraSmall, color: fontColor, fontWeight: '400' }}
                      />
                      <IconHolder>
                        <Animation source={animationSource} style={{ height: 22, width: 22 }} loop speed={0.9} />
                        <StatusIcon />
                      </IconHolder>
                    </ToggleWrapper>
                  </HeaderToggle>
                }
                {rightSideAddon}
                {(onClose || isMoreContentVisible) &&
                <HeaderIcon
                  icon="close"
                  color={fontColor}
                  onPress={isMoreContentVisible ? this.toggleContent : onClose}
                  fontSize={fontSizes.extraExtraSmall}
                  horizontalAlign="flex-end"
                />
                }
              </RightSide>
            </HeaderRow>
            <HeaderContent removeClippedSubviews>
              {!!balanceInfo.length &&
              <StyledList
                keyExtractor={item => item.key}
                data={visibleBalanceInfo}
                extraData={this.state}
                renderItem={this.renderBalanceListItem}
                ItemSeparatorComponent={Separator}
                removeClippedSubviews
              />}
            </HeaderContent>
          </HeaderContentWrapper>
        </SafeArea>
      </Wrapper>
    );
  }
}
