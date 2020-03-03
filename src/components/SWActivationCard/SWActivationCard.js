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
import InsightWithButton from 'components/InsightWithButton';
import SWActivationModal from 'components/SWActivationModal';
import SlideModal from 'components/Modals/SlideModal';

type Props = {
  message: string,
  buttonTitle: string,
};

type State = {
  isModalVisible: boolean,
};

class SWActivationCard extends React.Component<Props, State> {
  state = {
    isModalVisible: false,
  };

  render() {
    const { message, buttonTitle } = this.props;
    const { isModalVisible } = this.state;
    return (
      <React.Fragment>
        <InsightWithButton
          description={message}
          buttonTitle={buttonTitle}
          onButtonPress={() => this.setState({ isModalVisible: true })}
        />
        <SlideModal
          isVisible={isModalVisible}
          onModalHide={() => {
            this.setState({ isModalVisible: false });
          }}
        >
          <SWActivationModal
            onModalClose={(action) => {
              this.setState({ isModalVisible: false }, action);
            }}
          />
        </SlideModal>
      </React.Fragment>
    );
  }
}

export default SWActivationCard;
