export const up = async () => {
  // pg 索引最长不能超过 8192 字节，所以这里使用 LEFT 函数来创建前缀索引
  // content 不要做索引
  // await safeAddIndex(context, 'audit_logs', ['content'], { maxLength: 4000 });
};

export const down = async () => {};
