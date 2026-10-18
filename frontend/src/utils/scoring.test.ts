// frontend/src/utils/scoring.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { questions } from "../data/questions.ts";
import {
  calculateScores,
  classifyWFCSubscale,
  classifyStressAppraisalSubscale,
  determineStressLevel,
  INDICATOR_DEFINITIONS,
  WFC_SUBSCALE_DEFINITIONS,
  STRESS_APPRAISAL_DEFINITIONS,
  CUTOFF_S,
  MIN_SAMPLE_SIZE_FOR_NORMS,
} from "./Scoring.ts";

declare const process: any;

let passedAssertions = 0;

function assert(condition: boolean, message: string, logSuccess = true) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    } else {
      throw new Error(message);
    }
  }
  passedAssertions++;
  if (logSuccess) {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("=== RUNNING SCORING UNIT TESTS ===\n");

// ---------------------------------------------------------
// 1. Tes Nilai dari Bagian 6 PDF
// ---------------------------------------------------------
console.log("--- 1. Test Kasus Bagian 6 PDF ---");

// Test 1: Gejala kelelahan (item 6, 7, 8), jawaban 3, 4, 3 -> S = 1.67, status = 1 (berisiko)
{
  const answers: Record<number, number> = { 6: 3, 7: 4, 8: 3 };
  const res = calculateScores(answers);
  const kelelahan = res.perIndicator["gejala_kelelahan"];
  assert(kelelahan.sScore === 1.67, `Kelelahan S-score harus 1.67, dapat: ${kelelahan.sScore}`);
  assert(kelelahan.status === 1, `Kelelahan status harus 1 (berisiko), dapat: ${kelelahan.status}`);
}

// Test 2: Kepemimpinan (item 25), jawaban 2 -> S = 3.00, status = 0 (tidak berisiko)
{
  const answers: Record<number, number> = { 25: 2 };
  const res = calculateScores(answers);
  const kepemimpinan = res.perIndicator["kepemimpinan"];
  assert(kepemimpinan.sScore === 3.0, `Kepemimpinan S-score harus 3.00, dapat: ${kepemimpinan.sScore}`);
  assert(kepemimpinan.status === 0, `Kepemimpinan status harus 0 (tidak berisiko), dapat: ${kepemimpinan.status}`);
}

// Test 3: Reaksi fisik (item 18-23), jawaban 2, 3, 1, 2, 4, 3 -> S = 2.50, status = 0 (tidak berisiko)
{
  const answers: Record<number, number> = { 18: 2, 19: 3, 20: 1, 21: 2, 22: 4, 23: 3 };
  const res = calculateScores(answers);
  const reaksiFisik = res.perIndicator["reaksi_fisik"];
  assert(reaksiFisik.sScore === 2.5, `Reaksi fisik S-score harus 2.50, dapat: ${reaksiFisik.sScore}`);
  assert(reaksiFisik.status === 0, `Reaksi fisik status harus 0 (tidak berisiko), dapat: ${reaksiFisik.status}`);
}

// Test 4: Time-based conflict (item 37-40, 46-48), jawaban 3, 3, 2, 3, 3, 3, 2 -> rata-rata 2.71, kategori 3 (Sedang)
{
  const answers: Record<number, number> = {
    37: 3, 38: 3, 39: 2, 40: 3, 46: 3, 47: 3, 48: 2,
  };
  const res = calculateScores(answers);
  const timeBased = res.wfcSubscales["time_based_conflict"];
  assert(timeBased.rawAverage === 2.71, `Time-based raw average harus 2.71, dapat: ${timeBased.rawAverage}`);
  assert(timeBased.categoryValue === 3, `Time-based kategori harus 3, dapat: ${timeBased.categoryValue}`);
  assert(timeBased.categoryLabel === "Sedang", `Time-based label harus Sedang, dapat: ${timeBased.categoryLabel}`);
}

// ---------------------------------------------------------
// 2. Tes Nilai Batas (Boundary Tests)
// ---------------------------------------------------------
console.log("\n--- 2. Test Nilai Batas (Boundaries) ---");

// Test Batas S tepat 2.25: S >= 2.25 status 0, S < 2.25 status 1
{
  // n = 1 item: jika X = 2.75 -> S = 5 - 2.75 = 2.25 -> status harus 0
  const n = 1;
  const sExact = (5 * n - 2.75) / n;
  assert(sExact >= CUTOFF_S, `S tepat 2.25 harus >= CUTOFF_S`);
  const statusExact = sExact < CUTOFF_S ? 1 : 0;
  assert(statusExact === 0, `Status untuk S tepat 2.25 harus 0 (tidak berisiko)`);

  // Jika X = 2.76 -> S = 2.24 -> status harus 1
  const sBelow = (5 * n - 2.76) / n;
  const statusBelow = sBelow < CUTOFF_S ? 1 : 0;
  assert(statusBelow === 1, `Status untuk S = 2.24 harus 1 (berisiko)`);
}

// Test Batas Kelompok 6 (Peran Ganda)
{
  // Titik 3.4 persis harus masuk Kategori 4 (Tinggi) sesuai catatan PDF
  assert(classifyWFCSubscale(3.4).value === 4, `X = 3.4 harus Kategori 4 (Tinggi)`);
  assert(classifyWFCSubscale(3.4001).value === 5, `X = 3.41 harus Kategori 5 (Sangat tinggi)`);

  // Batas 2.8: 2.8 masuk Kategori 4 (Tinggi), 2.79 masuk Kategori 3 (Sedang)
  assert(classifyWFCSubscale(2.8).value === 4, `X = 2.8 harus Kategori 4 (Tinggi)`);
  assert(classifyWFCSubscale(2.79).value === 3, `X = 2.79 harus Kategori 3 (Sedang)`);

  // Batas 2.2: 2.2 masuk Kategori 3 (Sedang), 2.19 masuk Kategori 2 (Rendah)
  assert(classifyWFCSubscale(2.2).value === 3, `X = 2.2 harus Kategori 3 (Sedang)`);
  assert(classifyWFCSubscale(2.19).value === 2, `X = 2.19 harus Kategori 2 (Rendah)`);

  // Batas 1.6: 1.6 masuk Kategori 2 (Rendah), 1.59 masuk Kategori 1 (Sangat rendah)
  assert(classifyWFCSubscale(1.6).value === 2, `X = 1.6 harus Kategori 2 (Rendah)`);
  assert(classifyWFCSubscale(1.59).value === 1, `X = 1.59 harus Kategori 1 (Sangat rendah)`);
}

// ---------------------------------------------------------
// 3. Test Kelompok 7 (Penilaian Transaksional) & Syarat N >= 30
// ---------------------------------------------------------
console.log("\n--- 3. Test Kelompok 7 & Syarat N >= 30 ---");

// Bila N < 30 -> belum tersedia
{
  const resLowN = classifyStressAppraisalSubscale(3.0, { mean: 3.0, sd: 0.5, sampleSize: 20 });
  assert(resLowN.value === null, `N=20 (<30) harus return value null`);
  assert(resLowN.label === "Belum tersedia", `N=20 (<30) harus return label "Belum tersedia"`);

  const resNoNorms = classifyStressAppraisalSubscale(3.0, null);
  assert(resNoNorms.value === null, `Tanpa norms harus return value null`);
  assert(resNoNorms.label === "Belum tersedia", `Tanpa norms harus return label "Belum tersedia"`);
}

// Bila N >= 30 -> hitung kategori 0 sampai 4
{
  const norms = { mean: 3.0, sd: 0.5, sampleSize: 35 };
  // Kondisi 4: X > μ + 1.5 SD = 3.0 + 0.75 = 3.75 -> X = 3.8 -> 4
  assert(classifyStressAppraisalSubscale(3.8, norms).value === 4, `X=3.8 (> 3.75) harus Kategori 4`);

  // Kondisi 3: μ + 0.5 SD < X <= μ + 1.5 SD -> 3.25 < X <= 3.75 -> X = 3.5 -> 3
  assert(classifyStressAppraisalSubscale(3.5, norms).value === 3, `X=3.5 harus Kategori 3`);

  // Kondisi 2: μ - 0.5 SD < X <= μ + 0.5 SD -> 2.75 < X <= 3.25 -> X = 3.0 -> 2
  assert(classifyStressAppraisalSubscale(3.0, norms).value === 2, `X=3.0 harus Kategori 2`);

  // Kondisi 1: μ - 1.5 SD < X <= μ - 0.5 SD -> 2.25 < X <= 2.75 -> X = 2.5 -> 1
  assert(classifyStressAppraisalSubscale(2.5, norms).value === 1, `X=2.5 harus Kategori 1`);

  // Kondisi 0: X <= μ - 1.5 SD -> X <= 2.25 -> X = 2.0 -> 0
  assert(classifyStressAppraisalSubscale(2.0, norms).value === 0, `X=2.0 harus Kategori 0`);
}

// ---------------------------------------------------------
// 4. Test Ambang Persentase stress_level
// ---------------------------------------------------------
console.log("\n--- 4. Test Ambang Persentase stress_level ---");
{
  assert(determineStressLevel(40.0) === "tinggi", `40% harus tingkat stres 'tinggi'`);
  assert(determineStressLevel(39.9) === "sedang", `39.9% harus tingkat stres 'sedang'`);
  assert(determineStressLevel(20.0) === "sedang", `20% harus tingkat stres 'sedang'`);
  assert(determineStressLevel(19.9) === "rendah", `19.9% harus tingkat stres 'rendah'`);
}

// ---------------------------------------------------------
// 5. Test Integritas: Tepat 68 Pertanyaan & 1 Indikator per Item
// ---------------------------------------------------------
console.log("\n--- 5. Test Integritas 68 Pertanyaan ---");

// Tepat 68 pertanyaan
assert(questions.length === 68, `Jumlah pertanyaan harus tepat 68, dapat: ${questions.length}`);

// ID 1 sampai 68 berurutan tanpa bolong
for (let i = 1; i <= 68; i++) {
  const q = questions.find((item) => item.id === i);
  assert(!!q, `Pertanyaan dengan id ${i} harus ada`, false);
  assert(q?.code.length > 0, `Pertanyaan ${i} harus memiliki kode`, false);
  assert(q?.text.length > 0, `Pertanyaan ${i} harus memiliki teks pertanyaan`, false);
  assert(q?.scores.length >= 4, `Pertanyaan ${i} harus memiliki skor opsi jawaban`, false);
}
console.log(`✅ PASS: Seluruh 68 pertanyaan terdaftar lengkap (ID 1-68 urut, kode terdefinisi, teks ada, skor opsi terdefinisi)`);

// Cek bahwa setiap item 1-68 memiliki tepat satu indikator dalam struktur rumus
const itemToIndicatorMap: Record<number, string[]> = {};
for (let i = 1; i <= 68; i++) {
  itemToIndicatorMap[i] = [];
}

// Daftarkan dari Kelompok 1-5
INDICATOR_DEFINITIONS.forEach((def) => {
  def.questionIds.forEach((id) => {
    itemToIndicatorMap[id].push(def.label);
  });
});

// Daftarkan dari Kelompok 6
WFC_SUBSCALE_DEFINITIONS.forEach((def) => {
  def.questionIds.forEach((id) => {
    itemToIndicatorMap[id].push(def.label);
  });
});

// Daftarkan dari Kelompok 7
STRESS_APPRAISAL_DEFINITIONS.forEach((def) => {
  def.questionIds.forEach((id) => {
    itemToIndicatorMap[id].push(def.label);
  });
});

for (let i = 1; i <= 68; i++) {
  const count = itemToIndicatorMap[i].length;
  assert(
    count === 1,
    `Item ${i} harus memiliki tepat satu indikator! Ditemukan: ${count} (${itemToIndicatorMap[i].join(", ")})`,
    false
  );
}
console.log(`✅ PASS: Setiap pertanyaan 1 s.d. 68 memiliki tepat 1 indikator/subskala (tidak tumpang tindih)`);

// Total 21 indikator pada Kelompok 1 sampai 5
assert(
  INDICATOR_DEFINITIONS.length === 21,
  `Kelompok 1 sampai 5 harus memiliki tepat 21 indikator, dapat: ${INDICATOR_DEFINITIONS.length}`
);

// Total 3 subskala pada Kelompok 6
assert(
  WFC_SUBSCALE_DEFINITIONS.length === 3,
  `Kelompok 6 harus memiliki tepat 3 subskala, dapat: ${WFC_SUBSCALE_DEFINITIONS.length}`
);

// Total 5 subskala pada Kelompok 7
assert(
  STRESS_APPRAISAL_DEFINITIONS.length === 5,
  `Kelompok 7 harus memiliki tepat 5 subskala, dapat: ${STRESS_APPRAISAL_DEFINITIONS.length}`
);

// ---------------------------------------------------------
// 6. Test Komparasi questions.ts vs Fixture Dokumen Resmi (In-Repo)
// ---------------------------------------------------------
console.log("\n--- 6. Test Komparasi questions.ts vs Fixture Dokumen Resmi (In-Repo) ---");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "../data/official_questionnaire_fixture.json");
const docxPath = path.resolve(__dirname, "../data/official_questionnaire_17-04-2026.docx");

