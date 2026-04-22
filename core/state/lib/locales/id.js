/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: 'Gagal mendapatkan daftar Blocklet dari registrasi "{registryUrl}".',
  },
  backup: {
    space: {
      error: {
        title: 'Backup ke DID Spaces mengalami kesalahan',
        forbidden:
          'Anda tidak memiliki izin untuk melakukan pencadangan, coba pulihkan lisensi aplikasi di DID Spaces atau hubungkan kembali ke DID Spaces dan coba lagi',
      },
      isFull: 'Ruang penyimpanan DID Space saat ini penuh, harap perluas ruang dan lakukan cadangan lagi',
      lackOfSpace:
        'Ruang yang tersedia saat ini di penyimpanan tidak mencukupi. Mohon perluas ruang dan lakukan backup lagi.',
      unableEnableAutoBackup:
        'Tidak dapat mengaktifkan pencadangan otomatis, harap sambungkan ke DID Spaces terlebih dahulu',
    },
  },
};
