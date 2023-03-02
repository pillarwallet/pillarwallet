// @flow
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

import React, { FC, useRef } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { NavigationActions } from 'react-navigation';

// Constants
import { ADD_CASH_BROWSER } from 'constants/navigationConstants';

// Utils
import { fontStyles, spacing, borderRadiusSizes, appFont } from 'utils/variables';
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';
import { getPelerinUrl } from 'utils/perlerin';

// Services
import { navigate } from 'services/navigation';

// Components
import SlideModal from 'components/Modals/SlideModal';
import Text from 'components/core/Text';
import Button from 'components/core/Button';
import RadioButton from 'components/RadioButton';
import Icon from 'components/core/Icon';

interface ISelectResidentModal {
  residentSelected: (isUsResident: boolean) => void;
}

const SelectResidentModal: FC<ISelectResidentModal> = ({ residentSelected }) => {
  const modalRef = useRef(null);
  const { t, tRoot } = useTranslationWithPrefix('servicesContent.ramp.addCash.selectResidentModal');
  const [usResident, setUsResident] = React.useState(true);
  const [nonUsResident, setNonUsResident] = React.useState(false);

  const openPelerinBrowser = (url: string, title: string, iconUrl?: string) => {
    if (url) {
      navigate(
        NavigationActions.navigate({
          routeName: ADD_CASH_BROWSER,
          params: {
            url,
            title,
            iconUrl,
          },
        }),
      );
    } else {
      showServiceLaunchErrorToast();
    }
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
    if (usResident) {
      residentSelected(true);
    } else {
      const url = await getPelerinUrl();
      if (url) openPelerinBrowser(url, 'Mt Pelerin');
      residentSelected(false);
    }
  };

  return (
    <SlideModal title={t('title')} centerTitle ref={modalRef} showHeader noClose>
      <RecommendationText>{t('recommendation')}</RecommendationText>

      {nonUsResident && <WarningText>{t('highDeploymentFees')}</WarningText>}

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
              <FeeText>{`${t('fees')}: 2.90%`}</FeeText>
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
              <FeeText>{`${t('fees')}: 2.50%`}</FeeText>
            </InfoContainer>
          </RowContainer>
        </ContainerView>
      </Container>

      <Button title={tRoot('button.continue')} onPress={onSubmit} size="large" style={styles.buttonStyle} />
    </SlideModal>
  );
};

export default SelectResidentModal;

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
