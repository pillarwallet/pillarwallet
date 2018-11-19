// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { NEW_PROFILE, IMPORT_WALLET } from 'constants/navigationConstants';
import { Wrapper, Container, Footer } from 'components/Layout';
import { fontSizes } from 'utils/variables';
import Button from 'components/Button';
import AnimatedBackground from 'components/AnimatedBackground';
import ButtonText from 'components/ButtonText';
import { resetWalletImportAction } from 'actions/walletActions';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetWalletImport: Function,
}

type State = {
  shouldAnimate: boolean,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled(CachedImage)`
  height: 60;
  width: 120;
`;

class Welcome extends React.Component<Props, State> {
  listeners: Object[];

  constructor(props: Props) {
    super(props);
    this.listeners = [];
  }

  state = {
    shouldAnimate: true,
  };

  loginAction = () => {
    this.props.navigation.navigate(NEW_PROFILE);
  };

  toImportWallet = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET);
  };

  componentDidMount() {
    const { resetWalletImport } = this.props;
    resetWalletImport();

    this.listeners = [
      this.props.navigation.addListener('willFocus', () => {
        resetWalletImport();
        this.setState({ shouldAnimate: true });
      }),
      this.props.navigation.addListener('willBlur', () => this.setState({ shouldAnimate: false })),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach((listenerItem) => {
      listenerItem.remove();
    });
  }

  render() {
    return (
      <Container>
        <AnimatedBackground shouldAnimate={this.state.shouldAnimate} />
        <Wrapper fullScreen center>
          <PillarLogo source={pillarLogoSource} />
        </Wrapper>
        <Footer>
          <Button block marginBottom="20px" onPress={this.loginAction} title="New wallet" />
          <ButtonText
            buttonText="Restore wallet"
            onPress={this.toImportWallet}
            fontSize={fontSizes.medium}
          />
        </Footer>
      </Container>
    );
  }
}


const mapDispatchToProps = (dispatch: Function) => ({
  resetWalletImport: () => {
    dispatch(resetWalletImportAction());
  },
});

export default connect(null, mapDispatchToProps)(Welcome);
