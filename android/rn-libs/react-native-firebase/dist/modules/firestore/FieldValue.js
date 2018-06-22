/**
 * 
 * FieldValue representation wrapper
 */

export default class FieldValue {
  static delete() {
    return DELETE_FIELD_VALUE;
  }

  static serverTimestamp() {
    return SERVER_TIMESTAMP_FIELD_VALUE;
  }
}

export const DELETE_FIELD_VALUE = new FieldValue();
export const SERVER_TIMESTAMP_FIELD_VALUE = new FieldValue();