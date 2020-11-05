const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

try {
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || ''
    core.info(`Base directory ${baseDirectory}`)

    const buildScansPath = path.resolve(baseDirectory, core.getInput('build-scans-path'));

    if (fs.existsSync(buildScansPath)) {
        core.info(`Reading file ${buildScansPath}`)
        const content = fs.readFileSync(buildScansPath, 'utf-8');
        core.info(`File content: ${content}`)
    } else {
        core.info(`File ${buildScansPath} does not exist`)
    }
} catch (error) {
    core.setFailed(error.message);
}
