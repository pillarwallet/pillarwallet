// @flow
import * as React from 'react';
import { RefreshControl, FlatList } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { spacing, baseColors } from 'utils/variables';
import IcoCard from 'components/IcoCard';
import { ICO } from 'constants/navigationConstants';

// actions
import { fetchICOsAction } from 'actions/icosActions';

// types
import type { ICO as ICOT } from 'models/ICO';

type Props = {
  navigation: NavigationScreenProp<*>,
  icos: ICOT[],
  user: Object,
  fetchICOs: Function,
}

class MarketScreen extends React.Component<Props> {
  renderICOs = ({ item }: Object) => {
    const ico = { ...item, ...item.icos[0] };
    const goal = ico.unitPrice * ico.totalSupply;
    const raised = ico.unitPrice * ico.totalLocked;
    const allIcoData = { ...ico, goal, raised };
    return (
      <IcoCard
        id={ico.id}
        title={ico.name}
        status={ico.icoPhase}
        goal={goal}
        raised={raised}
        iconUrl={ico.iconUrl}
        goalCurrency={ico.baseCurrency}
        endDate={ico.plannedClosingDate}
        onPress={() => this.goToICO(allIcoData)}
      />
    );
  };

  goToICO = (icoData: ICOT) => {
    this.props.navigation.navigate(ICO, {
      icoData,
    });
  };

  render() {
    const { icos, fetchICOs } = this.props;
    return (
      <Container color={baseColors.snowWhite}>
        <Header
          title="market"
        />
        <FlatList
          data={icos}
          extraData={icos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderICOs}
          style={{ width: '100%' }}
          contentContainerStyle={{
            paddingHorizontal: spacing.rhythm / 2,
            width: '100%',
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={fetchICOs}
            />
          }
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
