

# TextToJSXBIN

Convert JSX code to JSXBIN and put in the eval.
Requires [ExetndScript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) to run.

![TextToJSXBIN](/images/demo.gif)


## Installation

- ### From VSCode application
  - Open `Extensions` and type `TextToJSXBIN`.
  - Click `Install` and then `Reload` button.

- ### From GitHub
  - Download repository and unzip the package.
  - Copy `TextToJSXBIN-master` to `/Users/YOURUSER/.vscode/extensions` folder.

## In action

- Launch VSCode and open jsx file, or for testing just type `alert("Hello World")`.
- Select created piece of code.
- Right click of the mouse and choose `TextToJSXBIN`
- Or click `Cmd+R` on Mac or `Ctrl+R` on Windows or launch `Command Palette` with keyboard shortcut `F1` or `Cmd+Shift+P` and type `TextToJSXBIN` and click enter.
- Selected code will be converted to JSXBIN, put inside eval and original code will be commented.

## Troubleshooting

The following steps are good standard troubleshooting.

- Make sure the ESTK stand-alone application is closed
- Close Visual Studio Code
- Make sure there are no VS "Code Helper" processes in the Activity Monitor (Mac) or Task Manager (Windows)
- Restart Visual Studio Code

## Known issues

- None (so far)
