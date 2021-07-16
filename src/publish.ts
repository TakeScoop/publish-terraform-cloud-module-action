import * as terraform from './lib/terraform'
import * as core from '@actions/core'
import {URL} from 'url'

export interface PublishOptions {
  organization: string
  repo: string
  displayIdentifier?: string
  vcsTokenID?: string
  vcsName?: string
}

export interface Module {
  id: string
  name: string
  namespace: string
  provider: string
  identifier: string
  display: string
  link?: string
}

export interface ModuleResponseData {
  id: string
  attributes: {
    name: string
    namespace: string
    provider: string
    'vcs-repo': {
      identifier: string
      'display-identifier': string
    }
  }
}

async function lookupVCSTokenID(
  tf: terraform.ClientInstance,
  organization: string,
  vcsName: string
): Promise<Module> {
  const oauthClients = await tf({
    url: `/organizations/${organization}/oauth-clients`,
    method: 'get'
  })

  const matchingClients = oauthClients.data.data.filter(
    (client: any) => client.attributes.name === vcsName
  )

  if (!matchingClients.length) {
    throw new Error(`VCS client "${vcsName}" not found`)
  }

  const oauthTokens = await tf({
    url: `/oauth-clients/${matchingClients[0].id}/oauth-tokens`,
    method: 'get'
  })

  if (!oauthTokens.data.data.length) {
    throw new Error(`No OAuth tokens found for client "${vcsName}"`)
  }

  return oauthTokens.data.data[0].id
}

function newModuleFromResponse({
  id,
  attributes: {
    name,
    namespace,
    provider,
    ['vcs-repo']: {identifier, ['display-identifier']: display}
  }
}: ModuleResponseData): Module {
  return {
    id,
    name,
    namespace,
    provider,
    identifier,
    display
  } as Module
}

export async function publish(
  {organization, repo, vcsTokenID, vcsName, displayIdentifier}: PublishOptions,
  tf: terraform.ClientInstance
): Promise<Module> {
  const tokenID =
    vcsTokenID || (await lookupVCSTokenID(tf, organization, vcsName!))

  const published = await tf({
    url: `/organizations/${organization}/registry-modules`,
    method: 'get',
    params: {
      filter: `identifier=${repo}`
    }
  })

  let rawModule: ModuleResponseData = published.data.data[0]

  if (!rawModule) {
    try {
      rawModule = (
        await tf({
          url: `/organizations/${organization}/registry-modules/vcs`,
          method: 'post',
          data: {
            data: {
              type: 'registry-modules',
              attributes: {
                vcs_repo: {
                  identifier: repo,
                  'oauth-token-id': tokenID,
                  display_identifier: displayIdentifier,
                }
              }
            }
          }
        })
      ).data.data as ModuleResponseData

      core.info(`Module "${rawModule.attributes.name}" from repository "${repo}" was published.`)
    } catch (err) {
      core.error(JSON.stringify(err.response.data))
      throw err
    }
  } else {
    core.info(`No action. Module "${rawModule.attributes.name}" from repository "${repo}" was already published.`)
  }

  const module = newModuleFromResponse(rawModule)

  const {origin} = new URL(tf.defaults.baseURL as string)
  module.link = `${origin}/app/${organization}/registry/modules/private/${module.namespace}/${module.name}/${module.provider}`

  core.info(module.link)
  
  return module
}
