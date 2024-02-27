import type {Field} from 'jsforce'
import type {
  CustomField as SalesforceCustomField,
  CustomObject as SalesforceCustomObject,
} from 'jsforce/lib/api/metadata/schema'
import type {CustomObjectSchema} from '../../../types/custom_object'
import type {PropertyType, PropertyUnified} from './../../../types/property'
import {BadRequestError} from './../../errors'

type ToolingAPIValueSet = {
  restricted: boolean
  valueSetDefinition: {
    sorted: boolean
    value: {label: string; valueName: string; description: string}[]
  }
}
type ToolingAPICustomField = {
  FullName: string
  Metadata: (
    | {
        type: 'DateTime' | 'Url' | 'Checkbox' | 'Date'
      }
    | {
        type: 'Text' | 'TextArea'
        length: number
      }
    | {
        type: 'Number'
        precision: number
        scale: number
      }
    | {
        type: 'MultiselectPicklist'
        valueSet: ToolingAPIValueSet
        visibleLines: number
      }
    | {
        type: 'Picklist'
        valueSet: ToolingAPIValueSet
      }
  ) & {
    required: boolean
    label: string
    description?: string
    defaultValue: string | null
  }
}

export const toCustomObject = (
  salesforceCustomObject: SalesforceCustomObject,
): CustomObjectSchema => {
  const {nameField} = salesforceCustomObject
  if (!nameField) {
    throw new Error(`unexpectedly, custom object missing nameField`)
  }
  return {
    name: salesforceCustomObject.fullName!,
    description: salesforceCustomObject.description ?? null,
    labels: {
      singular: salesforceCustomObject.label!,
      plural: salesforceCustomObject.pluralLabel!,
    },
    primaryFieldId: 'Name',
    fields: [
      toPropertyUnified(nameField, /* isNameField */ true),
      ...salesforceCustomObject.fields.map((field) => toPropertyUnified(field)),
    ],
  }
}

export const toPropertyUnified = (
  salesforceField: SalesforceCustomField,
  isNameField = false,
): PropertyUnified => {
  const type = fromCustomFieldTypeToPropertyType(salesforceField.type!)
  return {
    id: isNameField ? 'Name' : salesforceField.fullName!,
    label: salesforceField.label!,
    type,
    scale: salesforceField.scale ?? undefined,
    precision: salesforceField.precision ?? undefined,
    isRequired: (isNameField || salesforceField.required) ?? false,
    groupName: undefined,
    options: [],
    description: salesforceField.description ?? undefined,
    rawDetails: salesforceField,
  }
}

export const fromDescribeFieldToPropertyUnified = (
  describeResult: Field,
): PropertyUnified => {
  const type = fromDescribeTypeToPropertyType(describeResult.type)
  return {
    id: describeResult.name,
    customName: describeResult.name.endsWith('__c')
      ? describeResult.name
      : undefined,
    label: describeResult.label,
    type,
    scale: type === 'number' ? describeResult.scale : undefined,
    precision: type === 'number' ? describeResult.precision : undefined,
    isRequired: describeResult.nillable === false,
    groupName: undefined,
    options: [],
    description: describeResult.inlineHelpText ?? undefined,
    rawDetails: describeResult,
  }
}

export const fromDescribeTypeToPropertyType = (
  describeType: string,
): PropertyType => {
  switch (describeType) {
    case 'id':
    case 'reference':
    case 'url':
    case 'string':
    case 'email':
      return 'text'
    case 'textarea':
      return 'textarea'
    case 'picklist':
      return 'picklist'
    case 'boolean':
      return 'boolean'
    case 'double':
    case 'int':
      return 'number'
    case 'datetime':
      return 'datetime'
    case 'date':
      return 'date'
    case 'multipicklist':
      return 'multipicklist'
    default:
      return 'other'
  }
}

export const fromCustomFieldTypeToPropertyType = (
  salesforceType: string,
): PropertyType => {
  switch (salesforceType) {
    case 'DateTime':
      return 'datetime'
    case 'Date':
      return 'date'
    case 'Number':
      return 'number'
    case 'Text':
      return 'text'
    case 'Checkbox':
      return 'boolean'
    case 'Picklist':
      return 'picklist'
    case 'Multipicklist':
      return 'multipicklist'
    case 'TextArea':
      return 'textarea'
    case 'Url':
      return 'url'
    default:
      return 'other'
  }
}

