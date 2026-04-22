/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Khôi phục Blocklet',
      description: 'Vui lòng chọn blocklet bạn muốn khôi phục',
      verify: {
        title: 'Xác minh Quyền sở hữu',
        subTitle: 'Xác minh sở hữu blocklet với Ví DID của bạn',
        verify: 'Xác minh',
        reconnect: 'Hãy thử khối khác',
        scan: 'Sử dụng các phương pháp sau để chứng minh quyền sở hữu',
        confirm: 'Ủy quyền ký để cho phép máy chủ tải và giải mã sao lưu',
        success: 'Quyền sở hữu đã được xác minh, quá trình khôi phục đang diễn ra',
        exists: 'Blocklet này đã tồn tại trên máy chủ này và việc khôi phục đã bị hủy bỏ',
        open: 'Ghé thăm Blocklet',
        overwrite: 'Ghi đè',
      },
      overwrite: {
        title: 'Ghi đè lên khối đã tồn tại?',
        description:
          'Blocklet bạn đang khôi phục đã tồn tại trên máy chủ này, bạn có muốn ghi đè lên nó không? Blocklet hiện đang tồn tại sẽ bị xóa trước nếu bạn tiếp tục',
      },
      restore: {
        title: 'Khôi phục Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: 'Chọn Ứng dụng',
      description: 'Vui lòng chọn ứng dụng bạn muốn khôi phục',
      backupIn: 'Sao lưu trong',
    },
    restoreFromSpaces: {
      title: 'Khôi phục từ DID Spaces',
      navSubTitle: 'Khôi phục',
      connect: {
        title: 'Kết nối với DID Spaces',
        subTitle: 'Chuyển đến DID Spaces và chọn blocklet mà bạn muốn khôi phục.',
        select: 'Chọn Cổng Spaces DID',
        connect: 'Kết nối',
      },
      selectBlocklet: {
        title: 'Chọn ứng dụng',
      },
      restore: {
        title: 'Khôi phục Ứng dụng',
        subTitle: 'Ứng dụng đang được khôi phục',
        completeTitle: 'Mọi thứ đã sẵn sàng',
        installedTitle: 'Khôi phục thành công!',
        installedSubTitle: 'Nhưng vẫn cần một số cấu hình để bắt đầu',
        support:
          "Nếu thử lại không thành công, vui lòng yêu cầu trợ giúp trong <a href='{communityLink}' target='_blank'>cộng đồng</a> hoặc liên hệ với chúng tôi tại <a href='mailto: {supportEmail}'>{supportEmail}</a>.",
      },
      nftAuthDialog: {
        title: 'Vui lòng trình bày App Space NFT của bạn',
        scan: 'Quét mã QR bằng Ví DID của bạn để trình bày NFT của bạn',
        confirm: 'Xác nhận trong tài khoản của bạn',
        success: 'NFT đã được xác minh thành công!',
      },
      progress: {
        waiting: 'Đang chờ khôi phục...',
        restoring: 'Đang khôi phục...',
        importData: 'Đang nhập dữ liệu...',
        downloading: 'Đang tải tệp, tiến trình: {progress}',
        importSuccess: 'Nhập thành công!',
        installing: 'Đang cài đặt...',
      },
    },
  },
  server: {
    checkUpgrade: 'Kiểm tra phiên bản mới',
  },
};
