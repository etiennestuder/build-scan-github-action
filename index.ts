const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main(): Promise<void> {
    // collect environment and inputs
    const runId = process.env[`GITHUB_RUN_ID`];
    const jobName = process.env[`GITHUB_JOB`];
    const baseDirectory = process.env[`GITHUB_WORKSPACE`] || '';
    const buildScansPath = core.getInput('build-scans-path') || './build-scans';
    const token = core.getInput('token');

    // resolve path to file containing build scans, and abort if file not found
    core.info(`Resolving file ${buildScansPath} from base directory ${baseDirectory}`);
    const resolvedBuildScansPath = path.resolve(baseDirectory, buildScansPath);

    if (!fs.existsSync(resolvedBuildScansPath)) {
        core.warning(`File ${resolvedBuildScansPath} does not exist`);
        return;
    }

    // read build scan links line-by-line from file, and abort if no build scan links present
    core.info(`Reading file ${resolvedBuildScansPath}`)
    const rl = readline.createInterface({
        input: fs.createReadStream(resolvedBuildScansPath, 'utf-8'),
        crlfDelay: Infinity
    });
    const buildScanLinks = [];
    for await (const line of rl) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
            buildScanLinks.push(trimmedLine);
        }
    }

    if (buildScanLinks.length === 0) {
        core.warning(`File ${resolvedBuildScansPath} does not contain any build scan links`);
        return;
    }

    // get all jobs that are part of the current work flow run
    const octokit = github.getOctokit(token);
    const listJobsResponse: any = await octokit.actions.listJobsForWorkflowRun({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        run_id: runId,
        filter: 'latest'
    });

    const jobs: any[] = listJobsResponse.data.jobs;
    core.info(`Number of jobs in current work flow run: ${jobs.length}`);
    core.debug(`Jobs: ${JSON.stringify(jobs)}`);

    // get details for each job of the current work flow run
    const getJobDetailsPromises: Promise<any>[] = jobs.map(job => {
        return octokit.actions.getJobForWorkflowRun({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            job_id: job.id
        });
    });

    const getJobDetailsResponses: any[] = await Promise.all(getJobDetailsPromises)
    core.info(`Job names: ${getJobDetailsResponses.map(job => job.data.name).join(', ')}`);
    core.info(`Job details: ${JSON.stringify(getJobDetailsResponses)}`);

    // prepare dynamic content of build scan pane shown in GitHub actions
    const numOfBuildScans = buildScanLinks.length;
    const summary = numOfBuildScans === 0 ? 'no build scans were published' :
        numOfBuildScans === 1 ? `a build scan was published` :
            `${numOfBuildScans} build scans were published`
    const buildScanLinksMarkdown = buildScanLinks.map(l => `[${l}](${l})`).join('\n');

    // create build scan pane via Github check request
    const title = jobs.length > 1 ? `Build scan [${jobName}]` : 'Build scan';
    const createResponse = await octokit.checks.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name: title,
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
