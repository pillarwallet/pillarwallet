// @flow
import * as React from 'react';
import {
  View,
  RefreshControl,
  TouchableNativeFeedback,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import styled from 'styled-components/native';
import { format } from 'date-fns';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, spacing, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import IcoCard from 'components/IcoCard';
import { PARTICIPATE_IN_ICO_FLOW } from 'constants/navigationConstants';
import { getCurrencySymbol, formatMoney } from 'utils/common';
import Countdown from 'components/Countdown';

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
  width: 100%;
  padding: ${spacing.rhythm}px;
  position: absolute;
  bottom: 0;
  left: 0;
`;

const StyledFlatList = styled.FlatList`
  margin-bottom: ${spacing.rhythm}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
`;

const ContactsWrapper = styled(View)`
  margin-bottom: ${spacing.rhythm}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
`;

const ListRow = styled(View)`
  width: 100%;
  padding: 22px ${spacing.rhythm}px;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: center;
  justify-content: space-between;
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
  padding-left: ${props => props.horizonalPadding ? spacing.rhythm : 0}px;
  padding-right: ${props => props.horizonalPadding ? spacing.rhythm : 0}px;
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
    const { icoData } = this.props.navigation.state.params;
    this.props.navigation.navigate(PARTICIPATE_IN_ICO_FLOW, { icoData });
  };

  openLink = (address: string) => {
    Linking.openURL(address).catch(() => {});
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

  renderExternalLinksItem = ({ item: link }: Object) => {
    if (Platform.OS === 'android') {
      return (
        <TouchableNativeFeedback
          onPress={() => this.openLink(link.link)}
          background={TouchableNativeFeedback.Ripple()}
        >
          <ListRow>
            <ListRowItem label>
              {link.label}
            </ListRowItem>
            <Icon
              name="chevron-right"
              style={{
                fontSize: fontSizes.tiny,
                color: baseColors.coolGrey,
              }}
            />
          </ListRow>
        </TouchableNativeFeedback>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => this.openLink(link.link)}
        underlayColor={baseColors.lightGray}
      >
        <ListRow>
          <ListRowItem label>
            {link.label}
          </ListRowItem>
          <Icon
            name="chevron-right"
            style={{
              fontSize: fontSizes.tiny,
              color: baseColors.coolGrey,
            }}
          />
        </ListRow>
      </TouchableOpacity>
    );
  };

  renderSeparator = (padding?: number) => {
    return (
      <SeparatorWrapper horizonalPadding={padding}>
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
      website,
      whitepaper,
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
      // icoPhase,
      unitPrice,
      supportedCurrencies,
      goal,
      isPending,
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
        value: `${formatMoney(totalSupply, 0, 3, ',', '.', false)} ${symbol}`,
      },
      {
        label: 'Locked tokens',
        value: `${formatMoney(totalLocked, 0, 3, ',', '.', false)} ${symbol}`,
      },
      {
        label: 'Token type',
        value: 'ERC-20',
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

    const participateBtnText = isPending
      ? 'Starts in '
      : 'Participate';

    const externalLinks = [
      {
        label: 'Whitepaper',
        link: whitepaper,
      },
      {
        label: 'Website',
        link: website,
      },
    ];

    return (
      <Container color={baseColors.snowWhite} bottomPadding={120}>
        <Header onBack={this.navigateBack} title="ico" />
        <ScrollWrapper
          onScrollEndDrag={() => { }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { }}
            />
          }
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        >
          <ICOWrapper>
            <IcoCard
              inner
              id={id}
              onPress={() => { }}
              title={name}
              status={icoStatus}
              goal={goal}
              tokensSold={totalLocked}
              totalSupply={totalSupply}
              goalCurrency={baseCurrency}
              endDate={plannedClosingDate}
              startDate={plannedOpeningDate}
              description={description}
              iconUrl={iconUrl}
              isPending={isPending}
            />
          </ICOWrapper>
          <StyledFlatList
            keyExtractor={item => item.label}
            data={icoInfo}
            extraData={this.state}
            renderItem={this.renderIcoInfoRow}
            ItemSeparatorComponent={() => this.renderSeparator(spacing.rhythm)}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: baseColors.white,
            }}
            refreshing={false}
          />
          <StyledFlatList
            keyExtractor={item => item.label}
            data={externalLinks}
            extraData={this.state}
            renderItem={this.renderExternalLinksItem}
            ItemSeparatorComponent={() => this.renderSeparator()}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: baseColors.white,
            }}
            refreshing={false}
          />
          <ContactsWrapper>
            <ListRow>
              <ListRowItem label>
                Contacts
              </ListRowItem>
            </ListRow>
          </ContactsWrapper>
        </ScrollWrapper>
        <ButtonWrapper>
          <Button
            disabledTransparent={isPending}
            block
            title={participateBtnText}
            onPress={this.navigateToParticipate}
          >
            {!!isPending &&
            <Countdown
              endDate={plannedOpeningDate}
              fontSize={fontSizes.medium}
              fontColor={baseColors.white}
              extendedDayLabel
              lineHeight={fontSizes.large}
            />}
          </Button>
        </ButtonWrapper>
      </Container>
    );
  }
}

export default ICOScreen;
