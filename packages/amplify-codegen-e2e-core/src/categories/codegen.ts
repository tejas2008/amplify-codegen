import { AmplifyFrontend, singleSelect } from '../utils';
import { getCLIPath, nspawn as spawn } from '..';

export function generateModels(cwd: string, outputDir?: string, settings: { errMessage?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const params = ['codegen', 'models', ...(outputDir ? ['--output-dir', outputDir] : [])];
    const chain = spawn(getCLIPath(), params, { cwd, stripColors: true });

    if (settings?.errMessage) {
      chain.wait(settings.errMessage);
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export const generateModelsWithOptions = (cwd: string, options: Record<string, any>): Promise<void> =>
  new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['codegen', 'models', ...Object.entries(options).flat()], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });

export function generateStatementsAndTypes(cwd: string, errorMessage?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['codegen'], { cwd, stripColors: true });

    if (errorMessage) {
      chain.wait(errorMessage);
    }

    return chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function generateStatements(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['codegen', 'statements'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function generateTypes(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['codegen', 'types'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// CLI workflow to add codegen to Amplify project
export function addCodegen(cwd: string, settings: any = {}): Promise<void> {
  const defaultSettings = {
    params: [],
    isAPINotAdded: false,
    isCodegenAdded: false,
    frontendType: AmplifyFrontend.javascript,
    framework: 'none',
    codegenTarget: 'typescript',
    isStatementGenerated: true,
    statementNamePattern: '\r', // default value
    maxDepth: '\r', // default value
    isTypeGenerated: true,
    typeFileName: '\r', // default value
  };
  const mergedSettings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    const params = mergedSettings.params ? ['codegen', 'add', ...mergedSettings.params] : ['codegen', 'add'];
    const chain = spawn(getCLIPath(), params, { cwd, stripColors: true });
    if (mergedSettings.frontendType === AmplifyFrontend.flutter) {
      chain.wait('Flutter only supports the command $amplify codegen models. All the other codegen commands are not supported.');
    } else if (mergedSettings.isAPINotAdded) {
      chain.wait('There are no GraphQL APIs available.');
      chain.wait('Add by running $amplify api add');
    } else if (mergedSettings.isCodegenAdded) {
      chain.wait('Codegen support only one GraphQL API per project');
    } else {
      if (mergedSettings.frontendType === AmplifyFrontend.javascript) {
        chain.wait('Choose the code generation language target');
        if (mergedSettings.framework === 'angular' || mergedSettings.framework === 'ionic') {
          singleSelect(chain, mergedSettings.codegenTarget, ['angular', 'typescript']);
        } else {
          singleSelect(chain, mergedSettings.codegenTarget, ['javascript', 'typescript', 'flow']);
        }
      }
      chain
        .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
        .sendLine(mergedSettings.statementNamePattern)
        .wait('Do you want to generate/update all possible GraphQL operations');
      if (mergedSettings.isStatementGenerated) {
        chain
          .sendLine('y')
          .wait('Enter maximum statement depth [increase from default if your schema is deeply')
          .sendLine(mergedSettings.maxDepth);
      } else {
        chain.sendLine('n');
      }

      const isTypeGenIncluded =
        mergedSettings.frontendType === AmplifyFrontend.ios ||
        (mergedSettings.frontendType === AmplifyFrontend.javascript && mergedSettings.codegenTarget !== 'javascript');
      if (isTypeGenIncluded) {
        chain
          .wait('Enter the file name for the generated code')
          .sendLine(mergedSettings.typeFileName)
          .wait('Do you want to generate code for your newly created GraphQL API');
        if (mergedSettings.isTypeGenerated) {
          chain.sendLine('y');
        } else {
          chain.sendLine('n');
        }
      }
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// CLI workflow to remove the configured codegen from the project
export function removeCodegen(cwd: string, isCodegenAdded: boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['codegen', 'remove'], { cwd, stripColors: true });
    if (!isCodegenAdded) {
      chain.wait('Codegen is not configured');
    }
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// CLI workflow to configure codegen
export function configureCodegen(cwd: string, settings: any = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['codegen', 'configure'], { cwd, stripColors: true });
    if (settings.frontendType === AmplifyFrontend.javascript) {
      chain.wait('Choose the code generation language target').sendCarriageReturn();
    }
    chain.wait('Enter the file name pattern of graphql queries, mutations and subscriptions').sendCarriageReturn();

    if (!settings.isCodegenConfigured) {
      chain.wait('Do you want to generate/update all possible GraphQL operations').sendLine('y');
    } else if (settings.frontendType === AmplifyFrontend.ios) {
      chain.wait('Enter the file name for the generated code').sendCarriageReturn();
    }

    chain.wait('Enter maximum statement depth [increase from default if your schema is deeply');
    settings.maxStatementDepth ? chain.sendLine(settings.maxStatementDepth) : chain.sendCarriageReturn();

    if (settings.frontendType === AmplifyFrontend.ios && !settings.isCodegenConfigured) {
      chain
        .wait('Enter the file name for the generated code')
        .sendCarriageReturn()
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendCarriageReturn();
    }

    if (settings.isCodegenConfigured) {
      chain.wait('Codegen configured. Remember to run "amplify codegen" to generate your types and statements.');
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function generateModelIntrospection(cwd: string, settings: { outputDir?: string; errMessage?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['codegen', 'model-introspection', '--output-dir', settings.outputDir ?? ''], {
      cwd,
      stripColors: true,
    });
    if (settings?.errMessage) {
      chain.wait(settings.errMessage);
    }
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// CLI workflow to add codegen to non-Amplify JS project
export function addCodegenNonAmplifyJS(cwd: string, params: Array<string>, initialFailureMessage?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['codegen', 'add', ...params], { cwd, stripColors: true });

    if (initialFailureMessage) {
      chain.wait(initialFailureMessage);
    } else {
      chain
        .wait("Choose the type of app that you're building")
        .sendCarriageReturn()
        .wait('What javascript framework are you using')
        .sendCarriageReturn()
        .wait('Choose the code generation language target')
        .sendCarriageReturn()
        .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
        .sendCarriageReturn()
        .wait('Do you want to generate/update all possible GraphQL operations')
        .sendLine('y')
        .wait('Enter maximum statement depth [increase from default if your schema is deeply')
        .sendCarriageReturn();
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function addCodegenNonAmplifyTS(cwd: string, params: Array<string>, initialFailureMessage?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['codegen', 'add', ...params], { cwd, stripColors: true });

    if (initialFailureMessage) {
      chain.wait(initialFailureMessage);
    } else {
      chain
        .wait("Choose the type of app that you're building")
        .sendCarriageReturn()
        .wait('What javascript framework are you using')
        .sendCarriageReturn()
        .wait('Choose the code generation language target')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
        .sendCarriageReturn()
        .wait('Do you want to generate/update all possible GraphQL operations')
        .sendLine('y')
        .wait('Enter maximum statement depth [increase from default if your schema is deeply')
        .sendCarriageReturn()
        .wait('Enter the file name for the generated code')
        .sendCarriageReturn()
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendCarriageReturn();
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
