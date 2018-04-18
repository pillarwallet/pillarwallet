// @flow
import * as React from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode';
import styled from 'styled-components/native';

type Props = {
  value: string,
  positiveColor: string,
  negativeColor: string,
  blockHeight: number
}

type MatrixRow = number[]

type State = {
  sqrMatrix: MatrixRow[]
}

const Block = styled.View`
  width: ${(props) => props.width};
  backgroundColor: ${(props) => props.value ? props.positiveColor : props.negativeColor};
`;

const Row = styled.View`
  flexDirection: row;
  height: ${(props) => props.height};
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
  };

  componentDidMount(){
    this._generateQRCode();
  };

  async _generateQRCode(){
    const { value } = this.props;
    const qrCodeSrc = await qrcode.create(value);
    const arr = qrCodeSrc.modules.data;
    const sqrMatrix = this._generateSquareMatrix(arr)
    this.setState({
      sqrMatrix,
    });
  };

  _generateSquareMatrix(data: number[]){
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
  
  _renderQRCode(){
    const { sqrMatrix } = this.state;
    const { blockHeight, positiveColor, negativeColor } = this.props;
    let startIndex = -1;
    return (
      <View>
        {sqrMatrix.map((row, index) => (
          <Row key={index} height={blockHeight}>
            {row.map((value, col) => {
              if( startIndex < 0 ) startIndex = col;

              const isLastColumn = col >= row.length - 1;
              const nextColumnValueSame = !isLastColumn && (value == row[col+1]);

              if (nextColumnValueSame) return null;

              const thisStartIndex = startIndex;
              const numBlocks = col - startIndex + 1;
              startIndex = -1;
              const key = `${index}-${col}`
              const blockWidth = blockHeight * numBlocks;
              return (
                <Block 
                  key={key} 
                  width={blockWidth} 
                  value={value} 
                  positiveColor={positiveColor}
                  negativeColor={negativeColor} 
                />
              );
            })}
          </Row>
        ))}
      </View>
    )
  }

  render(){
    const { sqrMatrix } = this.state;
    return sqrMatrix.length ? this._renderQRCode() : null;
  }
}
