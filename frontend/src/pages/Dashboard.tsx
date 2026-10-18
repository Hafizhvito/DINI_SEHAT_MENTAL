// src/pages/Dashboard.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Eye,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Layers,
  Trash2,
  AlertCircle,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../config/api.ts";
import {
  TOTAL_BINARY_INDICATORS,
  MIN_SAMPLE_SIZE_FOR_NORMS,
  INDICATOR_DEFINITIONS,
  classifyStressAppraisalSubscale,
} from "../utils/Scoring.ts";

interface Respondent {
  id: number;
  name: string;
  age: number;
  status: string;
  education?: string | null;
  marital_status?: string | null;
  work_period?: string | null;
  smoking?: string | null;
}

interface Result {
  id: number;
  version?: string;
  respondent: Respondent;
  score_total: number;
  problematic_category: number;
  stress_level: "rendah" | "sedang" | "tinggi";
  wfc_index?: number | null;
  stress_index?: number | null;
  score_category?: any;
  score_details?: any;
  answers?: any;
  score_I?: number | null;
  score_II?: number | null;
  score_III?: number | null;
  score_IV?: number | null;
  score_V?: number | null;
  score_VI?: number | null;
  score_VII?: number | null;
  score_VIII?: number | null;
  score_IX?: number | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [versionFilter, setVersionFilter] = useState<"v68" | "legacy" | "all">("v68");
  const [levelFilter, setLevelFilter] = useState("Semua Level");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [normsInfo, setNormsInfo] = useState<{
    sampleSize: number;
    isAvailable: boolean;
    norms?: Record<string, any>;
  } | null>(null);

