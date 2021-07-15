# Terraform Register Module Action

This action creates a new private module in Terraform Cloud with a VCS connection to the current repository, if one does not already exist.

## Usage

```yaml
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: takescoop/terraform-register-module-action@v1
        with:
          repo: "${{ github.repository }}"
          tf-organization: takescoop
          tf-token: "${{ secrets.TF_TOKEN }}"
          vcs-name: Github
```

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `repo` | (Required) The repository to register. Format: `owner/name` ||
| `tf-organization` | (Required) The Terraform Cloud organization name ||
| `tf-token` | (Required) A Terraform Cloud API token ||
| `tf-host` | The Terraform Cloud hostname | `app.terraform.io` |
| `vcs-token-id` | Token ID of the Terraform Cloud VCS client used in the VCS connection (overrides vcs-name) ||
| `vcs-name` | Name of the Terraform Cloud VCS client for the repository ||

## Releasing

```sh
npm version (major|minor|patch) && git push --follow-tags
```
