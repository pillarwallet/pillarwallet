

export default class AndroidChannelGroup {

  constructor(groupId, name) {
    this._groupId = groupId;
    this._name = name;
  }

  get groupId() {
    return this._groupId;
  }

  get name() {
    return this._name;
  }

  build() {
    if (!this._groupId) {
      throw new Error('AndroidChannelGroup: Missing required `groupId` property');
    } else if (!this._name) {
      throw new Error('AndroidChannelGroup: Missing required `name` property');
    }

    return {
      groupId: this._groupId,
      name: this._name
    };
  }
} /**
   * 
   * AndroidChannelGroup representation wrapper
   */