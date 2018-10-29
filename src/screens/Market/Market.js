// @flow
import * as React from 'react';
import { RefreshControl, View, SectionList } from 'react-native';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { spacing } from 'utils/variables';
import IcoCard from 'components/IcoCard';
import { ICO } from 'constants/navigationConstants';
import { SubHeading } from 'components/Typography';

// actions
import { fetchICOsAction } from 'actions/icosActions';

// types
import type { ICO as ICOT } from 'models/ICO';

// screens
import MarketplaceComingSoon from 'screens/MarketplaceComingSoon';

type Props = {
  navigation: NavigationScreenProp<*>,
  icos: ICOT[],
  user: Object,
  fetchICOs: Function,
}

const ListHeader = styled.View`
  padding: 0 ${spacing.rhythm / 2}px;
`;

const PENDING = 'PENDING';
const ACTIVE = 'ACTIVE';

const filterIcosByStatus = (icos: ICOT[], status: string) => (
  icos.filter(({ icos: innerIcos }: Object) => {
    const { icoStatus } = innerIcos[0];
    return icoStatus === status;
  })
);

class MarketScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    return !isEqual(this.props, nextProps);
  }

  renderICOs = ({ item }: Object) => {
    const ico = { ...item, ...item.icos[0] };
    const goal = ico.unitPrice * ico.totalSupply;
    const isPending = ico.icoStatus === PENDING;
    const allIcoData = {
      ...ico,
      goal,
      isPending,
    };

    return (
      <IcoCard
        id={ico.id}
        title={ico.name}
        status={ico.icoStatus}
        goal={goal}
        tokensSold={ico.totalLocked}
        totalSupply={ico.totalSupply}
        iconUrl={ico.iconUrl}
        goalCurrency={ico.baseCurrency}
        startDate={ico.plannedOpeningDate}
        endDate={ico.plannedClosingDate}
        onPress={() => this.goToICO(allIcoData)}
        isPending={isPending}
      />
    );
  };

  renderListTitle = (titleText: string) => {
    return (
      <ListHeader>
        <SubHeading>{titleText}</SubHeading>
      </ListHeader>
    );
  };

  goToICO = (icoData: ICOT) => {
    this.props.navigation.navigate(ICO, {
      icoData,
    });
  };

  render() {
    const { icos, fetchICOs, user } = this.props;
    if ((!user.icoService || !user.icoService.userId) && !__DEV__) {
      return <MarketplaceComingSoon />;
    }
    const activeICOs = filterIcosByStatus(icos, ACTIVE);
    const pendingICOs = filterIcosByStatus(icos, PENDING);
    return (
      <Container>
        <Header
          title="market"
        />
        <SectionList
          renderItem={this.renderICOs}
          renderSectionHeader={({ section }) => {
            return section.data.length ? this.renderListTitle(section.title) : null;
          }}
          sections={[
            { title: 'ACTIVE ICOS', data: activeICOs, extraData: icos },
            { title: 'PENDING ICOS', data: pendingICOs, extraData: icos },
          ]}
          keyExtractor={(item) => item.id.toString()}
          style={{ width: '100%' }}
          contentContainerStyle={{
            paddingHorizontal: spacing.rhythm / 2,
            width: '100%',
            paddingBottom: spacing.rhythm / 2,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={fetchICOs}
            />
          }
          stickySectionHeadersEnabled={false}
          SectionSeparatorComponent={() => <View style={{ marginTop: spacing.rhythm / 2 }} />}
        />
      </Container >
    );
  }
}

const mapStateToProps = ({ icos: { data: icos }, user: { data: user } }) => ({
  icos,
  user,
});

const mapDispatchToProps = (dispatch) => ({
  fetchICOs: () => dispatch(fetchICOsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(MarketScreen);
