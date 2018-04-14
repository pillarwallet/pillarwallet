// @flow
import * as React from 'react';
import {
  Text,
  View,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';

import DefaultButton from 'components/Buttons/DefaultButton';
import { sendAssetAction, fetchEtherBalanceAction } from 'actions/assetsActions';
import { FETCHING, ETH } from 'constants/assetsConstants';
import styles from './styles';

// https://ropsten.etherscan.io/address/0x583cbbb8a8443b38abcc0c956bece47340ea1367#readContract
const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';
const { Form } = t.form;

const defaultICOState = {
  address,
  gasLimit: 1500000,
  gasPrice: 20000000000,
};

const ICO_TYPE = t.struct({
  address: t.String,
  amount: t.Number,
  gasPrice: t.Number,
  gasLimit: t.Number,
});

type Props = {
  sendAsset: (pin: string) => Function,
  fetchEtherBalance: () => Function,
  assets: Object
}

type State = {
  isPopupOpen: boolean,
  value: Object
};

class ICO extends React.Component<Props, State> {
  state = {
    isPopupOpen: false,
    value: defaultICOState,
  };

  componentWillMount() {
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
  }

  _form: t.Form

  handleICOTransaction = () => {
    const { sendAsset } = this.props;
    const value = this._form.getValue();
    if (!value) return;
    sendAsset(value);
    this.handlePopupState();
  }

  handleChange = (value) => {
    this.setState({ value });
  }

  handlePopupState = () => {
    const { isPopupOpen } = this.state;
    this.setState({
      isPopupOpen: !isPopupOpen,
    });
  }

  render() {
    const {
      isPopupOpen,
      value,
    } = this.state;
    const { assets: { data: assets, assetsState } } = this.props;
    return (
      <ScrollView
        style={styles.container}
        contentInset={{ bottom: 49 }}
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              this.props.fetchEtherBalance();
            }}
            tintColor="#EBEBEB"
            title="Loading..."
            colors={['#ff0000', '#00ff00', '#0000ff']}
            progressBackgroundColor="#EBEBEB"
          />
        }
      >
        <Text>Participate in the ICO</Text>
        <Text>{address}</Text>
        <Text>
            You have: {assets[ETH] && assetsState !== FETCHING ? assets[ETH].balance : '*Fetching*'} ETH
        </Text>
        <DefaultButton title="Participate" onPress={this.handlePopupState} />
        <Modal
          animationType="slide"
          showCloseBtn="true"
          transparent={false}
          visible={isPopupOpen}
          onRequestClose={this.handlePopupState}
        >
          <View>
            <Form
              ref={(node) => {
                this._form = node;
              }}
              type={ICO_TYPE}
              value={value}
              onChange={this.handleChange}
            />
            <DefaultButton title="Send" onPress={this.handleICOTransaction} />
          </View>
        </Modal>
      </ScrollView>
    );
  }
}

const mapStateToProps = ({ wallet, assets }) => ({ wallet, assets });

const mapDispatchToProps = (dispatch: Function) => ({
  sendAsset: (transaction: Object) =>
    dispatch(sendAssetAction(transaction)),
  fetchEtherBalance: () =>
    dispatch(fetchEtherBalanceAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ICO);
