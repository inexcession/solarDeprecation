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
    chartMonthlySavingsLabel: "Self-Consumption Savings",
    chartMonthlyDepositLabel: "Export Deposit",
    chartMonthlyBillLabel: "Grid Bill Paid",
    chartEnergyTitle: "Energy Generation & Self-Consumption",
    chartEnergySubtitle: "Solar generated, self-consumed, and exported (kWh)",
    chartEnergySelfConsumedLabel: "Self-Consumed (kWh)",
    chartEnergyExportedLabel: "Exported to Grid (kWh)",
    chartEnergyImportedLabel: "Imported from Grid (kWh)",
    tableTitle: "Monthly Ledger",
    tableSubtitle: "Computed monthly effective rates and derived self-consumption offsets",
    thMonth: "Month",
    thGridBill: "Grid Bill",
    thGridImport: "Grid Import",
    thEffectiveRate: "Effective Rate",
    thSolarGen: "Solar Gen",
    thSelfConsumed: "Self-Consumed",
    thSavings: "Savings",
    thExportRevenue: "Export Revenue",
    thTotalValue: "Total Value",
    thCumulative: "Cumulative",
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
    chartMonthlySavingsLabel: "自家消費削減効果額",
    chartMonthlyDepositLabel: "売電収入（振込額）",
    chartMonthlyBillLabel: "買電請求額",
    chartEnergyTitle: "電力収支バランス（発電・自家消費・買電）",
    chartEnergySubtitle: "太陽光発電量・自家消費量・売電量・買電量 (kWh)",
    chartEnergySelfConsumedLabel: "自家消費量 (kWh)",
    chartEnergyExportedLabel: "売電量 (kWh)",
    chartEnergyImportedLabel: "買電量 (kWh)",
    tableTitle: "月次明細一覧",
    tableSubtitle: "月ごとの実効電気料金単価と算定された自家消費削減効果",
    thMonth: "年月",
    thGridBill: "買電請求額",
    thGridImport: "買電量",
    thEffectiveRate: "実効単価",
    thSolarGen: "発電量",
    thSelfConsumed: "自家消費量",
    thSavings: "削減効果額",
    thExportRevenue: "売電収入",
    thTotalValue: "月次経済効果",
    thCumulative: "累積回収額",
    footerText: "リポジトリの <code>data/history.csv</code> および <code>data/config.json</code> からデータを直接読み込んでいます。"
  }
};

let i18n = embeddedI18n;
let currentLang = 'en';

let appConfig = {
  language: 'en',
  currency: '¥',
  systemCost: 2800000,
  subsidyReceived: 1200000,
  netInvestment: 1600000,
  installationDate: '2023-06-01',
  solarCapacityKw: 6.2,
  batteryCapacityKwh: 9.8,
  daytimeMultiplier: 1.15,
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

    rows.push({
      month: row.month || `Month ${i}`,
      gridImportedKwh: parseFloat(row.grid_imported_kwh) || 0,
      billJpy: parseFloat(row.bill_jpy) || 0,
      solarGeneratedKwh: parseFloat(row.solar_generated_kwh) || 0,
      solarExportedKwh: parseFloat(row.solar_exported_kwh) || 0,
      exportDepositJpy: parseFloat(row.export_deposit_jpy) || 0
    });
  }

  return rows.sort((a, b) => a.month.localeCompare(b.month));
}

function recalculateAndRender() {
  if (!rawHistoryData.length) return;

  let cumulativeVal = 0;
  calculatedRows = rawHistoryData.map(row => {
    const effectiveRate = row.gridImportedKwh > 0 ? (row.billJpy / row.gridImportedKwh) : 32.0;
    const selfConsumedKwh = Math.max(0, row.solarGeneratedKwh - row.solarExportedKwh);
    const daytimeRate = effectiveRate * (appConfig.daytimeMultiplier || 1.0);
    const selfConsumptionSavings = selfConsumedKwh * daytimeRate;
    const totalMonthlyValue = selfConsumptionSavings + row.exportDepositJpy;
    
    cumulativeVal += totalMonthlyValue;

    return {
      ...row,
      effectiveRate,
      selfConsumedKwh,
      daytimeRate,
      selfConsumptionSavings,
      totalMonthlyValue,
      cumulativeValue: cumulativeVal
    };
  });

  renderHeaderAndMetrics();
  renderCharts();
  renderLedgerTable();
}

