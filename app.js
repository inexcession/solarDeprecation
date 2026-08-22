// Fallback i18n dictionary for offline / direct file preview
const embeddedI18n = {
  en: {
    pageTitle: "Solar Deprecation & Payback Dashboard",
    defaultSystemName: "Solar + Storage",
    solarOnlySystemName: "Residential Solar",
    mainTitle: "Investment Amortization & ROI",
    mainSubtitle: "Tracking real-world generation, self-consumption savings, and grid offset",
    solarUnit: "kW Solar",
    batteryUnit: "kWh Battery",
    inverterUnit: "kW Inverter",
    btnExportCSV: "Export Calculated CSV",
    metricPaybackProgress: "Payback Progress",
    metricRemaining: "remaining",
    metricFullyAmortized: "Fully Amortized!",
    metricCumulativeReturn: "Cumulative Total Return",
    metricCumulativeBreakdown: "Self-consumption + Export deposits",
    metricNetCost: "Net System Cost",
    metricNetCostBreakdown: "Gross cost minus subsidies",
    metricProjectedBreakEven: "Projected Break-Even",
    metricMonthlyPace: "Based on active run-rate",
    metricNetProfit: "Net Profit Generated",
    metricNetProfitSub: "ROI over net investment",
    metricAchieved: "Achieved",
    metricFullyPaid: "System has fully paid for itself",
    metricPacePrefix: "~",
    metricPaceMonths: "months at",
    metricPaceSuffix: "/mo pace",
    chartAmortizationTitle: "Cumulative Amortization Timeline",
    chartAmortizationSubtitle: "Cumulative value generated over time versus net investment threshold",
    chartAmortizationCumulativeLabel: "Cumulative Value Generated",
    chartAmortizationTargetLabel: "Net Investment Threshold",
    chartMonthlyTitle: "Monthly Financial Offset",
    chartMonthlySubtitle: "Self-consumption savings + feed-in deposits vs grid bill",
    chartMonthlySavingsLabel: "Self-Consumption",
    chartMonthlyDepositLabel: "Export Deposit",
    chartMonthlyBillLabel: "Grid Bill",
    chartEnergyTitle: "Energy Generation & Self-Consumption",
    chartEnergySubtitle: "Solar generated, self-consumed, and exported (kWh)",
    chartEnergySelfConsumedLabel: "Self-Consumed",
    chartEnergyExportedLabel: "Exported",
    chartEnergyImportedLabel: "Imported",
    tableTitle: "Monthly Ledger",
    tableSubtitle: "Computed self-consumption offsets based on assumed replacement grid rate",
    thMonth: "Month",
    thGridBill: "Grid Bill",
    thGridImport: "Grid Import",
    thDaytimeRate: "Assumed Day Rate",
    thSolarGen: "Solar Gen",
    thSelfConsumed: "Self-Consumed",
    thSavings: "Savings",
    thExportRevenue: "Export Revenue",
    thTotalValue: "Total Value",
    thCumulative: "Cumulative",
    warnGenCapacity: "Solar generation ({val} kWh) exceeds typical maximum (~{max} kWh) for a {cap} kW system.",
    warnHighRate: "Implied electricity rate ({rate}/kWh) is unusually high. Check bill amount or grid import kWh.",
    warnLowRate: "Implied electricity rate ({rate}/kWh) is unusually low. Check bill amount or grid import kWh.",
    warnExportExceedsGen: "Exported energy ({exp} kWh) exceeds total generation ({gen} kWh).",
    warnDayRateRange: "Assumed daytime rate ({rate}/kWh) is outside expected range.",
    noDataFound: "No valid monthly records found in data/history.csv.",
    footerText: "Data synced directly from <code>data/history.csv</code> & <code>data/config.json</code> in repository."
  },
  ja: {
    pageTitle: "太陽光・蓄電池 投資回収・償却ダッシュボード",
    defaultSystemName: "太陽光発電＋蓄電池",
    solarOnlySystemName: "住宅用太陽光発電",
    mainTitle: "設備投資回収・経済効果ダッシュボード",
    mainSubtitle: "実績データに基づく自家消費削減額・売電収入・投資回収進捗の可視化",
    solarUnit: "kW 太陽光",
    batteryUnit: "kWh 蓄電池",
    inverterUnit: "kW パワコン",
    btnExportCSV: "計算結果CSV出力",
    metricPaybackProgress: "投資回収進捗",
    metricRemaining: "残額",
    metricFullyAmortized: "回収完了！",
    metricCumulativeReturn: "累積経済効果額",
    metricCumulativeBreakdown: "自家消費削減額 ＋ 売電振込額",
    metricNetCost: "実質投資額",
    metricNetCostBreakdown: "設備総費用（補助金差引後）",
    metricProjectedBreakEven: "回収完了予測",
    metricMonthlyPace: "直近の実績ペースに基づく予測",
    metricNetProfit: "創出純利益額",
    metricNetProfitSub: "実質投資額に対するROI",
    metricAchieved: "回収達成",
    metricFullyPaid: "設備投資費用を全額回収しました",
    metricPacePrefix: "月平均 ",
    metricPaceMonths: " で残り約",
    metricPaceSuffix: "ヶ月",
    chartAmortizationTitle: "累積投資回収推移",
    chartAmortizationSubtitle: "実質投資額に対する累積経済効果の推移（損益分岐ライン）",
    chartAmortizationCumulativeLabel: "累積経済効果額",
    chartAmortizationTargetLabel: "実質投資額ライン",
    chartMonthlyTitle: "月次経済効果内訳",
    chartMonthlySubtitle: "自家消費による削減額＋売電収入 vs 買電請求額",
    chartMonthlySavingsLabel: "自家消費削減",
    chartMonthlyDepositLabel: "売電収入",
    chartMonthlyBillLabel: "買電請求",
    chartEnergyTitle: "電力収支バランス（発電・自家消費・買電）",
    chartEnergySubtitle: "太陽光発電量・自家消費量・売電量・買電量 (kWh)",
    chartEnergySelfConsumedLabel: "自家消費",
    chartEnergyExportedLabel: "売電",
    chartEnergyImportedLabel: "買電",
    tableTitle: "月次明細一覧",
    tableSubtitle: "設定された想定昼間単価に基づく自家消費による経済効果",
    thMonth: "年月",
    thGridBill: "買電請求額",
    thGridImport: "買電量",
    thDaytimeRate: "想定昼間単価",
    thSolarGen: "発電量",
    thSelfConsumed: "自家消費量",
    thSavings: "削減効果額",
    thExportRevenue: "売電収入",
    thTotalValue: "月次経済効果",
    thCumulative: "累積回収額",
    warnGenCapacity: "発電量（{val} kWh）が{cap} kWシステムの理論最大値（約{max} kWh）を超過しています。",
    warnHighRate: "実効電気料金単価（{rate}/kWh）が異常に高額です。請求額や買電量をご確認ください。",
    warnLowRate: "実効電気料金単価（{rate}/kWh）が異常に低額です。請求額や買電量をご確認ください。",
    warnExportExceedsGen: "売電量（{exp} kWh）が総発電量（{gen} kWh）を上回っています。",
    warnDayRateRange: "想定昼間単価（{rate}/kWh）が標準範囲外です。",
    noDataFound: "data/history.csv に有効な月次データが見つかりません。",
    footerText: "リポジトリの <code>data/history.csv</code> および <code>data/config.json</code> からデータを直接読み込んでいます。"
  }
};

