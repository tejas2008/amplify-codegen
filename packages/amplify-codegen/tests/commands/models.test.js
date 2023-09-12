const generateModels = require('../../src/commands/models');
const {
  validateAmplifyFlutterMinSupportedVersion,
  MINIMUM_SUPPORTED_VERSION_CONSTRAINT,
} = require('../../src/utils/validateAmplifyFlutterMinSupportedVersion');
const defaultDirectiveDefinitions = require('../../src/utils/defaultDirectiveDefinitions');
const mockFs = require('mock-fs');
const fs = require('fs');
const path = require('path');

jest.mock('../../src/utils/validateAmplifyFlutterMinSupportedVersion', () => {
  const originalModule = jest.requireActual('../../src/utils/validateAmplifyFlutterMinSupportedVersion');

  return {
    ...originalModule,
    validateAmplifyFlutterMinSupportedVersion: jest.fn(),
  };
});
const MOCK_CONTEXT = {
  print: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
  amplify: {
    getProjectMeta: jest.fn(),
    getEnvInfo: jest.fn(),
    getResourceStatus: jest.fn(),
    executeProviderUtils: jest.fn(),
    pathManager: {
      getBackendDirPath: jest.fn(),
    },
    getProjectConfig: jest.fn(),
  },
};
const OUTPUT_PATHS = {
  javascript: 'src/models',
  android: 'app/src/main/java/com/amplifyframework/datastore/generated/model',
  ios: 'amplify/generated/models',
  flutter: 'lib/models',
};
const MOCK_PROJECT_ROOT = 'project';
const MOCK_PROJECT_NAME = 'myapp';
const MOCK_BACKEND_DIRECTORY = 'backend';
const MOCK_GENERATED_CODE = 'This code is auto-generated!';

