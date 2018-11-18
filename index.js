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
    const fixupFailed = await getFixupStatus(commits, app)
    
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
          title: 'No fixup commits found. The commit history is clean :+1:',
          summary: 'No fixup commits found'
        }
      }))
    } else {
      return context.github.checks.create(context.repo({
        name: 'fixupbot',
        head_branch: pr.head.ref,
        head_sha: pr.head.sha,
        status: 'completed',
        conclusion: 'action_required',
        completed_at: new Date(),
        output: {
          title: 'Fixup commits detected',
          summary: 'Fixup commits detected. Please rebase with autosquash before the merge.'
        }
      }))
    }
  }
}
