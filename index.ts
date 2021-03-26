const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main(): Promise<void> {
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || '';
    const buildScansPath = core.getInput('build-scans-path') || './build-scans';
    const token = core.getInput('token');

    const resolvedBuildScansPath = path.resolve(baseDirectory, buildScansPath);
    if (!fs.existsSync(resolvedBuildScansPath)) {
        core.warning(`File ${resolvedBuildScansPath} does not exist`);
        return;
    }

    core.info(`Reading file ${resolvedBuildScansPath}`)
    const content = fs.readFileSync(resolvedBuildScansPath, 'utf-8');
    core.info(`File content: ${content}`)

    const results = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(resolvedBuildScansPath, 'utf-8'),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        results.push(line);
    }

    core.info(results.length);

    // rl.on('line', function (line) {
    //     results.push(line);
    // });

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
            summary: `While executing this workflow, one or more build scans were published.

Build scans are a persistent record of what happened in your Gradle or Maven build, visualized in your browser. Learn more at [scans.gradle.com](https://scans.gradle.com).`,
            text: `[https://scans.gradle.com/s/foo123bar](https://scans.gradle.com/s/foo123bar)`,
        }
    });

    const data = createResponse.data;
    core.info(`Status: ${data.status}`);
}

main().catch(error => {
    console.error(error.stack)
    core.setFailed(`Build scan GitHub action: ${error.message}`)
})
