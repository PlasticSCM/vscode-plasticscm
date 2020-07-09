<p align="center">
  <img src="images/logo-full.png" alt="Plastic SCM" width="400" />
</p>

# Plastic SCM integration with VS Code's SCM features

![CI](https://github.com/PlasticSCM/vscode-plasticscm/workflows/CI/badge.svg)

## Intro

[`plastic-scm`](https://marketplace.visualstudio.com/items?itemName=plastic-scm.plastic-scm)
is a Visual Studio Code extension that integrates [Plastic SCM](https://www.plasticscm.com/).
With this plugin, you can use Plastic SCM as your SCM tool. It is powered by
[Codice Software](https://www.plasticscm.com/).

This plugin contains a subset of Plastic SCM commands and features. We will
extend it in the future, and we hope it will be useful and convenient to use.

## Requirements

* Visual Studio Code v1.19
* Plastic SCM

## Features

1. Lists your pending changes
2. Allows you to checkin all your pending changes at once

## Install

1. Install *Visual Studio Code* (1.19 or higher)
2. Launch *Code*
3. Open the command palette : `Ctrl` `⇧` `P` (Windows, Linux), `⌘` `⇧` `P` (macOS)
4. Select `Install Extensions`
5. Choose the extension `Plastic SCM`
6. Reload *Visual Studio Code*

## Configure

|Name                                             |Type     |Description
|-------------------------------------------------|---------|-----------
|`plastic-scm.autorefresh`                        |`boolean`|Whether the extension should automatically look for changes in the workspace
|`plastic-scm.enabled`                            |`boolean`|Whether the extension is enabled
|`plastic-scm.cmConfiguration.cmPath`             |`string` |Location of the `cm` CLI executable
|`plastic-scm.cmConfiguration.millisToStop`       |`number` |Grace time to wait before requesting a shell to closeshell to start
|`plastic-scm.cmConfiguration.millisToWaitUntilUp`|`number` |Time to wait for the shell to start

## Commands

We're working to add more! 👷‍♀️👨‍🏭

### Checkin

You can type in the input field in the SCM view and hit `Ctrl+Enter` to checkin
**all your pending changes**. We don't support selecting what items you want to
check in at the moment.

You can also invoke the Checkin command using the Command Palette. You'll be
prompted to enter a commit message in that case.

## Contribute

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## Credits

* [Visual Studio Code](https://code.visualstudio.com/)
* [vscode-docs on GitHub](https://github.com/Microsoft/vscode-docs)

## License

[MIT](LICENSE.md)
