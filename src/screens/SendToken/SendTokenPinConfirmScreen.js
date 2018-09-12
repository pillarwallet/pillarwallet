// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { Container } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: (transactionPayload: TransactionPayload, navigate: Function) => Function,
  resetIncorrectPassword: () => Function,
}

type State = {
  transactionPayload: TransactionPayload,
  isChecking: boolean,
};

class SendTokenPinConfirmScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    this.state = {
      transactionPayload,
      isChecking: false,
    };
  }

  handleDismissal = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    navigation.dismiss();
  };

  handleTransaction = () => {
    const { sendAsset } = this.props;
    const { transactionPayload } = this.state;
    this.setState({
      isChecking: true,
    }, () => sendAsset(transactionPayload, this.handleNavigationToTransactionState));
  }

  handleNavigationToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    navigation.navigate(SEND_TOKEN_TRANSACTION, { ...params });
  }

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    navigation.goBack(null);
    resetIncorrectPassword();
  }

  render() {
    const { isChecking } = this.state;
    return (
      <Container>
        <Header
          onBack={this.handleBack}
          onClose={this.props.navigation.dismiss}
          title="enter pincode"
        />
        <CheckPin onPinValid={this.handleTransaction} isChecking={isChecking} />
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload, navigate) => dispatch(sendAssetAction(transaction, navigate)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});


export default connect(null, mapDispatchToProps)(SendTokenPinConfirmScreen);