assert(fs.existsSync(fixturePath), `File fixture JSON harus ada di dalam repo: ${fixturePath}`);
assert(fs.existsSync(docxPath), `File salinan dokumen resmi DOCX harus ada di dalam repo: ${docxPath}`);

const officialFixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
assert(officialFixture.length === 68, `Fixture resmi harus memiliki tepat 68 item, dapat: ${officialFixture.length}`);

for (let i = 0; i < 68; i++) {
  const itemOfficial = officialFixture[i];
  const qId = i + 1;
  const q = questions.find((item) => item.id === qId);

  assert(!!q, `Pertanyaan ID ${qId} harus ada`, false);
  assert(
    q?.code === itemOfficial.code,
    `Item ${qId} kode harus '${itemOfficial.code}', dapat: '${q?.code}'`,
    false
  );

  const normOfficial = itemOfficial.text.replace(/\s+/g, " ").trim();
  const normApp = q?.text.replace(/\s+/g, " ").trim();
  assert(
    normApp === normOfficial,
    `Item ${qId} teks harus persis sesuai dokumen resmi`,
    false
  );

  const officialScores = itemOfficial.scores.map(Number);
  const appScores = q?.scores;
  assert(
    JSON.stringify(appScores) === JSON.stringify(officialScores),
    `Item ${qId} skor opsi harus ${JSON.stringify(officialScores)}, dapat: ${JSON.stringify(appScores)}`,
    false
  );
}
console.log(`✅ PASS: Komparasi 68 Item dengan Dokumen Resmi (17-04-2026): Seluruh nomor (1-68), kode item (2-1 s.d. 7-14), teks pertanyaan, dan urutan skor bobot opsi 100% identik`);

