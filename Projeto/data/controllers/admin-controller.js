const User = require('../models/user');
const Resource = require('../models/resource');
const News = require('../models/news');
const mongoose = require('mongoose');

exports.listUsers = async (queryParams = {}) => {
  try {
    const users = await User.find(queryParams).select('-password').sort({ registrationDate: -1 });
    return users;
  } catch (error) {
    console.error("[ERROR]: listing users:", error);
    throw error;
  }
};

exports.getUserByID = async (userID) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userID)) return null;
    const user = await User.findById(userID).select('-password');
    return user;
  } catch (error) {
    console.error(`[ERROR]: finding user ${userID}:`, error);
    throw error;
  }
};


exports.updateUser = async (userId, updateData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const allowed_updates = ['username', 'level'];
    const updated = {};
    for (const key of allowed_updates) {
        if (updateData.hasOwnProperty(key)) {
            updated[key] = updateData[key];
        }
    }

    const updated_user = await User.findByIdAndUpdate(userId, { $set: updated }, { new: true, runValidators: true }).select('-password');
    return updated_user;
  } catch (error) {
    console.error(`[ERROR]: updating user ${userId}:`, error);
    throw error;
  }
};

exports.deleteUser = async (userID_delete, requestingAdminID) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userID_delete)) return null;
    if (userID_delete.toString() === requestingAdminID.toString()) {
        const err = new Error("Admins cannot delete their own account through this interface.");
        err.status = 400;
        throw err;
    }

    const resources_owned = await Resource.countDocuments({ ownerID: userID_delete });
    if (resources_owned > 0) {
      const err = new Error(`User owns ${resources_owned} resource(s). Cannot delete user. Please reassign or delete their resources first.`);
      err.status = 400;
      throw err;
    }


    const result = await User.findByIdAndDelete(userID_delete);
    if (!result) return null;
    return { message: 'User deleted successfully.', deletedUserId: userID_delete };
  } catch (error) {
    console.error(`[ERROR]: deleting user ${userID_delete}:`, error);
    throw error;
  }
};

exports.adminRegisterUser = async (userData) => {
    const { username, password, level } = userData;
    if (!username || !password) {
        const err = new Error('Username and password are required.');
        err.status = 400;
        throw err;
    }
    try {
        const existing_user = await User.findOne({ username: username });
        if (existing_user) {
            const err = new Error('Username already exists.');
            err.status = 400;
            throw err;
        }
        const new_user = new User({
            username: username,
            password: password,
            level: (level && ['consumer', 'producer', 'admin'].includes(level)) ? level : 'producer'
        });
        await new_user.save();
        const user_return = new_user.toObject();
        delete user_return.password;
        return user_return;
    } catch (error) {
        console.error('[ERROR]: admin registering user:', error);
        throw error;
    }
};

exports.getUsageStatistics = async () => {
  try {
    const users = await User.countDocuments();
    const users_leveL = await User.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const resources = await Resource.countDocuments();
    const public = await Resource.countDocuments({ isPublic: true });
    const private = resources - public;
    const resourcesByType = await Resource.aggregate([
      { $group: { _id: "$resourceType", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);


    const news = await News.countDocuments();
    const visible_news = await News.countDocuments({ isVisible: true });

    return {
      users: {
        total: users,
        byLevel: users_leveL,
      },
      resources: {
        total: resources,
        public: public,
        private: private,
        byType: resourcesByType,
      },
      news: {
        total: news,
        visible: visible_news,
      }
    };
  } catch (error) {
    console.error("[ERROR]: getting usage statistics:", error);
    throw error;
  }
};