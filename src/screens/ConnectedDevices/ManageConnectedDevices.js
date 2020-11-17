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
import React, { useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import orderBy from 'lodash.orderby';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { fetchConnectedAccountAction } from 'actions/smartWalletActions';
import { confirmConnectedDeviceRemoveAction } from 'actions/connectedDevicesActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { ScrollWrapper } from 'components/Layout';

// utils
import { themedColors } from 'utils/themes';
import { humanizeDateString, humanizeHexString } from 'utils/common';
import { fontSizes, fontTrackings } from 'utils/variables';
import { addressesEqual } from 'utils/assets';
import { images } from 'utils/images';

// types
import type { Theme } from 'models/Theme';
import type { ConnectedDevice } from 'models/ConnectedDevice';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


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

const ManageConnectedDevices = ({
  theme,
  activeDeviceAddress,
  removingDeviceAddress,
  devices,
  fetchConnectedAccount,
  confirmConnectedDeviceRemove,
}: Props) => {
  useEffect(() => {
    fetchConnectedAccount();
  }, []);

  const removeDevice = (device: ConnectedDevice) => confirmConnectedDeviceRemove(device);

  const renderListItem = ({ item }) => {
    const { updatedAt, address: deviceAddress } = item;
    const deviceDate = humanizeDateString(updatedAt);
    const isCurrentDevice = addressesEqual(activeDeviceAddress, deviceAddress);
    const anyDeviceBeingRemoved = !!removingDeviceAddress;
    const thisDeviceBeingRemoved = addressesEqual(removingDeviceAddress, deviceAddress);
    const { roundedPhoneIcon } = images(theme);
    return (
      <ListItemWithImage
        subtext={deviceDate}
        iconSource={roundedPhoneIcon}
        iconImageResizeMode="contain"
        iconImageSize={48}
        customLabel={(
          <HorizontalView style={{ flex: 0.8 }}>
            <ItemTitle>{t('label.device', { address: humanizeHexString(deviceAddress) })}</ItemTitle>
          </HorizontalView>
        )}
      >
        {isCurrentDevice && <MediumText secondary>{t('label.thisDevice')}</MediumText>}
        {thisDeviceBeingRemoved &&
          <HorizontalView>
            <BaseText secondary>{t('label.removing')}</BaseText>
            <Spinner style={{ marginLeft: 7 }} size={20} trackWidth={2} />
          </HorizontalView>
        }
        {!thisDeviceBeingRemoved && !isCurrentDevice && anyDeviceBeingRemoved &&
          <RemoveAction onPress={() => removeDevice(item)}>
            <BaseText secondary>{t('label.onHold')}</BaseText>
          </RemoveAction>
        }
        {!isCurrentDevice && !anyDeviceBeingRemoved &&
          <RemoveAction onPress={() => removeDevice(item)}>
            <BaseText negative>{t('button.remove')}</BaseText>
          </RemoveAction>
        }
      </ListItemWithImage>
    );
  };

  const devicesByLatest = orderBy(devices, ['updatedAt'], ['desc']);
  const emptyStyle = { flex: 1, justifyContent: 'center', alignItems: 'center' };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('title.manageDevices') }] }}>
      <ScrollWrapper contentContainerStyle={!devicesByLatest.length && emptyStyle}>
        <FlatList
          data={devicesByLatest}
          keyExtractor={({ address }) => `${address}`}
          renderItem={renderListItem}
          initialNumToRender={9}
          contentContainerStyle={!devicesByLatest.length && emptyStyle}
          ListEmptyComponent={<EmptyStateParagraph title={t('title.noConnectedDevices')} />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => fetchConnectedAccount()}
            />
          }
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

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
