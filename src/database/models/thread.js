/**
 * Thread model for FCA/AsuraClient
 * Stores thread information and metadata
 * @module models/thread
 */

module.exports = function(sequelize) {
  const { Model, DataTypes } = require("sequelize");

  /**
   * Thread model class
   * @extends Model
   */
  class Thread extends Model {}

  Thread.init(
    {
      /** @type {number} Auto-incrementing primary key */
      num: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      /** @type {string} Facebook thread ID */
      threadID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      /** @type {Object} Thread metadata and data */
      data: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Thread",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['threadID']
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
  Thread.associate = function(models) {
    // Define associations here if needed
  };
  
  return Thread;
};
