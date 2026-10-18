// src/utils/Scoring.ts
// Rumus Skoring Kuesioner Stres Kerja - 68 Pertanyaan Valid (Versi 17-04-2026)

export const TOTAL_QUESTIONS = 68;
export const TOTAL_BINARY_INDICATORS = 21; // Kelompok 1 sampai 5
export const CUTOFF_S = 2.25; // S < 2.25 = Status 1 (berisiko), S >= 2.25 = Status 0 (tidak berisiko)
export const MIN_SAMPLE_SIZE_FOR_NORMS = 30; // Syarat minimal sampel v68 untuk hitung kategori Kelompok 7

export const WFC_CATEGORY_THRESHOLDS = {
  VERY_HIGH: 3.4, // X > 3.4
  HIGH: 2.8,      // 2.8 <= X <= 3.4 (titik batas 3.4 masuk kategori 4 sesuai catatan dokumen)
  MEDIUM: 2.2,    // 2.2 <= X < 2.8
  LOW: 1.6,       // 1.6 <= X < 2.2
  // X < 1.6 = Kategori 1 (Sangat rendah)
} as const;

export const STRESS_LEVEL_THRESHOLDS = {
  HIGH_PERCENTAGE: 40, // >= 40% = tinggi
  MEDIUM_PERCENTAGE: 20, // >= 20% = sedang, < 20% = rendah
};

export const DISCLAIMER_LABEL = "Hasil skrining, bukan diagnosis";

export interface IndicatorScore {
  key: string;
  label: string;
  userFriendlyLabel: string;
  kelompok: string;
  n: number;
  questionIds: number[];
  sumX: number;
  sScore: number; // Nilai S = (5n - sumX) / n (2 desimal)
  status: 0 | 1; // 1 = Berisiko (S < 2.25), 0 = Tidak berisiko (S >= 2.25)
}

export interface WFCSubscaleScore {
  key: string;
  label: string;
  questionIds: number[];
  rawAverage: number; // X = rata-rata item
  categoryValue: 1 | 2 | 3 | 4 | 5;
  categoryLabel: string;
}

export interface StressAppraisalSubscaleScore {
  key: string;
  label: string;
  questionIds: number[];
  rawAverage: number; // X = rata-rata item
  categoryValue: number | null; // 0 sampai 4 jika N >= 30, null jika N < 30
  categoryLabel: string; // "Stres sangat tinggi", dll., atau "Belum tersedia"
}

export interface ScoreResult {
  totalBinaryFlags: number; // Jumlah indikator berisiko di Kelompok 1-5 (maksimal 21)
  maxBinaryFlags: number; // 21
  binaryPercentage: number; // (totalBinaryFlags / 21) * 100
  stressLevel: "rendah" | "sedang" | "tinggi";
  disclaimer: string;
  perIndicator: Record<string, IndicatorScore>; // 21 indikator Kelompok 1-5
  problematicIndicators: IndicatorScore[]; // Daftar indikator berisiko (status 1)
  wfcSubscales: Record<string, WFCSubscaleScore>; // 3 subskala Kelompok 6
  wfcIndex: number; // Rata-rata kategori WFC (1-5)
  stressAppraisalSubscales: Record<string, StressAppraisalSubscaleScore>; // 5 subskala Kelompok 7
  perQuestion: Record<number, number>; // Jawaban X per item (1-68)
}

/**
 * Kelompok 1 sampai 5: 21 Definisi Indikator Baku
 */
