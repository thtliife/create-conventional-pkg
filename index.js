#!/usr/bin/env node
const chalk = require('chalk');
const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const prompt = require('prompt');
const spawn = require('cross-spawn');

const packageJson = require(path.join(__dirname, 'package.json'));

const dependencies = [
  '@commitlint/cli',
  'commitizen',
  'cz-conventional-changelog',
  'husky',
  'standard-version'
];

const gitignoredotioIsInstalled = () => {
  try {
    execSync('gitignore-dot-io --help', { stdio: 'ignore' });
    return true;
  } catch (e) {
    console.info(chalk.yellow(e));
    return false;
  }
};

const gitIsInstalled = () => {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

const yarnIsInstalled = () => {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

const npmIsInstalled = () => {
  try {
    execSync('npm --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

const packageManager = () => {
  const initArgs = ['init'];
  if (program.yes) {
    initArgs.push('--yes');
  }
  if (yarnIsInstalled()) {
    return {
      command: 'yarnpkg',
      installArgs: ['add', '--dev', ...dependencies],
      initArgs
    };
  }
  if (npmIsInstalled()) {
    return {
      command: 'npm',
      installArgs: ['install', '--save-dev', ...dependencies],
      initArgs
    };
  }
  return undefined;
};

const getGitIgnorePlatform = () => {
  try {
    const platforms = {
      darwin: 'osx',
      linux: 'linux',
      win32: 'windows'
    };
    return platforms[process.platform];
  } catch (e) {
    throw new Error(e);
  }
};

const pathExists = async path => {
  return new Promise((resolve, reject) => {
    fs
      .pathExists(path)
      .then(exists => resolve(exists))
      .catch(err => reject(err));
  });
};

const isSafeToCreateProjectIn = (root, name) => {
  // root: full path to project-dir, name: basename of project-dir
  const validFiles = [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    '.idea',
    'README.md',
    'LICENSE',
    'web.iml',
    '.hg',
    '.hgignore',
    '.hgcheck'
  ];
  console.log();

  const conflicts = fs
    .readdirSync(root)
    .filter(file => !validFiles.includes(file));
  if (conflicts.length < 1) {
    return true;
  }

  console.log(
    `The directory ${chalk.green(name)} contains files that could conflict:`
  );
  console.log();
  for (const file of conflicts) {
    console.log(`  ${file}`);
  }
  console.log();
  console.log(
    'Either try using a new directory name, or remove the files listed above.'
  );

  return false;
};

program
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} ${chalk.yellow('[options]')}`)
  .action(name => {
    projectName = name;
  })
  .option(
    '-y, --yes ',
    'skips the interactive session and generates a package.json based on your defaults'
  )
  .option(
    '-c, --commitlint-config [commitlint-config]',
    'optional commitlint-config to use (defaults to @commitlint/config-angular)'
  )
  .parse(process.argv);

let commitLintConfig;
if (typeof program.commitlintConfig === 'undefined') {
  commitLintConfig = '@commitlint/config-angular';
} else {
  commitLintConfig = program.commitlintConfig;
}
dependencies.push(commitLintConfig);

if (typeof projectName === 'undefined') {
  console.error(chalk.red('\nPlease specify the project directory'));
  program.outputHelp();
  process.exit(1);
}
const settings = {};
settings.addYesParm = program.yes ? program.yes : false;
settings.projectDir = path.resolve(process.cwd(), projectName);
settings.projectName = path.basename(settings.projectDir);
settings.packageManager = packageManager();
settings.git = gitIsInstalled()
  ? { command: 'git', args: ['init'] }
  : undefined;
settings.gitIgnoreDotIo = gitignoredotioIsInstalled()
  ? { command: 'gitignore-dot-io', args: ['node', getGitIgnorePlatform()] }
  : undefined;

if (typeof settings.packageManager === 'undefined') {
  console.error(
    chalk.red(
      '\nNo node package manager detected. Ensure node and npm/yarn is installed'
    )
  );
  program.outputHelp();
  process.exit(1);
}

if (typeof settings.git === 'undefined') {
  console.error(chalk.red('\nGit was not detected. Ensure git is installed'));
  program.outputHelp();
  process.exit(1);
}

fs.ensureDir(settings.projectDir);
if (!isSafeToCreateProjectIn(settings.projectDir, settings.projectName)) {
  process.exit(1);
}

const runCommand = async (command, args) => {
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: settings.projectDir
      });
      child.on('error', err => reject(err));
      child.on('close', code => {
        if (code !== 0) {
          reject({ command: `${command} ${args.join(' ')}` });
        }
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
};

const copyFile = async (source, dest, verbose) => {
  return new Promise((resolve, reject) => {
    fs.copy(source, dest, err => {
      if (err) {
        reject(err);
      }
      if (verbose) {
        console.log(chalk.green(`Created ${path.basename(dest)} successfully`));
      }
      resolve();
    });
  });
};

const updateJson = async (file, data, options) => {
  try {
    const fileExists = await pathExists(file);
    return new Promise((resolve, reject) => {
      const jsonData = fileExists ? require(file) : {};
      Object.assign(jsonData, data);
      fs.writeJson(file, jsonData, options).then(resolve()).catch(reject());
    });
  } catch (e) {
    return new Promise().reject(e);
  }
};

const install = async (command, args) => {
  try {
    await runCommand(settings.git.command, settings.git.args);
    await runCommand(
      settings.packageManager.command,
      settings.packageManager.initArgs
    );
    await runCommand(
      settings.packageManager.command,
      settings.packageManager.installArgs
    );
    await fs.copy(
      path.join(__dirname, 'templates', 'commitlint.config.template'),
      path.join(settings.projectDir, 'commitlint.config.js')
    );
    console.info(chalk.blue('created commitlint config'));
    updateJson(
      path.resolve(settings.projectDir, 'package.json'),
      {
        config: {
          commitizen: { path: './node_modules/cz-conventional-changelog' },
          commitLint: {
            extends: [commitLintConfig],
            rules: {
              'scope-enum': [
                2,
                'always',
                [
                  'config',
                  'deps',
                  'info',
                  'module',
                  'package',
                  'release',
                  'script',
                  'utility'
                ]
              ]
            }
          }
        },
        scripts: {
          commit: 'git-cz',
          commitmsg: 'commitlint -e',
          release: 'standard-version'
        }
      },
      { spaces: 2 }
    );
    console.info(chalk.blue('updated package.json with commitizen path'));

    if (settings.gitIgnoreDotIo) {
      await runCommand(
        settings.gitIgnoreDotIo.command,
        settings.gitIgnoreDotIo.args
      );
      console.info(
        chalk.blue(
          `created generic gitignore for platform ${getGitIgnorePlatform()}`
        )
      );
    }
    console.info(chalk.green('Completed successfully'));
  } catch (e) {
    console.error(chalk.red(e));
  }
};

install();
