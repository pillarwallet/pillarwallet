// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import * as React from 'react';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';
import SlideModal from 'components/Modals/SlideModal';
import Icon from 'components/core/Icon';
import Modal from 'components/Modal';

// Utils
import { fontStyles, spacing, borderRadiusSizes, appFont } from 'utils/variables';

type Props = {
  items: itemsType;
  onSelectItem: (val: Object) => void;
};

type itemsType = {
  data: any;
};

function ContractActionsModal({ items, onSelectItem }: Props) {
  const { data } = items;
  const [selectedItemName, setSelectedItemName] = React.useState('');

  const handleChains = (value) => {
    setSelectedItemName(value?.['action-name'][0]?.text);
    onSelectItem(value);
    Modal.closeAll();
  };

  const renderActions = (item: any) => {
    const title = item?.['action-name'][0]?.text;
    const description = item?.['action-description'][0]?.text;

    const isSelected = selectedItemName === title;

    return (
      <Container key={title} onPress={() => handleChains(item)}>
        <ContainerView isSelected={isSelected}>
          <RowContainer>
            {isSelected ? <RadioIcon name="checked-radio" /> : <RadioIcon name="unchecked-radio" />}
            <TitleContent>
              <Title>{title}</Title>
              <Description numberOfLines={2}>{description}</Description>
            </TitleContent>
          </RowContainer>
        </ContainerView>
      </Container>
    );
  };

  return (
    <SlideModal noPadding noClose showHeader centerTitle title={data?.name?.[0].text}>
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }} bounces={false}>
        <InfoView>{data?.actions.map((item) => renderActions(item))}</InfoView>
      </ContentWrapper>
    </SlideModal>
  );
}

export default ContractActionsModal;

const ContentWrapper = styled.ScrollView`
  padding: ${spacing.medium}px 0px 20px;
`;

const InfoView = styled.View`
  align-items: center;
  width: 100%;
`;

const TitleContent = styled.View`
  flex: 1;
`;

const ContainerView = styled.View`
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic080 : theme.colors.basic050)};
  margin: 0 ${spacing.layoutSides}px;
  padding: ${spacing.large}px;
  border-radius: ${borderRadiusSizes.medium}px;
  flex-direction: column;
  flex: 1;
`;

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
`;

const Container = styled(TouchableContainer)`
  background-color: ${({ theme }) => theme.colors.basic050};
  flex-direction: row;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
`;

const RowContainer = styled.View`
  justify-content: center;
  flex-direction: row;
  padding: ${spacing.small}px;
`;

const Title = styled(Text)`
  ${fontStyles.rBig};
  font-family: ${appFont.regular};
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const Description = styled(Text)`
  ${fontStyles.regular};
  font-family: ${appFont.regular};
  color: ${({ theme }) => theme.colors.basic020}
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

const RadioIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
  padding-right: ${spacing.medium}px;
  margin-right: ${spacing.medium}px;
  margin-top: 5px;
`;