export const INDICATOR_DEFINITIONS: Array<{
  key: string;
  label: string;
  userFriendlyLabel: string;
  kelompok: string;
  questionIds: number[];
}> = [
  // Kelompok 1. Tuntutan pekerjaan (2 indikator)
  {
    key: "konflik_antar_personal",
    label: "Konflik antar personal",
    userFriendlyLabel: "Indikasi adanya perselisihan atau perbedaan opini di lingkungan kerja",
    kelompok: "Tuntutan pekerjaan",
    questionIds: [3],
  },
  {
    key: "keseimbangan_pribadi_kerja_negatif",
    label: "Keseimbangan pribadi dan kerja (negatif)",
    userFriendlyLabel: "Indikasi kehidupan pribadi terganggu akibat beban pikiran pekerjaan",
    kelompok: "Tuntutan pekerjaan",
    questionIds: [35],
  },

  // Kelompok 2. Sumber daya pekerjaan level tugas (2 indikator)
  {
    key: "pekerjaan_yang_sesuai",
    label: "Pekerjaan yang sesuai",
    userFriendlyLabel: "Indikasi ketidaksesuaian minat atau kompetensi dengan tugas pekerjaan",
    kelompok: "Sumber daya pekerjaan level tugas",
    questionIds: [1],
  },
  {
    key: "kebermaknaan_dari_pekerjaan",
    label: "Kebermaknaan dari pekerjaan",
    userFriendlyLabel: "Indikasi kurangnya rasa bermakna dan motivasi dalam pekerjaan",
    kelompok: "Sumber daya pekerjaan level tugas",
    questionIds: [2],
  },

  // Kelompok 3. Sumber daya pekerjaan level grup (5 indikator)
  {
    key: "penghargaan_harga_diri",
    label: "Penghargaan bagi harga diri/martabat",
    userFriendlyLabel: "Indikasi kurangnya apresiasi atau pengakuan dari atasan",
    kelompok: "Sumber daya pekerjaan level grup",
    questionIds: [24],
  },
  {
    key: "kepemimpinan",
    label: "Kepemimpinan",
    userFriendlyLabel: "Indikasi minimnya dukungan atasan dalam pengembangan kemampuan diri",
    kelompok: "Sumber daya pekerjaan level grup",
    questionIds: [25],
  },
  {
    key: "keadilan_dalam_berinteraksi",
    label: "Keadilan dalam berinteraksi",
    userFriendlyLabel: "Indikasi perlakuan yang kurang adil atau kurang tulus di tempat kerja",
    kelompok: "Sumber daya pekerjaan level grup",
    questionIds: [26],
  },
  {
    key: "tempat_kerja_saling_memuji",
    label: "Tempat kerja saling memuji",
    userFriendlyLabel: "Indikasi kurangnya budaya saling menghargai kinerja antar rekan kerja",
    kelompok: "Sumber daya pekerjaan level grup",
    questionIds: [27],
  },
  {
    key: "tempat_kerja_kesalahan_diterima",
    label: "Tempat kerja yang kesalahan dapat diterima",
    userFriendlyLabel: "Indikasi kurangnya ruang perbaikan yang toleran terhadap kesalahan kerja",
    kelompok: "Sumber daya pekerjaan level grup",
    questionIds: [28],
  },

  // Kelompok 4. Sumber daya pekerjaan level organisasi (7 indikator)
  {
    key: "kepercayaan_pada_manajemen",
    label: "Kepercayaan pada manajemen",
    userFriendlyLabel: "Indikasi keraguan terhadap keterbukaan informasi manajemen perusahaan",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [29],
  },
  {
    key: "kesiapan_menghadapi_perubahan",
    label: "Kesiapan menghadapi perubahan",
    userFriendlyLabel: "Indikasi aspirasi pekerja kurang didengar saat perubahan organisasi",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [30],
  },
  {
    key: "penghormatan_bagi_individu",
    label: "Penghormatan bagi individu",
    userFriendlyLabel: "Indikasi nilai pribadi pekerja kurang dihargai oleh organisasi",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [31],
  },
  {
    key: "evaluasi_pekerja_yang_adil",
    label: "Evaluasi pekerja yang adil",
    userFriendlyLabel: "Indikasi proses penilaian kinerja kurang jelas atau kurang transparan",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [32],
  },
  {
    key: "keberagaman",
    label: "Keberagaman",
    userFriendlyLabel: "Indikasi adanya kesenjangan penghargaan perlakuan antar status pekerja",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [33],
  },
  {
    key: "pengembangan_karir",
    label: "Pengembangan karir",
    userFriendlyLabel: "Indikasi minimnya kesempatan pelatihan dan kemajuan karir",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [34],
  },
  {
    key: "keseimbangan_pribadi_kerja_positif",
    label: "Keseimbangan pribadi dan kerja (positif)",
    userFriendlyLabel: "Indikasi pekerjaan belum memberi dampak semangat positif pada kehidupan pribadi",
    kelompok: "Sumber daya pekerjaan level organisasi",
    questionIds: [36],
  },

  // Kelompok 5. Hasil (outcome) kesehatan (5 indikator)
  {
    key: "gejala_amarah_iritabilitas",
    label: "Gejala amarah/iritabilitas",
    userFriendlyLabel: "Indikasi ketegangan emosional seperti perasaan mudah kesal atau tersinggung",
    kelompok: "Hasil (outcome) kesehatan",
    questionIds: [4, 5],
  },
  {
    key: "gejala_kelelahan",
    label: "Gejala kelelahan",
    userFriendlyLabel: "Indikasi rasa lelah, lesu, dan kehabisan energi",
    kelompok: "Hasil (outcome) kesehatan",
    questionIds: [6, 7, 8],
  },
  {
    key: "gejala_kecemasan",
    label: "Gejala kecemasan",
    userFriendlyLabel: "Indikasi rasa tegang, khawatir, gelisah, atau tidak tenang",
    kelompok: "Hasil (outcome) kesehatan",
    questionIds: [9, 10, 11],
  },
  {
    key: "gejala_depresi",
    label: "Gejala depresi",
    userFriendlyLabel: "Indikasi suasana hati murung, sedih, dan sulit berkonsentrasi",
    kelompok: "Hasil (outcome) kesehatan",
    questionIds: [12, 13, 14, 15, 16, 17],
  },
  {
    key: "reaksi_fisik",
    label: "Reaksi fisik",
    userFriendlyLabel: "Indikasi keluhan fisik (sakit kepala, pening, kaku leher, atau dada berdebar)",
    kelompok: "Hasil (outcome) kesehatan",
    questionIds: [18, 19, 20, 21, 22, 23],
  },
];

