/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'فشل الحصول على قائمة بلوكلت من السجل "{registryUrl}".',
  },
  backup: {
    space: {
      error: {
        title: 'حدث خطأ في النسخ الاحتياطي إلى DID Spaces',
        forbidden:
          'ليس لديك إذن لأداء النسخ الاحتياطي، حاول استعادة ترخيص التطبيق على DID Spaces أو إعادة الاتصال بـ DID Spaces وحاول مرة أخرى',
      },
      isFull: 'مساحة التخزين في DID Space ممتلئة، يرجى توسيع المساحة والنسخ الاحتياطي مرة أخرى',
      lackOfSpace: 'المساحة المتاحة حاليًا في التخزين غير كافية. يرجى توسيع المساحة وإجراء النسخ الاحتياطي مرة أخرى.',
      unableEnableAutoBackup: 'يتعذر تمكين النسخ الاحتياطي التلقائي، يرجى الاتصال بمساحات DID أولاً',
    },
  },
};
