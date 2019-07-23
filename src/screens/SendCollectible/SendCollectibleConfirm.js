// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';
import type { CollectibleTransactionPayload } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { Account } from 'models/Account';
import { fetchGasInfoAction } from 'actions/historyActions';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { calculateGasEstimate, fetchRinkebyETHBalance } from 'services/assets';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { activeAccountSelector } from 'selectors';

const NORMAL = 'avg';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  wallet: Object,
  activeAccount: Account,
};

type State = {
  note: ?string,
  rinkebyETH: string,
  scrollPos: number,
  gasLimit: number,
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
  scroll: Object;
  source: string;

  constructor(props) {
    super(props);
    this.scroll = React.createRef();
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');

    this.state = {
      note: null,
      rinkebyETH: '',
      scrollPos: 0,
      gasLimit: 0,
    };
  }

  componentDidMount() {
    const {
      activeAccount: { id: from },
      fetchGasInfo,
    } = this.props;
    fetchGasInfo();
    this.fetchETHBalanceInRinkeby();
    const {
      id: tokenId,
      contractAddress,
    } = this.assetData;
    calculateGasEstimate({
      from,
      to: this.receiver,
      contractAddress,
      tokenId,
    })
      .then(gasLimit => this.setState({ gasLimit }))
      .catch(() => null);
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
    const { contacts, session, gasInfo } = this.props;
    const { name } = this.assetData;
    const { rinkebyETH, scrollPos, gasLimit } = this.state;
    const to = this.receiver;
    const txFeeInWei = this.getTxFeeInWei();
    const txFee = utils.formatEther(txFeeInWei.toString());
    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);
    const canProceedTesting = parseFloat(rinkebyETH) > parseFloat(txFee) || NETWORK_PROVIDER !== 'ropsten';

    return (
      <Container color={baseColors.white}>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title="review and confirm"
          white
        />
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll={Platform.OS === 'android'}
          innerRef={ref => { this.scroll = ref; }}
          onKeyboardWillShow={() => {
            if (Platform.OS === 'android') {
              this.scroll.scrollToPosition(0, scrollPos);
            }
          }}
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
            onLayout={(e) => {
              const scrollPosition = e.nativeEvent.layout.y + 180;
              this.setState({ scrollPos: scrollPosition });
            }}
          />
          }
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40} backgroundColor={UIColors.defaultBackgroundColor}>
          <FooterWrapper>
            <Button
              disabled={!gasLimit || !session.isOnline || !gasInfo.isFetched || !canProceedTesting}
              onPress={this.handleFormSubmit}
              title="Confirm Transaction"
            />
          </FooterWrapper>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  session: { data: session },
  history: { gasInfo },
  wallet: { data: wallet },
}) => ({
  contacts,
  session,
  gasInfo,
  wallet,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);
