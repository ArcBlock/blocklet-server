/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Không thể lấy danh sách Blocklet từ registry "{registryUrl}".',
  },
  backup: {
    space: {
      error: {
        title: 'Backup vào DID Spaces gặp lỗi',
        forbidden:
          'Bạn không có quyền thực hiện sao lưu, hãy thử khôi phục giấy phép ứng dụng trên DID Spaces hoặc kết nối lại với DID Spaces và thử lại',
      },
      isFull: 'Không gian lưu trữ DID Space hiện tại đã đầy, vui lòng mở rộng không gian và sao lưu lại',
      lackOfSpace: 'Không gian lưu trữ hiện tại không đủ. Vui lòng mở rộng không gian và thực hiện sao lưu lại.',
      unableEnableAutoBackup: 'Không thể bật sao lưu tự động, hãy kết nối với DID Spaces trước',
    },
  },
};
