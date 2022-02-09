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

import React, { useRef } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import SlideModal from 'components/Modals/SlideModal';
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';
import Button from 'components/core/Button';

// Utils
import { fontStyles, spacing, borderRadiusSizes, appFont } from 'utils/variables';

type Props = {|
  selectedResident: (isUsResident: boolean) => void,
|};

const SelectResidentModal = ({ selectedResident }: Props) => {
  const modalRef = useRef();
  const { t, tRoot } = useTranslationWithPrefix('servicesContent.ramp.addCash.selectResidentModal');
  const [usResident, setUsResident] = React.useState(true);
  const [nonUsResident, setNonUsResident] = React.useState(false);

  const selectUsResident = () => {
    setUsResident(true);
    setNonUsResident(false);
  };

  const selectNonUsResident = () => {
    setNonUsResident(true);
    setUsResident(false);
  };

  const onSubmit = () => {
    modalRef.current?.close();
    if (usResident) {
      selectedResident(true);
    } else {
      selectedResident(false);
    }
  };

  return (
    <SlideModal noSwipeToDismiss ref={modalRef} hideHeader noClose>
      <ModalTitle>{t('title')}</ModalTitle>
      <Container onPress={selectUsResident}>
        <ContainerView isSelected={usResident}>
          <RowContainer>
            {usResident && <RadioIcon name="checked-radio" />}
            {!usResident && <RadioIcon name="unchecked-radio" />}
            <Title style={usResident && styles.titleStyle}>{t('options.usResident')}</Title>
          </RowContainer>
        </ContainerView>
      </Container>
      <Container onPress={selectNonUsResident}>
        <ContainerView isSelected={nonUsResident}>
          <RowContainer>
            {nonUsResident && <RadioIcon name="checked-radio" />}
            {!nonUsResident && <RadioIcon name="unchecked-radio" />}
            <Title style={nonUsResident && styles.titleStyle}>{t('options.nonUsResident')}</Title>
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
    marginBottom: spacing.large,
  },
  titleStyle: {
    fontFamily: appFont.medium,
  },
};

const ModalTitle = styled(Text)`
  ${fontStyles.big};
  text-align: center;
  margin: ${spacing.large}px 0px;
  font-family: '${appFont.medium}';
`;

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
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic080 : theme.colors.basic050)};
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

const Title = styled(Text)`
  flex: 1;
  flex-direction: row;
  ${fontStyles.big};
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const RadioIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
  padding-right: ${spacing.medium}px;
  margin-right: ${spacing.medium}px;
`;
