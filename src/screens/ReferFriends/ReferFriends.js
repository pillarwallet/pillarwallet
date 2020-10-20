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
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { allowToAccessPhoneContactsAction } from 'actions/referralsActions';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// screens
import ReferralContacts from './ReferralContacts';
import AccessToAddressBook from './AccessToAddressBook';

type Props = {
  navigation: NavigationScreenProp<*>,
  hasAllowedToAccessContacts: boolean,
  allowToAccessPhoneContacts: () => void,
};

class ReferFriends extends React.PureComponent<Props> {
  render() {
    const { hasAllowedToAccessContacts, navigation, allowToAccessPhoneContacts } = this.props;

    if (hasAllowedToAccessContacts) {
      return <ReferralContacts navigation={navigation} />;
    }
    return <AccessToAddressBook allowToAccessPhoneContacts={allowToAccessPhoneContacts} />;
  }
}

const mapStateToProps = ({
  referrals: { hasAllowedToAccessContacts },
}: RootReducerState): $Shape<Props> => ({
  hasAllowedToAccessContacts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  allowToAccessPhoneContacts: () => dispatch(allowToAccessPhoneContactsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferFriends);
