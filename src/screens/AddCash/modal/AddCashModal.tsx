/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { CHAIN_ID } from 'constants/chainConstants';

// Utils
import { fontStyles, spacing, borderRadiusSizes, appFont } from 'utils/variables';
import { rampWidgetUrl, pelerinWidgetUrl } from 'utils/fiatToCrypto';
import { chainFromChainId } from 'utils/chains';

// Services
import etherspotService from 'services/etherspot';

// Components
import SlideModal from 'components/Modals/SlideModal';
import Text from 'components/core/Text';
import Button from 'components/core/Button';
import RadioButton from 'components/RadioButton';
import Icon from 'components/core/Icon';

interface IAddCashModal {
  setAddCashUrl?: (url: string) => void;
}

const AddCashModal: FC<IAddCashModal> = ({ setAddCashUrl }) => {
  const modalRef = useRef(null);
  const { t, tRoot } = useTranslationWithPrefix('servicesContent.ramp.addCash.selectResidentModal');
  const [usResident, setUsResident] = useState(true);
  const [nonUsResident, setNonUsResident] = useState(false);
  const [deployingAccount, setDeployingAccount] = useState(false);
  const [deployError, setDeployError] = useState('');

  useEffect(() => {
    return () => {
      setDeployingAccount(false);
      setDeployError('');
    };
  }, []);

  const openPelerin = async () => {
    const url = await pelerinWidgetUrl(deployingAccount, setDeployingAccount, setDeployError);
    setAddCashUrl?.(url);
  };

  const openRamp = () => {
    const chain = chainFromChainId[CHAIN_ID.XDAI];
    const cryptoAddress = etherspotService.getAccountAddress(chain);
    if (cryptoAddress === null) return;

    const url = rampWidgetUrl(cryptoAddress);
    setAddCashUrl?.(url);
  };

  const selectUsResident = () => {
    setUsResident(true);
    setNonUsResident(false);
  };

  const selectNonUsResident = () => {
    setNonUsResident(true);
    setUsResident(false);
  };

  const onSubmit = async () => {
    modalRef.current?.close();
    if (usResident) openRamp();
    else openPelerin();
  };

  return (
    <SlideModal title={t('title')} centerTitle ref={modalRef} showHeader noClose>
      <RecommendationText>{t('recommendation')}</RecommendationText>

      {!!deployError && <WarningText>{deployError}</WarningText>}

      <Container onPress={selectUsResident}>
        <ContainerView isSelected={usResident}>
          <RowContainer>
            <RadioButton visible={usResident} />
            <InfoContainer>
              <TitleContainer>
                <RowContainer>
                  <Icon name="ramp-network" />
                  <Title style={usResident && styles.titleStyle}>{t('options.rampTitle')}</Title>
                </RowContainer>
                <CountryText>{t('options.rampCountry')}</CountryText>
              </TitleContainer>
              <DescriptionText>{t('options.rampDescription')}</DescriptionText>
              <FeeText>{`${tRoot('transactions.label.fees')}: 2.90%`}</FeeText>
            </InfoContainer>
          </RowContainer>
        </ContainerView>
      </Container>

      <Container onPress={selectNonUsResident}>
        <ContainerView isSelected={nonUsResident}>
          <RowContainer>
            <RadioButton visible={nonUsResident} />
            <InfoContainer>
              <TitleContainer>
                <RowContainer>
                  <Icon name="pelerin" />
                  <Title style={nonUsResident && styles.titleStyle}>{t('options.pelerinTitle')}</Title>
                </RowContainer>
                <CountryText>{t('options.pelerinCountry')}</CountryText>
              </TitleContainer>
              <DescriptionText>{t('options.pelerinDescription')}</DescriptionText>
              <FeeText>{`${tRoot('transactions.label.fees')}: 2.50%`}</FeeText>
            </InfoContainer>
          </RowContainer>
        </ContainerView>
      </Container>

      <Button
        title={deployingAccount ? t('deploying') : tRoot('button.continue')}
        onPress={onSubmit}
        size="large"
        style={styles.buttonStyle}
        disabled={deployingAccount}
      />
    </SlideModal>
  );
};

export default AddCashModal;

const styles = {
  buttonStyle: {
    marginTop: spacing.medium,
    marginBottom: spacing.extraLarge,
  },
  titleStyle: {
    fontFamily: appFont.medium,
  },
};

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
`;

const Container = styled(TouchableContainer)`
  background-color: ${({ theme }) => theme.colors.basic050};
  flex-direction: row;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
  margin: ${spacing.small}px 0px;
`;

const ContainerView = styled.View`
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic60 : theme.colors.basic050)};
  padding: ${spacing.large}px;
  border-radius: ${borderRadiusSizes.medium}px;
  flex-direction: column;
  flex: 1;
`;

const RowContainer = styled.View`
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const InfoContainer = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

const TitleContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const RecommendationText = styled.Text`
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.tertiaryText};
`;

const WarningText = styled.Text`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.danger};
  margin-top: ${spacing.small}px;
`;

const Title = styled(Text)`
  font-weight: 500;
  ${fontStyles.big};
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const CountryText = styled(Text)`
  font-weight: 500;
  ${fontStyles.medium};
`;

const DescriptionText = styled(Text)`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.tertiaryText};
`;

const FeeText = styled(Text)`
  ${fontStyles.small};
  margin-top: ${spacing.small}px;
`;
