import * as fs from "fs";
import { getDMMF } from "@prisma/internals";

import { dmmfModelsdeserializer, Model, dmmfEnumsDeserializer } from "../src";

describe("transformer tests", () => {
  test("transform model name from snake_case to camelCase from simple schema", async () => {
    const schemaPath = "./fixtures/simple.prisma";

    const schema = fs.readFileSync(schemaPath, "utf-8");
    const dmmf = await getDMMF({ datamodel: schema });
    const models = dmmf.datamodel.models as Model[];

    const outputSchema = [
      await dmmfModelsdeserializer(models),
      await dmmfEnumsDeserializer(dmmf.datamodel.enums),
    ].join("\n\n\n");
    const outpuDmmf = await getDMMF({ datamodel: outputSchema });

    expect(outpuDmmf.datamodel).toEqual(dmmf.datamodel);
  });

  test("transform model name from snake_case to camelCase from blog schema", async () => {
    const schemaPath = "./fixtures/blog.prisma";

    const schema = fs.readFileSync(schemaPath, "utf-8");
    const dmmf = await getDMMF({ datamodel: schema });
    const models = dmmf.datamodel.models as Model[];

    const outputSchema = [
      await dmmfModelsdeserializer(models),
      await dmmfEnumsDeserializer(dmmf.datamodel.enums),
    ].join("\n\n\n");
    const outpuDmmf = await getDMMF({ datamodel: outputSchema });

    expect(outpuDmmf.datamodel).toEqual(dmmf.datamodel);
  });
});
