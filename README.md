<p align="center">
  <img src="images/logo-full.png" alt="Plastic SCM" width="400" />
</p>

# Plastic SCM integration with VS Code's SCM features


## Intro

[plasticscm](https://marketplace.visualstudio.com/items?itemName=Plastic.vscode-plasticscm)
is a Visual Studio Code extension that integrates [Plastic SCM](https://www.plasticscm.com/).
With this plugin, you can use Plastic SCM as your SCM tool. It is powered by
[Codice Software](https://www.plasticscm.com/).

This plugin contains a subset of Plastic SCM commands and features. We will
extend it in the future, and we hope it will be useful and convenient to use.

## Requirements

* Visual Studio Code v1.5
* Plastic SCM

## Features

1. Feature one
2. Feature two
3. Feature 3

## Install

1. Install *Visual Studio Code* (1.5 or higher)
2. Launch *Code*
3. From the command palette `ctrl+shift+p` (Windows, Linux) or `cmd+shift+p`
  (macOS)
4. Select `Install Extensions`
5. Choose the extension `Plastic SCM`
6. Reload *Visual Studio Code*

## Configure

|Name                               |Type       |Description
|-----------------------------------|-----------|-----------
|`plastic.user`                     |`string`   |Use the specified user
|`plastic.password`                 |`string`   |Use the specified password
|`plastic.confitem1`                |`string`   |Use item 1
|`plastic.confitem2`                |`string`   |Use item 2...

## Commands

* `workspace` - Create a new workspace
* `status` -  Get the status of the repository
* `update` -  Update to the last
* `branch` - Create a new branch
* `undo` - Undo all changes
* `checkin` - Add the changes to the branch
* `switch` - Switch or move to another branch

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
