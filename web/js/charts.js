// Chart.js rendering. Chart is the global from the pinned UMD bundle in index.html.
/* global Chart */

const css = getComputedStyle(document.documentElement);
const color = (name) => css.getPropertyValue(name).trim();

// Deferred to first render so a missing Chart global surfaces in the error banner.
let defaultsApplied = false;
function applyDefaults() {
  Chart.defaults.color = color('--text-dim');
  Chart.defaults.borderColor = color('--grid');
  Chart.defaults.font.family = color('--font-main');
  Chart.defaults.maintainAspectRatio = false;
  Object.assign(Chart.defaults.plugins.legend.labels, {
    boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 12, color: color('--text-muted'), font: { size: 12 },
  });
  defaultsApplied = true;
}

// One spec per <canvas id>. value(row, summary) → number plotted per month.
const SPECS = {
  amortizationChart: {
    type: 'line',
    unit: 'currency',
    series: [
      { label: 'chartAmortizationCumulativeLabel', color: '--accent', value: (r) => r.cumulativeValue },
      { label: 'chartAmortizationTargetLabel', color: '--danger', dashed: true, value: (r, s) => s.netInvestment },
    ],
  },
  monthlyValueChart: {
    type: 'bar',
    unit: 'currency',
    series: [
      { label: 'chartMonthlySavingsLabel', color: '--accent', value: (r) => r.savingsJpy },
      { label: 'chartMonthlyDepositLabel', color: '--solar', value: (r) => r.exportDepositJpy },
      { label: 'chartMonthlyBillLabel', color: '--border-focus', value: (r) => r.billJpy },
    ],
  },
  energyFlowChart: {
    type: 'bar',
    unit: 'kwh',
    series: [
      { label: 'chartEnergySelfConsumedLabel', color: '--accent', value: (r) => r.selfConsumedKwh },
      { label: 'chartEnergyExportedLabel', color: '--solar', value: (r) => r.solarExportedKwh },
      { label: 'chartEnergyImportedLabel', color: '--blue', value: (r) => r.gridImportedKwh },
    ],
  },
};

function dataset(series, type, data, t) {
  const c = color(series.color);
  const base = { label: t(series.label), data };
  if (type === 'bar') return { ...base, backgroundColor: c, borderRadius: 4 };
  if (series.dashed) return { ...base, borderColor: c, borderDash: [6, 6], borderWidth: 1.5, pointRadius: 0 };
  return {
    ...base, borderColor: c, backgroundColor: color(`${series.color}-soft`), fill: true,
    tension: 0.25, borderWidth: 2, pointRadius: 4, pointBackgroundColor: c,
  };
}

const charts = {};

export function renderCharts(ledger, summary, t, fmt) {
  if (!defaultsApplied) applyDefaults();
  for (const [id, spec] of Object.entries(SPECS)) {
    const format = fmt[spec.unit];
    charts[id]?.destroy();
    charts[id] = new Chart(document.getElementById(id), {
      type: spec.type,
      data: {
        labels: ledger.map((r) => r.month),
        datasets: spec.series.map((s) =>
          dataset(s, spec.type, ledger.map((r) => Math.round(s.value(r, summary))), t)),
      },
      options: {
        plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${format(ctx.raw)}` } } },
        scales: {
          x: { grid: { display: spec.type === 'line' } },
          y: { ticks: { callback: (v) => format(v) } },
        },
      },
    });
  }
}
