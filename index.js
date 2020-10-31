const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

try {
    let scanPath = path.resolve('build-scan.url');
    core.info(`Full path is ${scanPath}`);

    const buildScanUrlFile = 'build-scan.url';
    if (fs.existsSync(buildScanUrlFile)) {
        core.info(`Input file ${buildScanUrlFile} exists`)
        const content = fs.readFileSync(buildScanUrlFile, 'utf-8');
        core.info(`Scan URL: ${content}`)
    } else {
        core.info(`Input file ${buildScanUrlFile} does not exist`)
    }

    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);

    const time = (new Date()).toTimeString();
    core.setOutput('time', time);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
} catch (error) {
    core.setFailed(error.message);
}
