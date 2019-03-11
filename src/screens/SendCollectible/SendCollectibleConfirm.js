// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import type { CollectibleTransactionPayload } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import { fetchGasInfoAction } from 'actions/historyActions';
import { fontSizes } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { fetchRinkebyETHBalance } from 'services/assets';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { NETWORK_PROVIDER } from 'react-native-dotenv';

const GAS_LIMIT = 500000;
const NORMAL = 'avg';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  categories: Object[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  wallet: Object,
};

type State = {
  note: ?string,
  rinkebyETH: string,
};

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
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

  constructor(props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.state = {
      note: null,
      rinkebyETH: '',
    };
  }

  componentDidMount() {
    this.props.fetchGasInfo();
    this.fetchETHBalanceInRinkeby();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.fetchGasInfo();
    }
  }

  fetchETHBalanceInRinkeby = async () => {
    const { wallet } = this.props;
    const rinkebyETHBlanace = await fetchRinkebyETHBalance(wallet.address);
    this.setState({ rinkebyETH: rinkebyETHBlanace });
  }

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
    });
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  getTxFeeInWei = () => {
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[NORMAL] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(GAS_LIMIT);
  };

  render() {
    const { contacts, session, gasInfo } = this.props;
    const { name } = this.assetData;
    const { rinkebyETH } = this.state;

    const to = this.receiver;
    const txFeeInWei = this.getTxFeeInWei();
    const txFee = utils.formatEther(txFeeInWei.toString());
    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);
    const canProceedTesting = parseFloat(rinkebyETH) > parseFloat(txFee);

    return (
      <React.Fragment>
        <Container>
          <Header
            onBack={() => this.props.navigation.goBack(null)}
            title="review and confirm"
          />
          <ScrollWrapper regularPadding>
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
              <Value>{txFee} ETH</Value>
            </LabeledRow>
            {NETWORK_PROVIDER === 'ropsten' &&
            <LabeledRow>
              <Label>Balance in Rinkeby ETH (visible in dev and staging)</Label>
              <Value>{rinkebyETH} ETH</Value>
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
          <Footer keyboardVerticalOffset={40}>
            <FooterWrapper>
              <Button
                disabled={!session.isOnline || !gasInfo.isFetched || !canProceedTesting}
                onPress={this.handleFormSubmit}
                title="Confirm Transaction"
              />
            </FooterWrapper>
          </Footer>
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  session: { data: session },
  history: { gasInfo },
  collectibles: { categories },
  wallet: { data: wallet },
}) => ({
  contacts,
  session,
  gasInfo,
  categories,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);
