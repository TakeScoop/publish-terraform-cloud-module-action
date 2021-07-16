import * as core from '@actions/core'
import {publish} from './publish'
import * as terraform from './lib/terraform'

async function main(): Promise<void> {
  try {
    const module = await publish(
      {
        repo: core.getInput('repo'),
        displayIdentifier: core.getInput('display-identifier'),
        organization: core.getInput('tf-organization'),
        vcsTokenID: core.getInput('vcs-token-id'),
        vcsName: core.getInput('vcs-name')
      },
      terraform.Client({
        token: core.getInput('tf-token'),
        host: core.getInput('tf-host')
      } as terraform.ClientOptions)
    )

    core.setOutput('module', JSON.stringify(module))
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()