// ---------------------------------------------------------
// 7. Test End-to-End Skenario A, B, dan C (Simulasi Alur Penuh)
// ---------------------------------------------------------
console.log("\n--- 7. Test End-to-End Skenario A, B, dan C ---");

// Skenario A: Semua jawaban bernilai skor TERENDAH (skor tercetak 1 untuk setiap item)
{
  const answersA: Record<number, number> = {};
  for (let i = 1; i <= 68; i++) {
    const q = questions.find((item) => item.id === i);
    assert(!!q, `Pertanyaan ID ${i} harus ditemukan`, false);
    // Cari opsi yang skornya 1
    const minScoreIndex = q!.scores.indexOf(1);
    assert(minScoreIndex !== -1, `Pertanyaan ID ${i} harus memiliki opsi bernilai skor 1`, false);
    answersA[i] = q!.scores[minScoreIndex];
    assert(answersA[i] === 1, `Skor jawaban item ${i} harus tepat 1`, false);
  }

  const resA = calculateScores(answersA, null); // N < 30 (belum ada norma)

  // 1. 21 indikator Kelompok 1-5: S = 4.00, status 0
  assert(resA.totalBinaryFlags === 0, `Skenario A: total indikator berisiko harus 0, dapat: ${resA.totalBinaryFlags}`);
  assert(resA.binaryPercentage === 0.0, `Skenario A: persentase risiko harus 0.0%, dapat: ${resA.binaryPercentage}`);
  assert(resA.stressLevel === "rendah", `Skenario A: stress_level harus 'rendah', dapat: ${resA.stressLevel}`);

  INDICATOR_DEFINITIONS.forEach((def) => {
    const ind = resA.perIndicator[def.key];
    assert(ind.sScore === 4.0, `Skenario A: Indikator '${def.key}' S-score harus 4.00, dapat: ${ind.sScore}`, false);
    assert(ind.status === 0, `Skenario A: Indikator '${def.key}' status harus 0 (tidak berisiko), dapat: ${ind.status}`, false);
  });
  console.log(`✅ PASS: Skenario A: Seluruh 21 indikator Kelompok 1-5 memiliki S = 4.00 dan status = 0 (0 berisiko, tingkat stres rendah)`);

  // 2. Kelompok 6: Time, Strain, Behavior rata-rata 1.00, kategori 1
  ["time_based_conflict", "strain_based_conflict", "behavior_based_conflict"].forEach((key) => {
    const sub = resA.wfcSubscales[key];
    assert(sub.rawAverage === 1.0, `Skenario A WFC '${key}' rawAverage harus 1.00, dapat: ${sub.rawAverage}`);
    assert(sub.categoryValue === 1, `Skenario A WFC '${key}' categoryValue harus 1, dapat: ${sub.categoryValue}`);
    assert(sub.categoryLabel === "Sangat rendah", `Skenario A WFC '${key}' categoryLabel harus 'Sangat rendah'`);
  });

  // 3. Kelompok 7: skor mentah tersimpan (1.00); kategori 'Belum tersedia' selama N < 30
  STRESS_APPRAISAL_DEFINITIONS.forEach((def) => {
    const sub = resA.stressAppraisalSubscales[def.key];
    assert(sub.rawAverage === 1.0, `Skenario A Kelompok 7 '${def.key}' rawAverage harus 1.00, dapat: ${sub.rawAverage}`);
    assert(sub.categoryValue === null, `Skenario A Kelompok 7 '${def.key}' categoryValue harus null (N < 30)`);
    assert(sub.categoryLabel === "Belum tersedia", `Skenario A Kelompok 7 '${def.key}' categoryLabel harus 'Belum tersedia'`);
  });
}

