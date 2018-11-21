// @flow
import * as React from 'react';
import { Paragraph } from 'components/Typography';

const BackupPhraseModal = () => (
  <React.Fragment>
    <Paragraph small>
      Your wallet private key is represented and secured by a 12 word backup phrase.
    </Paragraph>
    <Paragraph small>
      It is stored locally on your device. Pillar does not have access to it.
    </Paragraph>
    <Paragraph small>
      Keep your backup phrase safe. If you lose it, Pillar will not be able to recover it for you.
    </Paragraph>
    <Paragraph small>
      Do NOT just store it on your computer. Print it out on a piece of paper or save it to a USB drive.
      Consider the risk of flood or fire. Multiple secure copies are recommended.
    </Paragraph>
    <Paragraph small>
      Do not store your backup phrase in Dropbox, Google Drive, or other cloud storage.
      If that account is compromised, your funds can be stolen.
    </Paragraph>
  </React.Fragment>
);

export default BackupPhraseModal;
