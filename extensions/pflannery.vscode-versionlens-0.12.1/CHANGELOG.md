- 0.12.1
  - Fixes an issue where code lenses were not showing for jspm in package.json
  
- 0.12.0

  - Adds ability to provide github access token to avoid github api rate limiting

    Tokens can be provided by setting `versionlens.github.accessToken` in your user settings. To generate a token see https://help.github.com/articles/creating-an-access-token-for-command-line-use/#creating-a-token

    When no token is provided then access to the api will be rate limited to 60 requests every 10 minutes or so.

  - Adds indication for github packages that dont exist

  - Project dependency properties can now be customised via vscode settings. The default settings keep the previoussetup so nothing will break.

    ```json
    // vscode settings.json example
    {
      "versionlens.npm.dependencyProperties": [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
        "myCustomDependencies"
      ]
    }
    ```

- 0.11.0
  - Can now choose to update all packages within a dependency section. i.e. update all beneath devDependencies.

    ![update-all-example](https://cloud.githubusercontent.com/assets/1727302/20415826/c7244f98-ad32-11e6-9c25-ada420828d8c.gif)

    **Note**

      - Because code lenses are not generated until they are viewed in the editor then only code lenses that have been viewed since opening the document can be updated. 
        If you have many dependencies that go off the screen then just scroll them all in to view once before running the update all command for maximum coverage.
      - This functionality ignores github and file package entries.

  - Now checks if an npm `file:` package path exists and provides indication when the resource does not exist.

    ![file-existence](https://cloud.githubusercontent.com/assets/1727302/20415939/7b1843d8-ad33-11e6-8444-bc4ae6d8e555.gif)

- 0.10.0
  - Added github commitish support for npm, jspm and bower. Doesn't support pre-releases yet.

    ![npm-comittish](https://cloud.githubusercontent.com/assets/1727302/20376535/69a638a8-ac7f-11e6-8408-857759c21106.gif)

    Also supports semver releases\tags 

    ![npm-comittish2](https://cloud.githubusercontent.com/assets/1727302/20376610/1669b59c-ac80-11e6-9415-94ed83066f0b.gif)

- 0.9.1
  - Fixes invalid message when using tags i.e. @next

- 0.9.0
  - Github and local file system packages are now treated as clickable links that browse to their respective destinations. (git urls are not implemented yet)

- 0.8.0
  - Added support for npm private packages and private registries

- 0.7.1
  - Replaces update arrow indicator to be a unicode charachter due to change in vscode 1.7. See https://github.com/Microsoft/vscode/issues/13714 for more info.

- 0.7.0
  - Adds support for preserving some semver operators when updating

- 0.6.0
  - Added jspm package support

- 0.5.0
  - Added npm scoped packages support

- 0.4.3
  - Fixes versionlens for dub sub packages

- 0.4.2
  - Transferred this project over to https://github.com/vscode-contrib/vscode-versionlens

- 0.4.1
  - Replaces internal json module with external
  - Replaces internal request module with external

- 0.4.0
  - Adds dotnet project.json support
  - Fixes issue when a child version entry is not present

- 0.3.0
  - Adds dub dub.json support