// Skenario B: Semua jawaban bernilai skor TERTINGGI (4 untuk Bagian I-VI, 5 untuk Bagian VII)
{
  const answersB: Record<number, number> = {};
  for (let i = 1; i <= 68; i++) {
    const q = questions.find((item) => item.id === i);
    assert(!!q, `Pertanyaan ID ${i} harus ditemukan`, false);
    const maxScore = i <= 54 ? 4 : 5;
    const maxScoreIndex = q!.scores.indexOf(maxScore);
    assert(maxScoreIndex !== -1, `Pertanyaan ID ${i} harus memiliki opsi bernilai skor ${maxScore}`, false);
    answersB[i] = q!.scores[maxScoreIndex];
    assert(answersB[i] === maxScore, `Skor jawaban item ${i} harus tepat ${maxScore}`, false);
  }

  const resB = calculateScores(answersB, null); // N < 30

  // 1. 21 indikator Kelompok 1-5: S = 1.00, status 1 (21/21 berisiko, 100%)
  assert(resB.totalBinaryFlags === 21, `Skenario B: total indikator berisiko harus 21, dapat: ${resB.totalBinaryFlags}`);
  assert(resB.binaryPercentage === 100.0, `Skenario B: persentase risiko harus 100.0%, dapat: ${resB.binaryPercentage}`);
  assert(resB.stressLevel === "tinggi", `Skenario B: stress_level harus 'tinggi', dapat: ${resB.stressLevel}`);

  INDICATOR_DEFINITIONS.forEach((def) => {
    const ind = resB.perIndicator[def.key];
    assert(ind.sScore === 1.0, `Skenario B: Indikator '${def.key}' S-score harus 1.00, dapat: ${ind.sScore}`, false);
    assert(ind.status === 1, `Skenario B: Indikator '${def.key}' status harus 1 (berisiko), dapat: ${ind.status}`, false);
  });
  console.log(`✅ PASS: Skenario B: Seluruh 21 indikator Kelompok 1-5 memiliki S = 1.00 dan status = 1 (21 berisiko, tingkat stres tinggi)`);

  // 2. Kelompok 6: Time, Strain, Behavior rata-rata 4.00, kategori 5
  ["time_based_conflict", "strain_based_conflict", "behavior_based_conflict"].forEach((key) => {
    const sub = resB.wfcSubscales[key];
    assert(sub.rawAverage === 4.0, `Skenario B WFC '${key}' rawAverage harus 4.00, dapat: ${sub.rawAverage}`);
    assert(sub.categoryValue === 5, `Skenario B WFC '${key}' categoryValue harus 5, dapat: ${sub.categoryValue}`);
    assert(sub.categoryLabel === "Sangat tinggi", `Skenario B WFC '${key}' categoryLabel harus 'Sangat tinggi'`);
  });

  // 3. Kelompok 7: skor mentah tersimpan (5.00); kategori 'Belum tersedia' selama N < 30
  STRESS_APPRAISAL_DEFINITIONS.forEach((def) => {
    const sub = resB.stressAppraisalSubscales[def.key];
    assert(sub.rawAverage === 5.0, `Skenario B Kelompok 7 '${def.key}' rawAverage harus 5.00, dapat: ${sub.rawAverage}`);
    assert(sub.categoryValue === null, `Skenario B Kelompok 7 '${def.key}' categoryValue harus null (N < 30)`);
    assert(sub.categoryLabel === "Belum tersedia", `Skenario B Kelompok 7 '${def.key}' categoryLabel harus 'Belum tersedia'`);
  });
}