/**
 * Kelompok 6: 3 Subskala Peran Ganda (Work-Family Conflict)
 */
export const WFC_SUBSCALE_DEFINITIONS = [
  {
    key: "time_based_conflict",
    label: "Time-based conflict",
    questionIds: [37, 38, 39, 40, 46, 47, 48], // 7 item
  },
  {
    key: "strain_based_conflict",
    label: "Strain-based conflict",
    questionIds: [41, 42, 49, 50, 51], // 5 item
  },
  {
    key: "behavior_based_conflict",
    label: "Behavior-based conflict",
    questionIds: [43, 44, 45, 52, 53, 54], // 6 item
  },
];

/**
 * Klasifikasi kategori Kelompok 6 (Peran Ganda) berdasarkan rentang X rata-rata
 * Sangat tinggi: X > 3.4
 * Tinggi: 2.8 <= X <= 3.4 (titik batas 3.4 masuk kategori 4 sesuai catatan PDF Bagian 4 & 7)
 * Sedang: 2.2 <= X < 2.8
 * Rendah: 1.6 <= X < 2.2
 * Sangat rendah: X < 1.6
 */
export function classifyWFCSubscale(averageX: number): {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
} {
  if (averageX > WFC_CATEGORY_THRESHOLDS.VERY_HIGH) {
    return { value: 5, label: "Sangat tinggi" };
  } else if (averageX >= WFC_CATEGORY_THRESHOLDS.HIGH) {
    return { value: 4, label: "Tinggi" };
  } else if (averageX >= WFC_CATEGORY_THRESHOLDS.MEDIUM) {
    return { value: 3, label: "Sedang" };
  } else if (averageX >= WFC_CATEGORY_THRESHOLDS.LOW) {
    return { value: 2, label: "Rendah" };
  } else {
    return { value: 1, label: "Sangat rendah" };
  }
}

/**
 * Kelompok 7: 5 Subskala Penilaian Transaksional (Stress Appraisal)
 */
export const STRESS_APPRAISAL_DEFINITIONS = [
  {
    key: "challenge",
    label: "Challenge",
    questionIds: [56, 57, 59, 65], // 4 item
  },
  {
    key: "centrality",
    label: "Centrality",
    questionIds: [58, 61], // 2 item
  },
  {
    key: "controllable_by_self",
    label: "Controllable by self",
    questionIds: [60, 62, 67], // 3 item
  },
  {
    key: "controllable_others",
    label: "Controllable others",
    questionIds: [55, 63, 64, 66], // 4 item
  },
  {
    key: "stressfullness",
    label: "Stressfullness",
    questionIds: [68], // 1 item
  },
];

export interface SubscaleNorms {
  mean: number;
  sd: number;
  sampleSize: number;
}

/**
 * Klasifikasi kategori Kelompok 7 (Penilaian Transaksional)
 * Hanya dihitung bila sampleSize >= MIN_SAMPLE_SIZE_FOR_NORMS (30).
 * Sebelum itu tampilkan "Belum tersedia", jangan default Sedang.
 */
export function classifyStressAppraisalSubscale(
  rawAverage: number,
  norms?: SubscaleNorms | null
): { value: number | null; label: string } {
  if (!norms || norms.sampleSize < MIN_SAMPLE_SIZE_FOR_NORMS || norms.sd <= 0) {
    return { value: null, label: "Belum tersedia" };
  }

  const { mean, sd } = norms;
  const X = rawAverage;

  if (X > mean + 1.5 * sd) {
    return { value: 4, label: "Stres sangat tinggi" };
  } else if (X > mean + 0.5 * sd && X <= mean + 1.5 * sd) {
    return { value: 3, label: "Stres tinggi" };
  } else if (X > mean - 0.5 * sd && X <= mean + 0.5 * sd) {
    return { value: 2, label: "Stres sedang" };
  } else if (X > mean - 1.5 * sd && X <= mean - 0.5 * sd) {
    return { value: 1, label: "Stres rendah" };
  } else {
    return { value: 0, label: "Stres sangat rendah" };
  }
}

