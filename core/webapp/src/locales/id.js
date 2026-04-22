/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Memulihkan Blocklet',
      description: 'Silakan pilih bloklet yang ingin Anda pulihkan',
      verify: {
        title: 'Verifikasi Kepemilikan',
        subTitle: 'Verifikasi kepemilikan blocklet dengan Dompet DID Anda',
        verify: 'Memverifikasi',
        reconnect: 'Coba blok yang lain',
        scan: 'Gunakan metode berikut untuk membuktikan kepemilikan',
        confirm: 'Berikan delegasi tanda tangan untuk memungkinkan server mengunduh dan mendekripsi backup',
        success: 'Verifikasi kepemilikan, pemulihan sedang berlangsung',
        exists: 'Blocklet ini sudah ada di server ini dan pemulihan dibatalkan',
        open: 'Kunjungi Bloklet',
        overwrite: 'Menimpa',
      },
      overwrite: {
        title: 'Timpa blok yang ada?',
        description:
          'Blocklet yang sedang Anda pulihkan sudah ada di server ini, apakah Anda ingin menimpanya? Blocklet yang ada akan dihapus terlebih dahulu jika Anda melanjutkan',
      },
      restore: {
        title: 'Memulihkan Blocklet',
      },
    },
    restoreFromServer: {
      selectTitle: 'Pilih Aplikasi',
      description: 'Silakan pilih aplikasi yang ingin Anda pulihkan',
      backupIn: 'Backup di',
    },
    restoreFromSpaces: {
      title: 'Memulihkan dari DID Spaces',
      navSubTitle: 'Mengembalikan',
      connect: {
        title: 'Hubungkan ke DID Spaces',
        subTitle: 'Melompat ke DID Spaces, dan pilih blocklet yang ingin Anda pulihkan.',
        select: 'Pilih Gateway Ruang DID',
        connect: 'Menghubungkan',
      },
      selectBlocklet: {
        title: 'Pilih App',
      },
      restore: {
        title: 'Pulihkan Aplikasi',
        subTitle: 'Aplikasi sedang dipulihkan',
        completeTitle: 'Semuanya sudah siap',
        installedTitle: 'Berhasil dipulihkan!',
        installedSubTitle: 'Namun masih memerlukan beberapa konfigurasi untuk memulai',
        support:
          "Jika mencoba ulang tidak berhasil, mohon minta bantuan di <a href='{communityLink}' target='_blank'>komunitas</a> atau hubungi kami di <a href='mailto: {supportEmail}'>{supportEmail}</a>.",
      },
      nftAuthDialog: {
        title: 'Silakan tampilkan App Space NFT Anda',
        scan: 'Pindai kode QR dengan dompet DID Anda untuk menampilkan NFT Anda',
        confirm: 'Konfirmasi di akun Anda',
        success: 'NFT berhasil diverifikasi!',
      },
      progress: {
        waiting: 'Menunggu pemulihan...',
        restoring: 'Memulihkan...',
        importData: 'Mengimpor data...',
        downloading: 'Mengunduh file, progress: {progress}',
        importSuccess: 'Berhasil diimpor!',
        installing: 'Menginstall...',
      },
    },
  },
  server: {
    checkUpgrade: 'Periksa versi baru',
  },
};
