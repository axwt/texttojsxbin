
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

function GetESDInterface() {
	const platform = `${process.platform}`;
	const platformArch = `${process.arch}`;
	var esdinterface = undefined;
	const extensionPath = vscode.extensions.getExtension("adobe.extendscript-debug");
	var ESdebugExtensionPath = extensionPath!.extensionPath;

	// require doesn't work

	if (platform === "darwin") {
		esdinterface = require(ESdebugExtensionPath + "/node_modules/@esdebug/esdebugger-core/mac/esdcorelibinterface.node");
	} else if (platform === "win32") {
		if (platformArch === "x64" || platformArch === "arm64") {
			esdinterface = require(ESdebugExtensionPath + "/node_modules/@esdebug/esdebugger-core/win/x64/esdcorelibinterface.node");
		} else {
			esdinterface = require(ESdebugExtensionPath + "/node_modules/@esdebug/esdebugger-core/win/win32/esdcorelibinterface.node");
		}
		
		if (esdinterface === undefined) {
			console.log("Platform not supported: " + platform);
			process.exit(1);
		}
	}
	
	return esdinterface;

}

function fetchLastErrorAndExit() {
    var errorInfo = undefined;
    var error = GetESDInterface().esdGetLastError();
    if(error.status !== 0){
        if(error.data) {
            errorInfo = error.data;
        }
    }
    if(errorInfo !== undefined) {
        console.log("Unable to proceed. Error Info: " + errorInfo);
    }
    process.exit(1);
}

function init() {
		var initData = GetESDInterface().esdInit();

    if(initData.status !== 0) {
        console.log("Unable to proceed. Error Code: " + initData.status);
        fetchLastErrorAndExit();
		}
		
}
function destroy() {
    GetESDInterface().esdDestroy();
}

function exportContentToJSX(scriptSource: any) {

	var compiledSource = "";

	var apiData = GetESDInterface().esdCompileToJSXBin(scriptSource, "", "");
	if(apiData.status !== 0){
			console.log("Unable to proceed. Error Code: " + apiData.status);
			fetchLastErrorAndExit();
	} else {
			compiledSource = apiData.data;
	}

	return compiledSource;

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


			
			// Get the word within the selection
			let textToEncode = document.getText(selection);
			let encodedText = "";
			let textToReplace = "";
			
			init();
			
			try {
				encodedText = exportContentToJSX(textToEncode);

				if (encodedText === "") {
					// Display a message box to the user
					vscode.window.showInformationMessage("There was an issue encoding the selection. Please, check your code.");
					destroy();
					process.exit(1);
					return false;
				}

				textToReplace = textToEncode.replace(/^/gm,"// ") + "\n\neval(\"" + encodedText + "\");";
				// Display a message box to the user
				// vscode.window.showInformationMessage("Converted to JSXBIN");
			} catch(error) {
				console.log(error);
				destroy();
				process.exit(1);
			}

			editor.edit(editBuilder => {
				editBuilder.replace(selection, textToReplace);
			});

			// console.log("Replaced\n\n");

			destroy();

		}

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
