import camelcase from "camelcase";
import pluralize from "pluralize";
import { produce } from "immer";

import { Model, Field } from ".";
import { DMMF } from "@prisma/generator-helper";

function singularizeModelName(modelName: string) {
  return camelcase(pluralize(modelName, 1), { pascalCase: true });
}

function transformModel(model: Model) {
  const { name, uniqueFields, idFields, primaryKey } = model;

  const fixModelName = produce(model, (draftModel) => {
    if (name !== singularizeModelName(name)) {
      draftModel.name = singularizeModelName(name);
      draftModel.dbName = name;
    }
  });

  const fixFieldsName = produce(fixModelName, (draftModel) => {
    const fields = draftModel.fields as unknown as Field[];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    draftModel.fields = fields.map((field) =>
      produce(field, (draftField) => {
        const {
          name,
          kind,
          type,
          relationFromFields,
          relationToFields,
          isList,
        } = draftField;
        // Transform field name
        draftField.name = isList
          ? camelcase(pluralize.plural(name))
          : camelcase(pluralize.singular(name));

        if (draftField.isList) {
          draftField.hasDefaultValue = false;
          draftField.default = undefined;
        }
        if (draftField.name !== name) {
          draftField.columnName = name;
        }

        // Posts posts[]
        if (kind === "object" && type !== singularizeModelName(type)) {
          draftField.type = singularizeModelName(type);
        }

        // Enum
        if (kind === "enum" && type !== singularizeModelName(type)) {
          draftField.type = singularizeModelName(type);
          if (draftField.default)
            draftField.default = camelcase(draftField.default);
        }

        // Object kind, with @relation attributes
        if (
          kind === "object" &&
          relationFromFields &&
          relationFromFields.length > 0 &&
          relationToFields
        ) {
          draftField.relationFromFields = [camelcase(relationFromFields[0])];
          draftField.relationToFields = [camelcase(relationToFields[0])];
        }

        if (name === "updated_at") {
          draftField.isUpdatedAt = true;
        }
      })
    ) as DMMF.Field[]; // Force type conversion
  });

  const fixUniqueName = produce(fixFieldsName, (draftModel) => {
    if (uniqueFields.length > 0) {
      draftModel.uniqueFields = uniqueFields.map((eachUniqueField) =>
        eachUniqueField.map((each) => camelcase(each))
      );
    }
  });

  const fixIdFieldsName = produce(fixUniqueName, (draftModel) => {
    if (idFields && idFields.length > 0) {
      draftModel.idFields = idFields.map((eachIdField) =>
        camelcase(eachIdField)
      );
    }
  });

  const fixPrimaryKey = produce(fixIdFieldsName, (draftModel) => {
    const primaryKey = draftModel.primaryKey;
    if (!primaryKey) {
      return;
    }
    draftModel.primaryKey = {
      name: primaryKey.name ? camelcase(primaryKey.name) : null,
      fields: primaryKey.fields.map((f) => camelcase(f)),
    };
  });

  return fixPrimaryKey;
}

function transformEnum(enumm: DMMF.DatamodelEnum) {
  const { name } = enumm;

  const fixModelName = produce(enumm, (draftModel) => {
    if (name !== singularizeModelName(name)) {
      draftModel.name = singularizeModelName(name);
      draftModel.dbName = name;
    }
  });

  const fixFieldsName = produce(fixModelName, (draftModel) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    draftModel.values = draftModel.values.map((field) =>
      produce(field, (draftField) => {
        const { name, dbName } = draftField;

        // Transform field name
        draftField.name = camelcase(pluralize.singular(name));

        if (draftField.name !== name) {
          draftField.dbName = dbName || name;
        }
      })
    );
  });

  return fixFieldsName;
}

export function dmmfModelTransformer(models: Model[]): Model[] {
  return models.map((model) => transformModel(model));
}

export function dmmfEnumTransformer(
  enums: DMMF.DatamodelEnum[]
): DMMF.DatamodelEnum[] {
  return enums.map((each) => transformEnum(each));
}
