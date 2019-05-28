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
import { Animated, Easing, Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { initFundTankProcessAction } from 'actions/smartWalletActions';

// components
import { ScrollWrapper, Container } from 'components/Layout';
import { BoldText, BaseText, MediumText } from 'components/Typography';
import Tank from 'components/Tank';
import Button from 'components/Button';
import IconButton from 'components/IconButton';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SETTLE_BALANCE } from 'constants/navigationConstants';

// selectors
import { activeAccountSelector } from 'selectors';
import { availableStakeSelector, paymentNetworkNonZeroBalancesSelector } from 'selectors/paymentNetwork';

// types
import type { Balances } from 'models/Asset';

// utils
import { getRate } from 'utils/assets';
import { baseColors, fontSizes } from 'utils/variables';
import { formatMoney, getCurrencySymbol } from 'utils/common';


type Props = {
  navigation: NavigationScreenProp<*>,
  tankData: {
    totalStake: number,
  },
  baseFiatCurrency: ?string,
  rates: Object,
  assetsOnNetwork: Balances,
  availableStake: number,
  resetIncorrectPassword: Function,
  initFundTankProcess: Function,
};

type DashLineProps = {
  total?: boolean,
};

type State = {
  tankValueAnimated: Animated.Value,
  leftColumnHeightHalf: number,
  rightColumnHeightHalf: number,
  showCheckPinModal: boolean,
  topUpButtonSubmitted: boolean,
};

const HeaderWrapper = styled.View`
  width: 100%;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`;

const Body = styled.View`
  padding-top: 80px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const FooterWrapper = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-bottom: 80px;
`;

const Column = styled.View`
  flex-direction: column;
  flex: 1;
`;

const ColumnInner = styled.View`
  flex-direction: column;
`;

const BoldTitle = styled(BoldText)`
  color: ${baseColors.white};
  font-size: ${fontSizes.medium}px;
`;

const Status = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin-top: 7px;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${props => props.active ? baseColors.emerald : baseColors.fireEngineRed};
  margin-right: 5px;
`;

const StatusText = styled(BaseText)`
  color: ${props => props.active ? baseColors.emerald : baseColors.fireEngineRed};
  font-size: ${fontSizes.extraExtraSmall}px;
  letter-spacing: 0.15;
`;

const ValueLabel = styled(BaseText)`
  color: ${props => props.total ? baseColors.caribbeanGreen : baseColors.lavenderBlue};
  font-size: ${fontSizes.extraSmall}px;
  margin-bottom: 5px;
  opacity: ${props => props.light ? 0.7 : 1};
`;

const ValueText = styled(MediumText)`
  color: ${props => props.total ? baseColors.caribbeanGreen : baseColors.lavenderBlue};
  font-size: ${fontSizes.medium}px;
`;

const TankHolder = styled.View`
  position: relative;
  padding: 0 14px;
`;

const TankGrade = styled.View`
  height: 0.5px;
  width: 28px;
  position: absolute;
  flex-direction: row;
  ${props => props.total ? 'left: 19px; top: 0;' : 'right: 12px;'}
`;

const Dash = styled.View`
  height: 1px;
  width: 2px;
  background-color: ${props => props.total ? baseColors.caribbeanGreen : '#c3e0ff'};
  margin-right: 2px;
`;

const CloseButton = styled(IconButton)`
  height: 44px;
  width: 44px;
  align-items: flex-end;
  position: absolute;
  top: 30px;
  right: 25px;
  z-index: 10;