function renderHeaderAndMetrics() {
  const netInvestment = appConfig.netInvestment || (appConfig.systemCost - appConfig.subsidyReceived);
  const totalCumulative = calculatedRows.length ? calculatedRows[calculatedRows.length - 1].cumulativeValue : 0;
  const paybackPercent = netInvestment > 0 ? Math.min(100, (totalCumulative / netInvestment) * 100) : 100;
  const remaining = Math.max(0, netInvestment - totalCumulative);

  let defaultName = appConfig.batteryCapacityKwh ? t('defaultSystemName') : t('solarOnlySystemName');
  document.getElementById('systemName').textContent = appConfig.systemName || defaultName;

  const solarPart = appConfig.solarCapacityKw ? `${appConfig.solarCapacityKw} ${t('solarUnit')}` : '';
  const batteryPart = appConfig.batteryCapacityKwh ? ` · ${appConfig.batteryCapacityKwh} ${t('batteryUnit')}` : '';
  document.getElementById('systemSpecs').textContent = `${solarPart}${batteryPart}`.trim() || '--';

  document.getElementById('paybackPercent').textContent = `${paybackPercent.toFixed(1)}%`;
  document.getElementById('paybackRemaining').textContent = remaining > 0 ? `${fmtCurrency(remaining)} ${t('metricRemaining')}` : t('metricFullyAmortized');
  document.getElementById('paybackProgressBar').style.width = `${paybackPercent}%`;

  document.getElementById('cumulativeReturn').textContent = fmtCurrency(totalCumulative);
  document.getElementById('netInvestmentDisplay').textContent = fmtCurrency(netInvestment);

  if (calculatedRows.length > 0 && remaining > 0) {
    const avgMonthlyVal = totalCumulative / calculatedRows.length;
    const monthsRemaining = avgMonthlyVal > 0 ? Math.ceil(remaining / avgMonthlyVal) : 0;
    
    const lastMonthStr = calculatedRows[calculatedRows.length - 1].month;
    const [year, month] = lastMonthStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1 + monthsRemaining);
    const targetLocale = (currentLang === 'ja') ? 'ja-JP' : undefined;
    const targetDateStr = targetDate.toLocaleDateString(targetLocale, { year: 'numeric', month: 'short' });
    
    document.getElementById('projectedBreakEven').textContent = targetDateStr;

    if (currentLang === 'ja') {
      document.getElementById('monthlyPace').textContent = `${t('metricPacePrefix')}${fmtCurrency(avgMonthlyVal)}${t('metricPaceMonths')}${monthsRemaining}${t('metricPaceSuffix')}`;
    } else {
      document.getElementById('monthlyPace').textContent = `${t('metricPacePrefix')}${monthsRemaining} ${t('metricPaceMonths')} ${fmtCurrency(avgMonthlyVal)}${t('metricPaceSuffix')}`;
    }
  } else if (remaining === 0) {
    document.getElementById('projectedBreakEven').textContent = t('metricAchieved');
    document.getElementById('monthlyPace').textContent = t('metricFullyPaid');
  }
}

function renderCharts() {
  const labels = calculatedRows.map(r => r.month);
  const cumulativeVals = calculatedRows.map(r => Math.round(r.cumulativeValue));
  const netCost = appConfig.netInvestment || (appConfig.systemCost - appConfig.subsidyReceived);
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
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif' } } },
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
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif' } } },
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
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif' } } },
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

  calculatedRows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${fmtCurrency(row.billJpy)}</td>
      <td>${fmtNumber(row.gridImportedKwh, 0)} kWh</td>
      <td>${fmtCurrency(row.effectiveRate)}/kWh</td>
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

    let csvContent = 'month,grid_bill_jpy,grid_import_kwh,effective_rate,solar_generated_kwh,self_consumed_kwh,self_consumption_savings_jpy,export_revenue_jpy,total_monthly_value_jpy,cumulative_value_jpy\n';
    calculatedRows.forEach(r => {
      csvContent += `${r.month},${r.billJpy},${r.gridImportedKwh},${r.effectiveRate.toFixed(2)},${r.solarGeneratedKwh},${r.selfConsumedKwh.toFixed(1)},${Math.round(r.selfConsumptionSavings)},${r.exportDepositJpy},${Math.round(r.totalMonthlyValue)},${Math.round(r.cumulativeValue)}\n`;
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
