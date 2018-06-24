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
        title="Your transaction is pending"
        center
        maxWidth={200}
      />
      <Paragraph light center style={{ marginBottom: 30 }}>
        The process may take up to 10 minutes to complete. please check your transaction history.
      </Paragraph>
    </PopModal>
  );
};

export default TransactionSentModal;
