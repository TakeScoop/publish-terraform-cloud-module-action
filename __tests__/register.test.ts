import {register, RegisterOptions} from '../src/register'
import {terraform, TerraformOptions} from '../src/lib/terraform'

import nock from 'nock'

beforeEach(() => {
  nock.cleanAll()
})

test('Should throw if the VCS client is not recognized', async () => {
  const regOpts: RegisterOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    vcsName: 'not-github'
  }
  const tfOpts: TerraformOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  nock(`https://${tfOpts.host}`)
    .get(`/api/v2/organizations/${regOpts.organization}/oauth-clients`)
    .reply(200, {
      data: [{attributes: {name: 'github'}}]
    })

  await expect(register(regOpts, terraform(tfOpts))).rejects.toMatchObject({
    message: `VCS client "${regOpts.vcsName}" not found`
  })
})

test('Should register the passed repository', async () => {
  const regOpts: RegisterOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    vcsName: 'github'
  }
  const tfOpts: TerraformOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  const vcsClientID = '123'
  const vcsTokenID = '456'

  const registration = {
    id: 'mod-123'
  }

  nock(`https://${tfOpts.host}`)
    .get(`/api/v2/organizations/${regOpts.organization}/oauth-clients`)
    .reply(200, {
      data: [
        {
          id: vcsClientID,
          attributes: {
            name: regOpts.vcsName
          }
        }
      ]
    })
    .get(`/api/v2/oauth-clients/${vcsClientID}/oauth-tokens`)
    .reply(200, {
      data: [
        {
          id: vcsTokenID
        }
      ]
    })
    .get(
      `/api/v2/organizations/${regOpts.organization}/registry-modules?filter=identifier%3Dorg%2Fterraform-unit-test`
    )
    .reply(200, {data: []})
    .post(`/api/v2/organizations/${regOpts.organization}/registry-modules/vcs`)
    .reply(200, {data: registration})

  await expect(register(regOpts, terraform(tfOpts))).resolves.toMatchObject(
    registration
  )
})

test('Should error if no tokens are associated with a VCS client', async () => {
  const regOpts: RegisterOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    vcsName: 'github'
  }
  const tfOpts: TerraformOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  const vcsClientID = '123'

  nock(`https://${tfOpts.host}`)
    .get(`/api/v2/organizations/${regOpts.organization}/oauth-clients`)
    .reply(200, {
      data: [
        {
          id: vcsClientID,
          attributes: {
            name: regOpts.vcsName
          }
        }
      ]
    })
    .get(`/api/v2/oauth-clients/${vcsClientID}/oauth-tokens`)
    .reply(200, {data: []})

  await expect(register(regOpts, terraform(tfOpts))).rejects.toMatchObject({
    message: `No OAuth tokens found for client "${regOpts.vcsName}"`
  })
})

test('Should return the registered repo if it has already been registered', async () => {
  const regOpts: RegisterOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    vcsName: 'github'
  }
  const tfOpts: TerraformOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  const vcsClientID = '123'
  const vcsTokenID = '456'
  const registration = {id: 'mod-123'}

  nock(`https://${tfOpts.host}`)
    .get(`/api/v2/organizations/${regOpts.organization}/oauth-clients`)
    .reply(200, {
      data: [
        {
          id: vcsClientID,
          attributes: {
            name: regOpts.vcsName
          }
        }
      ]
    })
    .get(`/api/v2/oauth-clients/${vcsClientID}/oauth-tokens`)
    .reply(200, {
      data: [
        {
          id: vcsTokenID
        }
      ]
    })
    .get(
      `/api/v2/organizations/${regOpts.organization}/registry-modules?filter=identifier%3Dorg%2Fterraform-unit-test`
    )
    .reply(200, {data: [registration]})

  await expect(register(regOpts, terraform(tfOpts))).resolves.toMatchObject(
    registration
  )
})

test('Should use the VCS token ID directly if passed', async () => {
  const regOpts: RegisterOptions = {
    organization: 'org',
    repo: 'org/terraform-unit-test',
    vcsTokenID: '123'
  }
  const tfOpts: TerraformOptions = {
    token: '12345',
    host: 'fake.terraform.io'
  }

  const registration = {
    id: 'mod-123'
  }

  nock(`https://${tfOpts.host}`)
    .get(
      `/api/v2/organizations/${regOpts.organization}/registry-modules?filter=identifier%3Dorg%2Fterraform-unit-test`
    )
    .reply(200, {data: []})
    .post(`/api/v2/organizations/${regOpts.organization}/registry-modules/vcs`)
    .reply(200, {data: registration})

  await expect(register(regOpts, terraform(tfOpts))).resolves.toMatchObject(
    registration
  )
})
