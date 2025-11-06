/**
 * User model for FCA/AsuraClient
 * Stores user information and metadata
 * @module models/user
 */

module.exports = function (sequelize) {
  const { Model, DataTypes } = require("sequelize");

  /**
   * User model class
   * @extends Model
   */
  class User extends Model { }

  User.init(
    {
      /** @type {number} Auto-incrementing primary key */
      num: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      /** @type {string} Facebook user ID */
      userID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      /** @type {Object} User metadata and data */
      data: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userID']
        },
        {
          fields: ['createdAt']
        }
      ]
    }
  );
  
  /**
   * Associate with other models
   * @param {Object} models - All models
   */
  User.associate = function(models) {
    // Define associations here if needed
  };

  return User;
};
