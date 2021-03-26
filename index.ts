const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main(): Promise<void> {
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || '';
    const buildScansPath = core.getInput('build-scans-path') || './build-scans';
    const token = core.getInput('token');

    // resolve path to file containing build scans
    const resolvedBuildScansPath = path.resolve(baseDirectory, buildScansPath);
    if (!fs.existsSync(resolvedBuildScansPath)) {
        core.warning(`File ${resolvedBuildScansPath} does not exist`);
        return;
    }

    // read build scan links line-by-line from file
    core.info(`Reading file ${resolvedBuildScansPath}`)
    const rawBuildScanLinks = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(resolvedBuildScansPath, 'utf-8'),
        crlfDelay: Infinity
    });
    for await (const line of rl) {
        rawBuildScanLinks.push(line);
    }

    // construct markdown with build scan links rendered as links
    const buildScanLinks = rawBuildScanLinks.map( l => `[${l}](${l})`)
    core.info(`Links: ${buildScanLinks}`);

    const octokit = github.getOctokit(token)
    const createResponse = await octokit.checks.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: 'Build scan',
        head_sha: github.context.payload.pull_request ? github.context.payload.pull_request.head.sha : github.context.sha,
        details_url: 'https://www.gradle.com',
        status: 'completed',
        conclusion: 'neutral',
        output: {
            title: `Build scan`,
            summary: `While executing this workflow, ${buildScanLinks.length} build scan${buildScanLinks.length === 1 ? '' : 's'} were published.

Build scans are a persistent record of what happened in your Gradle or Maven build, visualized in your browser. Learn more at [scans.gradle.com](https://scans.gradle.com).`,
            text: buildScanLinks,
        }
    });

    const data = createResponse.data;
    core.info(`Status: ${data.status}`);
}

main().catch(error => {
    console.error(error.stack)
    core.setFailed(`Build scan GitHub action: ${error.message}`)
})
