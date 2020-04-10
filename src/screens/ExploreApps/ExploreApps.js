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
import { type NavigationScreenProp, withNavigation } from 'react-navigation';
import styled from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ExploreAppsInfoCard from './ExploreAppsInfoCard';

interface Props {
    navigation: NavigationScreenProp<*>
}

const Wrapper = styled.View`
    padding: 20px 20px 0;
`;

class ExploreApps extends React.PureComponent<Props> {
    handleCardButton = () => {
      //
    }

    render() {
      return (
        <ContainerWithHeader
          navigation={this.props.navigation}
          headerProps={{
          centerItems: [{ title: 'Explore apps' }],
        }}
          inset={{ bottom: 0 }}
        >
          <Wrapper>
            <ExploreAppsInfoCard onButtonPress={this.handleCardButton} />
          </Wrapper>

        </ContainerWithHeader>
      );
    }
}


export default withNavigation(ExploreApps);
