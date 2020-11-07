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
    const r = await octokit.checks.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: 'Build scans',
        head_sha: github.context.payload.pull_request ? github.context.payload.pull_request.head.sha : github.context.sha,
        status: 'in_progress'
    });

    const data = r.data;
    core.info(`Response: ${data}`)

    core.info(`Id: ${data.id}`)
    core.info(`Name: ${data.name}`)
}

main().catch(error => {
    console.error(error.stack)
    core.setFailed(`Build scan annotations action: ${error.message}`)
})
