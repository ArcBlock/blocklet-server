/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'استعادة بلوكلت',
      description: 'يرجى تحديد القطعة التي ترغب في استعادتها',
      verify: {
        title: 'التحقق من الملكية',
        subTitle: 'قم بالتحقق من ملكية البلوكليت مع محفظتك DID',
        verify: 'تحقق',
        reconnect: 'جرب كتلة أخرى',
        scan: 'استخدم الطرق التالية لإثبات الملكية',
        confirm: 'قم بتفويض التوقيع للسماح للخادم بتنزيل وفك تشفير النسخة الاحتياطية',
        success: 'تم التحقق من الملكية، جارٍ النقل',
        exists: 'هذا الكتلة موجودة بالفعل على هذا الخادم وتم إلغاء الاستعادة',
        open: 'قم بزيارة بلوكليت',
        overwrite: 'الكتابة فوق',
      },
      overwrite: {
        title: 'الكتلة الحالية سيتم استبدالها؟',
        description: 'الكتلة التي تقوم بإستعادتها موجودة بالفعل على هذا الخادم، هل ترغب في استبدالها؟',
      },
      restore: {
        title: 'استعادة بلوكليت',
      },
    },
    restoreFromServer: {
      selectTitle: 'اختر التطبيق',
      description: 'يرجى تحديد التطبيق الذي ترغب في استعادته',
      backupIn: 'نسخ احتياطي في',
    },
    restoreFromSpaces: {
      title: 'استعادة من مساحات DID',
      navSubTitle: 'استعادة',
      connect: {
        title: 'اتصل بـ DID Spaces',
        subTitle: 'انتقل إلى مساحات DID وحدد العنصر الذي ترغب في استعادته.',
        select: 'حدد DID Spaces Gateway',
        connect: 'اتصل',
      },
      selectBlocklet: {
        title: 'اختر التطبيق',
      },
      restore: {
        title: 'استعادة التطبيق',
        subTitle: 'يتم استعادة التطبيق',
        completeTitle: 'كل شيء جاهز',
        installedTitle: 'تم استعادته بنجاح!',
        installedSubTitle: 'لكن لا تزال بعض التكوينات مطلوبة للبدء',
        support:
          'إذا لم ينجح إعادة المحاولة ، يرجى طلب المساعدة في <a href="{communityLink}" target="_blank">المجتمع</a> أو الاتصال بنا على <a href="mailto: {supportEmail}">{supportEmail}</a>.',
      },
      nftAuthDialog: {
        title: 'يرجى تقديم مساحتك لـ App NFT',
        scan: 'مسح رمز الاستجابة السريعة بواسطة محفظة DID الخاصة بك لتقديم NFT الخاص بك',
        confirm: 'تأكيد في حسابك',
        success: 'NFT تم التحقق منه بنجاح!',
      },
      progress: {
        waiting: 'انتظار الاستعادة...',
        restoring: 'استعادة...',
        importData: 'جار استيراد البيانات...',
        downloading: 'تحميل الملفات ، التقدم: {progress}',
        importSuccess: 'استيراد بنجاح!',
        installing: 'جاري التثبيت...',
      },
    },
  },
  server: {
    checkUpgrade: 'تحقق من النسخة الجديدة',
  },
};
