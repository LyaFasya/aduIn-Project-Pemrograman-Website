'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormsHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        FormsHistory.belongsTo(models.Form, { foreignKey: 'forms_request_id' });
    }
  }
  FormsHistory.init({
    forms_request_id: DataTypes.INTEGER,
    status: DataTypes.ENUM('pending', 'process', 'done','rejected'),
    note: DataTypes.TEXT,
    updated_by: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'FormsHistory',
  });
  return FormsHistory;
};