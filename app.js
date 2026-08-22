// State Management
let appConfig = {
  currency: '¥',
  systemCost: 2800000,
  subsidyReceived: 1200000,
  netInvestment: 1600000,
  installationDate: '2023-06-01',
  solarCapacityKw: 6.2,
  batteryCapacityKwh: 9.8,
  daytimeMultiplier: 1.15,
  systemName: 'Residential Solar + Storage'
};

let rawHistoryData = [];
let calculatedRows = [];

let amortizationChart = null;
let monthlyValueChart = null;
let energyFlowChart = null;

const fmtCurrency = (val) => `${appConfig.currency}${Math.round(val).toLocaleString()}`;
const fmtNumber = (val, decimals = 1) => Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadData();
});

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

  try {
    const historyRes = await fetch('data/history.csv');
    if (historyRes.ok) {
      const csvText = await historyRes.text();
      rawHistoryData = parseCSV(csvText);
    }
  } catch (err) {
    console.warn('Could not load history.csv, please load via file picker', err);
  }

  syncConfigUI();
  recalculateAndRender();
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

  document.getElementById('systemName').textContent = appConfig.systemName || 'Solar + Storage';
  document.getElementById('systemSpecs').textContent = `${appConfig.solarCapacityKw || '--'} kW Solar · ${appConfig.batteryCapacityKwh || '--'} kWh Battery`;

  document.getElementById('paybackPercent').textContent = `${paybackPercent.toFixed(1)}%`;
  document.getElementById('paybackRemaining').textContent = remaining > 0 ? `${fmtCurrency(remaining)} remaining` : 'Fully Amortized!';
  document.getElementById('paybackProgressBar').style.width = `${paybackPercent}%`;

  document.getElementById('cumulativeReturn').textContent = fmtCurrency(totalCumulative);
  document.getElementById('netInvestmentDisplay').textContent = fmtCurrency(netInvestment);

  if (calculatedRows.length > 0 && remaining > 0) {
    const avgMonthlyVal = totalCumulative / calculatedRows.length;
    const monthsRemaining = avgMonthlyVal > 0 ? Math.ceil(remaining / avgMonthlyVal) : 0;
    
    const lastMonthStr = calculatedRows[calculatedRows.length - 1].month;
    const [year, month] = lastMonthStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1 + monthsRemaining);
    const targetDateStr = targetDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    
    document.getElementById('projectedBreakEven').textContent = targetDateStr;
    document.getElementById('monthlyPace').textContent = `~${monthsRemaining} months at ${fmtCurrency(avgMonthlyVal)}/mo pace`;
  } else if (remaining === 0) {
    document.getElementById('projectedBreakEven').textContent = 'Achieved';
    document.getElementById('monthlyPace').textContent = 'System has fully paid for itself';
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
          label: 'Cumulative Value Generated',
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
          label: 'Net Investment Threshold',
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
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } },
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
          label: 'Self-Consumption Savings',
          data: calculatedRows.map(r => Math.round(r.selfConsumptionSavings)),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Export Deposit',
          data: calculatedRows.map(r => Math.round(r.exportDepositJpy)),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: 'Grid Bill Paid',
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
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } },
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
          label: 'Self-Consumed (kWh)',
          data: calculatedRows.map(r => Math.round(r.selfConsumedKwh)),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Exported to Grid (kWh)',
          data: calculatedRows.map(r => Math.round(r.solarExportedKwh)),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        },
        {
          label: 'Imported from Grid (kWh)',
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
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } },
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
  // Modal toggle
  const modal = document.getElementById('settingsModal');
  document.getElementById('openSettingsBtn').addEventListener('click', () => {
    syncConfigUI();
    modal.classList.add('open');
  });

  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  // Save Settings
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    appConfig.systemCost = parseFloat(document.getElementById('inputGrossCost').value) || 0;
    appConfig.subsidyReceived = parseFloat(document.getElementById('inputSubsidy').value) || 0;
    appConfig.netInvestment = parseFloat(document.getElementById('inputNetCost').value) || 0;
    appConfig.daytimeMultiplier = parseFloat(document.getElementById('inputMultiplier').value) || 1.0;
    appConfig.solarCapacityKw = parseFloat(document.getElementById('inputSolarKw').value) || 0;
    appConfig.batteryCapacityKwh = parseFloat(document.getElementById('inputBatteryKwh').value) || 0;

    modal.classList.remove('open');
    recalculateAndRender();
  });

  // Reset to original repo values
  document.getElementById('resetConfigBtn').addEventListener('click', async () => {
    await loadData();
    modal.classList.remove('open');
  });

  // Local CSV Upload
  document.getElementById('csvFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      rawHistoryData = parseCSV(event.target.result);
      recalculateAndRender();
    };
    reader.readAsText(file);
  });

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

function syncConfigUI() {
  document.getElementById('inputGrossCost').value = appConfig.systemCost || '';
  document.getElementById('inputSubsidy').value = appConfig.subsidyReceived || '';
  document.getElementById('inputNetCost').value = appConfig.netInvestment || (appConfig.systemCost - appConfig.subsidyReceived) || '';
  document.getElementById('inputMultiplier').value = appConfig.daytimeMultiplier || 1.15;
  document.getElementById('inputSolarKw').value = appConfig.solarCapacityKw || '';
  document.getElementById('inputBatteryKwh').value = appConfig.batteryCapacityKwh || '';
}
