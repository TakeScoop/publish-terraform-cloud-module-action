# Terraform Register Module Action

Use this action to register a repository with a Terraform Cloud registry.

## Usage

```yaml
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: takescoop/terraform-register-module-action@v1
        with:
          repo: "{{ github.repository }}"
          tf-organization: takescoop
          tf-token: "{{ secrets.TF_TOKEN }}"
          vcs-name: Github
```

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `repo` | (Required) The repository to register. Format: `owner/name` ||
| `tf-organization` | (Required) The Terraform organization name ||
| `tf-token` | (Required) A Terraform token capable of making API requests ||
| `tf-host` | Terraform API domain name | `app.terraform.io` |
| `vcs-token-id` | Token ID of the Terraform VCS client to register the repository with (takes precedence over vcs-name) ||
| `vcs-name` | Name of the Terraform Cloud VCS client to register the repository with ||

## Releasing

```sh
npm version (major|minor|patch) && git push --follow-tags
```
