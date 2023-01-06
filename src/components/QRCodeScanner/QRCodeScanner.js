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

// Components
import Modal from 'components/Modal';

// Local
import WalletConnetCamera from './WalletConnectCamera';

type Props = {|
  onRead?: (code: string) => void,
  onCancel?: () => void,
  validator?: (code: string) => boolean,
  dataFormatter?: (code: string) => string,
  onClose?: () => void,
  onNavigateWallet?: () => void,
|};

export default class QRCodeScanner extends React.Component<Props> {
  modalRef = React.createRef<Modal>();

  close = () => {
    const { onClose, onCancel } = this.props;
    if (onClose) {
      onClose();
    }

    if (onCancel) {
      onCancel();
    }

    if (this.modalRef.current) {
      this.modalRef.current.close();
    }
  };

  render() {
    const { validator, onRead } = this.props;

    const animationInTiming = 300;
    const animationOutTiming = 1;

    return (
      <Modal
        ref={this.modalRef}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        hideModalContentWhileAnimating
        style={{
          margin: 0,
          justifyContent: 'flex-start',
          flex: 1,
        }}
        onModalWillHide={this.close}
      >
        <WalletConnetCamera
          visibleCamera
          validator={validator}
          onRead={onRead}
          onCancel={this.close}
          onClose={this.close}
        />
      </Modal>
    );
  }
}
