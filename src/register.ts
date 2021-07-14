import {terraform, TerraformInstance, TerraformResponse} from './lib/terraform'
import * as core from '@actions/core'

export interface RegisterOptions {
  organization: string
  repo: string
  vcsTokenID?: string
  vcsName?: string
}

async function lookupVCSTokenID(
  tf: TerraformInstance,
  organization: string,
  vcsName: string
): Promise<string> {
  const oauthClients = await tf({
    url: `/api/v2/organizations/${organization}/oauth-clients`,
    method: 'get'
  })

  const matchingClients = oauthClients.data.data.filter(
    (client: any) => client.attributes.name === vcsName
  )

  if (!matchingClients.length) {
    throw new Error(`VCS client "${vcsName}" not found`)
  }

  const oauthTokens = await tf({
    url: `/api/v2/oauth-clients/${matchingClients[0].id}/oauth-tokens`,
    method: 'get'
  })

  if (!oauthTokens.data.data.length) {
    throw new Error(`No OAuth tokens found for client "${vcsName}"`)
  }

  return oauthTokens.data.data[0].id
}

export async function register(
  {organization, repo, vcsTokenID, vcsName}: RegisterOptions,
  tf: TerraformInstance
): Promise<{string: any}> {
  const tokenID =
    vcsTokenID || (await lookupVCSTokenID(tf, organization, vcsName!))

  const registered = await tf({
    url: `/api/v2/organizations/${organization}/registry-modules`,
    method: 'get',
    params: {
      filter: `identifier=${repo}`
    }
  })

  if (registered.data.data.length) {
    core.info(`Repository "${repo}" is already registered`)
    return registered.data.data[0]
  }

  try {
    const registered = await tf({
      url: `/api/v2/organizations/${organization}/registry-modules/vcs`,
      method: 'post',
      data: {
        data: {
          type: 'registry-modules',
          attributes: {
            vcs_repo: {
              identifier: repo,
              'oauth-token-id': tokenID,
              display_identifier: repo
            }
          }
        }
      }
    })

    core.info(`Repository "${repo}" was registered`)

    return registered.data.data
  } catch (err) {
    core.error(JSON.stringify(err.response.data))
    throw err
  }
}
