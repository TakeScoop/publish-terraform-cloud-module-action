import {publish, PublishOptions} from '../src/publish'
import * as terraform from '../src/lib/terraform'

import nock from 'nock'

beforeEach(() => {
  nock.cleanAll()
})

test('Should throw if the VCS client is not recognized', async () => {
  const pubOpts: PublishOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    displayIdentifier: 'org/terraform-unit-test',
    vcsName: 'not-github'
  }
  const tfOpts: terraform.ClientOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://fake.terraform.io`)
    .get(`/api/v2/organizations/org/oauth-clients`)
    .reply(200, {
      data: [{attributes: {name: 'github'}}]
    })

  await expect(
    publish(pubOpts, terraform.Client(tfOpts))
  ).rejects.toMatchObject({
    message: `VCS client "not-github" not found`
  })
})

test('Should publish the passed repository', async () => {
  const pubOpts: PublishOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    displayIdentifier: 'org/terraform-unit-test',
    vcsName: 'github'
  }
  const tfOpts: terraform.ClientOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://fake.terraform.io`)
    .get(`/api/v2/organizations/org/oauth-clients`)
    .reply(200, {
      data: [
        {
          id: '123',
          attributes: {
            name: 'github'
          }
        }
      ]
    })
    .get(`/api/v2/oauth-clients/123/oauth-tokens`)
    .reply(200, {data: [{id: '456'}]})
    .get(
      '/api/v2/organizations/org/registry-modules?q=test&filter[provider]=unit&page[size]=100&page[number]=1'
    )
    .reply(200, {
      data: [],
      meta: {
        pagination: {
          'next-page': null
        }
      }
    })
    .post(`/api/v2/organizations/org/registry-modules/vcs`)
    .reply(200, {
      data: {
        id: 'mod-123',
        attributes: {
          name: 'test',
          namespace: 'org',
          provider: 'terraform',
          'vcs-repo': {
            identifier: 'org/terraform-unit-test',
            'display-identifier': 'org/terraform-unit-test'
          }
        }
      }
    })

  await expect(
    publish(pubOpts, terraform.Client(tfOpts))
  ).resolves.toMatchObject({
    display: 'org/terraform-unit-test',
    id: 'mod-123',
    identifier: 'org/terraform-unit-test',
    link:
      'https://fake.terraform.io/app/org/registry/modules/private/org/test/terraform',
    name: 'test',
    namespace: 'org',
    provider: 'terraform'
  })
})

test('Should error if no tokens are associated with a VCS client', async () => {
  const pubOpts: PublishOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    displayIdentifier: 'org/terraform-unit-test',
    vcsName: 'github'
  }
  const tfOpts: terraform.ClientOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://fake.terraform.io`)
    .get(`/api/v2/organizations/org/oauth-clients`)
    .reply(200, {
      data: [
        {
          id: '123',
          attributes: {
            name: 'github'
          }
        }
      ]
    })
    .get(`/api/v2/oauth-clients/123/oauth-tokens`)
    .reply(200, {data: []})

  await expect(
    publish(pubOpts, terraform.Client(tfOpts))
  ).rejects.toMatchObject({
    message: `No OAuth tokens found for client "github"`
  })
})

test('Should return the published repo if it has already been published', async () => {
  const pubOpts: PublishOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    displayIdentifier: 'org/terraform-unit-test',
    vcsName: 'github'
  }
  const tfOpts: terraform.ClientOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://fake.terraform.io`)
    .get(`/api/v2/organizations/org/oauth-clients`)
    .reply(200, {
      data: [
        {
          id: '123',
          attributes: {
            name: 'github'
          }
        }
      ]
    })
    .get(`/api/v2/oauth-clients/123/oauth-tokens`)
    .reply(200, {
      data: [
        {
          id: '456'
        }
      ]
    })
    .get(
      '/api/v2/organizations/org/registry-modules?q=test&filter[provider]=unit&page[size]=100&page[number]=1'
    )
    .reply(200, {
      data: [
        {
          id: 'mod-123',
          attributes: {
            name: 'test',
            namespace: 'org',
            provider: 'terraform',
            'vcs-repo': {
              identifier: 'org/terraform-unit-test',
              'display-identifier': 'org/terraform-unit-test'
            }
          }
        }
      ],
      meta: {
        pagination: {
          'next-page': null
        }
      }
    })

  await expect(
    publish(pubOpts, terraform.Client(tfOpts))
  ).resolves.toMatchObject({
    display: 'org/terraform-unit-test',
    id: 'mod-123',
    identifier: 'org/terraform-unit-test',
    link:
      'https://fake.terraform.io/app/org/registry/modules/private/org/test/terraform',
    name: 'test',
    namespace: 'org',
    provider: 'terraform'
  })
})

test('Should use the VCS token ID directly if passed', async () => {
  const pubOpts: PublishOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    displayIdentifier: 'org/terraform-unit-test',
    vcsTokenID: '123'
  }
  const tfOpts: terraform.ClientOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://fake.terraform.io`)
    .get(
      '/api/v2/organizations/org/registry-modules?q=test&filter[provider]=unit&page[size]=100&page[number]=1'
    )
    .reply(200, {
      data: [],
      meta: {
        pagination: {
          'next-page': null
        }
      }
    })
    .post(`/api/v2/organizations/org/registry-modules/vcs`)
    .reply(200, {
      data: {
        id: 'mod-123',
        attributes: {
          name: 'test',
          namespace: 'org',
          provider: 'terraform',
          'vcs-repo': {
            identifier: 'org/terraform-unit-test',
            'display-identifier': 'org/terraform-unit-test'
          }
        }
      }
    })

  await expect(
    publish(pubOpts, terraform.Client(tfOpts))
  ).resolves.toMatchObject({
    display: 'org/terraform-unit-test',
    id: 'mod-123',
    identifier: 'org/terraform-unit-test',
    link:
      'https://fake.terraform.io/app/org/registry/modules/private/org/test/terraform',
    name: 'test',
    namespace: 'org',
    provider: 'terraform'
  })
})

test('Should paginate to determine whether the has already been published', async () => {
  const pubOpts: PublishOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    displayIdentifier: 'org/terraform-unit-test',
    vcsTokenID: '123'
  }
  const tfOpts: terraform.ClientOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://fake.terraform.io`)
    .get(
      '/api/v2/organizations/org/registry-modules?q=test&filter[provider]=unit&page[size]=100&page[number]=1'
    )
    .reply(200, {
      data: [],
      meta: {
        pagination: {
          'next-page': 2
        }
      }
    })
    .get(
      '/api/v2/organizations/org/registry-modules?q=test&filter[provider]=unit&page[size]=100&page[number]=2'
    )
    .reply(200, {
      data: [],
      meta: {
        pagination: {
          'next-page': null
        }
      }
    })
    .post(`/api/v2/organizations/org/registry-modules/vcs`)
    .reply(200, {
      data: {
        id: 'mod-123',
        attributes: {
          name: 'test',
          namespace: 'org',
          provider: 'terraform',
          'vcs-repo': {
            identifier: 'org/terraform-unit-test',
            'display-identifier': 'org/terraform-unit-test'
          }
        }
      }
    })

  await expect(
    publish(pubOpts, terraform.Client(tfOpts))
  ).resolves.toMatchObject({
    display: 'org/terraform-unit-test',
    id: 'mod-123',
    identifier: 'org/terraform-unit-test',
    link:
      'https://fake.terraform.io/app/org/registry/modules/private/org/test/terraform',
    name: 'test',
    namespace: 'org',
    provider: 'terraform'
  })
})
