/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'การรับรายการ Blocklet จากทะเบียน "{registryUrl}" ไม่สำเร็จ',
  },
  backup: {
    space: {
      error: {
        title: 'การสำรองข้อมูลไปยัง DID Spaces พบข้อผิดพลาด',
        forbidden:
          'คุณไม่ได้รับอนุญาตให้ทำการสำรองข้อมูลกลับสู่ ลองเรียกคืนใบอนุญาตแอปพลิเคชันบน DID Spaces หรือเชื่อมต่อกับ DID Spaces และลองอีกครั้ง',
      },
      isFull: 'พื้นที่เก็บข้อมูลใน DID Space เต็มแล้ว กรุณาขยายพื้นที่และสำรองข้อมูลอีกครั้ง',
      lackOfSpace: 'พื้นที่ว่างในการจัดเก็บปัจจุบันไม่เพียงพอ โปรดขยายพื้นที่และทำการสำรองข้อมูลอีกครั้ง',
      unableEnableAutoBackup: 'ไม่สามารถเปิดใช้งานการสำรองข้อมูลอัตโนมัติได้ โปรดเชื่อมต่อกับ DID Spaces ก่อน',
    },
  },
};
