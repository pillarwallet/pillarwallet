// @flow
import * as React from 'react';
import { Platform, Linking } from 'react-native';
import isEqual from 'lodash.isequal';
import { baseColors, spacing, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

import Header from 'components/Header';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { BoldText, Paragraph } from 'components/Typography';
import CircleButton from 'components/CircleButton';


const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type Props = {
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string, indexFrom?: number) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Balances,
  wallet: Object,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object,
  resetHideRemoval: Function,
};

type State = {
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object,
    },
  },
  showDescriptionModal: boolean,
};

const ActionButtonsWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-top: 5px;
  padding-bottom: 30px;
  padding-top: ${Platform.select({
    ios: '10px',
    android: '30px',
  })};
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: 64px ${spacing.large}px ${spacing.large}px;
  justify-content: center;
`;

const ButtonWrapper = styled.View`
  padding: ${spacing.large}px;
  justify-content: center;
`;

const CollectibleTitle = styled(BoldText)`
  font-size: ${fontSizes.semiGiant}px;
  text-align: center;
`;


const Description = styled(Paragraph)`
  padding-bottom: 80px;
  line-height: ${fontSizes.mediumLarge};
`;

const CircleButtonsWrapper = styled(Wrapper)`
  margin-top: ${Platform.select({
    ios: 0,
    android: '-20px',
  })}
`;

const CollectibleImage = styled(CachedImage)`
  align-self: center;
  height: 128px;
  width: 128px;
  margin-top: 30px;
`;

const iconSend = require('assets/icons/icon_send.png');
const genericCollectible = require('assets/images/no_logo.png');

class CollectibleScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
    showDescriptionModal: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  showMoreInfo = (url: string) => {
    Linking.openURL(url);
  };

  render() {
    const {
      showDescriptionModal,
    } = this.state;
    const { navigation } = this.props;
    const { assetData } = navigation.state.params;

    const {
      id,
      category,
      name,
      description,
      icon,
      externalLink,
    } = assetData;

    return (
      <Container color={baseColors.white} inset={{ bottom: 0 }}>
        <Header
          onBack={() => { navigation.goBack(); }}
          title={category}
          onNextPress={description
            ? () => { this.setState({ showDescriptionModal: true }); }
            : null}
          nextIcon="info-circle-inverse"
          nextIconSize={fontSizes.extraLarge}
        />
        <ScrollWrapper>
          <CollectibleImage
            key={id.toString()}
            source={{ uri: icon }}
            fallbackSource={genericCollectible}
            resizeMode="contain"
          />
          <DataWrapper>
            <CollectibleTitle>
              {name}
            </CollectibleTitle>
          </DataWrapper>
          <ActionButtonsWrapper>
            <CircleButtonsWrapper center horizontal>
              <CircleButton
                label="Send"
                icon={iconSend}
                onPress={() => {}}
              />
            </CircleButtonsWrapper>
          </ActionButtonsWrapper>
          {!!externalLink &&
          <ButtonWrapper>
            <Button
              block
              title="View more info"
              primaryInverted
              onPress={() => { this.showMoreInfo(externalLink); }}
            />
          </ButtonWrapper>}
        </ScrollWrapper>
        <SlideModal
          isVisible={showDescriptionModal}
          onModalHide={() => { this.setState({ showDescriptionModal: false }); }}
        >
          <Description small light>{description}</Description>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  contacts: { data: contacts },
  assets: { data: assets, balances },
  rates: { data: rates },
  history: { data: history },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  contacts,
  assets,
  balances,
  rates,
  history,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset, indexFrom) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset, indexFrom));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CollectibleScreen);