`;

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const DashedLine = (props: DashLineProps) => {
  const dashes = [];
  for (let i = 0; i < 6; i++) {
    dashes.push(<Dash key={i} total={props.total} />);
  }

  return dashes;
};

const TankGradeAnimated = Animated.createAnimatedComponent(TankGrade);
const ColumnAnimated = Animated.createAnimatedComponent(Column);

class TankDetails extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tankValueAnimated: new Animated.Value(this.props.availableStake),
      leftColumnHeightHalf: 0,
      rightColumnHeightHalf: 0,
      showCheckPinModal: false,
      topUpButtonSubmitted: false,
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { availableStake } = this.props;

    if (prevProps.availableStake !== availableStake) {
      this.animateValue(availableStake);
    }
  }

  animateValue = (newValuePercentage: number) => {
    Animated.timing(
      this.state.tankValueAnimated,
      {
        toValue: newValuePercentage,
        easing: Easing.linear,
        duration: 800,
      },
    ).start();
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false, topUpButtonSubmitted: false });
  };

  navigateToFundTankScreen = async (_: string, wallet: Object) => {
    const { initFundTankProcess } = this.props;
    this.setState({ showCheckPinModal: false });

    await initFundTankProcess(wallet.privateKey);
    this.setState({ topUpButtonSubmitted: false });
  };

  render() {
    const {
      tankValueAnimated,
      rightColumnHeightHalf,
      leftColumnHeightHalf,
      showCheckPinModal,
      topUpButtonSubmitted,
    } = this.state;
    const {
      tankData,
      baseFiatCurrency,
      rates,
      navigation,
      assetsOnNetwork,
      availableStake,
    } = this.props;
    const { totalStake } = tankData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const fundButtonTitle = !topUpButtonSubmitted ? 'Fund' : 'Initializing..';

    // total
    const totalInFiat = totalStake * getRate(rates, 'ETH', fiatCurrency);
    const formattedTotalInFiat = formatMoney(totalInFiat);
    const totalFormatedAmount = formatMoney(totalStake, 4);

    // available
    const availableInFiat = availableStake * getRate(rates, 'ETH', fiatCurrency);
    const formattedAvailableInFiat = formatMoney(availableInFiat);
    const availableFormatedAmount = formatMoney(availableStake, 4);

    // used
    const usedAmount = totalStake - availableStake;
    const usedFormatedAmount = formatMoney(usedAmount, 4);

    const isActive = availableStake > 0;
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <Container color="#203756">
        <CloseButton
          icon="close"
          color={baseColors.coolGrey}
          onPress={() => navigation.goBack(null)}
          fontSize={fontSizes.small}
          horizontalAlign="flex-end"
        />
        <ScrollWrapper contentContainerStyle={{ paddingHorizontal: 30, paddingTop: 70 }}>
          <HeaderWrapper style={{ marginBottom: leftColumnHeightHalf }}>
            <BoldTitle>Pillar Payment Network</BoldTitle>
            <Status>
              <StatusIcon active={isActive} />
              <StatusText active={isActive}>{isActive ? 'ACTIVE' : 'NOT ACTIVE'}</StatusText>
            </Status>
          </HeaderWrapper>
          <Body style={{ opacity: leftColumnHeightHalf ? 1 : 0 }}>
            <Column
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                this.setState({ leftColumnHeightHalf: height / 2 });
              }}
              style={{
                transform: [{ translateY: leftColumnHeightHalf ? -leftColumnHeightHalf : 0 }],
                alignSelf: 'flex-start',
                opacity: leftColumnHeightHalf ? 1 : 0,
                alignItems: 'flex-end',
              }}
            >
              <ColumnInner>
                <ValueLabel total light>Total stake</ValueLabel>
                <ValueText total>
                  {`${totalFormatedAmount} ETH`}
                </ValueText>
                <ValueLabel total>
                  {`${currencySymbol}${formattedTotalInFiat}`}
                </ValueLabel>
              </ColumnInner>
            </Column>
            <TankHolder>
              <TankGrade total><DashedLine total /></TankGrade>
              <TankGradeAnimated
                style={{
                  bottom: tankValueAnimated.interpolate({
                    inputRange: [0, totalStake],
                    outputRange: [0, 215],
                  }),
                }}
              >
                <DashedLine />
              </TankGradeAnimated>
              <Tank value={availableStake} totalValue={totalStake} wrapperStyle={{ marginHorizontal: 24 }} />
            </TankHolder>
            <ColumnAnimated
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                this.setState({ rightColumnHeightHalf: height / 2 });
              }}
              style={{
                transform: [{
                  translateY: tankValueAnimated.interpolate({
                    inputRange: [0, totalStake],
                    outputRange: [rightColumnHeightHalf, -216 + rightColumnHeightHalf],
                  }),
                  }],
                alignSelf: 'flex-end',
                marginTop: -20,
                opacity: rightColumnHeightHalf ? 1 : 0,
              }}
            >
              <ValueLabel light>Available</ValueLabel>
              <ValueText>
                {`${availableFormatedAmount} ETH`}
              </ValueText>
              <ValueLabel>
                {`${currencySymbol}${formattedAvailableInFiat}`}
              </ValueLabel>
            </ColumnAnimated>
          </Body>
          <ColumnAnimated
            style={{
              alignItems: 'center',
              marginBottom: 80,
              marginTop: tankValueAnimated.interpolate({
                inputRange: [0, totalStake * 0.2, totalStake],
                outputRange: [30, 15, 15],
              }),
            }}
          >
            <ValueText style={{ color: baseColors.hoki }}>
              {`${usedFormatedAmount} ETH`}
            </ValueText>
            <ValueLabel style={{ color: baseColors.hoki, fontSize: fontSizes.extraExtraSmall }}>Used</ValueLabel>
          </ColumnAnimated>
          <FooterWrapper>
            <Button
              title={fundButtonTitle}
              disabled={topUpButtonSubmitted}
              noPadding
              width="197px"
              style={{ marginBottom: 18 }}
              onPress={() => this.setState({ showCheckPinModal: true, topUpButtonSubmitted: true })}
            />
            <Button
              secondaryTransparent
              title="Settle"
              noPadding
              width="197px"
              onPress={() => navigation.navigate(SETTLE_BALANCE)}
              disabled={!Object.keys(assetsOnNetwork).length}
            />
          </FooterWrapper>
        </ScrollWrapper>
        <SlideModal
          isVisible={showCheckPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper flex={1}>
            <CheckPin onPinValid={this.navigateToFundTankScreen} />
          </Wrapper>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  tank: { data: tankData },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}) => ({
  tankData,
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
  availableStake: availableStakeSelector,
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  initFundTankProcess: (privateKey: string) => dispatch(initFundTankProcessAction(privateKey)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(TankDetails);
