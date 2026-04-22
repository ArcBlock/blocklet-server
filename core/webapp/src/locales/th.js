/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'กู้คืน Blocklet',
      description: 'โปรดเลือกบล็อกเล็ตที่คุณต้องการเรียกคืน',
      verify: {
        title: 'ยืนยันการเป็นเจ้าของ',
        subTitle: 'ยืนยันการเป็นเจ้าของ blocklet ด้วยกระเป๋าเงิน DID ของคุณ',
        verify: 'ยืนยัน',
        reconnect: 'ลองบล็อกเล็ตอื่น',
        scan: 'ใช้เมธอดต่อไปนี้เพื่อพิสูจน์การเป็นเจ้าของ',
        confirm: 'ลงชื่อมอบหมายให้เซิร์ฟเวอร์ดาวน์โหลดและถอดรหัสการสำรองข้อมูล',
        success: 'การตรวจสอบการเป็นเจ้าของเสร็จสิ้น การกู้คืนกำลังดำเนินการ',
        exists: 'Blocklet นี้มีอยู่แล้วในเซิร์ฟเวอร์นี้ และการเรียกคืนถูกยกเลิก',
        open: 'เยี่ยมชมบล็อกเล็ต',
        overwrite: 'เขียนทับ',
      },
      overwrite: {
        title: 'เขียนทับบล็อกที่มีอยู่ลงไปหรือไม่?',
        description:
          'Blocklet ที่คุณกำลังกู้คืนอยู่มีอยู่บนเซิร์ฟเวอร์นี้แล้ว คุณต้องการเขียนทับหรือไม่? Blocklet ที่มีอยู่จะถูกลบก่อนหากคุณดำเนินการต่อ',
      },
      restore: {
        title: 'กู้คืน Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: 'เลือกแอปพลิเคชัน',
      description: 'โปรดเลือกแอปพลิเคชันที่คุณต้องการเรียกคืน',
      backupIn: 'สำรองข้อมูลใน',
    },
    restoreFromSpaces: {
      title: 'กู้คืนจากพื้นที่ DID',
      navSubTitle: 'กู้คืน',
      connect: {
        title: 'เชื่อมต่อกับ DID Spaces',
        subTitle: 'กระโดดไปยัง DID Spacesและเลือก blocklet ที่คุณต้องการกู้คืน',
        select: 'เลือก Gateway Spaces DID',
        connect: 'เชื่อมต่อ',
      },
      selectBlocklet: {
        title: 'เลือกแอป',
      },
      restore: {
        title: 'กู้คืนแอป',
        subTitle: 'แอปกำลังถูกกู้คืน',
        completeTitle: 'ทุกอย่างพร้อมแล้ว',
        installedTitle: 'กู้คืนสำเร็จ!',
        installedSubTitle: 'แต่ยังคงต้องมีการกำหนดค่าบางอย่างเพื่อเริ่มต้น',
        support:
          "หากการลองใหม่ไม่สำเร็จ โปรดขอความช่วยเหลือใน <a href='{communityLink}' target='_blank'>ชุมชน</a> หรือติดต่อเราที่ <a href='mailto: {supportEmail}'>{supportEmail}</a>.",
      },
      nftAuthDialog: {
        title: 'โปรดนำเสนอ App Space NFT ของคุณ',
        scan: 'สแกนรหัส QR ด้วยกระเป๋าเงิน DID เพื่อนำเสนอ NFT ของคุณ',
        confirm: 'ยืนยันในบัญชีของคุณ',
        success: 'NFT ที่ตรวจสอบเรียบร้อยแล้ว!',
      },
      progress: {
        waiting: 'กำลังรอการกู้คืน...',
        restoring: 'กำลังกู้คืน...',
        importData: 'กำลังนำเข้าข้อมูล...',
        downloading: 'กำลังดาวน์โหลดไฟล์ ความคืบหน้า: {progress}',
        importSuccess: 'นำเข้าเรียบร้อยแล้ว!',
        installing: 'กำลังติดตั้ง...',
      },
    },
  },
  server: {
    checkUpgrade: 'ตรวจสอบเวอร์ชันใหม่',
  },
};
