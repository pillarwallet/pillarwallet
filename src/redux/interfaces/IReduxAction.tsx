import IObject from 'redux/interfaces/IObject';
import { ReduxUnionType } from 'redux/redux-types/redux-union-type';

export interface IReduxAction {
  type: ReduxUnionType;
  payload?: IObject;
  error?: any;
}
