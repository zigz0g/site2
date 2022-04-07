# vibeOS Development
This repository contains the most current version of "new" vibeOS. This repository and the code within are private and not to be released until further notice. The following instructions are WIP by Divide.

## Building:

```npm install```

```node ./index.js```

run dist.html

## Creating the docs

Make sure you have installed all the modules with:

```npm install```

Run

```node docs```

Check ```./basefs/var/docs/```

## Making docs

See https://devdocs.io/jsdoc/tags-example for format

To add a file, add the path in build.json => docs

## todo:

- convert .png files to .webp automatically + routing .png files to .webp in filesystem

## FS

https://nodejs.org/api/fs.html

### todo:

- [fs.watch](https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener)

- [fs.watchFile](https://nodejs.org/api/fs.html#fs_fs_watchfile_filename_options_listener)

- [fs.rename](https://nodejs.org/api/fs.html#fs_fs_rename_oldpath_newpath_callback)

- filesystem classes

- streams

- [fs.promises](https://nodejs.org/api/fs.html#fs_fs_promises_api)