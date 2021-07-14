import * as core from '@actions/core'
import {register} from './register'
import {terraform, TerraformOptions, TerraformInstance} from './lib/terraform'

async function main(): Promise<void> {
  try {
    const module = await register(
      {
        repo: core.getInput('repo'),
        organization: core.getInput('tf-organization'),
        vcsTokenID: core.getInput('vcs-token-id'),
        vcsName: core.getInput('vcs-name')
      },
      terraform({
        token: core.getInput('tf-token'),
        host: core.getInput('tf-host')
      } as TerraformOptions) as TerraformInstance
    )

    core.setOutput('module', JSON.stringify(module))
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()
