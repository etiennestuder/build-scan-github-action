const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

async function main(): Promise<void> {
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || '';
    const buildScansPath = core.getInput('build-scans-path');
    const token = core.getInput('token');

    const resolvedBuildScansPath = path.resolve(baseDirectory, buildScansPath);
    if (fs.existsSync(resolvedBuildScansPath)) {
        core.info(`Reading file ${resolvedBuildScansPath}`)
        const content = fs.readFileSync(resolvedBuildScansPath, 'utf-8');
        core.info(`File content: ${content}`)
    } else {
        core.warning(`File ${resolvedBuildScansPath} does not exist`);
        return;
    }

    const octokit = github.getOctokit(token)
    const createResponse = await octokit.checks.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: 'Build scans',
        head_sha: github.context.payload.pull_request ? github.context.payload.pull_request.head.sha : github.context.sha,
        details_url: 'https://www.gradle.com',
        status: 'completed',
        conclusion: 'success',
        output: {
            title: `Build scans`,
            summary: `While executing this workflow, one or more build scans were published.`,
            text: `Build scan link: [https://scans.gradle.com/s/foo123bar](https://scans.gradle.com/s/foo123bar)`
        }
    });

    const data = createResponse.data;
    const checksId = data.id;
    const checksName = data.name;

    core.info(`Id: ${checksId}`)
    core.info(`Name: ${checksName}`)
}

main().catch(error => {
    console.error(error.stack)
    core.setFailed(`Build scan annotations action: ${error.message}`)
})
