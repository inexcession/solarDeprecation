// Model tests. No Node: runs on macOS's built-in JavaScriptCore.
//   jsc=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
//   $jsc -m tests/model.test.js        (from the repo root)
import { addMonths, computeLedger, ledgerToCsv, parseHistory, rowWarnings, summarize } from '../web/js/model.js';

const log = globalThis.print ?? console.log;
let failures = 0;

function test(name, fn) {
  try {
    fn();
    log(`ok      ${name}`);
  } catch (err) {
    failures += 1;
    log(`FAILED  ${name}: ${err.message}`);
  }
}
function eq(actual, expected) {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a !== e) throw new Error(`expected ${e}, got ${a}`);
}
function throws(fn, pattern) {
  try { fn(); } catch (err) {
    if (!pattern.test(err.message)) throw new Error(`wrong error: ${err.message}`);
    return;
  }
  throw new Error('expected an exception');
}

const HEADER = 'month,grid_imported_kwh,bill_jpy,solar_generated_kwh,solar_exported_kwh,export_deposit_jpy,assumed_day_rate_jpy';
const CONFIG = {
  systemCost: 1000, subsidyReceived: 400, solarCapacityKw: 10, selfConsumptionTargetPercent: 30,
  sanityChecks: { maxMonthlyKwhPerKw: 220, minImpliedRate: 15, maxImpliedRate: 80, minDayRate: 10, maxDayRate: 120 },
};
const row = (month, over = {}) => ({
  month, gridImportedKwh: 100, billJpy: 3000, solarGeneratedKwh: 10, solarExportedKwh: 4, exportDepositJpy: 0, dayRateJpy: 30, ...over,
});

test('parseHistory parses, sorts and skips blank lines', () => {
  const rows = parseHistory(`${HEADER}\n2026-04,73,5442,1592.1,778.2,833,32.6\n\n2026-03,228,10798,572.7,206.4,0,30.8\n`);
  eq(rows.map((r) => r.month), ['2026-03', '2026-04']);
  eq(rows[1], {
    month: '2026-04', gridImportedKwh: 73, billJpy: 5442, solarGeneratedKwh: 1592.1,
    solarExportedKwh: 778.2, exportDepositJpy: 833, dayRateJpy: 32.6,
  });
});

test('parseHistory rejects malformed input loudly', () => {
  throws(() => parseHistory('month,foo\n2026-01,1'), /expected header/);
  throws(() => parseHistory(`${HEADER}\n2026-13,1,1,1,1,1,1`), /:2: bad month/);
  throws(() => parseHistory(`${HEADER}\n2026-01,1,1,1,1,1`), /:2: expected 6/);
  throws(() => parseHistory(`${HEADER}\n2026-01,1,x,1,1,1,1`), /:2: expected 6/);
  throws(() => parseHistory(`${HEADER}\n2026-01,1,-5,1,1,1,1`), /:2: expected 6/);
});

test('computeLedger derives savings and running total', () => {
  const ledger = computeLedger([row('2026-01', { exportDepositJpy: 50 }), row('2026-02', { solarExportedKwh: 20 })], CONFIG);
  eq(ledger.map((r) => [r.selfConsumedKwh, r.savingsJpy, r.totalValueJpy, r.cumulativeValue]),
    [[6, 180, 230, 230], [0, 0, 0, 230]]);
});

test('rowWarnings flags implausible rows', () => {
  const keys = (over) => rowWarnings(row('2026-01', over), CONFIG).map((w) => w.key);
  eq(keys({}), []);
  eq(keys({ solarGeneratedKwh: 2201, solarExportedKwh: 0 }), ['warnGenCapacity']);
  eq(keys({ billJpy: 9000 }), ['warnHighRate']);
  eq(keys({ billJpy: 1000 }), ['warnLowRate']);
  eq(keys({ gridImportedKwh: 10, billJpy: 9000 }), []);
  eq(keys({ solarExportedKwh: 11 }), ['warnExportExceedsGen']);
  eq(keys({ dayRateJpy: 9 }), ['warnDayRateRange']);
});

test('addMonths rolls over years', () => {
  eq(addMonths('2026-11', 2), '2027-01');
  eq(addMonths('2026-12', 0), '2026-12');
  eq(addMonths('2026-01', 24), '2028-01');
});

test('summarize projects break-even from the trailing 12 months', () => {
  // 13 months: first is huge, the last 12 are 60/month → net 600, cumulative 1000+720 → paid off
  const big = row('2025-12', { solarGeneratedKwh: 1000, solarExportedKwh: 0, dayRateJpy: 1 });
  const monthly = Array.from({ length: 12 }, (_, i) => row(addMonths('2026-01', i), { solarExportedKwh: 8 }));
  const s = summarize(computeLedger([big, ...monthly], CONFIG), CONFIG);
  eq([s.netInvestment, s.cumulative, s.remaining, s.netProfit, s.paybackPercent, s.breakEvenMonth], [600, 1720, 0, 1120, 100, null]);

  const partial = summarize(computeLedger(monthly.slice(0, 3), CONFIG), CONFIG); // 3 × 60 = 180 of 600
  eq([partial.remaining, partial.monthsRemaining, partial.breakEvenMonth, partial.paybackPercent], [420, 7, '2026-10', 30]);
  eq([partial.selfConsumptionRate, partial.subsidyTargetMet], [20, false]);
});

test('summarize handles an empty ledger', () => {
  const s = summarize([], CONFIG);
  eq([s.hasData, s.cumulative, s.remaining, s.breakEvenMonth], [false, 0, 600, null]);
});

test('ledgerToCsv emits one line per month', () => {
  const csv = ledgerToCsv(computeLedger([row('2026-01')], CONFIG));
  eq(csv.split('\n')[1], '2026-01,3000,100,30.00,10,6.0,180,0,180,180');
});

let fileReader = globalThis.read;
if (typeof fileReader !== 'function') {
  const fs = await import('node:fs').catch(() => null);
  if (fs) fileReader = (p) => fs.readFileSync(p, 'utf8');
}

if (typeof fileReader === 'function') {
  test('the real web/data files are valid', () => {
    const config = JSON.parse(fileReader('web/data/config.json'));
    const ledger = computeLedger(parseHistory(fileReader('web/data/history.csv')), config);
    if (!ledger.length) throw new Error('history.csv is empty');
    summarize(ledger, config);
  });
}

log(failures ? `\n${failures} test(s) failed` : '\nall tests passed');
if (failures) throw new Error('test failures');