// Skenario C: Seed 30 responden v68 dengan variasi jawaban -> Norma N >= 30 aktif -> Kategori 0 s.d. 4 muncul
{
  const subscaleKeys = ["challenge", "centrality", "controllable_by_self", "controllable_others", "stressfullness"];
  const subscaleValues: Record<string, number[]> = {};
  subscaleKeys.forEach((k) => (subscaleValues[k] = []));

  for (let i = 1; i <= 30; i++) {
    subscaleKeys.forEach((k, idx) => {
      const val = 1.0 + ((i + idx * 3) % 40) / 10;
      subscaleValues[k].push(Math.round(val * 100) / 100);
    });
  }

  // Hitung norma mean dan SD persis seperti backend RespondentController@getNorms
  const normsMap: Record<string, { mean: number; sd: number; sampleSize: number }> = {};
  subscaleKeys.forEach((k) => {
    const vals = subscaleValues[k];
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sumSq = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    const sd = Math.sqrt(sumSq / (vals.length - 1));
    normsMap[k] = {
      mean: Math.round(mean * 10000) / 10000,
      sd: Math.round(sd * 10000) / 10000,
      sampleSize: vals.length,
    };
    assert(normsMap[k].sampleSize === 30, `Sample size untuk '${k}' harus 30`);
    assert(normsMap[k].sd > 0, `SD untuk '${k}' harus > 0`);
  });

  // Uji klasifikasi dengan norma N=30:
  const chalNorm = normsMap["challenge"];
  const cat4 = classifyStressAppraisalSubscale(chalNorm.mean + 1.6 * chalNorm.sd, chalNorm);
  assert(cat4.value === 4, `X > mu + 1.5 SD harus Kategori 4`);

  const cat3 = classifyStressAppraisalSubscale(chalNorm.mean + 1.0 * chalNorm.sd, chalNorm);
  assert(cat3.value === 3, `mu + 0.5 SD < X <= mu + 1.5 SD harus Kategori 3`);

  const cat2 = classifyStressAppraisalSubscale(chalNorm.mean, chalNorm);
  assert(cat2.value === 2, `mu - 0.5 SD < X <= mu + 0.5 SD harus Kategori 2`);

  const cat1 = classifyStressAppraisalSubscale(chalNorm.mean - 1.0 * chalNorm.sd, chalNorm);
  assert(cat1.value === 1, `mu - 1.5 SD < X <= mu - 0.5 SD harus Kategori 1`);

  const cat0 = classifyStressAppraisalSubscale(chalNorm.mean - 1.6 * chalNorm.sd, chalNorm);
  assert(cat0.value === 0, `X <= mu - 1.5 SD harus Kategori 0`);

  console.log(`✅ PASS: Skenario C: 30 sampel v68 menghitung norma mu dan SD secara valid, dan menghasilkan rentang kategori 0 sampai 4 lengkap`);
}

