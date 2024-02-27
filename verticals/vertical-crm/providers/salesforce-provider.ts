import type {BaseRecord} from '@supaglue/vdk'
import {
  LastUpdatedAtId,
  mapper,
  modifyRequest,
  PLACEHOLDER_BASE_URL,
  z,
  zCast,
} from '@supaglue/vdk'
import * as jsforce from 'jsforce'
import type {
  CustomField as SalesforceCustomField,
  CustomObject as SalesforceCustomObject,
} from 'jsforce/lib/api/metadata/schema'
import type {SalesforceSDKTypes} from '@opensdks/sdk-salesforce'
import {
  initSalesforceSDK,
  type SalesforceSDK as _SalesforceSDK,
} from '@opensdks/sdk-salesforce'
import {CustomObjectSchemaCreateParams} from '../../types/custom_object'
import {PropertyUnified} from '../../types/property'
import {BadRequestError} from '../errors'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'
import {SALESFORCE_STANDARD_OBJECTS} from './salesforce/constants'
import {updateFieldPermissions} from './salesforce/updatePermissions'

export type SFDC = SalesforceSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<SFDC['ContactSObject']>(), commonModels.contact, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    first_name: 'FirstName',
    last_name: 'LastName',
  }),
  account: mapper(zCast<SFDC['AccountSObject']>(), commonModels.account, {
    id: 'Id',
    updated_at: (record) =>
      record.SystemModstamp ? new Date(record.SystemModstamp) : null,
    name: 'Name',
    isDeleted: 'IsDeleted',
    website: 'Website',
    industry: 'Industry',
    numberOfEmployees: 'NumberOfEmployees',
    ownerId: 'OwnerId',
    createdAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
  }),
  opportunity: mapper(
    zCast<SFDC['OpportunitySObject']>(),
    commonModels.opportunity,
    {
      id: 'Id',
      updated_at: 'SystemModstamp',
      name: 'Name',
      description: 'Description',
      ownerId: 'OwnerId',
      status: (record) => (record.IsClosed ? 'Closed' : 'Open'),
      stage: 'StageName',
      closeDate: (record) =>
        record.CloseDate ? new Date(record.CloseDate) : null,
      accountId: 'AccountId',
      amount: 'Amount',
      lastActivityAt: (record) =>
        record.LastActivityDate ? new Date(record.LastActivityDate) : null,
      createdAt: (record) =>
        record.CreatedDate ? new Date(record.CreatedDate) : null,
      isDeleted: 'IsDeleted',
      lastModifiedAt: (record) =>
        record.LastModifiedDate ? new Date(record.LastModifiedDate) : null,
      rawData: (record) => record,
    },
  ),
  lead: mapper(zCast<SFDC['LeadSObject']>(), commonModels.lead, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    firstName: 'FirstName',
    lastName: 'LastName',
    ownerId: 'OwnerId',
    title: 'Title',
    company: 'Company',
    convertedDate: (record) =>
      record.ConvertedDate ? new Date(record.ConvertedDate) : null,
    leadSource: 'LeadSource',
    convertedAccountId: 'ConvertedAccountId',
    convertedContactId: 'ConvertedContactId',
    addresses: (record) =>
      record.Street ||
      record.City ||
      record.State ||
      record.Country ||
      record.PostalCode
        ? [
            {
              street1: record.Street ?? null,
              street2: null,
              city: record.City ?? null,
              state: record.State ?? null,
              country: record.Country ?? null,
              postalCode: record.PostalCode ?? null,
              addressType: 'primary',
            },
          ]
        : [],
    emailAddresses: (record) =>
      record.Email
        ? [{emailAddress: record.Email, emailAddressType: 'primary'}]
        : [],
    phoneNumbers: (record) =>
      record.Phone
        ? [
            {
              phoneNumber: record.Phone ?? null,
              phoneNumberType: 'primary',
            },
          ]
        : [],
    createdAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
    isDeleted: 'IsDeleted',
    lastModifiedAt: (record) =>
      record.SystemModstamp ? new Date(record.SystemModstamp) : new Date(0),
    rawData: (record) => record,
  }),
  user: mapper(zCast<SFDC['UserSObject']>(), commonModels.user, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    email: 'Email',
    isActive: 'IsActive',
    createdAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
    updatedAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
    lastModifiedAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
    // rawData: (rawData) => rawData,
  }),
  customObject: {
    parse: (rawData: any) => ({
      id: rawData.Id,
      updated_at: rawData.SystemModstamp
        ? new Date(rawData.SystemModstamp).toISOString()
        : '',
      name: rawData.Name,
      createdAt: rawData.CreatedDate
        ? new Date(rawData.CreatedDate).toISOString()
        : '',
      updatedAt: rawData.CreatedDate
        ? new Date(rawData.CreatedDate).toISOString()
        : '',
      lastModifiedAt: rawData.CreatedDate
        ? new Date(rawData.CreatedDate).toISOString()
        : '',
      raw_data: rawData,
    }),
    _in: {
      Name: true,
    },
  },
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

