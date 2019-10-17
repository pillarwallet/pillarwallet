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
import * as React from 'react';
import {
  View,
  TouchableNativeFeedback,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
} from 'react-native';
import styled from 'styled-components/native';
import { format } from 'date-fns';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, spacing, fontTrackings, lineHeights, fontStyles } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper, ScrollWrapper, Footer } from 'components/Layout';
import IcoCard from 'components/IcoCard';
import { PARTICIPATE_IN_ICO_FLOW, ICO_LINKS } from 'constants/navigationConstants';
import { getCurrencySymbol, formatMoney } from 'utils/common';
import Countdown from 'components/Countdown';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const ICOWrapper = styled(Wrapper)`
  flex: 1;
  padding: 0 ${spacing.rhythm / 2}px ${spacing.rhythm / 2}px;
`;

const ButtonWrapper = styled(Wrapper)`
  width: 100%;
`;

const StyledFlatList = styled.FlatList`
  margin-bottom: ${spacing.rhythm}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
`;

const ContactsRow = styled(View)`
  margin-bottom: ${spacing.rhythm}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.lightGray};
  width: 100%;
  padding: 10px ${spacing.rhythm / 2}px 10px ${spacing.rhythm}px;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: flex-start;
  justify-content: space-between;
`;

const ListRow = styled(View)`
  width: 100%;
  padding: 22px ${spacing.rhythm}px;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: flex-start;
  justify-content: space-between;
`;

const ListRowItem = styled(BaseText)`
  width: 50%;
  padding-right: ${spacing.rhythm}px;
  letter-spacing: ${fontTrackings.tiny}px;
  color: ${props => props.label ? baseColors.slateBlack : baseColors.darkGray};
  ${fontStyles.medium};
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

const ContactsButtonWrapper = styled(View)`
  padding: 7px ${spacing.rhythm / 2}px;
  justify-content: center;
  align-items: center;
`;

const ContactsWrapper = styled(View)`
  width: 60%;
  flex-direction: row;
  background-color: ${baseColors.white};
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const ContactsLabel = styled(BaseText)`
  width: 40%;
  letter-spacing: ${fontTrackings.tiny}px;
  color: ${baseColors.slateBlack};
  margin-top: 13px;
  padding-right: ${spacing.rhythm}px;
  ${fontStyles.medium};
`;

const twitter = require('assets/icons/icon_twitter.png');
const telegram = require('assets/icons/icon_telegram.png');

class ICOScreen extends React.Component<Props, {}> {
  navigateBack = () => {
    this.props.navigation.goBack();
  };

  navigateToParticipate = () => {
    const { icoData } = this.props.navigation.state.params;
    this.props.navigation.navigate(PARTICIPATE_IN_ICO_FLOW, { icoData });
  };

  openLink = (address: string, inApp?: boolean) => {
    const { navigation } = this.props;
    const { icoData } = navigation.state.params;

    if (inApp) {
      navigation.navigate(address, { links: icoData.links });
    } else {
      Linking.openURL(address).catch(() => {});
    }
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
          onPress={() => this.openLink(link.link, link.inApp)}
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
                alignSelf: 'center',
              }}
            />
          </ListRow>
        </TouchableNativeFeedback>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => this.openLink(link.link, link.inApp)}
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

  renderIconButton = (key: string, link: string, icon: string) => {
    return (
      <TouchableOpacity
        key={key}
        onPress={() => this.openLink(link)}
      >
        <ContactsButtonWrapper>
          <Image
            style={{
              width: 30,
              height: 30,
            }}
            resizeMode="contain"
            source={icon}
          />
        </ContactsButtonWrapper>
      </TouchableOpacity>
    );
  };

  renderContactsButton(socMedia: any) {
    return socMedia.map(social => {
      switch (social.service.toLowerCase()) {
        case 'twitter': {
          return this.renderIconButton(social.username, `https://twitter.com/${social.username}`, twitter);
        }
        case 'telegram': {
          return this.renderIconButton(social.username, `https://t.me/${social.username}`, telegram);
        }
        default: {
          return null;
        }
      }
    });
  }

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
      socialMedia,
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
      minimumContribution,
      maximumContribution,
      icoStatus,
      // icoPhase,
      unitPrice,
      supportedCurrencies,
      goal,
      isPending,
      links,
    } = icoData;

    const startDate = format(new Date(plannedOpeningDate), 'D MMM YYYY');
    const endDate = format(new Date(plannedClosingDate), 'D MMM YYYY');
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

    const externalLinks = [];

    if (whitepaper) {
      externalLinks.push({
        label: 'Whitepaper',
        link: whitepaper,
      });
    }

    if (website) {
      externalLinks.push({
        label: 'Website',
        link: website,
      });
    }

    if (links.length) {
      externalLinks.push({
        label: 'Links',
        link: icoData.links.length ? ICO_LINKS : null,
        inApp: true,
      });
    }

    return (
      <Container inset={{ bottom: 0 }}>
        <Header onBack={this.navigateBack} title="ico" />
        <ScrollWrapper>
          <Wrapper>
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
              ItemSeparatorComponent={this.renderSeparator}
              contentContainerStyle={{
                flexGrow: 1,
                backgroundColor: baseColors.white,
              }}
              refreshing={false}
            />
            {!!socialMedia.length &&
            <ContactsRow>
              <ContactsLabel>
                Contacts
              </ContactsLabel>
              <ContactsWrapper>
                {this.renderContactsButton(socialMedia)}
              </ContactsWrapper>
            </ContactsRow>
            }
          </Wrapper>
        </ScrollWrapper>
        {totalLocked < totalSupply &&
        <Footer backgroundColor={baseColors.white}>
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
                fontSize={fontSizes.big}
                fontColor={baseColors.white}
                extendedDayLabel
                lineHeight={lineHeights.big}
              />}
            </Button>
          </ButtonWrapper>
        </Footer>}
      </Container>
    );
  }
}

export default ICOScreen;
