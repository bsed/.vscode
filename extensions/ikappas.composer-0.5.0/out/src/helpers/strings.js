/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
/* tslint:disable:variable-name */
var Strings = (function () {
    function Strings() {
    }
    Strings.ExecutingCommand = 'Executing: composer {0}';
    Strings.InputPackageName = 'Input package name';
    Strings.InputPackageNamePlaceHolder = 'namespace/name [version]';
    Strings.ComposerArchiveInput = 'Optional. Input options, package name and/or version to archive.';
    Strings.ComposerArchivePlaceHolder = '[options] [--] [<package>] [<version>]';
    Strings.ComposerDumpAutoloadInput = 'Optional. Input options to use.';
    Strings.ComposerDumpAutoloadPlaceHolder = '[options]';
    Strings.ComposerShowInput = 'Composer Show Arguments';
    Strings.ComposerShowPlaceHolder = '[options] [--] [<package>] [<version>]';
    Strings.ComposerRequireInput = 'Input options and the name(s) of the package(s) to add';
    Strings.ComposerRequirePlaceHolder = '[options] [--] [<packages>] ...';
    Strings.ComposerRemoveInput = 'Input options and the name(s) of the package(s) to remove';
    Strings.ComposerRemovePlaceHolder = '[options] [--] [<packages>] ...';
    Strings.ComposerRunScriptInput = '';
    Strings.ComposerRunScriptPlaceHolder = '[options] [--] [<script>] [<args>] ...';
    Strings.CommandCompletedSuccessfully = 'Command completed successufully.';
    Strings.CommandCompletedWithErrors = 'Command completed with errors.';
    // Errors
    Strings.ComposerNotFound = 'Composer could not be found in the system.';
    Strings.ComposerProjectRequired = 'Open a folder with a composer project in order to access composer features.';
    return Strings;
}());
exports.Strings = Strings;
/* tslint:enable:variable-name */
//# sourceMappingURL=strings.js.map