  // Seleksi & Penghapusan Riwayat
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [legacyDeleteAcknowledged, setLegacyDeleteAcknowledged] = useState(false);
  const [doubleConfirmStep, setDoubleConfirmStep] = useState<1 | 2>(1);

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const fetchResults = async () => {
    const token = localStorage.getItem("doctor_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [resResults, resNorms] = await Promise.all([
        axios.get(`${API_BASE_URL}/results?version=${versionFilter}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
        axios.get(`${API_BASE_URL}/norms`).catch(() => null),
      ]);

      setResults(resResults.data);
      if (resNorms?.data) {
        setNormsInfo({
          sampleSize: resNorms.data.sampleSize,
          isAvailable: resNorms.data.isAvailable,
          norms: resNorms.data.norms || undefined,
        });
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("doctor_token");
        navigate("/");
      } else {
        setError("Gagal memuat data dashboard. Silakan refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
    fetchResults();
  }, [navigate, versionFilter]);

  const filteredResults = results.filter((res) => {
    const levelText =
      res.stress_level === "tinggi"
        ? "Stress Tinggi"
        : res.stress_level === "sedang"
        ? "Stress Sedang"
        : "Stress Rendah";
    if (levelFilter !== "Semua Level" && levelText !== levelFilter) return false;
    if (
      searchTerm &&
      !res.respondent.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !res.respondent.status.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sinkronisasi status checkbox "Select All"
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const isAll =
        filteredResults.length > 0 &&
        filteredResults.every((r) => selectedIds.includes(r.id));
      const isSome =
        selectedIds.length > 0 &&
        !isAll &&
        filteredResults.some((r) => selectedIds.includes(r.id));

      selectAllCheckboxRef.current.checked = isAll;
      selectAllCheckboxRef.current.indeterminate = isSome;
    }
  }, [selectedIds, filteredResults]);

  const totalResponden = results.length;
  const rataRataFlags =
    results.length > 0
      ? (
          results.reduce((a, b) => a + (b.score_total || 0), 0) / results.length
        ).toFixed(1)
      : "0";

  const baru7Hari = results.filter((r) => {
    const diff =
      (new Date().getTime() - new Date(r.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const stressTinggi = results.filter((r) => r.stress_level === "tinggi").length;
  const stressSedang = results.filter((r) => r.stress_level === "sedang").length;
  const stressRendah = results.filter((r) => r.stress_level === "rendah").length;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("doctor_token");
      if (token) {
        await axios.post(
          `${API_BASE_URL}/doctor/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  // -------------------------------------------------------------
  // FITUR SELEKSI & PENGHAPUSAN (PENGAMAN DATA LEGACY)
  // -------------------------------------------------------------
  const selectedResults = results.filter((r) => selectedIds.includes(r.id));
  const selectedLegacyCount = selectedResults.filter(
    (r) => r.version !== "v68"
  ).length;

  const targetLegacyCount = results.filter(
    (r) => deleteTargetIds.includes(r.id) && r.version !== "v68"
  ).length;

  // Helper untuk mengekstrak 3 subskala WFC & 5 subskala Appraisal
  const getRecordSubscales = (r: Result) => {
    const wfc = r.score_details?.wfcSubscales || {};
    const appraisal = r.score_details?.stressAppraisalSubscales || {};
    const isV68 = r.version === "v68";

    const timeVal = wfc.time_based_conflict?.categoryValue ?? null;
    const strainVal = wfc.strain_based_conflict?.categoryValue ?? null;
    const behavVal = wfc.behavior_based_conflict?.categoryValue ?? null;

    // Untuk SEMUA responden v68: hitung kategori selalu dari skor mentah (rawAverage) dengan norma populasi terbaru,
    // abaikan kategori yang tersimpan di database.
    const getAppraisalClassification = (key: string) => {
      if (!isV68) return { value: null, label: "-" };
      const rawAvg = appraisal[key]?.rawAverage;
      if (rawAvg === undefined || rawAvg === null) {
        return { value: null, label: "-" };
      }
      const norm = normsInfo?.norms ? normsInfo.norms[key] : null;
      return classifyStressAppraisalSubscale(Number(rawAvg), norm);
    };

    const chalClass = getAppraisalClassification("challenge");
    const centClass = getAppraisalClassification("centrality");
    const selfClass = getAppraisalClassification("controllable_by_self");
    const othersClass = getAppraisalClassification("controllable_others");
    const stressClass = getAppraisalClassification("stressfullness");

    return {
      wfcTime: timeVal !== null ? `Kat. ${timeVal}` : "-",
      wfcStrain: strainVal !== null ? `Kat. ${strainVal}` : "-",
      wfcBehav: behavVal !== null ? `Kat. ${behavVal}` : "-",
      wfcTimeNum: timeVal,
      wfcStrainNum: strainVal,
      wfcBehavNum: behavVal,
      appChallenge:
        chalClass.value !== null
          ? `Kat. ${chalClass.value}`
          : isV68
          ? "Belum tersedia"
          : "-",
      appCentrality:
        centClass.value !== null
          ? `Kat. ${centClass.value}`
          : isV68
          ? "Belum tersedia"
          : "-",
      appSelf:
        selfClass.value !== null
          ? `Kat. ${selfClass.value}`
          : isV68
          ? "Belum tersedia"
          : "-",
      appOthers:
        othersClass.value !== null
          ? `Kat. ${othersClass.value}`
          : isV68
          ? "Belum tersedia"
          : "-",
      appStress:
        stressClass.value !== null
          ? `Kat. ${stressClass.value}`
          : isV68
          ? "Belum tersedia"
          : "-",
      appChallengeNum: chalClass.value,
      appCentralityNum: centClass.value,
      appSelfNum: selfClass.value,
      appOthersNum: othersClass.value,
      appStressNum: stressClass.value,
      appChallengeLabel: chalClass.label,
      appCentralityLabel: centClass.label,
      appSelfLabel: selfClass.label,
      appOthersLabel: othersClass.label,
      appStressLabel: stressClass.label,
    };
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    // Default hanya mencentang v68 jika ada data v68 pada filter saat ini
    const v68FilteredIds = filteredResults
      .filter((r) => r.version === "v68")
      .map((r) => r.id);
    const allFilteredIds = filteredResults.map((r) => r.id);

    if (v68FilteredIds.length > 0) {
      const isAllV68Selected = v68FilteredIds.every((id) =>
        selectedIds.includes(id)
      );

      if (isAllV68Selected) {
        // Batalkan pilihan data v68
        setSelectedIds((prev) =>
          prev.filter((id) => !v68FilteredIds.includes(id))
        );
      } else {
        // Centang data v68 saja (data legacy tidak ikut tercentang secara default)
        setSelectedIds((prev) =>
          Array.from(new Set([...prev, ...v68FilteredIds]))
        );
      }
    } else {
      // Jika memang sedang memfilter data legacy saja
      const isAllSelected = allFilteredIds.every((id) =>
        selectedIds.includes(id)
      );
      if (isAllSelected) {
        setSelectedIds((prev) =>
          prev.filter((id) => !allFilteredIds.includes(id))
        );
      } else {
        setSelectedIds((prev) =>
          Array.from(new Set([...prev, ...allFilteredIds]))
        );
      }
    }
  };

  const openDeleteModal = (ids: number[]) => {
    setDeleteTargetIds(ids);
    setLegacyDeleteAcknowledged(false);
    setDoubleConfirmStep(1);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetIds.length === 0) return;
    setIsDeleting(true);
    const token = localStorage.getItem("doctor_token");

    try {
      if (deleteTargetIds.length === 1) {
        await axios.delete(`${API_BASE_URL}/results/${deleteTargetIds[0]}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/results/bulk-delete`,
          { ids: deleteTargetIds },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
      }

      const deletedCount = deleteTargetIds.length;
      setSelectedIds((prev) => prev.filter((id) => !deleteTargetIds.includes(id)));
      setShowDeleteModal(false);
      setDeleteTargetIds([]);

      setActionFeedback(`${deletedCount} data riwayat skrining berhasil dihapus.`);
      setTimeout(() => setActionFeedback(null), 4000);

      await fetchResults();
    } catch (err: any) {
      console.error("Gagal menghapus riwayat:", err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // EKSPOR PDF POLISHED & TIDAK FLAT (Landscape A4, Header Box, Badges)
  // -------------------------------------------------------------
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Banner Elegan
    doc.setFillColor(30, 58, 138); // Deep Navy (#1E3A8A)
    doc.rect(0, 0, pageWidth, 25, "F");

    // Aksen Garis
    doc.setFillColor(14, 165, 233); // Cyan Sky (#0EA5E9)
    doc.rect(0, 25, pageWidth, 1.5, "F");

    // Teks Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("DINI SEHAT MENTAL", 14, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(224, 231, 255);
    doc.text("Laporan Rekapitulasi Skrining Stres Kerja Pekerja Perempuan", 14, 18);

    const printDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.setFontSize(8);
    doc.setTextColor(224, 231, 255);
    doc.text(`Dicetak: ${printDate}`, pageWidth - 14, 15, { align: "right" });

    // 2. Kotak Ringkasan Statistik
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 31, pageWidth - 28, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `DATASET: ${versionFilter.toUpperCase()} (${filteredResults.length} RESPONDEN DITAMPILKAN)`,
      20,
      38
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.setTextColor(22, 101, 52); // Hijau
    doc.text(
      `● Stres Rendah: ${stressRendah} (${totalResponden > 0 ? Math.round((stressRendah / totalResponden) * 100) : 0}%)`,
      20,
      44
    );

    doc.setTextColor(180, 83, 9); // Amber
    doc.text(
      `● Stres Sedang: ${stressSedang} (${totalResponden > 0 ? Math.round((stressSedang / totalResponden) * 100) : 0}%)`,
      85,
      44
    );

    doc.setTextColor(185, 28, 28); // Merah
    doc.text(
      `● Stres Tinggi: ${stressTinggi} (${totalResponden > 0 ? Math.round((stressTinggi / totalResponden) * 100) : 0}%)`,
      150,
      44
    );

    doc.setTextColor(51, 65, 85);
    doc.text(`● Rerata Faktor Risiko: ${rataRataFlags} / 21`, 215, 44);

    // 3. Tabel Data Responden (Landscape dengan 3 Subskala WFC & 5 Subskala Appraisal)
    const tableData = filteredResults.map((r, idx) => {
      const subs = getRecordSubscales(r);
      const riskMax = r.version === "v68" ? TOTAL_BINARY_INDICATORS : "63";

      return [
        idx + 1,
        new Date(r.created_at).toLocaleDateString("id-ID"),
        r.respondent.name,
        r.respondent.age,
        r.respondent.status || "-",
        `${r.score_total}/${riskMax}`,
        r.stress_level.toUpperCase(),
        subs.wfcTime,
        subs.wfcStrain,
        subs.wfcBehav,
        subs.appChallengeNum !== null ? `Kat. ${subs.appChallengeNum}` : "N/A (<30)",
        subs.appCentralityNum !== null ? `Kat. ${subs.appCentralityNum}` : "N/A (<30)",
        subs.appSelfNum !== null ? `Kat. ${subs.appSelfNum}` : "N/A (<30)",
        subs.appOthersNum !== null ? `Kat. ${subs.appOthersNum}` : "N/A (<30)",
        subs.appStressNum !== null ? `Kat. ${subs.appStressNum}` : "N/A (<30)",
      ];
    });

    autoTable(doc, {
      startY: 53,
      head: [
        [
          "No",
          "Tanggal",
          "Nama Responden",
          "Usia",
          "Posisi / Pekerjaan",
          "Risiko",
          "Stres",
          "WFC-Time",
          "WFC-Strain",
          "WFC-Behav",
          "App Chal",
          "App Cent",
          "App Self",
          "App Oth",
          "App Str",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 6.8,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 1.5,
        overflow: "visible",
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [30, 41, 59],
        cellPadding: 1.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 7 },
        1: { halign: "center", cellWidth: 16 },
        // Kolom 2 (Nama Responden) fleksibel (~44 mm)
        3: { halign: "center", cellWidth: 9 },
        // Kolom 4 (Posisi / Pekerjaan) fleksibel (~47 mm)
        5: { halign: "center", cellWidth: 13 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "center", cellWidth: 17 },
        8: { halign: "center", cellWidth: 17 },
        9: { halign: "center", cellWidth: 17 },
        10: { halign: "center", cellWidth: 15 },
        11: { halign: "center", cellWidth: 15 },
        12: { halign: "center", cellWidth: 15 },
        13: { halign: "center", cellWidth: 15 },
        14: { halign: "center", cellWidth: 15 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const val = String(data.cell.raw).toLowerCase();
          if (val.includes("tinggi")) {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          } else if (val.includes("sedang")) {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = "bold";
          } else if (val.includes("rendah")) {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawPage: () => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = (doc.internal as any).getCurrentPageInfo().pageNumber;

        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const normFootnote = normsInfo?.isAvailable
          ? `Norma dihitung dari ${normsInfo.sampleSize} responden v68.`
          : `Norma belum tersedia (saat ini N = ${normsInfo?.sampleSize || 0} < 30).`;
        doc.text(
          `* WFC (Kel 6): Kategori 1 - 5. Appraisal (Kel 7): Kategori 0 - 4 (${normFootnote}) Untuk data v68, wfc_index & stress_index tidak dihitung. Hasil skrining bukan diagnosis medis.`,
          10,
          pageHeight - 6
        );
        doc.text(
          `Halaman ${currentPage} dari ${pageCount}`,
          pageWidth - 10,
          pageHeight - 6,
          { align: "right" }
        );
      },
      margin: { left: 10, right: 10, bottom: 12 },
    });

    doc.save(
      `laporan-skrining-dini-${versionFilter}-${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  // -------------------------------------------------------------
  // EKSPOR EXCEL (.XLSX) MULTI-SHEET & TERSTRUKTUR RAPI (SEMUA VERSI)
  // -------------------------------------------------------------
  const getParsedAnswers = (raw: any): Record<string, any> => {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Ringkasan Responden
    const summaryHeaders = [
      "No",
      "Tanggal Skrining",
      "Nama Responden",
      "Usia",
      "Posisi / Pekerjaan",
      "Pendidikan Terakhir",
      "Status Pernikahan",
      "Masa Kerja",
      "Merokok",
      "Faktor Berisiko (Kel 1-5)",
      "Total Indikator",
      "Persentase Risiko (%)",
      "Tingkat Stres",
      "WFC - Time-based (Kat 1-5)",
      "WFC - Strain-based (Kat 1-5)",
      "WFC - Behavior-based (Kat 1-5)",
      "Appraisal - Challenge (Kat 0-4)",
      "Appraisal - Centrality (Kat 0-4)",
      "Appraisal - Controllable by Self (Kat 0-4)",
      "Appraisal - Controllable Others (Kat 0-4)",
      "Appraisal - Stressfullness (Kat 0-4)",
      "WFC Index (Legacy)",
      "Stress Index (Legacy)",
      "Versi Dataset",
    ];

    const summaryRows = filteredResults.map((r, idx) => {
      const isV68 = r.version === "v68";
      const totalIndikator = isV68 ? TOTAL_BINARY_INDICATORS : 63;
      const pct = ((r.score_total / totalIndikator) * 100).toFixed(1) + "%";

      const subs = getRecordSubscales(r);

      return [
        idx + 1,
        new Date(r.created_at).toLocaleDateString("id-ID"),
        r.respondent.name,
        r.respondent.age,
        r.respondent.status || "-",
        r.respondent.education || "-",
        r.respondent.marital_status || "-",
        r.respondent.work_period || "-",
        r.respondent.smoking || "-",
        r.score_total,
        totalIndikator,
        pct,
        r.stress_level.toUpperCase(),
        subs.wfcTimeNum !== null ? subs.wfcTimeNum : "-",
        subs.wfcStrainNum !== null ? subs.wfcStrainNum : "-",
        subs.wfcBehavNum !== null ? subs.wfcBehavNum : "-",
        subs.appChallengeNum !== null
          ? subs.appChallengeNum
          : isV68
          ? "Belum Tersedia (<30)"
          : "-",
        subs.appCentralityNum !== null
          ? subs.appCentralityNum
          : isV68
          ? "Belum Tersedia (<30)"
          : "-",
        subs.appSelfNum !== null
          ? subs.appSelfNum
          : isV68
          ? "Belum Tersedia (<30)"
          : "-",
        subs.appOthersNum !== null
          ? subs.appOthersNum
          : isV68
          ? "Belum Tersedia (<30)"
          : "-",
        subs.appStressNum !== null
          ? subs.appStressNum
          : isV68
          ? "Belum Tersedia (<30)"
          : "-",
        !isV68 && r.wfc_index !== undefined && r.wfc_index !== null
          ? r.wfc_index
          : "-",
        !isV68 && r.stress_index !== undefined && r.stress_index !== null
          ? r.stress_index
          : "-",
        r.version || "legacy",
      ];
    });

    const wsSummary = XLSX.utils.aoa_to_sheet([
      ["DINI SEHAT MENTAL - REKAPITULASI HASIL SKRINING STRES KERJA"],
      [
        `Filter Versi: ${versionFilter.toUpperCase()} | Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")} | Total: ${filteredResults.length} Responden | Norma dihitung dari ${normsInfo?.sampleSize || 0} responden v68`,
      ],
      [],
      summaryHeaders,
      ...summaryRows,
    ]);

    wsSummary["!cols"] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 28 },
      { wch: 8 },
      { wch: 26 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 10 },
      { wch: 24 },
      { wch: 14 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Responden");

    // 2. Sheet Matriks Jawaban (P1 s.d. Pn untuk SEMUA Versi)
    const hasLegacy = filteredResults.some((r) => r.version === "legacy");
    const maxQuestions = hasLegacy ? 89 : 68;

    const matrixHeaders = [
      "No",
      "Tanggal",
      "Nama Responden",
      "Usia",
      "Posisi / Pekerjaan",
      "Versi Kuesioner",
      "Skor Total Risiko",
      "Level Stres",
      ...Array.from({ length: maxQuestions }, (_, i) => `P${i + 1}`),
    ];

    const matrixRows = filteredResults.map((r, idx) => {
      const ans = getParsedAnswers(r.answers);
      const qScores = Array.from({ length: maxQuestions }, (_, i) => {
        const qNum = i + 1;
        return ans[qNum] ?? ans[`P${qNum}`] ?? ans[String(qNum)] ?? "-";
      });

      return [
        idx + 1,
        new Date(r.created_at).toLocaleDateString("id-ID"),
        r.respondent.name,
        r.respondent.age,
        r.respondent.status || "-",
        r.version || "legacy",
        r.score_total,
        r.stress_level.toUpperCase(),
        ...qScores,
      ];
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet([
      ["DINI SEHAT MENTAL - MATRIKS JAWABAN ITEM PERTANYAAN (RAW RESPONSES)"],
      [
        `Filter Versi: ${versionFilter.toUpperCase()} | Total: ${filteredResults.length} Responden | Menampilkan Item P1 s.d. P${maxQuestions}`,
      ],
      [],
      matrixHeaders,
      ...matrixRows,
    ]);

    wsMatrix["!cols"] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 26 },
      { wch: 8 },
      { wch: 24 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      ...Array.from({ length: maxQuestions }, () => ({ wch: 5 })),
    ];

    XLSX.utils.book_append_sheet(wb, wsMatrix, "Matriks Jawaban (P1-Pn)");

    // 3. Sheet Rincian Indikator (khusus v68 dengan score_details)
    const v68Results = filteredResults.filter(
      (r) => r.version === "v68" && r.score_details
    );
    if (v68Results.length > 0) {
      const detailHeaders = [
        "No",
        "Nama Responden",
        "Posisi / Pekerjaan",
        ...INDICATOR_DEFINITIONS.map((def) => `${def.label} (S-Score)`),
        ...INDICATOR_DEFINITIONS.map((def) => `${def.label} (Status 0/1)`),
        "WFC Time-based (Rata-rata X)",
        "WFC Time-based (Kategori 1-5)",
        "WFC Strain-based (Rata-rata X)",
        "WFC Strain-based (Kategori 1-5)",
        "WFC Behavior-based (Rata-rata X)",
        "WFC Behavior-based (Kategori 1-5)",
        "Appraisal Challenge (Rata-rata X)",
        "Appraisal Challenge (Kategori 0-4)",
        "Appraisal Centrality (Rata-rata X)",
        "Appraisal Centrality (Kategori 0-4)",
        "Appraisal Controllable by Self (Rata-rata X)",
        "Appraisal Controllable by Self (Kategori 0-4)",
        "Appraisal Controllable Others (Rata-rata X)",
        "Appraisal Controllable Others (Kategori 0-4)",
        "Appraisal Stressfullness (Rata-rata X)",
        "Appraisal Stressfullness (Kategori 0-4)",
      ];

      const detailRows = v68Results.map((r, idx) => {
        const perInd = r.score_details?.perIndicator || {};
        const sScores = INDICATOR_DEFINITIONS.map(
          (def) => perInd[def.key]?.sScore ?? "-"
        );
        const statuses = INDICATOR_DEFINITIONS.map(
          (def) => perInd[def.key]?.status ?? "-"
        );

        const wfc = r.score_details?.wfcSubscales || {};
        const appraisal = r.score_details?.stressAppraisalSubscales || {};
        const subs = getRecordSubscales(r);

        return [
          idx + 1,
          r.respondent.name,
          r.respondent.status,
          ...sScores,
          ...statuses,
          wfc["time_based_conflict"]?.rawAverage ?? "-",
          wfc["time_based_conflict"]?.categoryValue ?? "-",
          wfc["strain_based_conflict"]?.rawAverage ?? "-",
          wfc["strain_based_conflict"]?.categoryValue ?? "-",
          wfc["behavior_based_conflict"]?.rawAverage ?? "-",
          wfc["behavior_based_conflict"]?.categoryValue ?? "-",
          appraisal["challenge"]?.rawAverage ?? "-",
          subs.appChallengeNum !== null ? subs.appChallengeNum : "Belum Tersedia (<30)",
          appraisal["centrality"]?.rawAverage ?? "-",
          subs.appCentralityNum !== null ? subs.appCentralityNum : "Belum Tersedia (<30)",
          appraisal["controllable_by_self"]?.rawAverage ?? "-",
          subs.appSelfNum !== null ? subs.appSelfNum : "Belum Tersedia (<30)",
          appraisal["controllable_others"]?.rawAverage ?? "-",
          subs.appOthersNum !== null ? subs.appOthersNum : "Belum Tersedia (<30)",
          appraisal["stressfullness"]?.rawAverage ?? "-",
          subs.appStressNum !== null ? subs.appStressNum : "Belum Tersedia (<30)",
        ];
      });

      const wsDetails = XLSX.utils.aoa_to_sheet([
        ["RINCIAN SKOR SUB-SKALA & INDIKATOR KUESIONER RESMI (v68)"],
        [
          `Kelompok 1-5 (Formula S = (5n - ΣX)/n), Kelompok 6 (3 Subskala WFC), Kelompok 7 (5 Subskala Stress Appraisal) | Norma dihitung dari ${normsInfo?.sampleSize || 0} responden v68`,
        ],
        [],
        detailHeaders,
        ...detailRows,
      ]);

      XLSX.utils.book_append_sheet(wb, wsDetails, "Rincian Indikator (v68)");
    }

    // 4. Sheet Rincian Kategori (Legacy - jika ada data legacy)
    const legacyResults = filteredResults.filter((r) => r.version === "legacy");
    if (legacyResults.length > 0) {
      const legacyHeaders = [
        "No",
        "Tanggal",
        "Nama Responden",
        "Usia",
        "Posisi / Pekerjaan",
        "Skor I (Karakteristik Pekerjaan)",
        "Skor II (Respon Terhadap Stres)",
        "Skor III (Beban Kerja)",
        "Skor IV (Kepemimpinan)",
        "Skor V (Dukungan Organisasi)",
        "Skor VI (Kepuasan Kerja)",
        "Skor VII (Work-Family Conflict)",
        "Skor VIII (Stress Appraisal)",
        "Skor IX (Lainnya)",
        "Kategori Bermasalah",
        "Total Skor",
        "Level Stres",
      ];

      const legacyRows = legacyResults.map((r, idx) => [
        idx + 1,
        new Date(r.created_at).toLocaleDateString("id-ID"),
        r.respondent.name,
        r.respondent.age,
        r.respondent.status || "-",
        r.score_I ?? "-",
        r.score_II ?? "-",
        r.score_III ?? "-",
        r.score_IV ?? "-",
        r.score_V ?? "-",
        r.score_VI ?? "-",
        r.score_VII ?? "-",
        r.score_VIII ?? "-",
        r.score_IX ?? "-",
        r.problematic_category ?? "-",
        r.score_total,
        r.stress_level.toUpperCase(),
      ]);

      const wsLegacy = XLSX.utils.aoa_to_sheet([
        ["ARSIP REKAPITULASI KATEGORI LAMA (LEGACY)"],
        [
          "Data responden arsip terdahulu sebelum penyesuaian kuesioner resmi 68 pertanyaan",
        ],
        [],
        legacyHeaders,
        ...legacyRows,
      ]);

      wsLegacy["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 26 },
        { wch: 8 },
        { wch: 22 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(wb, wsLegacy, "Rincian Kategori (Legacy)");
    }

    // 5. Sheet Statistik & Distribusi
    const wsStats = XLSX.utils.aoa_to_sheet([
      ["STATISTIK DISTRIBUSI KESEHATAN MENTAL KERJA"],
      [`Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["Metrik", "Nilai", "Keterangan"],
      ["Total Responden", totalResponden, "Jumlah responden pada dataset terpilih"],
      [
        "Stres Rendah (< 20%)",
        stressRendah,
        `${totalResponden > 0 ? ((stressRendah / totalResponden) * 100).toFixed(1) : 0}%`,
      ],
      [
        "Stres Sedang (20% - 39.9%)",
        stressSedang,
        `${totalResponden > 0 ? ((stressSedang / totalResponden) * 100).toFixed(1) : 0}%`,
      ],
      [
        "Stres Tinggi (>= 40%)",
        stressTinggi,
        `${totalResponden > 0 ? ((stressTinggi / totalResponden) * 100).toFixed(1) : 0}%`,
      ],
      [
        "Rata-rata Faktor Risiko",
        rataRataFlags,
        `Dari total ${versionFilter === "v68" ? TOTAL_BINARY_INDICATORS : 63} indikator`,
      ],
      [
        "Status Norma Kelompok 7",
        normsInfo?.isAvailable ? "Aktif" : "Belum Tersedia",
        `Sampel v68: ${normsInfo?.sampleSize || 0} / ${MIN_SAMPLE_SIZE_FOR_NORMS}`,
      ],
    ]);

    wsStats["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsStats, "Statistik & Ringkasan");

    XLSX.writeFile(
      wb,
      `rekapitulasi-skrining-dini-${versionFilter}-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Memuat data dashboard dokter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Dashboard Dokter
                </h1>
                <p className="text-xs text-slate-500">
                  Evaluasi Skrining Stres Kerja Pekerja Perempuan
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Feedback Alert Notifikasi */}
        {actionFeedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Error Alert Notifikasi */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchResults()}
              className="text-xs text-rose-700 underline font-semibold hover:text-rose-900 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Filter Versi Kuesioner Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">
                Dataset Kuesioner
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  {versionFilter === "v68"
                    ? "Versi Resmi 68 Pertanyaan (v68)"
                    : versionFilter === "legacy"
                    ? "Data Versi Lama (Legacy)"
                    : "Semua Versi"}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVersionFilter("v68")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                versionFilter === "v68"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              v68 (Resmi)
            </button>
            <button
              onClick={() => setVersionFilter("legacy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                versionFilter === "legacy"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Legacy
            </button>
            <button
              onClick={() => setVersionFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                versionFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Norms Status Banner (Untuk Kelompok 7) */}
        {versionFilter === "v68" && normsInfo && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-900">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                Status Norma Statistik Kelompok 7 (Penilaian Transaksional):
              </p>
              <p className="mt-0.5">
                Responden v68 terdaftar: <strong>{normsInfo.sampleSize}</strong> /{" "}
                {MIN_SAMPLE_SIZE_FOR_NORMS} responden.{" "}
                {normsInfo.isAvailable ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Syarat sampel terpenuhi (kategori 0–4 aktif).
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold">
                    Kategori kelompok 7 belum dihitung (membutuhkan minimal{" "}
                    {MIN_SAMPLE_SIZE_FOR_NORMS} responden v68). Skor mentah tetap
                    tersimpan.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Responden"
            value={totalResponden}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            bg="bg-blue-50"
            color="text-blue-700"
          />
          <StatCard
            title="Rata-rata Faktor Risiko"
            value={`${rataRataFlags} / 21`}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            bg="bg-emerald-50"
            color="text-emerald-700"
          />
          <StatCard
            title="Stres Tinggi"
            value={stressTinggi}
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            bg="bg-rose-50"
            color="text-rose-700"
          />
          <StatCard
            title="Stres Sedang"
            value={stressSedang}
            icon={<Eye className="w-5 h-5 text-amber-600" />}
            bg="bg-amber-50"
            color="text-amber-700"
          />
          <StatCard
            title="Responden Baru (7 Hari)"
            value={baru7Hari}
            icon={<Calendar className="w-5 h-5 text-purple-600" />}
            bg="bg-purple-50"
            color="text-purple-700"
          />
        </div>

        {/* Table Responden Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Tabel & Filter */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data Responden ({filteredResults.length})
              </h2>
              <p className="text-xs text-slate-500">
                Centang kotak untuk memilih dan menghapus riwayat, atau klik baris
                untuk melihat rincian Kelompok 1–5, 6, dan 7
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau posisi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-56"
                />
              </div>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option>Semua Level</option>
                <option>Stress Tinggi</option>
                <option>Stress Sedang</option>
                <option>Stress Rendah</option>
              </select>
            </div>
          </div>

          {/* Peringatan Khusus Bila Ada Data Legacy yang Terpilih */}
          {selectedLegacyCount > 0 && (
            <div className="bg-amber-50 border-b border-amber-300 px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Perhatian: Terpilih {selectedLegacyCount} Data Riwayat Versi Legacy!
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Data legacy diisi menggunakan instrumen kuesioner lama. Sangat dianjurkan untuk mengunduh cadangan Excel sebelum melakukan penghapusan agar arsip historis tetap aman.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Unduh Cadangan Excel (.xlsx)</span>
              </button>
            </div>
          )}

          {/* Bar Seleksi Masal (Muncul jika ada yang dipilih) */}
          {selectedIds.length > 0 && (
            <div className="bg-rose-50/90 border-b border-rose-200 px-6 py-3 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-900">
                  {selectedIds.length} data riwayat dipilih{" "}
                  {selectedLegacyCount > 0 && (
                    <span className="text-amber-700">
                      ({selectedResults.filter((r) => r.version === "v68").length} v68, {selectedLegacyCount} legacy)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-rose-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => openDeleteModal(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus {selectedIds.length} Terpilih
                </button>
              </div>
            </div>
          )}

          {/* Select All Bar Header */}
          <div className="bg-slate-50/80 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <label className="flex items-center gap-2.5 cursor-pointer font-medium select-none">
              <input
                ref={selectAllCheckboxRef}
                type="checkbox"
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>
                {filteredResults.some((r) => r.version === "v68")
                  ? `Pilih Semua v68 (${filteredResults.filter((r) => r.version === "v68").length} responden resmi)`
                  : `Pilih Semua (${filteredResults.length} responden)`}
              </span>
            </label>
            <div className="flex items-center gap-2">
              {filteredResults.some((r) => r.version !== "v68") &&
                filteredResults.some((r) => r.version === "v68") && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    * Default hanya mencentang v68 demi keamanan arsip legacy
                  </span>
                )}
              {selectedIds.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  {selectedIds.length} dari {filteredResults.length} terpilih
                </span>
              )}
            </div>
          </div>

          {/* List Data Responden */}
          <div className="divide-y divide-slate-100">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada data responden yang sesuai filter.
              </div>
            ) : (
              filteredResults.map((res) => {
                const isExpanded = expandedId === res.id;
                const isSelected = selectedIds.includes(res.id);
                const details = res.score_details;
                const wfc = details?.wfcSubscales || {};
                const appraisal = details?.stressAppraisalSubscales || {};
                const subs = getRecordSubscales(res);

                return (
                  <div
                    key={res.id}
                    className={`p-4 sm:p-5 transition-colors ${
                      isSelected
                        ? "bg-blue-50/40"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      {/* Checkbox Seleksi */}
                      <div className="pt-1 sm:pt-0 flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRow(res.id);
                          }}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Info Responden (Klik untuk expand detail) */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : res.id)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                            {res.respondent.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              res.stress_level === "tinggi"
                                ? "bg-rose-100 text-rose-700"
                                : res.stress_level === "sedang"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {res.stress_level}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {res.version || "legacy"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Usia: {res.respondent.age} th | Posisi:{" "}
                          {res.respondent.status || "-"}
                          {res.respondent.education
                            ? ` | Pendidikan: ${res.respondent.education}`
                            : ""}
                          {res.respondent.marital_status
                            ? ` | Status: ${res.respondent.marital_status}`
                            : ""}
                          {res.respondent.work_period
                            ? ` | Masa Kerja: ${res.respondent.work_period}`
                            : ""}
                          {res.respondent.smoking
                            ? ` | Merokok: ${res.respondent.smoking}`
                            : ""}
                          <span className="ml-2 text-slate-400">
                            • {new Date(res.created_at).toLocaleDateString("id-ID")}
                          </span>
                        </p>

                        {/* Ringkasan Subskala Kelompok 6 & 7 */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {res.version === "v68" ? (
                            <>
                              <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 rounded font-medium">
                                WFC: T:Kat.{subs.wfcTimeNum ?? "-"} • S:Kat.{subs.wfcStrainNum ?? "-"} • B:Kat.{subs.wfcBehavNum ?? "-"}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-medium">
                                {normsInfo?.isAvailable ? (
                                  `Appraisal: Ch:Kat.${subs.appChallengeNum ?? "-"} • Ce:Kat.${subs.appCentralityNum ?? "-"} • Se:Kat.${subs.appSelfNum ?? "-"} • Ot:Kat.${subs.appOthersNum ?? "-"} • St:Kat.${subs.appStressNum ?? "-"}`
                                ) : (
                                  "Appraisal: Belum Tersedia (N < 30)"
                                )}
                              </span>
                            </>
                          ) : (
                            <>
                              {res.wfc_index !== null && res.wfc_index !== undefined && (
                                <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 rounded">
                                  WFC (Legacy): Kat. {res.wfc_index}
                                </span>
                              )}
                              {res.stress_index !== null && res.stress_index !== undefined && (
                                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                                  Appraisal (Legacy): Kat. {res.stress_index}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Skor & Aksi */}
                      <div className="flex items-center gap-4">
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : res.id)}
                          className="text-right cursor-pointer"
                        >
                          <div className="text-sm font-extrabold text-slate-900">
                            {res.score_total} /{" "}
                            {res.version === "v68"
                              ? TOTAL_BINARY_INDICATORS
                              : "63"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Faktor Risiko
                          </div>
                        </div>

                        {/* Tombol Hapus Satuan */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal([res.id]);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus riwayat responden ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Expand Icon */}
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : res.id)}
                          className="cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detail Rincian Dokter (Kelompok 6 & 7) */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-xs animate-in fade-in duration-200">
                        {/* Kelompok 6: Peran Ganda */}
                        <div className="bg-pink-50/70 border border-pink-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-pink-900 text-xs">
                              Kelompok 6: Peran Ganda (3 Subskala Kategori 1 - 5)
                            </h4>
                            <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded font-semibold text-[10px]">
                              {res.version === "v68"
                                ? "Kategori 1 (Sangat Rendah) s.d. 5 (Sangat Tinggi)"
                                : `WFC Index (Legacy): ${res.wfc_index ?? "-"}`}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            {[
                              "time_based_conflict",
                              "strain_based_conflict",
                              "behavior_based_conflict",
                            ].map((k) => {
                              const sub = wfc[k];
                              return (
                                <div
                                  key={k}
                                  className="bg-white p-2.5 rounded-lg border border-pink-100"
                                >
                                  <span className="text-[10px] text-slate-500 block">
                                    {sub?.label || k}
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    Rata-rata: {sub?.rawAverage ?? "-"}
                                  </span>
                                  <span className="block text-[10px] font-semibold text-pink-700">
                                    Kategori: {sub?.categoryValue ?? "-"} (
                                    {sub?.categoryLabel ?? "-"})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Kelompok 7: Penilaian Transaksional */}
                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-indigo-900 text-xs">
                              Kelompok 7: Penilaian Transaksional (5 Subskala Kategori 0 - 4)
                            </h4>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px]">
                              {res.version === "v68"
                                ? normsInfo?.isAvailable
                                  ? `Norma dihitung dari ${normsInfo.sampleSize} responden v68`
                                  : `Norma Belum Tersedia (N = ${normsInfo?.sampleSize ?? 0} < 30)`
                                : `Stress Index (Legacy): ${res.stress_index ?? "-"}`}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                            {[
                              { key: "challenge", num: subs.appChallengeNum, label: subs.appChallengeLabel },
                              { key: "centrality", num: subs.appCentralityNum, label: subs.appCentralityLabel },
                              { key: "controllable_by_self", num: subs.appSelfNum, label: subs.appSelfLabel },
                              { key: "controllable_others", num: subs.appOthersNum, label: subs.appOthersLabel },
                              { key: "stressfullness", num: subs.appStressNum, label: subs.appStressLabel },
                            ].map(({ key, num, label }) => {
                              const sub = appraisal[key];
                              return (
                                <div
                                  key={key}
                                  className="bg-white p-2.5 rounded-lg border border-indigo-100"
                                >
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {sub?.label || key}
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    Rata-rata: {sub?.rawAverage ?? "-"}
                                  </span>
                                  <span className="block text-[10px] font-semibold text-indigo-700">
                                    {num !== null && num !== undefined
                                      ? `Kat: ${num} (${label})`
                                      : "Kat: Belum tersedia"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section Download / Ekspor Laporan (PDF & Excel) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Unduh Rekapitulasi Data Responden
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih format unduhan laporan skrining untuk keperluan audit, arsip,
                atau analisis kesehatan kerja ({filteredResults.length} responden)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Tombol PDF */}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Download PDF Resmi</span>
              </button>

              {/* Tombol Excel (.xlsx) */}
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Download Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Riwayat Skrining
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus{" "}
              <strong className="text-slate-800">
                {deleteTargetIds.length} data riwayat responden
              </strong>{" "}
              {targetLegacyCount > 0 ? (
                <span className="text-amber-700 font-semibold">
                  (termasuk {targetLegacyCount} data riwayat versi legacy)
                </span>
              ) : ""}{" "}
              dari database?
            </p>

            {/* Peringatan & Unduh Cadangan jika ada Data Legacy yang ditargetkan */}
            {targetLegacyCount > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Peringatan Khusus: {targetLegacyCount} Data Legacy Akan Dihapus!
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Data legacy merupakan arsip penelitian terdahulu yang tidak dapat dibuat ulang. Pastikan Anda telah mengunduh cadangan Excel terlebih dahulu.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Unduh Cadangan Excel (.xlsx) Terlebih Dahulu</span>
                </button>
              </div>
            )}

            {/* Konfirmasi Ganda (Wajib Centang Jika Ada Legacy) */}
            {targetLegacyCount > 0 && (
              <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl select-none">
                <input
                  type="checkbox"
                  checked={legacyDeleteAcknowledged}
                  onChange={(e) => setLegacyDeleteAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700 leading-snug">
                  Saya sadar akan menghapus {targetLegacyCount} data legacy dan telah mengunduh cadangan data jika diperlukan.
                </span>
              </label>
            )}

            {/* Peringatan Konfirmasi Tahap 2 */}
            {targetLegacyCount > 0 && doubleConfirmStep === 2 && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-semibold animate-in fade-in duration-150">
                ⚠️ Konfirmasi Tahap Akhir: Klik tombol merah di bawah untuk mengeksekusi penghapusan {deleteTargetIds.length} data riwayat.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTargetIds([]);
                  setLegacyDeleteAcknowledged(false);
                  setDoubleConfirmStep(1);
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>

              {targetLegacyCount > 0 && doubleConfirmStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setDoubleConfirmStep(2)}
                  disabled={!legacyDeleteAcknowledged}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Lanjut ke Konfirmasi Akhir →
                </button>
              ) : (
                <button
                  onClick={confirmDelete}
                  disabled={
                    isDeleting ||
                    (targetLegacyCount > 0 && !legacyDeleteAcknowledged)
                  }
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menghapus...
                    </>
                  ) : targetLegacyCount > 0 ? (
                    "Ya, Hapus Data Termasuk Legacy"
                  ) : (
                    "Ya, Hapus Data"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, bg, color }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
        <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      </div>
      <div
        className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;
