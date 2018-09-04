// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import { Container, Wrapper, Footer } from 'components/Layout';
import ShareSocial from 'components/ShareSocial';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import TransactionSentAnimation from './TransactionSentAnimation';

type Props = {
  onModalHide?: Function,
  isVisible: boolean,
  modalHide: Function,
};

const TransactionSentModal = (props: Props) => {
  const {
    isVisible,
    modalHide,
    onModalHide,
  } = props;

  const animationInTiming = 300;
  const animationOutTiming = 300;

  return (
    <Modal
      isVisible={isVisible}
      animationInTiming={animationInTiming}
      animationOutTiming={animationOutTiming}
      animationIn="fadeIn"
      animationOut="fadeOut"
      onBackButtonPress={modalHide}
      onModalHide={onModalHide}
      style={{
        margin: 0,
        justifyContent: 'flex-start',
      }}
    >
      <Container>
        <Wrapper flex={1} center regularPadding>
          <TransactionSentAnimation />
          <Title title="Money is on its way" align="center" noBlueDot />
          <Paragraph light center style={{ marginBottom: 30 }}>
            It will be settled in a few moments, depending on your gas price settings and Ethereum network load
          </Paragraph>
          <Button marginBottom="20px" onPress={modalHide} title="Magic!" />
        </Wrapper>
        <Footer>
          <ShareSocial label="Share the love" facebook instagram twitter />
        </Footer>
      </Container>
    </Modal>
  );
};

export default TransactionSentModal;
