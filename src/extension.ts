
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface ESDInterface {
	init(): void;
	destroy(): void;
	exportContentToJSX(scriptSource: string): string;
}

function getESDInterface(): ESDInterface | null {
	const extensionPath = vscode.extensions.getExtension("adobe.extendscript-debug");
	const ESdebugExtensionPath = extensionPath!.extensionPath;
	const ESdebugExtensionVersion = extensionPath!.packageJSON.version;
	const version = ESdebugExtensionVersion.match(/(\d+)\.(\d+)\.(\d+)/);
	const majorVersion = parseInt(version[1], 10);
	switch(majorVersion) {
		case 1:
			return getESDInterfaceV1(ESdebugExtensionPath);
		default:
			return getESDInterfaceV2(ESdebugExtensionPath);
	}
}

function getESDInterfaceV1(extensionPath: string): ESDInterface | null {
	const platform = `${process.platform}`;
	const platformArch = `${process.arch}`;
	let coreLib: any = undefined;
	if (platform === "darwin") {
		coreLib = require(extensionPath + "/node_modules/@esdebug/esdebugger-core/mac/esdcorelibinterface.node");
	} else if (platform === "win32") {
		if (platformArch === "x64" || platformArch === "arm64") {
			coreLib = require(extensionPath + "/node_modules/@esdebug/esdebugger-core/win/x64/esdcorelibinterface.node");
		} else {
			coreLib = require(extensionPath + "/node_modules/@esdebug/esdebugger-core/win/win32/esdcorelibinterface.node");
		}		
		if (coreLib === undefined) {
			console.log("Platform not supported: " + platform);
			return null;
		}
	}

	const esdinterface = {
		init() {
			const initData = coreLib.esdInit();
			if (initData.status !== 0) {
				console.log("Unable to proceed. Error Code: " + initData.status);
			}
		},
		destroy() {
			coreLib.esdDestroy();
		},
		exportContentToJSX(scriptSource: string) {
			let compiledSource = "";

			const apiData = coreLib.esdCompileToJSXBin(scriptSource, "", "");
			if (apiData.status !== 0) {
				console.log("Unable to proceed. Error Code: " + apiData.status);
			} else {
				compiledSource = apiData.data;
			}

			return compiledSource;
		}
	};

	return esdinterface;
}

function getESDInterfaceV2(extensionPath: string): ESDInterface | null{
	const platform = `${process.platform}`;
	const platformArch = `${process.arch}`;
	let coreLib: any = undefined;
	if (platform === "darwin") {
		coreLib = require(extensionPath + "/lib/esdebugger-core/mac/esdcorelibinterface.node");
	} else if (platform === "win32") {
		if (platformArch === "x64" || platformArch === "arm64") {
			coreLib = require(extensionPath + "/lib/esdebugger-core/win/x64/esdcorelibinterface.node");
		} else {
			coreLib = require(extensionPath + "/lib/esdebugger-core/win/win32/esdcorelibinterface.node");
		}		
		if (coreLib === undefined) {
			console.log("Platform not supported: " + platform);
			return null;
		}
	}

	const esdinterface = {
		init() {
			const result = coreLib.esdInitialize('vscesd', process.pid);
			if (result.status !== 0 && result.status !== 11) {
				console.log("Unable to proceed. Error Code: " + result.status);
			}
		},
		destroy() {
			coreLib.esdCleanup();
		},
		exportContentToJSX(scriptSource: string) {
			let compiledSource = "";

			const apiData = coreLib.esdCompileToJSXBin(scriptSource, "", "");
			if (apiData.status !== 0) {
				console.log("Unable to proceed. Error Code: " + apiData.status);
			} else {
				compiledSource = apiData.output;
			}

			return compiledSource;
		}
	};

	return esdinterface;
}

function buildReplacementText(textToEncode: String, encodedText: String) {
	const config = vscode.workspace.getConfiguration('extension');

	let commentedText = '/*\n' + textToEncode + '\n*/';
	if (config.useLineComment) {
		commentedText = '// ' + textToEncode.replace(/\n/gm, '\n// ');
	}

	let quotes = "'";
	if (config.useDoubleQuotes) {
		quotes = '"';
	}

	let evalString = encodedText.replace('@2.0@', '@2.1@').replace(/\n/g, '');
	evalString = 'eval(' + quotes + evalString + quotes + ');';

	let textToReplace = evalString + '\n\n' + commentedText;
	if (config.evalPlacementBottom) {
		textToReplace = commentedText + '\n\n' + evalString;
	}

	return textToReplace;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		// console.log('Congratulations, your extension "texttojsxbin" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.texttojsxbin', () => {
		// The code you place here will be executed every time your command is executed

		let editor = vscode.window.activeTextEditor;
		let extensions = vscode.extensions;
		let workspace = vscode.workspace;

		if (editor) {
			let document = editor.document;
			let selection = editor.selection;

			let textToEncode = document.getText(selection);
			let encodedText = "";
			let textToReplace = "";

			const esdinterface = getESDInterface();
			if (!esdinterface) {
				vscode.window.showInformationMessage("Unable to load Core Lib.");
				return;
			}
			
			esdinterface.init();
			
			try {
				encodedText = esdinterface.exportContentToJSX(textToEncode);

				if (encodedText === "") {
					// Display a message box to the user
					vscode.window.showInformationMessage("There was an issue encoding the selection. Please, check your code.");
					esdinterface.destroy();
					return;
				}

				textToReplace = buildReplacementText(textToEncode, encodedText);

			} catch(error) {
				console.log(error);
				esdinterface.destroy();
				return;
			}

			editor.edit(editBuilder => {
				editBuilder.replace(selection, textToReplace);
			});

			esdinterface.destroy();

		}

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
