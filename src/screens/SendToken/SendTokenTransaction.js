// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper, Footer } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import TransactionSentAnimation from 'components/TransactionSentAnimation';
import ShareSocial from 'components/ShareSocial';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {}

class SendTokenTransaction extends React.Component<Props, State> {
  handleDismissal = () => {
    const { navigation } = this.props;
    navigation.dismiss();
  };

  render() {
    return (
      <React.Fragment>
        <Container>
          <Wrapper flex={1} center regularPadding>
            <TransactionSentAnimation />
            <Title title="Money is on its way" align="center" noBlueDot />
            <Paragraph light center style={{ marginBottom: 30 }}>
              It will be settled in a few moments, depending on your gas price settings and Ethereum network load
            </Paragraph>
            <Button marginBottom="20px" onPress={this.handleDismissal} title="Magic!" />
          </Wrapper>
          <Footer>
            <ShareSocial label="Share the love" facebook instagram twitter />
          </Footer>
        </Container>
      </React.Fragment>
    );
  }
}

export default SendTokenTransaction;