// TODO: Figure out what to do with id and reference types
export const toSalesforceType = (
  property: PropertyUnified,
): ToolingAPICustomField['Metadata']['type'] => {
  switch (property.type) {
    case 'number':
      return 'Number'
    case 'text':
      return 'Text'
    case 'textarea':
      return 'TextArea'
    case 'boolean':
      return 'Checkbox'
    case 'picklist':
      return 'Picklist'
    case 'multipicklist':
      return 'MultiselectPicklist'
    case 'date':
      return 'Date'
    case 'datetime':
      return 'DateTime'
    case 'url':
      return 'Url'
    default:
      return 'Text'
  }
}

export const toSalesforceCustomFieldCreateParamsForToolingAPI = (
  objectName: string,
  property: PropertyUnified,
  prefixed = false,
): Partial<ToolingAPICustomField> => {
  const salesforceType = toSalesforceType(property)
  const base = {
    // When calling the CustomObjects API, it does not need to be prefixed.
    // However, when calling the CustomFields API, it needs to be prefixed.
    FullName: prefixed ? `${objectName}.${property.id}` : property.id,
    Metadata: {
      label: property.label,
      required: property.isRequired ?? false,
      description: property.description,
      defaultValue: property.defaultValue?.toString() ?? null,
    },
  }

  switch (salesforceType) {
    case 'Text':
    case 'TextArea':
      return {
        ...base,
        Metadata: {
          ...base.Metadata,
          type: salesforceType,
          // TODO: Maybe textarea should be longer
          length: 255,
        },
      }
    case 'Number':
      return {
        ...base,
        Metadata: {
          ...base.Metadata,
          type: salesforceType,
          scale: property.scale!,
          precision: property.precision!,
        },
      }
    case 'Checkbox':
      return {
        ...base,
        Metadata: {
          ...base.Metadata,
          type: salesforceType,
          // Salesforce does not support the concept of required boolean fields
          required: false,
          // JS Force (incorrectly) expects string here
          // This is required for boolean fields
          defaultValue: property.defaultValue?.toString() ?? 'false',
        },
      }
    case 'Picklist':
    case 'MultiselectPicklist':
      if (!property.options || property.options.length === 0) {
        throw new BadRequestError(
          `Picklist property ${property.id} has no options`,
        )
      }

      if (
        property.defaultValue &&
        !property.options.find(
          (option) => option.value === property.defaultValue,
        )
      ) {
        throw new BadRequestError(
          `Picklist property ${property.id} has a defaultValue that is not in the options: ${property.defaultValue}`,
        )
      }

      return {
        ...base,
        Metadata: {
          ...base.Metadata,
          type: salesforceType,
          visibleLines: 4,
          valueSet: {
            restricted: false,
            valueSetDefinition: {
              sorted: false, // TODO: maybe support this?
              value: property.options.map((option) => ({
                valueName: option.value,
                label: option.label,
                description: option.description ?? '',
                default: option.value === property.defaultValue,
              })),
            },
          },
        },
      }
    default:
      return {...base, Metadata: {...base.Metadata, type: salesforceType}}
  }
}

export const toSalesforceCustomFieldCreateParams = (
  objectName: string,
  property: PropertyUnified,
  prefixed = false,
): Partial<SalesforceCustomField> => {
  const base: Partial<SalesforceCustomField> = {
    // When calling the CustomObjects API, it does not need to be prefixed.
    // However, when calling the CustomFields API, it needs to be prefixed.
    fullName: prefixed ? `${objectName}.${property.id}` : property.id,
    label: property.label,
    type: toSalesforceType(property),
    required: property.isRequired,
    defaultValue: property.defaultValue?.toString() ?? null,
  }
  // if (property.defaultValue) {
  //   base = { ...base, defaultValue: property.defaultValue.toString() };
  // }
  if (property.type === 'text') {
    return {
      ...base,
      // TODO: Maybe textarea should be longer
      length: 255,
    }
  }
  if (property.type === 'number') {
    return {
      ...base,
      scale: property.scale,
      precision: property.precision,
    }
  }
  if (property.type === 'boolean') {
    return {
      ...base,
      // Salesforce does not support the concept of required boolean fields
      required: false,
      // JS Force (incorrectly) expects string here
      // This is required for boolean fields
      defaultValue: property.defaultValue?.toString() ?? 'false',
    }
  }
  // TODO: Support picklist options
  return base
}

export const toSalesforceCustomObjectCreateParams = (
  objectName: string,
  labels: {
    singular: string
    plural: string
  },
  description: string | null,
  primaryField: PropertyUnified,
  nonPrimaryFieldsToUpdate: PropertyUnified[],
) => {
  return {
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fullName: objectName,
    description,
    label: labels.singular,
    pluralLabel: labels.plural,
    nameField: {
      label: primaryField?.label,
      type: 'Text',
    },
    fields: nonPrimaryFieldsToUpdate.map((field) =>
      toSalesforceCustomFieldCreateParams(objectName, field),
    ),
  }
}
