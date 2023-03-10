/**
 * For debugging
 */

import * as fs from 'fs';
import {getDMMF, formatSchema} from '@prisma/internals';
import {dmmfModelsdeserializer, Model, dmmfModelTransformer, fixPrismaFile} from './src';

const schemaName = 'simple';
const outputSchemaName = `${schemaName}.actual`;

const schemaPath = `./fixtures/${schemaName}.prisma`;
const outputSchemaPath = `./fixtures/${outputSchemaName}.prisma`;

(async function () {
  // Format input schema file
  const formatedSchemaString = await formatSchema({schemaPath});
  fs.writeFileSync(schemaPath, formatedSchemaString);
  const outputSchema = await fixPrismaFile(schemaPath)
  // console.log(`outputSchema: ${outputSchema}`)
  // const formatedOutputSchema = await formatSchema({schemaPath: outputSchema});
  // console.log(`formatedOutputSchema: ${formatedOutputSchema}`)
  fs.writeFileSync(outputSchemaPath, outputSchema);

  // Validate
  const outputDmmf = await getDMMF({datamodel: outputSchema});
  fs.writeFileSync(`./${schemaName}-dmmf.actual.json`, JSON.stringify(outputDmmf, null, 2));
})();
