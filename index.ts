const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main(): Promise<void> {
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || '';
    const buildScansPath = core.getInput('build-scans-path') || './build-scans';
    const token = core.getInput('token');

    core.info(`Run id: ${process.env[`GITHUB_RUN_ID`]}`);
    core.info(`Action id: ${process.env[`GITHUB_ACTION`]}`);

    // resolve path to file containing build scans
    const resolvedBuildScansPath = path.resolve(baseDirectory, buildScansPath);
    if (!fs.existsSync(resolvedBuildScansPath)) {
        core.warning(`File ${resolvedBuildScansPath} does not exist`);
        return;
    }

    // read build scan links line-by-line from file
    core.info(`Reading file ${resolvedBuildScansPath}`)
    const rl = readline.createInterface({
        input: fs.createReadStream(resolvedBuildScansPath, 'utf-8'),
        crlfDelay: Infinity
    });
    const rawBuildScanLinks = [];
    for await (const line of rl) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
            rawBuildScanLinks.push(trimmedLine);
        }
    }

    // prepare dynamic content of build scan pane shown in GitHub actions
    const numOfBuildScans = rawBuildScanLinks.length;
    const summary = numOfBuildScans === 0 ? 'no build scans were published' :
        numOfBuildScans === 1 ? `a build scan was published` :
            `${numOfBuildScans} build scans were published`
    const buildScanLinksMarkdown = rawBuildScanLinks.map(l => `[${l}](${l})`).join('\n');

    // create build scan pane via Github check request
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
            summary: `While executing this job, ${summary}.

Build scans are a persistent record of what happened in your Gradle or Maven build, visualized in your browser. Learn more about build scans at [gradle.com](https://gradle.com/gradle-enterprise-solution-overview/build-scan-root-cause-analysis-data), and more about the free service at [scans.gradle.com](https://scans.gradle.com).`,
            text: buildScanLinksMarkdown,
        }
    });

    const data = createResponse.data;
    core.info(`Status: ${data.status}`);
}

main().catch(error => {
    console.error(error.stack)
    core.setFailed(`Build scan GitHub action: ${error.message}`)
})