let i18n = embeddedI18n;
let currentLang = 'en';

let appConfig = {
  language: 'en',
  currency: '¥',
  systemCost: 4300000,
  subsidyReceived: 2106000,
  netInvestment: 2194000,
  installationDate: '2026-03-15',
  solarCapacityKw: 15.0,
  batteryCapacityKwh: 13.0,
  inverterCapacityKw: 9.9,
  systemName: ''
};

let rawHistoryData = [];
let calculatedRows = [];

let amortizationChart = null;
let monthlyValueChart = null;
let energyFlowChart = null;

function t(key) {
  const dict = i18n[currentLang] || i18n.en || embeddedI18n.en;
  return dict[key] || embeddedI18n.en[key] || key;
}

const fmtCurrency = (val) => `${appConfig.currency}${Math.round(val).toLocaleString()}`;
const fmtNumber = (val, decimals = 1) => Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Defensive Parsing Helpers
function cleanNumber(val, defaultVal = 0) {
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (!val && val !== 0) return defaultVal;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
}

function normalizeMonth(val, fallbackIdx) {
  if (!val) return `Month ${fallbackIdx}`;
  const trimmed = String(val).trim().replace('/', '-');
  const parts = trimmed.split('-');
  if (parts.length === 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m)) {
      return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}`;
    }
  }
  return trimmed;
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadI18n();
  await loadData();
});

async function loadI18n() {
  try {
    const res = await fetch('data/i18n.json');
    if (res.ok) {
      const json = await res.json();
      i18n = json;
    }
  } catch (err) {
    console.warn('Could not load data/i18n.json, using embedded translations', err);
  }
}

async function loadData() {
  try {
    const configRes = await fetch('data/config.json');
    if (configRes.ok) {
      const fetchedConfig = await configRes.json();
      appConfig = { ...appConfig, ...fetchedConfig };
    }
  } catch (err) {
    console.warn('Could not load config.json, using defaults', err);
  }

  currentLang = appConfig.language || 'en';

  try {
    const historyRes = await fetch('data/history.csv');
    if (historyRes.ok) {
      const csvText = await historyRes.text();
      rawHistoryData = parseCSV(csvText);
    }
  } catch (err) {
    console.warn('Could not load history.csv', err);
  }

  applyTranslations();
  recalculateAndRender();
}

function setLanguage(lang) {
  currentLang = (lang === 'ja') ? 'ja' : 'en';
  applyTranslations();
  recalculateAndRender();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) {
      if (el.tagName === 'TITLE') {
        document.title = translation;
      } else if (key === 'footerText') {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  const enBtn = document.getElementById('langEnBtn');
  const jaBtn = document.getElementById('langJaBtn');
  if (enBtn && jaBtn) {
    enBtn.classList.toggle('active', currentLang === 'en');
    jaBtn.classList.toggle('active', currentLang === 'ja');
  }
}

function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const month = normalizeMonth(row.month, i);
    const gridImportedKwh = Math.max(0, cleanNumber(row.grid_imported_kwh, 0));
    const billJpy = Math.max(0, cleanNumber(row.bill_jpy, 0));
    const solarGeneratedKwh = Math.max(0, cleanNumber(row.solar_generated_kwh, 0));
    const solarExportedKwh = Math.max(0, cleanNumber(row.solar_exported_kwh, 0));
    const exportDepositJpy = Math.max(0, cleanNumber(row.export_deposit_jpy, 0));
    const assumedDayRateJpy = cleanNumber(row.assumed_day_rate_jpy, 35.0);

    rows.push({
      month,
      gridImportedKwh,
      billJpy,
      solarGeneratedKwh,
      solarExportedKwh,
      exportDepositJpy,
      assumedDayRateJpy: assumedDayRateJpy > 0 ? assumedDayRateJpy : 35.0
    });
  }

  return rows.sort((a, b) => a.month.localeCompare(b.month));
}

// Mathematical Sanity Checks
function checkRowWarnings(row) {
  const warnings = [];

  // 1. Generation vs System Capacity Check
  if (appConfig.solarCapacityKw > 0) {
    const theoreticalMax = appConfig.solarCapacityKw * 220;
    if (row.solarGeneratedKwh > theoreticalMax) {
      warnings.push(
        t('warnGenCapacity')
          .replace('{val}', row.solarGeneratedKwh.toLocaleString())
          .replace('{max}', Math.round(theoreticalMax).toLocaleString())
          .replace('{cap}', appConfig.solarCapacityKw)
      );
    }
  }

  // 2. Implied Grid Rate Check (Bill vs Import)
  if (row.gridImportedKwh >= 50 && row.billJpy > 0) {
    const impliedRate = row.billJpy / row.gridImportedKwh;
    if (impliedRate > 80) {
      warnings.push(
        t('warnHighRate').replace('{rate}', fmtCurrency(impliedRate))
      );
    } else if (impliedRate < 15) {
      warnings.push(
        t('warnLowRate').replace('{rate}', fmtCurrency(impliedRate))
      );
    }
  }

  // 3. Export exceeds total generation
  if (row.solarExportedKwh > row.solarGeneratedKwh && row.solarGeneratedKwh > 0) {
    warnings.push(
      t('warnExportExceedsGen')
        .replace('{exp}', row.solarExportedKwh.toLocaleString())
        .replace('{gen}', row.solarGeneratedKwh.toLocaleString())
    );
  }

  // 4. Day Rate out of range check
  if (row.assumedDayRateJpy < 10 || row.assumedDayRateJpy > 120) {
    warnings.push(
      t('warnDayRateRange').replace('{rate}', fmtCurrency(row.assumedDayRateJpy))
    );
  }

  return warnings;
}

function recalculateAndRender() {
  if (!rawHistoryData.length) {
    renderHeaderAndMetrics();
    renderCharts();
    renderLedgerTable();
    return;
  }

  let cumulativeVal = 0;
  calculatedRows = rawHistoryData.map(row => {
    const selfConsumedKwh = Math.max(0, row.solarGeneratedKwh - row.solarExportedKwh);
    const selfConsumptionSavings = selfConsumedKwh * row.assumedDayRateJpy;
    const totalMonthlyValue = selfConsumptionSavings + row.exportDepositJpy;
    const warnings = checkRowWarnings(row);
    
    cumulativeVal += totalMonthlyValue;

    return {
      ...row,
      selfConsumedKwh,
      selfConsumptionSavings,
      totalMonthlyValue,
      cumulativeValue: cumulativeVal,
      warnings
    };
  });

  renderHeaderAndMetrics();
  renderCharts();
  renderLedgerTable();
}

function renderHeaderAndMetrics() {
  const netInvestment = appConfig.netInvestment || (appConfig.systemCost - appConfig.subsidyReceived) || 0;
  const totalCumulative = calculatedRows.length ? calculatedRows[calculatedRows.length - 1].cumulativeValue : 0;
  const paybackPercent = netInvestment > 0 ? Math.min(100, (totalCumulative / netInvestment) * 100) : 100;
  const remaining = Math.max(0, netInvestment - totalCumulative);

  let defaultName = appConfig.batteryCapacityKwh ? t('defaultSystemName') : t('solarOnlySystemName');
  document.getElementById('systemName').textContent = appConfig.systemName || defaultName;

  const solarPart = appConfig.solarCapacityKw ? `${appConfig.solarCapacityKw} ${t('solarUnit')}` : '';
  const batteryPart = appConfig.batteryCapacityKwh ? ` · ${appConfig.batteryCapacityKwh} ${t('batteryUnit')}` : '';
  const inverterPart = appConfig.inverterCapacityKw ? ` · ${appConfig.inverterCapacityKw} ${t('inverterUnit')}` : '';
  document.getElementById('systemSpecs').textContent = `${solarPart}${batteryPart}${inverterPart}`.trim() || '--';

  document.getElementById('paybackPercent').textContent = `${paybackPercent.toFixed(1)}%`;
  document.getElementById('paybackRemaining').textContent = remaining > 0 ? `${fmtCurrency(remaining)} ${t('metricRemaining')}` : t('metricFullyAmortized');
  document.getElementById('paybackProgressBar').style.width = `${paybackPercent}%`;

  document.getElementById('cumulativeReturn').textContent = fmtCurrency(totalCumulative);
  document.getElementById('netInvestmentDisplay').textContent = fmtCurrency(netInvestment);

  const breakEvenLabelEl = document.getElementById('breakEvenCardLabel');
  const netProfit = Math.max(0, totalCumulative - netInvestment);

  if (calculatedRows.length > 0 && remaining > 0) {
    if (breakEvenLabelEl) breakEvenLabelEl.textContent = t('metricProjectedBreakEven');

    // Use Trailing 12 Months (TTM) if available, otherwise all recorded months
    const recentRows = calculatedRows.slice(-12);
    const recentSum = recentRows.reduce((acc, r) => acc + r.totalMonthlyValue, 0);
    const avgMonthlyVal = recentRows.length > 0 ? (recentSum / recentRows.length) : 0;
    const monthsRemaining = avgMonthlyVal > 0 ? Math.ceil(remaining / avgMonthlyVal) : 0;
    
    const lastMonthStr = calculatedRows[calculatedRows.length - 1].month;
    const [year, month] = lastMonthStr.split('-').map(Number);
    const targetDate = new Date(year, (month || 1) - 1 + monthsRemaining);
    const targetLocale = (currentLang === 'ja') ? 'ja-JP' : undefined;
    const targetDateStr = targetDate.toLocaleDateString(targetLocale, { year: 'numeric', month: 'short' });
    
    document.getElementById('projectedBreakEven').textContent = targetDateStr;

    if (currentLang === 'ja') {
      document.getElementById('monthlyPace').textContent = `${t('metricPacePrefix')}${fmtCurrency(avgMonthlyVal)}${t('metricPaceMonths')}${monthsRemaining}${t('metricPaceSuffix')}`;
    } else {
      document.getElementById('monthlyPace').textContent = `${t('metricPacePrefix')}${monthsRemaining} ${t('metricPaceMonths')} ${fmtCurrency(avgMonthlyVal)}${t('metricPaceSuffix')}`;
    }
  } else if (remaining === 0 && calculatedRows.length > 0) {
    if (breakEvenLabelEl) breakEvenLabelEl.textContent = t('metricNetProfit');
    const roiPercent = netInvestment > 0 ? ((netProfit / netInvestment) * 100).toFixed(1) : '0.0';
    document.getElementById('projectedBreakEven').textContent = `+${fmtCurrency(netProfit)}`;
    document.getElementById('monthlyPace').textContent = `+${roiPercent}% ${t('metricNetProfitSub')}`;
  } else {
    document.getElementById('projectedBreakEven').textContent = '--';
    document.getElementById('monthlyPace').textContent = t('metricMonthlyPace');
  }
}

function renderCharts() {
  const labels = calculatedRows.map(r => r.month);
  const cumulativeVals = calculatedRows.map(r => Math.round(r.cumulativeValue));
  const netCost = appConfig.netInvestment || (appConfig.systemCost - appConfig.subsidyReceived) || 0;
  const targetLine = calculatedRows.map(() => netCost);

  // Amortization Chart
  const ctxAmortization = document.getElementById('amortizationChart').getContext('2d');
  if (amortizationChart) amortizationChart.destroy();

  amortizationChart = new Chart(ctxAmortization, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('chartAmortizationCumulativeLabel'),
          data: cumulativeVals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        },
        {
          label: t('chartAmortizationTargetLabel'),
          data: targetLine,
          borderColor: '#ef4444',
          borderDash: [6, 6],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            color: '#94a3b8',
            font: { size: 12, family: 'Plus Jakarta Sans, sans-serif' }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${fmtCurrency(context.raw)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30, 41, 59, 0.5)' } },
        y: { 
          ticks: { 
            color: '#64748b',
            callback: (val) => fmtCurrency(val)
          }, 
          grid: { color: 'rgba(30, 41, 59, 0.5)' } 
        }
      }
    }
  });

  // Monthly Financial Breakdown
  const ctxMonthly = document.getElementById('monthlyValueChart').getContext('2d');
  if (monthlyValueChart) monthlyValueChart.destroy();

  monthlyValueChart = new Chart(ctxMonthly, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: t('chartMonthlySavingsLabel'),
          data: calculatedRows.map(r => Math.round(r.selfConsumptionSavings)),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: t('chartMonthlyDepositLabel'),
          data: calculatedRows.map(r => Math.round(r.exportDepositJpy)),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: t('chartMonthlyBillLabel'),
          data: calculatedRows.map(r => Math.round(r.billJpy)),
          backgroundColor: '#334155',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            color: '#94a3b8',
            font: { size: 12, family: 'Plus Jakarta Sans, sans-serif' }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${fmtCurrency(context.raw)}`
          }
        }
      },
      scales: {
        x: { stacked: false, ticks: { color: '#64748b' }, grid: { display: false } },
        y: { 
          ticks: { 
            color: '#64748b',
            callback: (val) => fmtCurrency(val)
          }, 
          grid: { color: 'rgba(30, 41, 59, 0.5)' } 
        }
      }
    }
  });

  // Energy Flow Chart
  const ctxEnergy = document.getElementById('energyFlowChart').getContext('2d');
  if (energyFlowChart) energyFlowChart.destroy();

  energyFlowChart = new Chart(ctxEnergy, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: t('chartEnergySelfConsumedLabel'),
          data: calculatedRows.map(r => Math.round(r.selfConsumedKwh)),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: t('chartEnergyExportedLabel'),
          data: calculatedRows.map(r => Math.round(r.solarExportedKwh)),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: t('chartEnergyImportedLabel'),
          data: calculatedRows.map(r => Math.round(r.gridImportedKwh)),
          backgroundColor: '#38bdf8',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            color: '#94a3b8',
            font: { size: 12, family: 'Plus Jakarta Sans, sans-serif' }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString()} kWh`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { display: false } },
        y: { 
          ticks: { 
            color: '#64748b',
            callback: (val) => `${val} kWh`
          }, 
          grid: { color: 'rgba(30, 41, 59, 0.5)' } 
        }
      }
    }
  });
}

function renderLedgerTable() {
  const tbody = document.getElementById('ledgerTableBody');
  tbody.innerHTML = '';

  if (!calculatedRows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="10" class="table-empty-message">${t('noDataFound')}</td>`;
    tbody.appendChild(tr);
    return;
  }

  calculatedRows.forEach(row => {
    const tr = document.createElement('tr');
    const hasWarnings = row.warnings && row.warnings.length > 0;
    const warningTooltip = hasWarnings ? row.warnings.join('\n') : '';

    const monthHtml = hasWarnings
      ? `<span class="month-cell">${row.month} <span class="warning-badge" title="${warningTooltip}">⚠️</span></span>`
      : row.month;

    tr.innerHTML = `
      <td>${monthHtml}</td>
      <td>${fmtCurrency(row.billJpy)}</td>
      <td>${fmtNumber(row.gridImportedKwh, 0)} kWh</td>
      <td>${fmtCurrency(row.assumedDayRateJpy)}/kWh</td>
      <td>${fmtNumber(row.solarGeneratedKwh, 0)} kWh</td>
      <td>${fmtNumber(row.selfConsumedKwh, 0)} kWh</td>
      <td class="highlight-positive">${fmtCurrency(row.selfConsumptionSavings)}</td>
      <td>${row.exportDepositJpy > 0 ? fmtCurrency(row.exportDepositJpy) : '-'}</td>
      <td class="highlight-positive"><strong>${fmtCurrency(row.totalMonthlyValue)}</strong></td>
      <td>${fmtCurrency(row.cumulativeValue)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function setupEventListeners() {
  // Language Switch Buttons
  const langEnBtn = document.getElementById('langEnBtn');
  const langJaBtn = document.getElementById('langJaBtn');
  if (langEnBtn) langEnBtn.addEventListener('click', () => setLanguage('en'));
  if (langJaBtn) langJaBtn.addEventListener('click', () => setLanguage('ja'));

  // Export Calculated CSV
  document.getElementById('exportCalculationsBtn').addEventListener('click', () => {
    if (!calculatedRows.length) return;

    let csvContent = 'month,grid_bill_jpy,grid_import_kwh,assumed_day_rate_jpy,solar_generated_kwh,self_consumed_kwh,self_consumption_savings_jpy,export_revenue_jpy,total_monthly_value_jpy,cumulative_value_jpy\n';
    calculatedRows.forEach(r => {
      csvContent += `${r.month},${r.billJpy},${r.gridImportedKwh},${r.assumedDayRateJpy.toFixed(2)},${r.solarGeneratedKwh},${r.selfConsumedKwh.toFixed(1)},${Math.round(r.selfConsumptionSavings)},${r.exportDepositJpy},${Math.round(r.totalMonthlyValue)},${Math.round(r.cumulativeValue)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'solar_amortization_calculated.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
