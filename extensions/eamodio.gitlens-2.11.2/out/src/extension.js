'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const blameabilityTracker_1 = require("./blameabilityTracker");
const blameActiveLineController_1 = require("./blameActiveLineController");
const blameAnnotationController_1 = require("./blameAnnotationController");
const blameAnnotationFormatter_1 = require("./blameAnnotationFormatter");
const commands_1 = require("./commands");
const commands_2 = require("./commands");
const commands_3 = require("./commands");
const commands_4 = require("./commands");
const commands_5 = require("./commands");
const commands_6 = require("./commands");
const commands_7 = require("./commands");
const commands_8 = require("./commands");
const commands_9 = require("./commands");
const constants_1 = require("./constants");
const gitContentProvider_1 = require("./gitContentProvider");
const gitProvider_1 = require("./gitProvider");
const gitRevisionCodeLensProvider_1 = require("./gitRevisionCodeLensProvider");
const logger_1 = require("./logger");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.Logger.configure(context);
        if (!vscode_1.workspace.rootPath) {
            logger_1.Logger.warn('GitLens inactive: no rootPath');
            return;
        }
        const rootPath = vscode_1.workspace.rootPath.replace(/\\/g, '/');
        logger_1.Logger.log(`GitLens active: ${rootPath}`);
        const config = vscode_1.workspace.getConfiguration('gitlens');
        const gitPath = config.get('advanced').git;
        blameAnnotationFormatter_1.configureCssCharacters(config.get('blame'));
        let repoPath;
        try {
            repoPath = yield gitProvider_1.Git.repoPath(rootPath, gitPath);
        }
        catch (ex) {
            logger_1.Logger.error(ex);
            if (ex.message.includes('Unable to find git')) {
                yield vscode_1.window.showErrorMessage(`GitLens was unable to find Git. Please make sure Git is installed. Also ensure that Git is either in the PATH, or that 'gitlens.advanced.git' is pointed to its installed location.`);
            }
            commands_1.setCommandContext(commands_1.CommandContext.Enabled, false);
            return;
        }
        const version = gitProvider_1.Git.gitInfo().version;
        const [major, minor] = version.split('.');
        if (parseInt(major, 10) < 2 || parseInt(minor, 10) < 2) {
            yield vscode_1.window.showErrorMessage(`GitLens requires a newer version of Git (>= 2.2.0) than is currently installed (${version}). Please install a more recent version of Git.`);
        }
        let gitEnabled = vscode_1.workspace.getConfiguration('git').get('enabled');
        commands_1.setCommandContext(commands_1.CommandContext.Enabled, gitEnabled);
        context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(() => {
            if (gitEnabled !== vscode_1.workspace.getConfiguration('git').get('enabled')) {
                gitEnabled = !gitEnabled;
                commands_1.setCommandContext(commands_1.CommandContext.Enabled, gitEnabled);
            }
        }, this));
        context.workspaceState.update(constants_1.WorkspaceState.RepoPath, repoPath);
        const git = new gitProvider_1.GitProvider(context);
        context.subscriptions.push(git);
        const blameabilityTracker = new blameabilityTracker_1.BlameabilityTracker(git);
        context.subscriptions.push(blameabilityTracker);
        context.subscriptions.push(vscode_1.workspace.registerTextDocumentContentProvider(gitContentProvider_1.GitContentProvider.scheme, new gitContentProvider_1.GitContentProvider(context, git)));
        context.subscriptions.push(vscode_1.languages.registerCodeLensProvider(gitRevisionCodeLensProvider_1.GitRevisionCodeLensProvider.selector, new gitRevisionCodeLensProvider_1.GitRevisionCodeLensProvider(context, git)));
        const annotationController = new blameAnnotationController_1.BlameAnnotationController(context, git, blameabilityTracker);
        context.subscriptions.push(annotationController);
        const activeLineController = new blameActiveLineController_1.BlameActiveLineController(context, git, blameabilityTracker, annotationController);
        context.subscriptions.push(activeLineController);
        context.subscriptions.push(new commands_9.Keyboard(context));
        context.subscriptions.push(new commands_2.CloseUnchangedFilesCommand(git, repoPath));
        context.subscriptions.push(new commands_2.OpenChangedFilesCommand(git, repoPath));
        context.subscriptions.push(new commands_3.CopyMessageToClipboardCommand(git, repoPath));
        context.subscriptions.push(new commands_3.CopyShaToClipboardCommand(git, repoPath));
        context.subscriptions.push(new commands_4.DiffDirectoryCommand(git, repoPath));
        context.subscriptions.push(new commands_4.DiffLineWithPreviousCommand(git));
        context.subscriptions.push(new commands_4.DiffLineWithWorkingCommand(git));
        context.subscriptions.push(new commands_4.DiffWithNextCommand(git));
        context.subscriptions.push(new commands_4.DiffWithPreviousCommand(git));
        context.subscriptions.push(new commands_4.DiffWithWorkingCommand(git));
        context.subscriptions.push(new commands_5.ShowBlameCommand(annotationController));
        context.subscriptions.push(new commands_5.ToggleBlameCommand(annotationController));
        context.subscriptions.push(new commands_6.ShowBlameHistoryCommand(git));
        context.subscriptions.push(new commands_6.ShowFileHistoryCommand(git));
        context.subscriptions.push(new commands_7.ShowQuickCommitDetailsCommand(git));
        context.subscriptions.push(new commands_7.ShowQuickCommitFileDetailsCommand(git));
        context.subscriptions.push(new commands_7.ShowQuickFileHistoryCommand(git));
        context.subscriptions.push(new commands_7.ShowQuickRepoHistoryCommand(git, repoPath));
        context.subscriptions.push(new commands_7.ShowQuickRepoStatusCommand(git, repoPath));
        context.subscriptions.push(new commands_8.ToggleCodeLensCommand(git));
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map