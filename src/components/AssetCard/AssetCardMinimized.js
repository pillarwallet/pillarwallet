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
import { TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import isEqual from 'lodash.isequal';
import isEqualWith from 'lodash.isequalwith';
import styled from 'styled-components/native';
import { LightText, BaseText, MediumText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { CachedImage } from 'react-native-cached-image';
import { spacing, fontSizes, fontTrackings, baseColors, fontStyles, lineHeights } from 'utils/variables';
import Icon from 'components/Icon';
import Toast from 'components/Toast';

type Props = {
  id: string,
  token: string,
  amount: string,
  onPress?: Function,
  address?: string,
  wallpaper?: string,
  name: string,
  children?: React.Node,
  disclaimer?: string,
  balanceInFiat: string,
  icon: string,
  smallScreen?: boolean,
  extraSmall?: boolean,
  disabledRemove?: boolean,
  onRemove?: Function,
  forceHideRemoval?: boolean,
  assetData?: Object,
  isCollectible?: boolean,
  columnCount: number,
}

type State = {
  showHide: boolean,
  shakeAnimation: Object,
}

const defaultCircleColor = '#ACBCCD';
const genericToken = require('assets/images/tokens/genericToken.png');

const AssetWrapper = styled(Animated.View)`
  width: ${props => props.columnCount ? 100 / props.columnCount : 100}%;
  justify-content: center;
  align-items: center;
  margin-bottom: 2px;
`;

const { width } = Dimensions.get('window');
const cardWidth = (columnCount) => ((width - 20) / columnCount) - 15;
const AssetWrapperAnimated = Animated.createAnimatedComponent(AssetWrapper);

const cardHeight = (smallScreen, extraSmall) => {
  if ((smallScreen && extraSmall) || smallScreen) {
    return 70;
  } else if (extraSmall) {
    return 88;
  }
  return 105;
};

const ShadowHolder = styled(Shadow)`
  margin: 4px ${spacing.rhythm / 4}px 6px;
  flex-direction: row;
`;

const Sizer = styled.View`
  height: ${props => props.isCollectible
    ? '100%'
    : `${cardHeight(props.smallScreen, props.extraSmall)}px`};
  border-radius: 6px;
  background: ${baseColors.white};
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: ${props => props.justify ? props.justify : 'space-between'};
  align-items: flex-start;
  padding: ${props => props.smallScreen ? spacing.rhythm / 4 : spacing.rhythm / 2}px; 
  width: 100%;
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: ${props => props.justify ? props.justify : 'flex-start'};
  align-items: center;
  width: 100%;
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const AmountWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-top: ${props => props.extraSmall ? 4 : spacing.rhythm / 2}px;
`;

const Amount = styled(MediumText)`
  ${fontStyles.medium};
  color: ${baseColors.slateBlack};
  text-align: left;
`;

const FiatAmount = styled(LightText)`
  ${fontStyles.medium};
  color: ${baseColors.darkGray};
  text-align: left;
`;

const Disclaimer = styled(LightText)`
  ${props => props.smallScreen ? fontStyles.small : fontStyles.regular};
  color: ${baseColors.burningFire};
  text-align: left;
`;

const IconCircle = styled.View`
  width: ${props => props.smallScreen ? 20 : 36}px;
  height: ${props => props.smallScreen ? 20 : 36}px;
  border-radius: ${props => props.smallScreen ? 10 : 18}px;
  background: ${props => props.color ? props.color : defaultCircleColor};
  margin-right: ${props => props.smallScreen ? 4 : 6}px;
  align-items: center;
  justify-content: center;
`;

const nameStyle = (props) => `
  font-size: ${props.smallScreen ? fontSizes.small : fontSizes.regular}px;
  line-height: ${props.smallScreen ? lineHeights.small : lineHeights.regular}px;
  letter-spacing: ${fontTrackings.small};
  color: ${baseColors.darkGray};
  ${props.center ? 'width: 100%; text-align: center;' : ''}
`;

const Name = styled(MediumText)`
  ${props => nameStyle(props)};
`;

const NameRegular = styled(BaseText)`
  ${props => nameStyle(props)};
`;

const DetailWrapper = styled.View`
  margin-top: 2px;
`;

const HideAssetAddon = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${baseColors.burningFire};
  position: absolute;
  top: 0;
  right: 2px;
  elevation: 3;
  justify-content: center;
  align-items: center;
`;

class AssetCardMinimized extends React.Component<Props, State> {
  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    }) && isEqual(this.state, nextState);
    return !isEq;
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      showHide: false,
      shakeAnimation: new Animated.Value(0),
    };
  }

  static defaultProps = {
    balanceInFiat: {
      amount: 0,
      currency: '',
    },
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.forceHideRemoval !== this.props.forceHideRemoval && this.props.forceHideRemoval) {
      this.hideRemoval();
    }
  }

  handleLongPress = () => {
    const { isCollectible } = this.props;
    if (isCollectible) return;

    if (this.state.showHide) {
      this.hideRemoval();
    } else {
      this.showRemoval();
    }
  };

  handlePress = () => {
    const { onPress, assetData } = this.props;
    if (onPress) onPress(assetData);
    if (this.state.showHide) {
      this.hideRemoval();
    }
  };

  hideRemoval = () => {
    this.state.shakeAnimation.stopAnimation(() => {
      this.setState({ showHide: false });
      this.state.shakeAnimation.setValue(0);
    });
  };

  showRemoval = () => {
    this.setState({ showHide: true });
    Animated.loop(
      Animated.timing(
        this.state.shakeAnimation,
        {
          toValue: 4,
          easing: Easing.linear,
          duration: 360,
        },
      ),
    ).start();
  };

  showNotification = () => {
    Toast.show({
      message: 'Ethereum is essential for Pillar Wallet',
      type: 'info',
      title: 'This asset cannot be switched off',
    });
  };

  renderCardContent = () => {
    const {
      smallScreen,
      token,
      icon,
      extraSmall,
      amount,
      disclaimer,
      balanceInFiat,
      isCollectible,
      name,
    } = this.props;

    if (isCollectible) {
      const imageSize = icon ? 135 : 55;
      return (
        <InnerWrapper justify="flex-start">
          <CardRow justify="center" style={{ marginTop: 4, height: 150 }}>
            <CachedImage
              key={name}
              style={{
                height: imageSize,
                width: imageSize,
                marginBottom: spacing.mediumLarge,
              }}
              source={{ uri: icon }}
              fallbackSource={genericToken}
              resizeMode="contain"
            />
          </CardRow>
          <CardRow justify="center">
            <NameRegular center numberOfLines={1} ellipsizeMode="tail">{name}</NameRegular>
          </CardRow>
        </InnerWrapper>
      );
    }

    return (
      <InnerWrapper smallScreen={smallScreen}>
        <CardRow>
          <IconCircle smallScreen={smallScreen}>
            <CachedImage
              key={token}
              style={{
                height: smallScreen ? 20 : 36,
                width: smallScreen ? 20 : 36,
              }}
              source={{ uri: icon }}
              fallbackSource={genericToken}
              resizeMode="contain"
            />
          </IconCircle>
          <Name>{token}</Name>
        </CardRow>
        <CardRow>
          <AmountWrapper extraSmall={extraSmall}>
            <Amount>{amount}</Amount>
            <DetailWrapper>
              {disclaimer
                ? <Disclaimer smallScreen={smallScreen}>{disclaimer}</Disclaimer>
                : <FiatAmount>{balanceInFiat}</FiatAmount>
              }
            </DetailWrapper>
          </AmountWrapper>
        </CardRow>
      </InnerWrapper>
    );
  };

  render() {
    const {
      extraSmall,
      smallScreen,
      disabledRemove,
      onRemove,
      columnCount,
      isCollectible,
    } = this.props;
    const { showHide, shakeAnimation } = this.state;

    const animatedStyle = {
      transform: [
        {
          translateY: shakeAnimation.interpolate({
            inputRange: [0, 1, 2, 3, 4],
            outputRange: [0, 2, 0, 2, 0],
          }),
        },
        {
          rotate: shakeAnimation.interpolate({
            inputRange: [0, 1, 2, 3, 4],
            outputRange: ['0deg', '2deg', '0deg', '-2deg', '0deg'],
          }),
        },
      ],
    };

    return (
      <AssetWrapperAnimated style={animatedStyle} columnCount={columnCount}>
        <ShadowHolder
          heightAndroid={isCollectible ? 196 : cardHeight(smallScreen, extraSmall)}
          // widthIOS={width / 3.6}
          widthAndroid={cardWidth(columnCount)}
          widthIOS={cardWidth(columnCount)}
          heightIOS={isCollectible ? 196 : cardHeight(smallScreen, extraSmall)}
          marginVertical={4}
          borderShadow={5}
          useSVGShadow
          shadowOpacity={0.8}
        >
          <Sizer
            isCollectible={isCollectible}
            columnCount={columnCount}
            smallScreen={smallScreen}
            extraSmall={extraSmall}
          >
            <TouchableWithoutFeedback onPress={this.handlePress} onLongPress={this.handleLongPress}>
              {this.renderCardContent()}
            </TouchableWithoutFeedback>
          </Sizer>
        </ShadowHolder>
        {!!showHide &&
        <HideAssetAddon>
          <TouchableOpacity
            onPress={disabledRemove ? this.showNotification : onRemove}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon
              name="turn-off"
              style={{
                color: baseColors.white,
                fontSize: fontSizes.medium,
                opacity: disabledRemove ? 0.5 : 1,
              }}
            />
          </TouchableOpacity>
        </HideAssetAddon>}
      </AssetWrapperAnimated>
    );
  }
}

export default AssetCardMinimized;
