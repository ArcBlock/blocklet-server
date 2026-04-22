module.exports = class Base {
  /**
   * Base constructor
   * @constructor Base
   * @param  {RBAC}     rbac        Instance of the RBAC
   * @param  {String}   name        Name of the grant
   * @param  {String}   opt.title       Title of the grant
   * @param  {String}   opt.description Description of the grant
   * @param  {String}   opt.extra Extra info of the grant
   { */
  constructor(rbac, name, { title, description, extra, orgId } = {}) {
    if (!rbac || !name) {
      throw new Error('One of parameters is undefined');
    }

    this.name = name;
    this.title = title;
    this.description = description;
    this.extra = extra;
    this.orgId = orgId;
    this.rbac = rbac;
  }

  /**
   * Add this to RBAC (storage)
   * @method Base#remove
   * @return {boolean}
   */
  add() {
    const { rbac } = this;
    return rbac.add(this);
  }

  /**
   * Remove this from RBAC (storage)
   * @method Base#remove
   * @return {boolean}
   */
  remove() {
    const { rbac } = this;
    return rbac.remove(this);
  }
};
