/**
 * For debugging
 */

import * as fs from 'fs';
import {getDMMF, formatSchema} from '@prisma/sdk';
import {dmmfModelsdeserializer, Model, dmmfModelTransformer} from './src';

const schemaName = 'schema';
const outputSchemaName = `${schemaName}.actual`;

const schemaPath = `./prisma/${schemaName}.prisma`;
const outputSchemaPath = `./prisma/${outputSchemaName}.prisma`;

(async function () {
  console.log(`1`)
	// Format input schema file
	const formatedSchemaString = await formatSchema({schemaPath});
  console.log(`2`)
	fs.writeFileSync(schemaPath, formatedSchemaString);
  console.log(`3`)
	const schema = fs.readFileSync(schemaPath, 'utf-8');
  console.log(`4`)
	const dmmf = await getDMMF({datamodel: schema});
  console.log(`5`)
	fs.writeFileSync(`./${schemaName}-dmmf.json`, JSON.stringify(dmmf, null, 2));

	// Transform to camelcase
	const models = dmmf.datamodel.models as Model[];
	const transformedModels = dmmfModelTransformer(models);

	// Deserialize models
	const outputSchema = await dmmfModelsdeserializer(transformedModels);
	fs.writeFileSync(outputSchemaPath, outputSchema);
	const formatedOutputSchema = await formatSchema({schemaPath: outputSchemaPath});
	fs.writeFileSync(outputSchemaPath, formatedOutputSchema);

	// Validate
	const outputDmmf = await getDMMF({datamodel: outputSchema});
	fs.writeFileSync(`./${schemaName}-dmmf.actual.json`, JSON.stringify(outputDmmf, null, 2));
})();