describe('command-models-generates models in expected output path', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    addMocksToContext();
    validateAmplifyFlutterMinSupportedVersion.mockReturnValue(true);
  });

  for (const frontend in OUTPUT_PATHS) {
    it(frontend + ': Should generate models from a single schema file', async () => {
      // mock the input and output file structure
      const schemaFilePath = path.join(MOCK_BACKEND_DIRECTORY, 'api', MOCK_PROJECT_NAME);
      const outputDirectory = path.join(MOCK_PROJECT_ROOT, OUTPUT_PATHS[frontend]);
      const mockedFiles = {};
      const nodeModules = path.resolve(path.join(__dirname, '../../../../node_modules'));
      mockedFiles[schemaFilePath] = {
        'schema.graphql': ' type SimpleModel @model { id: ID! status: String } ',
      };
      mockedFiles[outputDirectory] = {};
      mockFs(mockedFiles);
      MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({ frontend: frontend });

      // assert empty folder before generation
      expect(fs.readdirSync(outputDirectory).length).toEqual(0);

      await generateModels(MOCK_CONTEXT);

      // assert model files are generated in expected output directory
      expect(fs.readdirSync(outputDirectory)).toMatchSnapshot();
    });

    it(frontend + ': Should generate models from any subdirectory in schema folder', async () => {
      // mock the input and output file structure
      const schemaFolderPath = path.join(MOCK_BACKEND_DIRECTORY, 'api', MOCK_PROJECT_NAME, 'schema', 'nested', 'deeply');
      const outputDirectory = path.join(MOCK_PROJECT_ROOT, OUTPUT_PATHS[frontend]);
      const mockedFiles = {};
      mockedFiles[schemaFolderPath] = {
        'myschema.graphql': ' type SimpleModel { id: ID! status: String } ',
      };
      mockedFiles[outputDirectory] = {};
      mockFs(mockedFiles);
      MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({ frontend: frontend });

      // assert empty folder before generation
      expect(fs.readdirSync(outputDirectory).length).toEqual(0);

      await generateModels(MOCK_CONTEXT);

      // assert model files are generated in expected output directory
      expect(fs.readdirSync(outputDirectory)).toMatchSnapshot();
    });

    it(frontend + ': Should generate models in overrideOutputDir', async () => {
      // mock the input and output file structure
      const schemaFilePath = path.join(MOCK_BACKEND_DIRECTORY, 'api', MOCK_PROJECT_NAME);
      const outputDirectory = path.join(MOCK_PROJECT_ROOT, OUTPUT_PATHS[frontend]);
      const mockedFiles = {};
      mockedFiles[schemaFilePath] = {
        'schema.graphql': ' type SimpleModel @model { id: ID! status: String } ',
      };
      const overrideOutputDir = 'some/other/dir';
      mockedFiles[outputDirectory] = {};
      mockedFiles[overrideOutputDir] = {};
      mockFs(mockedFiles);
      MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({ frontend: frontend });

      // assert empty folder before generation
      expect(fs.readdirSync(outputDirectory).length).toEqual(0);
      expect(fs.readdirSync(overrideOutputDir).length).toEqual(0);

      await generateModels(MOCK_CONTEXT, { overrideOutputDir });

      // assert model files are generated in expected output directory
      expect(fs.readdirSync(outputDirectory).length).toEqual(0);
      expect(fs.readdirSync(overrideOutputDir).length).not.toEqual(0);
    });

    if (frontend === 'flutter') {
      it(`${frontend}: Should print error when Amplify Flutter version < ${MINIMUM_SUPPORTED_VERSION_CONSTRAINT} and not generate any models`, async () => {
        validateAmplifyFlutterMinSupportedVersion.mockReturnValue(false);
        // mock the input and output file structure
        const schemaFilePath = path.join(MOCK_BACKEND_DIRECTORY, 'api', MOCK_PROJECT_NAME);
        const outputDirectory = path.join(MOCK_PROJECT_ROOT, OUTPUT_PATHS[frontend]);
        const mockedFiles = {};
        mockedFiles[schemaFilePath] = {
          'schema.graphql': ' type SimpleModel { id: ID! status: String } ',
        };
        mockedFiles[outputDirectory] = {};
        mockFs(mockedFiles);
        MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({ frontend: frontend });

        // assert empty folder before generation
        expect(fs.readdirSync(outputDirectory).length).toEqual(0);

        await generateModels(MOCK_CONTEXT);

        expect(MOCK_CONTEXT.print.error).toBeCalled();
      });
    }
  }

  it('should use default directive definitions if getTransformerDirectives fails', async () => {
    MOCK_CONTEXT.amplify.executeProviderUtils.mockRejectedValue('no amplify project');
    const frontend = 'javascript';
    // mock the input and output file structure
    const schemaFilePath = path.join(MOCK_BACKEND_DIRECTORY, 'api', MOCK_PROJECT_NAME);
    const outputDirectory = path.join(MOCK_PROJECT_ROOT, OUTPUT_PATHS[frontend]);
    const mockedFiles = {};
    const nodeModules = path.resolve(path.join(__dirname, '../../../../node_modules'));
    mockedFiles[schemaFilePath] = {
      'schema.graphql': ' type SimpleModel @model { id: ID! status: String } ',
    };
    mockedFiles[outputDirectory] = {};
    mockFs(mockedFiles);
    MOCK_CONTEXT.amplify.getProjectConfig.mockReturnValue({ frontend: frontend });

    // assert empty folder before generation
    expect(fs.readdirSync(outputDirectory).length).toEqual(0);

    await generateModels(MOCK_CONTEXT);

    // assert model files are generated in expected output directory
    expect(fs.readdirSync(outputDirectory)).toMatchSnapshot();
  });

  afterEach(mockFs.restore);
});

// Add models generation specific mocks to Amplify Context
function addMocksToContext() {
  MOCK_CONTEXT.amplify.getEnvInfo.mockReturnValue({ projectPath: MOCK_PROJECT_ROOT });
  MOCK_CONTEXT.amplify.getResourceStatus.mockReturnValue({
    allResources: [
      {
        service: 'AppSync',
        providerPlugin: 'awscloudformation',
        resourceName: MOCK_PROJECT_NAME,
      },
    ],
  });
  MOCK_CONTEXT.amplify.executeProviderUtils.mockReturnValue(defaultDirectiveDefinitions);
  MOCK_CONTEXT.amplify.pathManager.getBackendDirPath.mockReturnValue(MOCK_BACKEND_DIRECTORY);
}
