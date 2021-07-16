# Publish Terraform Cloud Module Action

This action creates a new private module in Terraform Cloud with a VCS connection to the current repository, if one does not already exist.

## Usage

```yaml
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: takescoop/publish-terraform-cloud-module-action@v1
        with:
          tf-organization: takescoop
          tf-token: "${{ secrets.TF_TOKEN }}"
```

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `tf-organization` | (Required) The Terraform Cloud organization name ||
| `tf-token` | (Required) A Terraform Cloud API token ||
| `repo` | The repository to publish. Format: `owner/name` | `${{github.repository}}` |
| `display-identifier` | The display identifier for the repository | `${{github.repository}}` |
| `tf-host` | The Terraform Cloud hostname | `app.terraform.io` |
| `vcs-token-id` | Token ID of the Terraform Cloud VCS client used in the VCS connection (overrides vcs-name) ||
| `vcs-name` | Name of the Terraform Cloud VCS client for the repository (not used if vcs-token-id is passed) | `GitHub.com` |

## Releasing

```sh
npm version (major|minor|patch) && git push --follow-tags
```
