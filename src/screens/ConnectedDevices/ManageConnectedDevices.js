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
import { FlatList, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import orderBy from 'lodash.orderby';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { fetchConnectedAccountAction } from 'actions/smartWalletActions';
import { confirmConnectedDeviceRemoveAction } from 'actions/connectedDevicesActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';

// utils
import { getThemeColors, themedColors } from 'utils/themes';
import { humanizeDateString } from 'utils/common';
import { fontSizes, fontTrackings } from 'utils/variables';
import { addressesEqual } from 'utils/assets';

// models, types
import type { Theme } from 'models/Theme';
import type { ConnectedDevice } from 'models/ConnectedDevice';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

const iconPhone = require('assets/icons/icon_phone.png');


type Props = {
  navigation: NavigationScreenProp<*>,
  activeDeviceAddress: string,
  devices: ConnectedDevice[],
  theme: Theme,
  fetchConnectedAccount: () => void,
  removingDeviceAddress: ?string,
  confirmConnectedDeviceRemove: (device: ConnectedDevice) => void,
};

const ItemTitle = styled(BaseText)`
  color: ${themedColors.text};
  font-size: ${fontSizes.medium}px;
  line-height: 22px;
  letter-spacing: ${fontTrackings.small}px;
`;

const RemoveAction = styled.TouchableOpacity`
  color: ${themedColors.negative};
`;

const HorizontalView = styled.View`
  flex-direction: row;
`;

class ManageConnectedDevices extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchConnectedAccount();
  }

  removeDevice = (device: ConnectedDevice) => this.props.confirmConnectedDeviceRemove(device);

  renderListItem = ({ item }) => {
    const { theme, activeDeviceAddress, removingDeviceAddress } = this.props;
    const colors = getThemeColors(theme);
    const { updatedAt, address: deviceAddress } = item;
    const deviceDate = humanizeDateString(updatedAt);
    const isCurrentDevice = addressesEqual(activeDeviceAddress, deviceAddress);
    const anyDeviceBeingRemoved = !!removingDeviceAddress;
    const thisDeviceBeingRemoved = addressesEqual(removingDeviceAddress, deviceAddress);
    return (
      <ListItemWithImage
        subtext={deviceDate}
        iconSource={iconPhone}
        iconImageAutoWidth
        customLabel={(
          <HorizontalView style={{ width: '60%' }}>
            <ItemTitle numberOfLines={1} >Device </ItemTitle>
            <ItemTitle numberOfLines={1} ellipsizeMode="middle">{deviceAddress}</ItemTitle>
          </HorizontalView>
        )}
      >
        {isCurrentDevice && <MediumText color={colors.secondaryText}>This device</MediumText>}
        {thisDeviceBeingRemoved &&
          <HorizontalView>
            <BaseText color={colors.secondaryText}>Removing</BaseText>
            <Spinner style={{ marginLeft: 7 }} width={20} height={20} />
          </HorizontalView>
        }
        {!thisDeviceBeingRemoved && !isCurrentDevice && anyDeviceBeingRemoved &&
          <RemoveAction onPress={() => this.removeDevice(item)}>
            <BaseText color={colors.secondaryText}>On hold</BaseText>
          </RemoveAction>
        }
        {!isCurrentDevice && !anyDeviceBeingRemoved &&
          <RemoveAction onPress={() => this.removeDevice(item)}>
            <BaseText color={colors.negative}>Remove</BaseText>
          </RemoveAction>
        }
      </ListItemWithImage>
    );
  };

  render() {
    const { devices, fetchConnectedAccount } = this.props;
    const devicesByLatest = orderBy(devices, ['updatedAt'], ['desc']);
    const emptyStyle = { justifyContent: 'center', alignItems: 'center' };
    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Manage devices' }] }}>
        <FlatList
          data={devicesByLatest}
          keyExtractor={({ address }) => `${address}`}
          renderItem={this.renderListItem}
          initialNumToRender={9}
          style={[{ flex: 1 }, !devices.length && emptyStyle]}
          ListEmptyComponent={<EmptyStateParagraph title="No Connected Devices" />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => fetchConnectedAccount()}
            />
          }
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  smartWallet: { connectedAccount: { activeDeviceAddress } },
  connectedDevices: { data: devices, removingDeviceAddress },
}: RootReducerState): $Shape<Props> => ({
  activeDeviceAddress,
  devices,
  removingDeviceAddress,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchConnectedAccount: () => dispatch(fetchConnectedAccountAction()),
  confirmConnectedDeviceRemove: (device: ConnectedDevice) => dispatch(confirmConnectedDeviceRemoveAction(device)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ManageConnectedDevices));
