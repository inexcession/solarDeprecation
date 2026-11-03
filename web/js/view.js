// DOM rendering for the metric cards, the ledger table and the error banner.

const $ = (id) => document.getElementById(id);

function el(tag, { text, className, ...attrs } = {}, children = []) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.append(...children);
  return node;
}

function specsLine(config, t) {
  const parts = [
    config.solarCapacityKw && `${config.solarCapacityKw} ${t('solarUnit')}`,
    config.batteryCapacityKwh && `${config.batteryCapacityKwh} ${t('batteryUnit')}`,
    config.inverterCapacityKw && `${config.inverterCapacityKw} ${t('inverterUnit')}`,
    config.tariffPlan || config.electricityProvider,
  ];
  return parts.filter(Boolean).join(' · ') || '--';
}

export function renderMetrics(s, config, t, fmt) {
  $('systemName').textContent = config.systemName
    || t(config.batteryCapacityKwh ? 'defaultSystemName' : 'solarOnlySystemName');
  $('systemSpecs').textContent = specsLine(config, t);

  $('paybackPercent').textContent = fmt.percent(s.paybackPercent);
  $('paybackRemaining').textContent = s.remaining > 0
    ? `${fmt.currency(s.remaining)} ${t('metricRemaining')}`
    : t('metricFullyAmortized');
  $('paybackProgressBar').style.width = `${s.paybackPercent}%`;
  $('cumulativeReturn').textContent = fmt.currency(s.cumulative);
  $('netInvestmentDisplay').textContent = fmt.currency(s.netInvestment);

  const [label, value, sub] = !s.hasData
    ? [t('metricProjectedBreakEven'), '--', t('metricMonthlyPace')]
    : s.remaining > 0
      ? [t('metricProjectedBreakEven'), s.breakEvenMonth ? fmt.month(s.breakEvenMonth) : '--',
        t('metricPace', { months: s.monthsRemaining, amount: fmt.currency(s.avgMonthlyValue) })]
      : [t('metricNetProfit'), `+${fmt.currency(s.netProfit)}`,
        `+${fmt.percent(s.roiPercent)} ${t('metricNetProfitSub')}`];
  $('breakEvenCardLabel').textContent = label;
  $('projectedBreakEven').textContent = value;
  $('monthlyPace').textContent = sub;

  const target = config.selfConsumptionTargetPercent;
  $('selfConsumptionRate').textContent = s.hasData ? fmt.percent(s.selfConsumptionRate) : '--%';
  $('selfConsumptionKwh').textContent = s.hasData ? fmt.kwh(s.selfConsumedKwh) : '-- kWh';
  $('selfConsumptionProgressBar').style.width = `${Math.min(100, s.selfConsumptionRate)}%`;
  const met = s.hasData && s.subsidyTargetMet;
  $('selfConsumptionSub').textContent = t(met ? 'metricSubsidyMet' : 'metricSubsidyTarget', { target });
  $('selfConsumptionSub').classList.toggle('is-met', met);
}

// ¥/kWh placeholders are all named {rate}; everything else is a plain number.
const warningText = (w, t, fmt) => t(w.key, Object.fromEntries(
  Object.entries(w.vars).map(([k, v]) => [k, k === 'rate' ? fmt.rate(v) : fmt.number(v)]),
));

export function renderLedger(ledger, t, fmt) {
  const tbody = $('ledgerTableBody');
  if (!ledger.length) {
    tbody.replaceChildren(el('tr', {}, [el('td', { colspan: 10, className: 'table-empty-message', text: t('noDataFound') })]));
    return;
  }
  tbody.replaceChildren(...ledger.map((r) => {
    const month = el('td', { text: r.month });
    if (r.warnings.length) {
      const msg = r.warnings.map((w) => warningText(w, t, fmt)).join('\n');
      month.append(' ', el('span', { className: 'warning-badge', text: '⚠️', title: msg, 'aria-label': msg, role: 'img', tabindex: 0 }));
    }
    return el('tr', {}, [
      month,
      el('td', { text: fmt.currency(r.billJpy) }),
      el('td', { text: fmt.kwh(r.gridImportedKwh) }),
      el('td', { text: fmt.rate(r.dayRateJpy) }),
      el('td', { text: fmt.kwh(r.solarGeneratedKwh) }),
      el('td', { text: fmt.kwh(r.selfConsumedKwh) }),
      el('td', { text: fmt.currency(r.savingsJpy), className: 'positive' }),
      el('td', { text: r.exportDepositJpy > 0 ? fmt.currency(r.exportDepositJpy) : '-' }),
      el('td', { text: fmt.currency(r.totalValueJpy), className: 'positive strong' }),
      el('td', { text: fmt.currency(r.cumulativeValue) }),
    ]);
  }));
}

export function renderError(message) {
  const banner = $('loadError');
  banner.textContent = message;
  banner.hidden = false;
}
