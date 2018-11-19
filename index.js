const getFixupStatus = require('./lib/fixup.js')

module.exports = app => {
  app.on(['pull_request.opened', 'pull_request.synchronize', 'check_run.requested'], check)
  
  async function check (context) {
    const pr = context.payload.pull_request

    const compare = await context.github.repos.compareCommits(context.repo({
      base: pr.base.sha,
      head: pr.head.sha
    }))

    const commits = compare.data.commits
    const fixupFailed = await getFixupStatus(commits)
    
    if (!fixupFailed.length) {
      // All is well
      return context.github.checks.create(context.repo({
        name: 'fixupbot',
        head_branch: pr.head.ref,
        head_sha: pr.head.sha,
        status: 'completed',
        conclusion: 'success',
        completed_at: new Date(),
        output: {
          title: 'No fixup commits found. The commit history is clean 👍',
          summary: 'No fixup commits found'
        }
      }))
    } else {
      const summary = 'Fixup commits should not be merged.\n\n' +
      'When this PR is finished and reviewed please squash your fixup commits with: \n' + 
      '`git rebase --interactive --autosquash ' + commits[0].sha + '^`\n\n' +
      'Note that you will have to use the `--force` option for the next push.'

      return context.github.checks.create(context.repo({
        name: 'fixupbot',
        head_branch: pr.head.ref,
        head_sha: pr.head.sha,
        status: 'completed',
        conclusion: 'action_required',
        completed_at: new Date(),
        output: {
          title: 'Fixup commits detected',
          summary: summary
        }
      }))
    }
  }
}
