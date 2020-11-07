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
    core.info(`Response: ${r}`)

    // var gh = new GitHub({
    //     username: 'FOO',
    //     password: 'NotFoo'
    //     /* also acceptable:
    //        token: 'MY_OAUTH_TOKEN'
    //      */
    // });
    //
    // this.client = (new github.GitHub({
    //   auth: token,
    // }) as unknown) as Octokit
    // this.context = github.context
    // this.owner = this.context.repo.owner
    // this.repo = this.context.repo.repo
    // this.sha = this.context.payload.pull_request?.head.sha ?? this.context.sha
    //
    // const response = await this.client.checks.create({
    //     owner,
    //     repo,
    //     name,
    //     head_sha: sha,
    //     status: 'in_progress',
    // })
}

main().catch(error => {
    console.error(error.stack)
    core.setFailed(`Build scan annotations action: ${error.message}`)
})
