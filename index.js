const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

try {
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || ''
    core.info(`Base directory ${baseDirectory}`)

    let ddd = path.resolve(baseDirectory, core.getInput('build-scan-path'));
    core.info(`Resolved: ${ddd}`)

    const exists = fs.existsSync(ddd)
    core.info(`Exists: ${exists}`)

    const buildScanPath = core.getInput('build-scan-path');
    if (fs.existsSync(buildScanPath)) {
        core.info(`Build scan path ${buildScanPath} exists`)
        const content = fs.readFileSync(buildScanPath, 'utf-8');
        core.info(`Scan URL: ${content}`)
    } else {
        core.info(`Build scan path ${buildScanPath} does not exist`)
    }

    const time = (new Date()).toTimeString();
    core.setOutput('build-scan-url', 'https://ge.com/456123');
    core.setOutput('build-outcome', 'SUCCESS');

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}
