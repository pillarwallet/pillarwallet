// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';
import type { CollectibleTransactionPayload } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { Accounts } from 'models/Account';
import { fetchGasInfoAction } from 'actions/historyActions';
import { fontSizes, spacing } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { addressesEqual } from 'utils/assets';
import { getAccountName } from 'utils/accounts';
import { calculateGasEstimate, fetchRinkebyETHBalance } from 'services/assets';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { activeAccountAddressSelector } from 'selectors';

const NORMAL = 'avg';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  wallet: Object,
  activeAccountAddress: string,
  accounts: Accounts,
};

type State = {
  note: ?string,
  rinkebyETH: string,
  gasLimit: number,
};

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
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
      rinkebyETH: '',
      gasLimit: 0,
    };
  }

  componentDidMount() {
    const {
      activeAccountAddress,
      fetchGasInfo,
    } = this.props;
    fetchGasInfo();
    this.fetchETHBalanceInRinkeby();
    const {
      id: tokenId,
      contractAddress,
    } = this.assetData;
    calculateGasEstimate({
      from: activeAccountAddress,
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
    const {
      contacts,
      session,
      gasInfo,
      accounts,
    } = this.props;
    const { name } = this.assetData;
    const { rinkebyETH, gasLimit } = this.state;
    const to = this.receiver;
    const txFeeInWei = this.getTxFeeInWei();
    const txFee = utils.formatEther(txFeeInWei.toString());
    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);
    const canProceedTesting = parseFloat(rinkebyETH) > parseFloat(txFee) || NETWORK_PROVIDER !== 'ropsten';
    const userAccount = !recipientUsername ? accounts.find(({ id }) => addressesEqual(id, to)) : null;

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
          {!!userAccount &&
          <LabeledRow>
            <Label>Recipient</Label>
            <Value>{getAccountName(userAccount.type, accounts)}</Value>
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
          {session.isOnline && !!recipientUsername &&
            <TextInput
              inputProps={{
                onChange: (text) => this.handleNoteChange(text),
                value: this.state.note,
                autoCapitalize: 'none',
                multiline: true,
                numberOfLines: 3,
                placeholder: 'Add a note to this transaction',
              }}
              keyboardAvoidance
              inputWrapperStyle={{ marginTop: spacing.medium }}
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
  accounts: { data: accounts },
}) => ({
  contacts,
  session,
  gasInfo,
  wallet,
  accounts,
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
