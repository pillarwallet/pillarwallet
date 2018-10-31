// @flow
import * as React from 'react';
import { Platform, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import isEqual from 'lodash.isequal';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { Shadow } from 'components/Shadow';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors } from 'utils/variables';
import Icon from 'components/Icon';
import Toast from 'components/Toast';

type Props = {
  id: string,
  token: string,
  amount: string,
  onPress: Function,
  address: string,
  wallpaper: string,
  children?: React.Node,
  disclaimer?: string,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
  icon: string,
  smallScreen?: boolean,
  extraSmall?: boolean,
  disabledRemove?: boolean,
  onRemove: Function,
  forceHideRemoval?: boolean,
}

type State = {
  showHide: boolean,
  shakeAnimation: Object,
}

const defaultCircleColor = '#ACBCCD';

const AssetWrapper = styled(Animated.View)`
  width: 33.33333%;
  justify-content: center;
  align-items: center;
`;

const { width } = Dimensions.get('window');
const cardWidth = (width - 20) / 3;
const AssetWrapperAnimated = Animated.createAnimatedComponent(AssetWrapper);

const cardHeight = (smallScreen, extraSmall) => {
  if (smallScreen && extraSmall) {
    return 55;
  } else if (smallScreen) {
    return 70;
  } else if (extraSmall) {
    return 88;
  }
  return 105;
};

const ShadowHolder = styled(Shadow)`
  margin: ${Platform.select({
    ios: `4px ${spacing.rhythm / 4}px 6px`,
    android: '0',
  })};
  flex-direction: row;
`;

const Sizer = styled.View`
  height: ${props => cardHeight(props.smallScreen, props.extraSmall)}px;
  border-radius: 6px;
  background: ${baseColors.white};
  width: ${Platform.select({
    ios: '100%',
    android: `${cardWidth}px`,
  })};
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${props => props.smallScreen ? spacing.rhythm / 4 : spacing.rhythm / 2}px; 
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
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

const Amount = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
  color: ${baseColors.slateBlack};
  text-align: left;
`;

const FiatAmount = styled(LightText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  line-height: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  text-align: left;
`;

const Disclaimer = styled(LightText)`
  font-size: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
  line-height: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
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

const Name = styled(BoldText)`
  font-size: ${props => props.smallScreen ? fontSizes.extraExtraSmall : fontSizes.extraSmall}px;
  letter-spacing: ${fontTrackings.small};
  line-height: ${fontSizes.small}px;
  color: ${baseColors.darkGray};
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
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      showHide: false,
      shakeAnimation: new Animated.Value(0),
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.forceHideRemoval !== this.props.forceHideRemoval && this.props.forceHideRemoval) {
      this.hideRemoval();
    }
  }

  handleLongPress = () => {
    if (this.state.showHide) {
      this.hideRemoval();
    } else {
      this.showRemoval();
    }
  };

  handlePress = () => {
    const { onPress } = this.props;
    if (onPress) onPress();
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

  render() {
    const {
      amount,
      token,
      balanceInFiat,
      disclaimer,
      icon = '',
      extraSmall,
      smallScreen,
      disabledRemove,
      onRemove,
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

    const currencySymbol = getCurrencySymbol(balanceInFiat.currency);
    return (
      <AssetWrapperAnimated style={animatedStyle}>
        <ShadowHolder heightAndroid={cardHeight(smallScreen, extraSmall)}>
          <Sizer smallScreen={smallScreen} extraSmall={extraSmall}>
            <TouchableWithoutFeedback onPress={this.handlePress} onLongPress={this.handleLongPress}>
              <InnerWrapper smallScreen={smallScreen}>
                <CardRow>
                  <IconCircle smallScreen={smallScreen}>
                    {!!icon &&
                    <CachedImage
                      key={token}
                      style={{
                        height: smallScreen ? 20 : 36,
                        width: smallScreen ? 20 : 36,
                      }}
                      source={{ uri: icon }}
                      resizeMode="contain"
                    />}
                  </IconCircle>
                  <Name>{token}</Name>
                </CardRow>
                <CardRow>
                  <AmountWrapper extraSmall={extraSmall}>
                    <Amount>{amount}</Amount>
                    {!extraSmall &&
                    <DetailWrapper>
                      {disclaimer
                        ? <Disclaimer smallScreen={smallScreen}>{disclaimer}</Disclaimer>
                        : <FiatAmount>{currencySymbol}{balanceInFiat.amount}</FiatAmount>
                      }
                    </DetailWrapper>}
                  </AmountWrapper>
                </CardRow>
              </InnerWrapper>
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
                fontSize: fontSizes.small,
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
