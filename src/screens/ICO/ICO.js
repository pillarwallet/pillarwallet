// @flow
import * as React from 'react';
import {
  Text,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';

import Container from 'components/Container';
import Title from 'components/Title';
import Button from 'components/Button';
import Footer from 'components/Footer';

import { sendAssetAction, fetchEtherBalanceAction } from 'actions/assetsActions';
import { FETCHING, ETH } from 'constants/assetsConstants';

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

  _form: t.Form;

  handleICOTransaction = () => {
    const { sendAsset } = this.props;
    const value = this._form.getValue();
    if (!value) return;
    sendAsset(value);
    this.handlePopupState();
  };

  handleChange = (value) => {
    this.setState({ value });
  };

  handlePopupState = () => {
    const { isPopupOpen } = this.state;
    this.setState({
      isPopupOpen: !isPopupOpen,
    });
  };

  render() {
    const {
      isPopupOpen,
      value,
    } = this.state;
    const { assets: { data: assets, assetsState } } = this.props;
    return (
      <Container>
        <Title>ICOs</Title>
        <ScrollView
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
          <Text style={{ marginBottom: 20 }}>Participate in the ICO</Text>
          <Text style={{ marginBottom: 20 }}>{address}</Text>
          <Text style={{ marginBottom: 20 }}>
            You have: {assets[ETH] && assetsState !== FETCHING ? assets[ETH].balance : '*Fetching*'} ETH
          </Text>
          <Button small title="Participate" onPress={this.handlePopupState} />

          <Modal
            animationType="slide"
            showCloseBtn="true"
            transparent={false}
            visible={isPopupOpen}
            onRequestClose={this.handlePopupState}
          >
            <Container>
              <Title>Participate in ICO</Title>
              <Form
                ref={(node) => {
                      this._form = node;
                    }}
                type={ICO_TYPE}
                value={value}
                onChange={this.handleChange}
              />
              <Footer>
                <Button marginBottom title="Send" onPress={this.handleICOTransaction} />
              </Footer>
            </Container>
          </Modal>
        </ScrollView>
      </Container>
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
