module.exports = async function (commits) {
    const regex = /^fixup! .*$/im
    let failed = []

    for (const { commit, parents, sha } of commits) {
        const isMerge = parents && parents.length > 1

        if (isMerge) {
            continue
        }

        const match = regex.exec(commit.message)

        if (match === null) {
            continue
        }

        failed.push({sha})
    }

    return failed
}