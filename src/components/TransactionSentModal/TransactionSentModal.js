// @flow
import * as React from 'react';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import PopModal from 'components/Modals/PopModal';

const tokenSentConfirmationImage = require('assets/images/token-sent-confirmation-image.png');

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
      headerImage={tokenSentConfirmationImage}
    >
      <Title
        title="transaction sent"
        center
      />
      <Paragraph light center style={{ marginBottom: 30 }}>
        We will let you know once it has been confirmed.
      </Paragraph>
    </PopModal>
  );
};

export default TransactionSentModal;
