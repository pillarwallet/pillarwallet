// @flow
import * as React from 'react';
import { Paragraph } from 'components/Typography';
import { Center } from 'components/Layout';
import Title from 'components/Title';
import PopModal from 'components/Modals/PopModal';
import TransactionSentAnimation from './TransactionSentAnimation';

type Props = {
  isVisible: boolean,
  onModalHide: Function,
};

const TransactionSentModal = (props: Props) => {
  const { isVisible, onModalHide } = props;

  return (
    <PopModal
      isVisible={isVisible}
      onModalHide={onModalHide}
    >
      <Center>
        <TransactionSentAnimation />
        <Title title="transaction sent" align="center" />
      </Center>
      <Paragraph light center style={{ marginBottom: 30 }}>
          We will let you know once it has been confirmed.
      </Paragraph>
    </PopModal>
  );
};

export default TransactionSentModal;

