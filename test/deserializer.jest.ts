import { fixPrismaFile } from "../src";

describe("deserializer tests", () => {
  test("deserialized model is identical with the input from simple schema", async () => {
    const schemaPath = "./fixtures/simple.prisma";

    const outputSchema = await fixPrismaFile(schemaPath);
    expect(outputSchema).toMatchSnapshot();
  });

  test("deserialized model is identical with the input from blog schema", async () => {
    const schemaPath = "./fixtures/blog.prisma";

    const outputSchema = await fixPrismaFile(schemaPath);
    expect(outputSchema).toMatchSnapshot();
  });

  test("deserialized model is excluding users model", async () => {
    const schemaPath = "./fixtures/simple.prisma";

    const outputSchema = await fixPrismaFile(schemaPath, ["users"]);
    expect(outputSchema).toMatchSnapshot();
  });
});
