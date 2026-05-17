'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Form extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        Form.belongsTo(models.User, { foreignKey: 'user_id' });
        Form.belongsTo(models.Category, { foreignKey: 'category_id' });
        Form.hasMany(models.FormsHistory, { foreignKey: 'forms_request_id' });
    }
  }
  Form.init({
    user_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    image_url: DataTypes.STRING,
    status: DataTypes.ENUM('pending', 'process', 'done','rejected'),
    label: DataTypes.ENUM('report','request')
  }, {
    sequelize,
    modelName: 'Form',
  });
  return Form;
};