export function capitalizeString(str: string): string {
  if (!str) {
    return str
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

type AccountFields =
  | 'OwnerId'
  | 'Name'
  | 'Description'
  | 'Industry'
  | 'Website'
  | 'NumberOfEmployees'
  | 'BillingCity'
  | 'BillingCountry'
  | 'BillingPostalCode'
  | 'BillingState'
  | 'BillingStreet'
  | 'ShippingCity'
  | 'ShippingCountry'
  | 'ShippingPostalCode'
  | 'ShippingState'
  | 'ShippingStreet'
  | 'Phone'
  | 'Fax'
  | 'LastActivityDate'
  | 'CreatedDate'
  | 'IsDeleted'
type ContactFields =
  | 'OwnerId'
  | 'AccountId'
  | 'FirstName'
  | 'LastName'
  | 'Email'
  | 'Phone'
  | 'Fax'
  | 'MobilePhone'
  | 'LastActivityDate'
  | 'MailingCity'
  | 'MailingCountry'
  | 'MailingPostalCode'
  | 'MailingState'
  | 'MailingStreet'
  | 'OtherCity'
  | 'OtherCountry'
  | 'OtherPostalCode'
  | 'OtherState'
  | 'OtherStreet'
  | 'IsDeleted'
  | 'CreatedDate'
type OpportunityFields =
  | 'OwnerId'
  | 'Name'
  | 'Description'
  | 'LastActivityDate'
  | 'Amount'
  | 'IsClosed'
  | 'IsDeleted'
  | 'IsWon'
  | 'StageName'
  | 'CloseDate'
  | 'CreatedDate'
  | 'AccountId'
type LeadFields =
  | 'OwnerId'
  | 'Title'
  | 'FirstName'
  | 'LastName'
  | 'ConvertedDate'
  | 'CreatedDate'
  | 'SystemModstamp'
  | 'ConvertedContactId'
  | 'ConvertedAccountId'
  | 'Company'
  | 'City'
  | 'State'
  | 'Street'
  | 'Country'
  | 'PostalCode'
  | 'Phone'
  | 'Email'
  | 'IsDeleted'
type UserFields = 'Name' | 'Email' | 'IsActive' | 'CreatedDate'

export const CRM_COMMON_OBJECT_TYPES = [
  'account',
  'contact',
  'lead',
  'opportunity',
  'user',
] as const
export type CRMCommonObjectType = (typeof CRM_COMMON_OBJECT_TYPES)[number]

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

function validateCustomObject(params: CustomObjectSchemaCreateParams): void {
  if (!params.fields.length) {
    throw new BadRequestError('Cannot create custom object with no fields')
  }

  const primaryField = params.fields.find(
    (field) => field.id === params.primaryFieldId,
  )

  if (!primaryField) {
    throw new BadRequestError(
      `Could not find primary field with key name ${params.primaryFieldId}`,
    )
  }

  if (primaryField.type !== 'text') {
    throw new BadRequestError(
      `Primary field must be of type text, but was ${primaryField.type} with key name ${params.primaryFieldId}`,
    )
  }

  if (!primaryField.is_required) {
    throw new BadRequestError(
      `Primary field must be required, but was not with key name ${params.primaryFieldId}`,
    )
  }

  if (capitalizeString(primaryField.id) !== 'Name') {
    throw new BadRequestError(
      `Primary field for salesforce must have key name 'Name', but was ${primaryField.id}`,
    )
  }

  const nonPrimaryFields = params.fields.filter(
    (field) => field.id !== params.primaryFieldId,
  )

  if (nonPrimaryFields.some((field) => !field.id.endsWith('__c'))) {
    throw new BadRequestError('Custom object field key names must end with __c')
  }

  if (
    nonPrimaryFields.some(
      (field) => field.type === 'boolean' && field.isRequired,
    )
  ) {
    throw new BadRequestError('Boolean fields cannot be required in Salesforce')
  }
}

export const toSalesforceCustomFieldCreateParams = (
  objectName: string,
  property: any,
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

const propertiesForCommonObject: Record<CRMCommonObjectType, string[]> = {
  account: [
    'OwnerId',
    'Name',
    'Description',
    'Industry',
    'Website',
    'NumberOfEmployees',
    // We may not need all of these fields in order to map to common object
    'BillingCity',
    'BillingCountry',
    'BillingPostalCode',
    'BillingState',
    'BillingStreet',
    // We may not need all of these fields in order to map to common object
    'ShippingCity',
    'ShippingCountry',
    'ShippingPostalCode',
    'ShippingState',
    'ShippingStreet',
    'Phone',
    'Fax',
    'LastActivityDate',
    'CreatedDate',
    'IsDeleted',
  ] as AccountFields[],
  contact: [
    'OwnerId',
    'AccountId',
    'FirstName',
    'LastName',
    'Email',
    'Phone',
    'Fax',
    'MobilePhone',
    'LastActivityDate',
    // We may not need all of these fields in order to map to common object
    'MailingCity',
    'MailingCountry',
    'MailingPostalCode',
    'MailingState',
    'MailingStreet',
    // We may not need all of these fields in order to map to common object
    'OtherCity',
    'OtherCountry',
    'OtherPostalCode',
    'OtherState',
    'OtherStreet',
    'IsDeleted',
    'CreatedDate',
  ] as ContactFields[],
  opportunity: [
    'OwnerId',
    'Name',
    'Description',
    'LastActivityDate',
    'Amount',
    'IsClosed',
    'IsDeleted',
    'IsWon',
    'StageName',
    'CloseDate',
    'CreatedDate',
    'AccountId',
  ] as OpportunityFields[],
  lead: [
    'OwnerId',
    'Title',
    'FirstName',
    'LastName',
    'ConvertedDate',
    'CreatedDate',
    'SystemModstamp',
    'ConvertedContactId',
    'ConvertedAccountId',
    'Company',
    'City',
    'State',
    'Street',
    'Country',
    'PostalCode',
    'Phone',
    'Email',
    'IsDeleted',
  ] as LeadFields[],
  user: ['Name', 'Email', 'IsActive', 'CreatedDate'] as UserFields[],
}

type SalesforceSDK = _SalesforceSDK & {
  getJsForce: () => Promise<jsforce.Connection>
}

/**
 * Hard-coded for now, to get list of available versions, visit $instanceUrl/services/data
 * TODO: Consider making this configurable by
 * 1) Exposing ConnectionConfiguration and ConnectionMetadata as part of params to __init__.
 * We don't do that today to reduce 1x roundtrip needed on every request
 * 2) Allow it to be configured on a per request basis via a `x-salesforce-api-version` header.
 * Simpler but we would be forcing the consumer to have to worry about it.
 */
const API_VERSION = '59.0'

function sdkExt(instance: SalesforceSDK) {
  /** NOTE: extract these into a helper functions inside sdk-salesforce */
  const countEntity = async (entity: string) =>
    instance.query(`SELECT COUNT() FROM ${entity}`).then((r) => r.totalSize)

  const listEntity = async <T>({
    cursor,
    ...opts
  }: {
    // to-do: Make entity and fields type safe
    entity: string
    fields: string[]
    cursor?: {
      last_updated_at: string
      last_id: string
    }
    limit?: number
  }) => {
    const whereStatement = cursor
      ? `WHERE SystemModstamp > ${cursor.last_updated_at} OR (SystemModstamp = ${cursor.last_updated_at} AND Id > '${cursor.last_id}')`
      : ''
    const limitStatement = opts.limit != null ? `LIMIT ${opts.limit}` : ''
    return instance.query<T>(`
        SELECT Id, SystemModstamp, ${opts.fields.join(', ')}, FIELDS(CUSTOM)
        FROM ${opts.entity}
        ${whereStatement}
        ORDER BY SystemModstamp ASC, Id ASC
        ${limitStatement} 
      `)
  }

  return {
    countEntity,
    listEntity,
    _listEntityThenMap: async <TIn, TOut extends BaseRecord>({
      entity,
      fields,
      ...opts
    }: {
      entity: string
      fields: Array<Extract<keyof TIn, string>>
      mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
      page_size?: number
      cursor?: string | null
    }) => {
      const limit = opts?.page_size ?? 100
      const cursor = LastUpdatedAtId.fromCursor(opts?.cursor)
      const res = await listEntity<TIn>({entity, fields, cursor, limit})
      const items = res.records.map(opts.mapper.parse)
      const lastItem = items[items.length - 1]
      return {
        items,
        has_next_page: items.length > 0,
        next_cursor: lastItem
          ? LastUpdatedAtId.toCursor({
              last_id: lastItem.id,
              last_updated_at: lastItem.updated_at,
            })
          : opts?.cursor,
      }
    },
  }
}

export const salesforceProvider = {
  __init__: ({proxyLinks, getCredentials}) => {
    const sdk = initSalesforceSDK({
      baseUrl: PLACEHOLDER_BASE_URL,
      links: (defaultLinks) => [
        (req, next) =>
          next(
            modifyRequest(req, {
              url: req.url.replace(
                PLACEHOLDER_BASE_URL,
                PLACEHOLDER_BASE_URL + '/services/data/v' + API_VERSION,
              ),
            }),
          ),
        ...proxyLinks,
        ...defaultLinks,
      ],
    })
    async function getJsForce() {
      const creds = await getCredentials()
      if (!creds.instance_url || !creds.access_token) {
        throw new Error('Missing instance_url or access_token')
      }
      const conn = new jsforce.Connection({
        instanceUrl: creds.instance_url,
        accessToken: creds.access_token,
        version: API_VERSION,
        maxRequest: 10,
      })
      return conn
    }
    return {...sdk, getJsForce} satisfies SalesforceSDK
  },
  countEntity: async ({instance, input}) => {
    // NOTE: extract this into a helper function inside sdk-salesforce
    const res = await instance.query(`SELECT COUNT() FROM ${input.entity}`)
    return {count: res.totalSize}
  },
  // MARK: - Account
  listAccounts: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Account',
      fields: propertiesForCommonObject.account,
      mapper: mappers.account,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),
  getAccount: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Account/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },

  // MARK: - Contact

  listContacts: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Contact',
      fields: propertiesForCommonObject.contact,
      mapper: mappers.contact,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),
  getContact: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Contact/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },

  // MARK: - Opportunity

  listOpportunities: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Opportunity',
      fields: propertiesForCommonObject.opportunity,
      mapper: mappers.opportunity,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - Lead

  listLeads: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Lead',
      fields: ['Name'],
      mapper: mappers.lead,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - User

  listUsers: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'User',
      fields: propertiesForCommonObject.user,
      mapper: mappers.user,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  listCustomObjectRecords: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: input.id,
      fields: ['Name'],
      mapper: mappers.customObject,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - Metadata
  metadataListStandardObjects: () =>
    SALESFORCE_STANDARD_OBJECTS.map((name) => ({name})),
  metadataListCustomObjects: async ({instance}) => {
    const res = await instance.GET('/sobjects')
    return (res.data.sobjects ?? [])
      .filter((s) => s.custom)
      .map((s) => ({id: s.name!, name: s.name!}))
  },
  metadataListProperties: async ({instance, input}) => {
    const sfdc = await instance.getJsForce()
    await sfdc.metadata.read('CustomObject', input.name)
    return []
  },

  metadataCreateObjectsSchema: async ({instance, input}) => {
    validateCustomObject(input)

    const sfdc = await instance.getJsForce()

    const objectName = input.name.endsWith('__c')
      ? input.name
      : `${input.name}__c`

    const readResponse = await sfdc.metadata.read('CustomObject', objectName)
    if (readResponse.fullName) {
      console.log(`Custom object with name ${objectName} already exists`)
    }

    const primaryField = input.fields.find(
      (field) => field.id === input.primaryFieldId,
    )
    const nonPrimaryFields = input.fields.filter(
      (field) => field.id !== input.primaryFieldId,
    )

    const result = await sfdc.metadata.create(
      'CustomObject',
      toSalesforceCustomObjectCreateParams(
        objectName,
        input.label,
        input.description || null,
        primaryField!,
        nonPrimaryFields,
      ),
    )

    // const nonRequiredFields = nonPrimaryFields.filter(
    //   (field) => !field.is_required,
    // )

    // await updateFieldPermissions(
    //   instance,
    //   objectName,
    //   nonRequiredFields.map((field) => field.id),
    // )

    if (result.success) {
      // throw new Error(
      //   `Failed to create custom object. Since creating a custom object with custom fields is not an atomic operation in Salesforce, you should use the custom object name ${
      //     input.name
      //   } as the 'id' parameter in the Custom Object GET endpoint to check if it was already partially created. If so, use the PUT endpoint to update the existing object. Raw error message from Salesforce: ${JSON.stringify(
      //     result,
      //     null,
      //     2,
      //   )}`,
      // )
      return {id: input.name, name: input.name}
    }
    throw new Error(
      `Failed to create custom object. Since creating a custom object with custom fields is not an atomic operation in Salesforce, you should use the custom object name ${
        input.name
      } as the 'id' parameter in the Custom Object GET endpoint to check if it was already partially created. If so, use the PUT endpoint to update the existing object. Raw error message from Salesforce: ${JSON.stringify(
        result,
        null,
        2,
      )}`,
    )
  },
} satisfies CRMProvider<SalesforceSDK>
