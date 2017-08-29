# create-conventional-pkg

`create-conventional-pkg` is a cli tool, which you should use to initialize new
nodejs projects.

I created this project so I don't have to remember all the steps in setting up
my new projects to follow a manageable commit standard. If you choose to use
`create-conventional-pkg`, I hope you find it useful.

It will create the folder you specify when calling the cli tool, and then go
ahead and install the following packages:

- [@commitlint/cli](https://github.com/marionebl/commitlint/tree/master/%40commitlint/cli)
- [@commitlint/config-angular](https://github.com/marionebl/commitlint/tree/master/%40commitlint/commitlint-config-angular) (config-angular is default, but you can specify a different commitlint config when running create-conventional-pkg)
- [commitizen](https://github.com/commitizen/cz-cli)
- [cz-conventional-changelog](https://github.com/commitizen/cz-conventional-changelog)
- [husky](https://github.com/typicode/husky)
- [standard-version](https://github.com/conventional-changelog/standard-version)

## Getting started

### install
```bash
npm install -g create-conventional-pkg
```

### use
```bash
Usage: create-conventional-pkg <project-directory> [options]

  Options:

    -V, --version                                output the version number
    -y, --yes                                    skips the interactive session and generates a package.json based on your defaults
    -c, --commitlint-config [commitlint-config]  optional commitlint-config to use (defaults to @commitlint/config-angular)
    -h, --help                                   output usage information
```

#### examples
```bash
create-conventional-pkg my-awesome-package
```
This will create the directory `my-awesome-package` in the current directory,
and initialize it for git, setting up commit hooks and scripts for committing
using the `config-angular` commitlint config.
You will be asked to answer all init questions to create the
`my-awesome-package` package.


```bash
create-conventional-pkg my-awesome-package --yes
```
This will create the directory `my-awesome-package` in the current directory,
and initialize it for git, setting up commit hooks and scripts for committing
using the `config-angular` commitlint config.
Your npm defaults will be used for the package.json content and you will not be
asked any questions to create the `my-awesome-package` package.


```bash
create-conventional-pkg my-awesome-package --yes --commitlint-config '@commitlint/config-lerna-scopes'
```
This will create the directory `my-awesome-package` in the current directory,
and initialize it for git, setting up commit hooks and scripts for committing
using the `config-lerna-scopes` commitlint config.
Your npm defaults will be used for the package.json content and you will not be
asked any questions to create the `my-awesome-package` package.

### configuring commitlint
commitlint can be configured directly in your package.json file via the
config.commitLint.rules property.
The default rules are:
```javascript
"rules": {
  "scope-enum": [
    2,
    "always",
    [
      "config",
      "deps",
      "info",
      "module",
      "package",
      "release",
      "script",
      "utility"
    ]
  ]
}
```
All rules are configurable as per the [commitlint documentation](http://marionebl.github.io/commitlint/#/reference-rules)

If you find this useful, awesome, otherwise, please feel free to create an
[issue](https://github.com/thtliife/create-conventional-pkg/issues)
and i will try to help you out.
