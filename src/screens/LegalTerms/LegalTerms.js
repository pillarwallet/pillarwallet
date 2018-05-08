// @flow
import * as React from 'react';
import { Container, Wrapper, Footer } from 'components/Layout';
import { Title, Body } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Divider from 'components/Divider';
import HyperLink from 'components/HyperLink';
import Checkbox from 'components/Checkbox';
import CheckboxItem from 'components/CheckboxItem';
import CheckboxText from 'components/CheckboxText';
import { connect } from 'react-redux';
import { generateEncryptedWalletAction } from 'actions/walletActions';

type Props = {
  generateEncryptedWallet: () => Function,
};

type State = {
  termsViewVisible: boolean,
  box01: boolean,
  box02: boolean,
  box03: boolean,
  confirmButtonDisabled: boolean,
};

class LegalTerms extends React.Component<Props, State> {
  state = {
    termsViewVisible: false,
    box01: false,
    box02: false,
    box03: false,
    confirmButtonDisabled: true,
  };

  toggleCheckBox = (checkbox: boolean, tag: any) => {
    this.setState((prevState) => {
      let {
        termsViewVisible,
        box01,
        box02,
        box03,
      } = prevState;

      let confirmButtonDisabled = true;

      if (tag === 'box01') box01 = checkbox;
      if (tag === 'box02') box02 = checkbox;
      if (tag === 'box03') box03 = checkbox;

      if (box01 && box02) {
        termsViewVisible = true;
      } else {
        termsViewVisible = false;
        box03 = false;
      }
      if (box03) {
        confirmButtonDisabled = false;
      }

      return {
        ...prevState,
        box01,
        box02,
        box03,
        termsViewVisible,
        confirmButtonDisabled,
      };
    });
  };

  buildCheckBox = (tag: any, state: boolean) => {
    return <Checkbox toggleCheckbox={this.toggleCheckBox} tag={tag} checked={state} />;
  };

  handleConfirm = () => {
    this.props.generateEncryptedWallet();
  };

  render() {
    const {
      termsViewVisible,
      box01,
      box02,
      box03,
      confirmButtonDisabled,
    } = this.state;

    return (
      <Container>
        <Wrapper padding>
          <Title>Let&#39;s Review</Title>
          <Body style={{ color: 'grey', marginBottom: 20 }}>By using the Pillar Wallet you agree that:</Body>
          <CheckboxItem marginBottom>
            { this.buildCheckBox('box01', box01) }
            <CheckboxText>
            I understand that my funds are held securely on this device, not by a company.
            </CheckboxText>
          </CheckboxItem>

          <CheckboxItem marginBottom>
            { this.buildCheckBox('box02', box02) }
            <CheckboxText>
            I understand that if this app is moved to a new phone or deleted,
            the only way my funds and contacts can be recovered is by using my 12 word backup phrase.
            </CheckboxText>
          </CheckboxItem>
        </Wrapper>
        {termsViewVisible && (
          <Footer>
            <CheckboxItem marginBottom>
              { this.buildCheckBox('box03', box03) }
              <CheckboxText>
                I have read, understand, and agree to the Terms of Use.
              </CheckboxText>
            </CheckboxItem>
            <Divider />
            <MultiButtonWrapper>
              <Button
                block
                title="Confirm and Finish"
                onPress={this.handleConfirm}
                disabled={confirmButtonDisabled}
                marginBottom="20px"
              />

              <Body>
                <HyperLink url="https://pillarproject.io/en/terms-of-use/">Terms of Use </HyperLink>
                and
                <HyperLink url="https://pillarproject.io/en/legal/privacy/"> Privacy Policy</HyperLink>
              </Body>

            </MultiButtonWrapper>
          </Footer>
        )}
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  generateEncryptedWallet: () => {
    dispatch(generateEncryptedWalletAction());
  },
});

export default connect(null, mapDispatchToProps)(LegalTerms);
