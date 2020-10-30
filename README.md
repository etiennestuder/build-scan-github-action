# build-scan-github-action

This Github action prominently exposes the build scan URL in the Annotations section.
## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

uses: actions/build-scan-github-action@v1
with:
  who-to-greet: 'Mona the Octocat'
