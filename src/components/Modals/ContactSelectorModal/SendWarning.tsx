import React, { FC } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';
import CheckBoxWithText from 'components/core/CheckBoxWithText';
import { Spacing } from 'components/layout/Layout';
import Icon from 'components/core/Icon';
import Modal from 'components/Modal';
import UnsupportedExchangesModal from 'components/Modals/ContactSelectorModal/UnsupportedExchangesModal';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

interface ISendWarning {
  warningAccepted: boolean;
  setWarningAccepted: (value: boolean) => void;
  style?: ViewStyleProp;
}

const SendWarning: FC<ISendWarning> = ({ warningAccepted, setWarningAccepted, style }) => {
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('contactSelector');

  const warningTextStyle = {
    color: colors.negative,
  };

  const linkTextStyle = {
    color: colors.primaryAccent130,
  };

  const openUnsupportedExchanges = () => {
    Modal.open(() => <UnsupportedExchangesModal />);
  };

  return (
    <SendWarningWrapper style={style}>
      <SendWarningTextWrapper>
        <TextRow>
          <Icon name="small-warning" color={colors.negative} />
          <Spacing w={spacing.small} />
          <Text style={warningTextStyle}>{t('sendWarning.title')}</Text>
        </TextRow>
        <Text style={warningTextStyle}>{t('sendWarning.body')}</Text>

        <Spacing h={spacing.large} />

        <LinkTouchable onPress={openUnsupportedExchanges}>
          <TextRow>
            <Text style={linkTextStyle}>{t('sendWarning.unsupportedExchanges')}</Text>
            <Spacing w={spacing.small} />
            <Icon name="open-link" color={colors.primaryAccent130} />
          </TextRow>
        </LinkTouchable>
      </SendWarningTextWrapper>

      <Spacing h={spacing.large} />

      <CheckBoxWithText
        value={warningAccepted}
        onValueChange={setWarningAccepted}
        text={t('button.sendingToExchangeWarning')}
        paddingHorizontal={spacing.mediumLarge}
        paddingVertical={spacing.largePlus}
        roundedBorders
        highlightBackground
      />
    </SendWarningWrapper>
  );
};

const SendWarningWrapper = styled.View`
  margin: 0px ${spacing.large}px;
`;

const SendWarningTextWrapper = styled.View`
  padding: 0px ${spacing.large}px;
`;

const TextRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const LinkTouchable = styled.TouchableOpacity`
  padding: ${spacing.small}px 0px;
`;

export default SendWarning;
