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

    const octokit = github.getOctokit(core.getInput('token'), {userAgent : "ddd", log: {
            debug: console.debug,
            info: console.info,
            warn: console.warn,
            error: console.error
        },})

    const r = octokit.checks.create({
        owner: github.context.repo.owner,
        repo: github.context.repo,
        name: 'Build scans',
        head_sha: github.context.payload.pull_request ? github.context.payload.pull_request.head.sha : github.context.sha,
        status: 'in_progress'
    });
    r.catch(e => core.error(`Error: ${e}`)).then(x => core.info(`Response: ${x}`))

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
} catch (error) {
    core.setFailed(error.message);
}
