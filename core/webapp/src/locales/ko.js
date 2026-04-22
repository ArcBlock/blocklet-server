/* eslint-disable prettier/prettier */
export default {
  blocklet: {
    restoreBlocklet: {
      title: 'Blocklet 복원하기',
      description: '복원하려는 블록을 선택하세요',
      verify: {
        title: '소유권 확인하기',
        subTitle: '당신의 DID 지갑으로 블록렛의 소유권을 확인하세요',
        verify: '확인',
        reconnect: '다른 블록을 시도해보세요',
        scan: '다음 방법을 사용하여 소유권을 증명하십시오',
        confirm: '서버가 백업을 다운로드하고 복호화 할 수 있도록 서명 위임을 허용합니다',
        success: '소유권이 확인되었습니다. 복원이 진행 중입니다',
        exists: '이 블록이 이미 이 서버에 존재하며 복원이 중단되었습니다',
        open: 'Blocklet 방문하기',
        overwrite: '덮어쓰다',
      },
      overwrite: {
        title: '기존 블록을 덮어쓰시겠습니까?',
        description:
          '복원하려는 블록렛은 이미 이 서버에 존재합니다. 덮어쓰시겠습니까? 계속 진행하면 기존 블록렛이 먼저 삭제됩니다.',
      },
      restore: {
        title: '블록 복원',
      },
    },
    restoreFromServer: {
      selectTitle: '어플리케이션 선택하기',
      description: '복원하고자하는 애플리케이션을 선택하세요',
      backupIn: '백업 중',
    },
    restoreFromSpaces: {
      title: 'DID Spaces에서 복원',
      navSubTitle: '복원',
      connect: {
        title: 'DID Spaces 에 연결',
        subTitle: 'DID Spaces로 이동하여 복원하려는 블록렛을 선택하세요.',
        select: 'DID 공간 게이트웨이를 선택하세요',
        connect: '연결',
      },
      selectBlocklet: {
        title: '앱 선택',
      },
      restore: {
        title: '앱 복원하기',
        subTitle: '앱이 복원 중입니다',
        completeTitle: '모든 것이 준비되었습니다',
        installedTitle: '복원 성공!',
        installedSubTitle: '하지만 시작하려면 일부 구성이 필요합니다',
        support:
          '다시 시도해도 작동하지 않는 경우, <a href="{communityLink}" target="_blank">커뮤니티</a>에서 도움을 요청하거나 <a href="mailto: {supportEmail}">{supportEmail}</a>으로 문의하십시오.',
      },
      nftAuthDialog: {
        title: '앱 스페이스 NFT를 제시해주세요',
        scan: 'DID 지갑으로 QR 코드를 스캔하여 NFT를 제시하세요',
        confirm: '계정에서 확인',
        success: 'NFT가 성공적으로 검증되었습니다!',
      },
      progress: {
        waiting: '복원 대기 중...',
        restoring: '복원 중...',
        importData: '데이터를 가져오는 중...',
        downloading: '파일 다운로드 중, 진행 상황 : {progress}',
        importSuccess: '성공적으로 가져왔습니다!',
        installing: '설치중입니다...',
      },
    },
  },
  server: {
    checkUpgrade: '새 버전 확인',
  },
};
