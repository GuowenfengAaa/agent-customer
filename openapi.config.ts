import { generateService } from '@umijs/openapi';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const config = {
  requestLibPath: "import request from '@/services/openapiRequest'",
  schemaPath: process.env.OPENAPI_SCHEMA_URL ?? 'http://localhost:8080/v3/api-docs',
  serversPath: './src',
};

async function patchGeneratedService() {
  await generateService(config);

  const generatedRoot = path.resolve(config.serversPath, 'api');
  const replacements: Record<string, Array<[string, string]>> = {
    'hallController.ts': [['params: API.seatsParams', 'params: { hallId: number }']],
    'showtimeController.ts': [['params: API.seatsParams', 'params: { id: number }']],
    'showtimeUserController.ts': [['params: API.seatsParams', 'params: { id: number }']],
  };

  await Promise.all(
    Object.entries(replacements).map(async ([fileName, fileReplacements]) => {
      const filePath = path.join(generatedRoot, fileName);
      let source = await readFile(filePath, 'utf8');
      for (const [from, to] of fileReplacements) {
        source = source.replace(from, to);
      }
      await writeFile(filePath, source, 'utf8');
    }),
  );

  const typingsPath = path.join(generatedRoot, 'typings.d.ts');
  const typings = await readFile(typingsPath, 'utf8');
  await writeFile(
    typingsPath,
    typings.replace(/\n  type seatsParams = \{\n(?:    [^\n]+\n)+  \};\n/g, '\n'),
    'utf8',
  );
}

patchGeneratedService().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
