// @flow
import * as React from 'react';
import { View, RefreshControl, FlatList } from 'react-native';
import styled from 'styled-components/native';
import { format } from 'date-fns';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { baseColors, fontSizes, spacing, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import IcoCard from 'components/IcoCard';
import { PARTICIPATE_IN_ICO_FLOW } from 'constants/navigationConstants';
import { getCurrencySymbol, formatMoney } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
  // onPress: Function,
}
type State = {};

const ICOWrapper = styled(Wrapper)`
  flex: 1;
  padding: 0 ${spacing.rhythm / 2}px ${spacing.rhythm / 2}px;
`;

const ButtonWrapper = styled(Wrapper)`
  flex: 1;
  padding: ${spacing.rhythm}px;
`;

const ListRow = styled(View)`
  width: 100%;
  padding: 22px ${spacing.rhythm}px;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: center;
`;

const ListRowItem = styled(BaseText)`
  width: 50%;
  padding-right: ${spacing.rhythm}px;
  font-size: ${fontSizes.small}px;
  letter-spacing: ${fontTrackings.tiny}px;
  line-height: ${fontSizes.medium}px;
  color: ${props => props.label ? baseColors.slateBlack : baseColors.darkGray};
`;

const SeparatorWrapper = styled(View)`
  width: 100%;
  padding: 0 ${spacing.rhythm}px;
  flex-direction: row;
`;

const Separator = styled(View)`
  width: 100%;
  height: 1px;
  background-color: ${baseColors.lightGray}
`;

class ICOScreen extends React.Component<Props, State> {
  navigateBack = () => {
    this.props.navigation.goBack();
  };

  navigateToParticipate = () => {
    this.props.navigation.navigate(PARTICIPATE_IN_ICO_FLOW);
  };

  renderIcoInfoRow = ({ item: icoInfo }: Object) => {
    return (
      <ListRow>
        <ListRowItem label>
          {icoInfo.label}
        </ListRowItem>
        <ListRowItem>
          {icoInfo.value}
        </ListRowItem>
      </ListRow>
    );
  };

  renderSeparator = () => {
    return (
      <SeparatorWrapper>
        <Separator />
      </SeparatorWrapper>
    );
  };

  render() {
    const { navigation } = this.props;
    const { icoData } = navigation.state.params;
    const {
      id,
      name,
      symbol,
      // address,
      // decimals,
      description,
      iconUrl,
      // socialMedia,
      // website,
      // whitepaper,
      // nivauraProjectId,
      baseCurrency,
      totalSupply,
      totalLocked,
      // icoAddress,
      // icoStartingBlockNumber,
      nationalityRestriction,
      plannedOpeningDate,
      plannedClosingDate,
      // links,
      minimumContribution,
      maximumContribution,
      icoStatus,
      icoPhase,
      unitPrice,
      supportedCurrencies,
      goal,
      raised,
    } = icoData;

    const startDate = format(new Date(plannedOpeningDate), 'D MMM YYYY');
    const endDate = format(new Date(plannedClosingDate), 'D MMM YYYY');

    // const {
    //     : [ { service: 'twitter', username: 'example' } ],
    // } = socialMedia,

    const goalCurrencySymbol = getCurrencySymbol(baseCurrency) || baseCurrency;

    const icoInfo = [
      {
        label: 'Ticker',
        value: symbol,
      },
      {
        label: 'Dates',
        value: `${startDate} - ${endDate}`,
      },
      {
        label: 'Token price',
        value: `${goalCurrencySymbol}${unitPrice} per token`,
      },
      {
        label: 'Goal',
        value: `${goalCurrencySymbol}${formatMoney(goal, 0, 3, ',', '.', false)}`,
      },
      {
        label: 'Accepted',
        value: supportedCurrencies,
      },
      {
        label: 'Max Supply',
        value: `${formatMoney(totalSupply, 0, 3, ',', '.', false)} TKN`,
      },
      {
        label: 'Locked tokens',
        value: `${formatMoney(totalLocked, 0, 3, ',', '.', false)} TKN`,
      },
      {
        label: 'Token type',
        value: '',
      },
      {
        label: 'Restricted',
        value: nationalityRestriction || 'None',
      },
      {
        label: 'Min. contribution',
        value: minimumContribution,
      },
      {
        label: 'Max. contribution',
        value: maximumContribution,
      },
      {
        label: 'Token issue',
        value: icoStatus,
      },
    ];

    return (
      <Container color={baseColors.snowWhite}>
        <Header onClose={this.navigateBack} />
        <ScrollWrapper
          onScrollEndDrag={() => {}}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
        >
          <ICOWrapper>
            <Transition key={id} shared={id}>
              <IcoCard
                inner
                id={id}
                onPress={() => {}}
                title={name}
                status={icoPhase}
                goal={goal}
                raised={raised}
                goalCurrency={baseCurrency}
                endDate={plannedClosingDate}
                startDate={plannedOpeningDate}
                description={description}
                iconUrl={iconUrl}
              />
            </Transition>
          </ICOWrapper>
          <FlatList
            keyExtractor={item => item.label}
            data={icoInfo}
            extraData={this.state}
            renderItem={this.renderIcoInfoRow}
            ItemSeparatorComponent={this.renderSeparator}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: baseColors.white,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: baseColors.lightGray,
            }}
            refreshing={false}
          />
          <ButtonWrapper>
            <Button block title="Participate" onPress={this.navigateToParticipate} />
          </ButtonWrapper>
        </ScrollWrapper>
      </Container>
    );
  }
}

export default ICOScreen;
