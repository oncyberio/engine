export default class Layers {
  private _bits = 0;

  constructor(rawBits = undefined) {
    this._bits = 0;

    if (rawBits !== undefined && rawBits > 0 && rawBits <= 0xffff)
      this._bits = rawBits;
  }

  get groupCount() {
    if (this._bits === 0) return 0;

    let count = 0;

    for (let i = 0; i < 16; i++) {
      if (this.hasGroup(i)) count++;
    }

    return count;
  }
  /**
   * @param groupIndex starts from 0 to 15
   */
  hasGroup(groupIndex) {
    if (this._bits === 0) return false;

    if (groupIndex < 0 || groupIndex >= 16)
      throw new Error("Invalid group index");

    return (this._bits & ((1 << groupIndex) & 0xffff)) !== 0;
  }
  /**
   * @param groups group index, starts from 0 to 15
   */
  addGroup(groups) {
    for (let i = 0; i < groups.length; i++) {
      const gIdx = groups[i];

      if (gIdx < 0 || gIdx >= 16) throw new Error("Invalid group index");

      this._bits |= (1 << gIdx) & 0xffff;
    }

    return this;
  }
  /**
   * @param groups group index, starts from 0 to 15
   */
  removeGroup(...groups) {
    for (let i = 0; i < groups.length; i++) {
      const gIdx = groups[i];

      if (gIdx < 0 || gIdx >= 16) throw new Error("Invalid group index");

      this._bits &= ~(1 << gIdx);
    }

    return this;
  }

  test(a, b) {
    return ((a >> 16) & (b & 0xffff)) != 0 && ((b >> 16) & (a & 0xffff)) != 0;
  }

  get value() {
    return this._bits;
  }
  /**
   * Generates a `InteractionGroup` value for a collider to set.
   * @param withGroups group index (exists already in this helper), index value starts from 0 to 15. if not provided, all groups will be take into account.
   */
  generate(withGroups) {
    if (withGroups === undefined || withGroups.length === 0) {
      return 0xffff0000 | (this._bits & 0xffff);
    } else {
      let flags = 0;

      for (let i = 0, j = withGroups.length; i < j; i++) {
        const gIdx = withGroups[i];

        if (!this.hasGroup(gIdx)) throw new Error("no such group: " + gIdx);

        flags |= (1 << gIdx) & 0xffff;
      }

      return (flags << 16) | (this._bits & 0xffff);
    }
  }
}
