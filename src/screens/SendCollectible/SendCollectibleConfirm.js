// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';
import type { CollectibleTransactionPayload } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { EthereumNetwork } from 'models/Network';
import { fetchGasInfoAction } from 'actions/historyActions';
import { baseColors, fontSizes, UIColors, spacing } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { calculateGasEstimate, fetchETHBalance } from 'services/assets';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { activeAccountAddressSelector } from 'selectors';

const NORMAL = 'avg';

type Props = {
  ethereumNetwork: EthereumNetwork,
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  wallet: Object,
  activeAccountAddress: string,
};

type State = {
  note: ?string,
  collectiblesETH: string,
  gasLimit: number,
};

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${baseColors.snowWhite};
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium};
`;

class SendCollectibleConfirm extends React.Component<Props, State> {
  assetData: Object;
  receiver: string;
  source: string;

  constructor(props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');

    this.state = {
      note: null,
      collectiblesETH: '',
      gasLimit: 0,
    };
  }

  componentDidMount() {
    const {
      activeAccountAddress,
      fetchGasInfo,
      ethereumNetwork,
    } = this.props;
    fetchGasInfo();
    this.fetchETHBalanceForCollectibles();
    const {
      id: tokenId,
      contractAddress,
    } = this.assetData;
    calculateGasEstimate({
      from: activeAccountAddress,
      to: this.receiver,
      contractAddress,
      tokenId,
    }, ethereumNetwork.collectiblesNetwork)
      .then(gasLimit => this.setState({ gasLimit }))
      .catch(() => null);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.fetchGasInfo();
    }
  }

  fetchETHBalanceForCollectibles = async () => {
    const { wallet, ethereumNetwork } = this.props;
    const collectiblesETHBalance = await fetchETHBalance(
      wallet.address,
      ethereumNetwork.collectiblesNetwork,
    );
    this.setState({ collectiblesETH: collectiblesETHBalance });
  };

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const { note } = this.state;
    const {
      name,
      tokenType,
      id: tokenId,
      contractAddress,
    } = this.assetData;

    const transactionPayload: CollectibleTransactionPayload = {
      to: this.receiver,
      name,
      contractAddress,
      tokenType,
      tokenId,
      note,
    };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  getTxFeeInWei = () => {
    const { gasInfo } = this.props;
    const { gasLimit } = this.state;
    const gasPrice = gasInfo.gasPrice[NORMAL] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(gasLimit);
  };

  render() {
    const {
      contacts,
      session,
      gasInfo,
      ethereumNetwork,
    } = this.props;
    const { name } = this.assetData;
    const { collectiblesETH, gasLimit } = this.state;
    const to = this.receiver;
    const txFeeInWei = this.getTxFeeInWei();
    const txFee = utils.formatEther(txFeeInWei.toString());
    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);
    const canProceedTesting = parseFloat(collectiblesETH) > parseFloat(txFee);

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review and confirm' }] }}
        keyboardAvoidFooter={(
          <FooterWrapper>
            <Button
              disabled={!gasLimit || !session.isOnline || !gasInfo.isFetched || !canProceedTesting}
              onPress={this.handleFormSubmit}
              title="Confirm Transaction"
            />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll
          color={UIColors.defaultBackgroundColor}
        >
          <LabeledRow>
            <Label>Collectible</Label>
            <Value>{name}</Value>
          </LabeledRow>
          {!!recipientUsername &&
          <LabeledRow>
            <Label>Recipient Username</Label>
            <Value>{recipientUsername}</Value>
          </LabeledRow>
          }
          <LabeledRow>
            <Label>Recipient Address</Label>
            <Value>{to}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Est. Network Fee</Label>
            {
              (!!gasLimit && <Value>{txFee} ETH</Value>)
              || <Spinner style={{ marginTop: 5 }} width={20} height={20} />
            }
          </LabeledRow>
          {ethereumNetwork.id === ethereumNetwork.collectiblesNetwork &&
          <LabeledRow>
            <Label>Balance on collectibles network</Label>
            <Value>{collectiblesETH} ETH</Value>
          </LabeledRow>}
          {!!recipientUsername &&
          <TextInput
            inputProps={{
              onChange: (text) => this.handleNoteChange(text),
              value: this.state.note,
              autoCapitalize: 'none',
              multiline: true,
              numberOfLines: 3,
              placeholder: 'Add a note to this transaction',
            }}
            inputType="secondary"
            labelBigger
            noBorder
            keyboardAvoidance
          />
          }
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  session: { data: session },
  history: { gasInfo },
  wallet: { data: wallet },
  network: { ethereumNetwork },
}) => ({
  contacts,
  session,
  gasInfo,
  wallet,
  ethereumNetwork,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);
