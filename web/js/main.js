// Entry point: load data, compute, render; re-render on language switch.
import { applyStaticTranslations, formatters, translator } from './i18n.js';
import { computeLedger, ledgerToCsv, parseHistory, summarize } from './model.js';
import { renderCharts } from './charts.js';
import { renderError, renderLedger, renderMetrics } from './view.js';

async function load(path, as) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res[as]();
}

function download(filename, text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href));
}

async function main() {
  const [config, strings, csv] = await Promise.all([
    load('data/config.json', 'json'),
    load('data/i18n.json', 'json'),
    load('data/history.csv', 'text'),
  ]);
  const ledger = computeLedger(parseHistory(csv), config);
  const summary = summarize(ledger, config);

  const render = (lang) => {
    const t = translator(strings, lang);
    const fmt = formatters(config.currency, lang);
    applyStaticTranslations(t, lang);
    renderMetrics(summary, config, t, fmt);
    renderLedger(ledger, t, fmt);
    renderCharts(ledger, summary, t, fmt);
  };

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => render(btn.dataset.lang));
  });
  document.getElementById('exportCalculationsBtn').addEventListener('click', () => {
    if (ledger.length) download('solar_amortization_calculated.csv', ledgerToCsv(ledger));
  });
  render(config.language);
}

main().catch((err) => {
  console.error(err);
  renderError(`Failed to load dashboard data: ${err.message}`);
});
