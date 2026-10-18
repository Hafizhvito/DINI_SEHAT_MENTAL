// path : frontend/src/data/categories.ts

export type Category = {
  instruction: string;
  options: string[];
};

export const categories: Record<string, Category> = {
  I: {
    instruction:
      "Berilah tanda pada jawaban yang paling sesuai berkenaan dengan pekerjaan anda saat ini",
    options: [
      "Sangat Setuju",
      "Cukup Setuju",
      "Kurang Setuju",
      "Sangat Tidak Setuju",
    ],
  },

  II: {
    instruction: "Kondisi Kesehatan anda dalam satu bulan terakhir",
    options: [
      "Hampir tidak ada",
      "Kadang-kadang",
      "Sering",
      "Hampir selalu",
    ],
  },

  IV: {
    instruction:
      "Jawaban yang paling sesuai berkenaan dengan situasi di tempat kerja saat ini",
    options: [
      "Benar",
      "Cukup benar",
      "Kurang benar",
      "Sangat tidak benar",
    ],
  },

  V: {
    instruction:
      "Jawaban yang paling sesuai berkenaan dengan organisasi di tempat kerja anda saat ini",
    options: [
      "Sangat setuju",
      "Cukup setuju",
      "Kurang setuju",
      "Sangat tidak setuju",
    ],
  },

  VI: {
    instruction:
      "Jawaban yang paling sesuai berkenaan dengan kondisi konflik Peran Ganda antara pekerjaan dan keluarga",
    options: [
      "Sangat setuju",
      "Setuju",
      "Tidak setuju",
      "Sangat tidak setuju",
    ],
  },

  VII: {
    instruction:
      "Stres Appraisal - Jawaban yang paling sesuai berkenaan dengan kondisi anda",
    options: [
      "Sangat tidak sesuai",
      "Sedikit",
      "Cukup",
      "Sangat cukup",
      "Sangat sesuai",
    ],
  },
};