/**
 * Tentukan tingkat stres keseluruhan berdasarkan persentase binary flags Kelompok 1-5
 */
export function determineStressLevel(
  binaryPercentage: number
): "rendah" | "sedang" | "tinggi" {
  if (binaryPercentage >= STRESS_LEVEL_THRESHOLDS.HIGH_PERCENTAGE) {
    return "tinggi";
  } else if (binaryPercentage >= STRESS_LEVEL_THRESHOLDS.MEDIUM_PERCENTAGE) {
    return "sedang";
  } else {
    return "rendah";
  }
}

/**
 * Fungsi utama untuk menghitung semua skor kuesioner 68 item
 */
export function calculateScores(
  answers: Record<number, number>,
  normsMap?: Record<string, SubscaleNorms> | null
): ScoreResult {
  const perIndicator: Record<string, IndicatorScore> = {};

  // 1. Hitung 21 indikator Kelompok 1 sampai 5
  INDICATOR_DEFINITIONS.forEach((def) => {
    const n = def.questionIds.length;
    let sumX = 0;
    def.questionIds.forEach((id) => {
      sumX += answers[id] !== undefined ? answers[id] : 0;
    });

    // Rumus baku: S = (5n - ΣX) / n
    const sScore = (5 * n - sumX) / n;
    const roundedS = Math.round(sScore * 100) / 100;
    // Status 1 (berisiko) jika S < 2.25, selain itu 0
    const status: 0 | 1 = roundedS < CUTOFF_S ? 1 : 0;

    perIndicator[def.key] = {
      key: def.key,
      label: def.label,
      userFriendlyLabel: def.userFriendlyLabel,
      kelompok: def.kelompok,
      n,
      questionIds: def.questionIds,
      sumX,
      sScore: roundedS,
      status,
    };
  });

  const problematicIndicators = Object.values(perIndicator).filter(
    (ind) => ind.status === 1
  );
  const totalBinaryFlags = problematicIndicators.length;
  const binaryPercentage = Math.round((totalBinaryFlags / TOTAL_BINARY_INDICATORS) * 1000) / 10;
  const stressLevel = determineStressLevel(binaryPercentage);

  // 2. Hitung 3 subskala Kelompok 6 (Peran Ganda)
  const wfcSubscales: Record<string, WFCSubscaleScore> = {};
  let wfcCategorySum = 0;

  WFC_SUBSCALE_DEFINITIONS.forEach((def) => {
    let sumX = 0;
    def.questionIds.forEach((id) => {
      sumX += answers[id] !== undefined ? answers[id] : 0;
    });
    const rawAverage = def.questionIds.length > 0 ? sumX / def.questionIds.length : 0;
    const roundedAvg = Math.round(rawAverage * 100) / 100;
    const classification = classifyWFCSubscale(roundedAvg);

    wfcSubscales[def.key] = {
      key: def.key,
      label: def.label,
      questionIds: def.questionIds,
      rawAverage: roundedAvg,
      categoryValue: classification.value,
      categoryLabel: classification.label,
    };
    wfcCategorySum += classification.value;
  });

  const wfcIndex = Math.round(wfcCategorySum / WFC_SUBSCALE_DEFINITIONS.length);

  // 3. Hitung 5 subskala Kelompok 7 (Penilaian Transaksional)
  const stressAppraisalSubscales: Record<string, StressAppraisalSubscaleScore> = {};

  STRESS_APPRAISAL_DEFINITIONS.forEach((def) => {
    let sumX = 0;
    def.questionIds.forEach((id) => {
      sumX += answers[id] !== undefined ? answers[id] : 0;
    });
    const rawAverage = def.questionIds.length > 0 ? sumX / def.questionIds.length : 0;
    const roundedAvg = Math.round(rawAverage * 100) / 100;
    const norms = normsMap ? normsMap[def.key] : null;
    const classification = classifyStressAppraisalSubscale(roundedAvg, norms);

    stressAppraisalSubscales[def.key] = {
      key: def.key,
      label: def.label,
      questionIds: def.questionIds,
      rawAverage: roundedAvg,
      categoryValue: classification.value,
      categoryLabel: classification.label,
    };
  });

  return {
    totalBinaryFlags,
    maxBinaryFlags: TOTAL_BINARY_INDICATORS,
    binaryPercentage,
    stressLevel,
    disclaimer: DISCLAIMER_LABEL,
    perIndicator,
    problematicIndicators,
    wfcSubscales,
    wfcIndex,
    stressAppraisalSubscales,
    perQuestion: answers,
  };
}

export default calculateScores;