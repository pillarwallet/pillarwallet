import React, { FC } from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { spacing } from 'utils/variables';

// Local
import BrowserOptionsButton from './BrowserOptionsButton';

interface IBrowserOptionsModal {
  openInSystemBrowser: () => void;
}

const BrowserOptionsModal: FC<IBrowserOptionsModal> = ({ openInSystemBrowser }) => {
  return (
    <SlideModal showHeader noPadding hideHeader sideMargins={spacing.small / 2}>
      <ModalContainer>
        <BrowserOptionsButton title={t('button.openInBrowser')} onPress={openInSystemBrowser} />
      </ModalContainer>
    </SlideModal>
  );
};

const ModalContainer = styled.View`
  padding: ${spacing.large}px ${spacing.medium}px ${spacing.extraPlusLarge}px;
`;

export default BrowserOptionsModal;
