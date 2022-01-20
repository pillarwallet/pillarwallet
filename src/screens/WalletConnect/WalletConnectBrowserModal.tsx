import React, { useEffect, FC } from 'react';
import { useTranslation } from 'translations/translate';

// Components
import SlideModal from 'components/Modals/SlideModal';
import InAppBrowser from 'components/InAppBrowser/InAppBrowser';

// Utils
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';
import { spacing } from 'utils/variables';

interface IWalletConnectBrowserModal {
  url?: string;
  closeModal?: () => void;
}

const WalletConnectBrowserModal: FC<IWalletConnectBrowserModal> = ({ url, closeModal }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!url) showServiceLaunchErrorToast();
  }, []);

  const onClose = (): void => {
    closeModal();
  };

  return (
    <SlideModal
      showHeader
      fillHeight
      noPadding
      noClose
      noSwipeToDismiss
      sideMargins={spacing.small / 2}
      headerLeftItems={[{ title: t('button.close'), onPress: onClose }]}
    >
      <InAppBrowser initialUrl={url} />
    </SlideModal>
  );
};

export default WalletConnectBrowserModal;
