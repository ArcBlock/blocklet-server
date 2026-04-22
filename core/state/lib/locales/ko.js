/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: '"{registryUrl}" 레지스트리에서 Blocklet 목록을 가져오는 데 실패했습니다.',
  },
  backup: {
    space: {
      error: {
        title: 'DID Spaces 백업 중 오류가 발생했습니다',
        forbidden:
          '백업을 수행할 권한이 없습니다. DID Spaces에서 애플리케이션 라이센스를 복원하거나 DID Spaces에 다시 연결한 후 다시 시도하십시오',
      },
      isFull: '현재 DID Space 저장 공간이 가득 찼습니다. 공간을 확장하고 다시 백업하세요',
      lackOfSpace: '현재 사용 가능한 저장 공간이 부족합니다. 공간을 확장하고 백업을 다시 실행하세요.',
      unableEnableAutoBackup: '자동 백업을 사용할 수 없습니다. 먼저 DID 공간에 연결하세요.',
    },
  },
};