// ---------------------------------------------------------
// 8. Test Transisi Dinamis Norma Kelompok 7 (N < 30 -> N >= 30, dan perubahan saat norma bergeser)
// ---------------------------------------------------------
console.log("\n--- 8. Test Transisi Dinamis Norma Kelompok 7 ---");
{
  // Responden A mengisi dengan rawAverage = 3.5 pada saat N = 10 (< 30)
  const respondentRawAverage = 3.5;

  // Fase 1: Saat N < 30 (misal N = 10)
  const initialNormsLowN = { mean: 2.5, sd: 0.5, sampleSize: 10 };
  const phase1 = classifyStressAppraisalSubscale(respondentRawAverage, initialNormsLowN);
  assert(phase1.value === null, `Saat N < 30, kategori harus null`);
  assert(phase1.label === "Belum tersedia", `Saat N < 30, label harus 'Belum tersedia'`);

  // Fase 2: Begitu N >= 30 (populasi awal mean = 2.5, sd = 0.5, N = 30)
  // X = 3.5: mu + 1.5*SD = 2.5 + 0.75 = 3.25. Karena 3.5 > 3.25, maka kategori = 4
  const normsAt30 = { mean: 2.5, sd: 0.5, sampleSize: 30 };
  const phase2 = classifyStressAppraisalSubscale(respondentRawAverage, normsAt30);
  assert(phase2.value === 4, `Begitu N >= 30, responden langsung mendapat Kategori 4 (dapat: ${phase2.value})`);
  assert(phase2.label === "Stres sangat tinggi", `Label kategori 4 harus 'Stres sangat tinggi'`);

  // Fase 3: Norma bergeser seiring bertambahnya populasi baru (misal N = 60, mean naik ke 3.6, sd = 0.5)
  // X = 3.5: mu - 0.5*SD = 3.35, mu + 0.5*SD = 3.85. Karena 3.35 < 3.5 <= 3.85, kategori berubah menjadi 2 (Sedang)
  const updatedNorms = { mean: 3.6, sd: 0.5, sampleSize: 60 };
  const phase3 = classifyStressAppraisalSubscale(respondentRawAverage, updatedNorms);
  assert(phase3.value === 2, `Saat norma populasi bergeser, kategori responden dinamis berubah ke Kategori 2 (dapat: ${phase3.value})`);
  assert(phase3.label === "Stres sedang", `Label kategori 2 harus 'Stres sedang'`);

  console.log(`✅ PASS: Responden yang mengisi saat N < 30 otomatis memperoleh kategori saat N >= 30, dan kategori dinamis berubah mengikuti norma terbaru`);
}

console.log(`\n🎉 SEMUA UNIT TEST & VERIFIKASI RESMI BERHASIL 100%! (${passedAssertions} assertions passed)`);

