// @flow
import * as React from 'react';
import qrcode from 'qrcode';
import { delay } from 'utils/common';
import styled from 'styled-components/native';
import qrCodePlaceholder from 'assets/images/qr_code_placeholder.png';

type Props = {
  value: string,
  positiveColor: string,
  negativeColor: string,
  blockHeight: number
}

type MatrixRow = number[]

type State = {
  sqrMatrix: MatrixRow[],
  isGenerating: boolean
}

const AVERAGE_NUMBER_OF_MATRIX_ROWS = 30;

const Container = styled.View`
  height: ${props => props.height || 200}px;
  margin-bottom: 20px;
`;

const QRWrapper = styled.View`
  position: relative;
`;

const Image = styled.Image`
  height: ${props => props.height || 200}px;
  width: ${props => props.width || 200}px;
`;

const ActivityIndicator = styled.ActivityIndicator`
  position: absolute
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  alignItems: center;
  justifyContent: center;
`;

const QRBlock = styled.View`
  width: ${props => props.width};
  backgroundColor: ${props => props.value ? props.positiveColor : props.negativeColor};
`;

const QRRow = styled.View`
  flexDirection: row;
  height: ${props => props.height};
`;

export default class QRCode extends React.Component<Props, State> {
  static defaultProps = {
    value: '',
    positiveColor: 'black',
    negativeColor: 'white',
    blockHeight: 8,
  };

  state = {
    sqrMatrix: [],
    isGenerating: true,
  };

  componentDidMount() {
    this.generateQRCode();
  }

  async generateQRCode() {
    const { value } = this.props;
    await delay(800);
    const qrCodeSrc = await qrcode.create(value);
    const arr = [...qrCodeSrc.modules.data];
    const sqrMatrix = this.generateSquareMatrix(arr);
    this.setState({
      sqrMatrix,
      isGenerating: false,
    });
  }

  generateSquareMatrix(data: number[]) {
    const rowSize = Math.sqrt(data.length);
    return data.reduce((rows, key, index) => {
      if (index % rowSize) {
        rows[rows.length - 1].push(key);
      } else {
        rows.push([key]);
      }
      return rows;
    }, []);
  }

  renderQRCode() {
    const { sqrMatrix } = this.state;
    const { blockHeight, positiveColor, negativeColor } = this.props;
    let startIndex = -1;
    return (
      <QRWrapper>
        {sqrMatrix.map((row, index) => (
          <QRRow key={index} height={blockHeight}>
            {row.map((value, col) => {
              if (startIndex < 0) {
                startIndex = col;
              }

              const isLastColumn = col >= row.length - 1;
              const nextColumnValueSame = !isLastColumn && (value === row[col + 1]);

              if (nextColumnValueSame) return null;

              const numBlocks = (col - startIndex) + 1;
              startIndex = -1;
              const key = `${index}-${col}`;
              const blockWidth = blockHeight * numBlocks;
              return (
                <QRBlock
                  key={key}
                  width={blockWidth}
                  value={value}
                  positiveColor={positiveColor}
                  negativeColor={negativeColor}
                />
              );
            })}
          </QRRow>
        ))}
      </QRWrapper>
    );
  }

  render() {
    const { isGenerating } = this.state;
    const { blockHeight } = this.props;
    const height = blockHeight * AVERAGE_NUMBER_OF_MATRIX_ROWS;
    return (
      <Container height={height}>
        {isGenerating ?
          <QRWrapper>
            <Image source={qrCodePlaceholder} blurRadius={10} width={height} height={height} />
            <ActivityIndicator />
          </QRWrapper >
          : this.renderQRCode()}
      </Container>
    );
  }
}
