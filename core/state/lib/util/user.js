const omitBy = require('lodash/omitBy');
const omit = require('lodash/omit');

/**
 * 生成用户要更新的数据
 * @param {*} user 要更新的用户对象
 * @param {*} existingUser 已存在的用户对象
 */
const generateUserUpdateData = (user, existingUser) => {
  // 如果用户不存在，需要抛出错误
  if (!existingUser) {
    throw new Error('User not found');
  }

  const { emailVerified, phoneVerified, metadata = {} } = existingUser;

  // 创建基础更新对象，只包含非空值
  let updateData = {
    did: user.did,
    ...omitBy(user, (x) => !x),
    metadata: { ...metadata, ...user.metadata },
  };

  // 处理地址
  if (user.address) {
    updateData.address = {
      ...existingUser.address,
      ...(user.address ?? {}),
    };
    updateData.metadata = {
      ...updateData.metadata,
      ...(user.metadata ?? {}),
      location: user.address?.city || '',
    };
  }

  // 处理电话信息
  if (phoneVerified && updateData.metadata?.phone?.phoneNumber !== existingUser.phone) {
    // 保持原号码相同
    updateData.metadata.phone = {
      country: '',
      phoneNumber: existingUser.phone,
    };
  } else if (!phoneVerified && user.phone) {
    // 从user.phone更新
    updateData.metadata.phone = {
      country: '',
      phoneNumber: user.phone,
    };
  } else if (!phoneVerified && !user.phone && user.metadata?.phone) {
    // 从user.metadata.phone更新
    updateData.phone = user.metadata?.phone?.phoneNumber || '';
  }

  // 处理邮件
  if (user.metadata?.email) {
    updateData.metadata = omit(updateData.metadata, ['email']);
    if (!emailVerified) {
      updateData.email = user.metadata.email;
    }
  }

  // 邮箱已验证，保持服务器上已验证的邮箱
  if (emailVerified && updateData.email) {
    updateData = omit(updateData, ['email']);
  }
  if (phoneVerified && updateData.phone) {
    updateData = omit(updateData, ['phone']);
  }
  return updateData;
};

module.exports = { generateUserUpdateData };
