/* ============ 홈 인터뷰·지원사업 콘텐츠 데이터 ============ */

const VOICES = [
  {
    category: '카페', name: '김영숙 사장님', place: '늘봄 카페', district: '마포구',
    before: '10년 동안 단골손님이 오지 못하는 걸 알았지만 어떻게 해야 할지 몰랐어요.',
    after: '경사로가 생기고 나서 그 손님이 다시 오셨어요. 3년 만이었습니다.',
    verificationStatus: 'needs-source-review', verifiedAt: null, sourceUrl: null,
  },
  {
    category: '서점', name: '박민준 대표', place: '온기 서점', district: '성동구',
    before: '서점에 오고 싶다는 DM을 받았는데 계단 때문에 못 온다는 말을 듣고 충격이었어요.',
    after: '이제 우리 서점은 ‘모두의 서점’이 됐습니다. 매출도 올랐고요.',
    verificationStatus: 'needs-source-review', verifiedAt: null, sourceUrl: null,
  },
  {
    category: '식당', name: '이정호 대표', place: '햇살 분식', district: '은평구',
    before: '40년 된 분식집인데 한 번도 휠체어 손님을 모신 적이 없었어요.',
    after: '이제 어르신들도, 유아차 손님도 자유롭게 오세요. 정말 기쁩니다.',
    verificationStatus: 'needs-source-review', verifiedAt: null, sourceUrl: null,
  },
];

const SUPPORTS = [
  {
    region: '서울·동작구', tag: '경사로 무상 설치', title: '2026 소규모시설 경사로 설치 지원사업',
    org: '동작구 장애인복지과', when: '2026.09.04 접수 종료', r: '서울', status: 'closed',
    eligibility: '동작구 내 바닥면적 300㎡ 미만 음식점·약국·카페·미용실·편의점 등',
    documents: '동작구청 공고의 신청서, 고정형은 임대인 동의 필요',
    sourceLabel: '기관 제공 보도 확인', sourceOfficial: false,
    verificationStatus: 'press-checked', verifiedAt: '2026-09-14',
    sourceUrl: 'https://v.daum.net/v/20260804091550219',
  },
  {
    region: '경기·수원시', tag: '최대 300만원·공급가 90%', title: '2026 수원시 소상공인 경영환경개선 지원사업',
    org: '수원도시재단 상권활성화센터', when: '2026.03.12 접수 종료', r: '경기', status: 'closed',
    eligibility: '수원시 소재 소상공인 중 최근 3년간 동일·유사 사업 미수혜자 등',
    documents: '체크리스트, 신청서·추진계획서, 점포 사진, 견적서, 사업자등록증 등',
    sourceLabel: '공식 공고 확인', sourceOfficial: true,
    verificationStatus: 'source-checked', verifiedAt: '2026-09-14',
    sourceUrl: 'https://www.sscf2016.or.kr/sscf2019_files/contest/1773032955415_0415.pdf',
  },
  {
    region: '서울·성동구', tag: '고정식·이동식 경사로 지원', title: '2026 생활밀착형 소규모시설 경사로 설치 지원사업',
    org: '성동구 장애인복지과', when: '2026.07.01 ~ 2026.07.30 접수 종료', r: '서울', status: 'closed',
    eligibility: '성동구 내 바닥면적 300㎡ 미만 편의점·슈퍼마켓·약국·의원·음식점 등 소규모시설',
    documents: '신청 전 성동구장애인편의증진기술지원센터에 설치 가능 여부와 제출 서류 확인',
    sourceLabel: '공식 공고 확인', sourceOfficial: true,
    verificationStatus: 'source-checked', verifiedAt: '2026-09-14',
    sourceUrl: 'https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=183&key=1472&nttNo=359436',
  },
];
