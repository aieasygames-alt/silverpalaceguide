import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { captureStatus, createCapture, inspectCapture, prepareCapture, reportMarkdown } from './lib/capture';
import type { CaptureKind } from './lib/capture-template';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const context = { projectRoot, captureRoot: join(projectRoot, 'artifacts/private/captures') };
const [command, ...args] = process.argv.slice(2);
const usage = 'Usage: capture.ts new <case|route|interval> <stable-id> | check <package-name> [--json] | prepare <package-name> | status [--json]';
try {
  if (command === 'new' && args.length === 2) {
    const directory = await createCapture(context, args[0] as CaptureKind, args[1]);
    console.log(`Created private capture package: ${directory}\nFill manifest.json, content.json, record.md and evidence.csv. Unknown values remain null. Run capture:check before preparing a review.`);
  } else if (command === 'check' && (args.length === 1 || (args.length === 2 && args[1] === '--json'))) {
    const { report } = await inspectCapture(context, args[0]);
    console.log(args[1] === '--json' ? JSON.stringify(report, null, 2) : reportMarkdown(report));
    if (!report.readyForReview) process.exitCode = 1;
  } else if (command === 'prepare' && args.length === 1) {
    console.log(`Prepared private draft review: ${await prepareCapture(context, args[0])}\nNo public data, images or status flags were changed.`);
  } else if (command === 'status' && (!args.length || (args.length === 1 && args[0] === '--json'))) {
    const reports = await captureStatus(context);
    if (args[0] === '--json') console.log(JSON.stringify(reports, null, 2));
    else {
      console.log('Private gameplay capture queue (readiness is not a factual-verification certificate):');
      for (const report of reports) console.log('error' in report ? `ERROR  ${report.package}: ${report.error}` : `${report.readyForReview ? 'REVIEWABLE' : 'INCOMPLETE'}  ${report.package}  ${report.issues.length} issue(s)`);
      if (!reports.length) console.log('No packages yet. Run capture:new to create one.');
    }
  } else throw new Error(usage);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Capture command failed');
  process.exitCode = 1;
}
