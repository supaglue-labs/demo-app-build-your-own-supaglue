import * as jsforce from 'jsforce'

interface SalesforceInstance {
  getJsForce: () => Promise<jsforce.Connection>
}

const API_VERSION = '59.0'

export async function updateFieldPermissions(
  instance: SalesforceInstance,
  objectName: string,
  nonPrimaryFields: string[],
) {
  // After custom fields are created, they're not automatically visible. We need to
  // set the field-level security to Visible for profiles.
  // Instead of updating all profiles, we'll just update it for the profile for the user
  // in this connection.
  //
  // We're doing this all the time, even if there were no detected added fields, since
  // the previous call to this endpoint could have failed after creating fields but before
  // adding permissions, and we want the second call to this endpoint to fix that.
  //
  // TODO: do we want to make it visible for all profiles?
  const sfdc = await instance.getJsForce()

  const {userInfo} = sfdc
  if (!userInfo) {
    throw new Error('Could not get info of current user')
  }

  // Get the user record
  const user = await sfdc.retrieve('User', userInfo.id, {
    fields: ['ProfileId'],
  })

  // Get the Id for the standard user profile
  const [standardUserId] = (
    await sfdc.query(`SELECT Id FROM Profile WHERE Name = 'Standard User'`)
  ).records.map((record: any) => record.Id)

  const profileIdsToGrantPermissionsTo = [user['ProfileId'], standardUserId]

  // Get the permission set ids
  const permissionSetIds = (
    await sfdc.query(
      `SELECT Id FROM PermissionSet WHERE ProfileId IN ('${profileIdsToGrantPermissionsTo.join(
        "','",
      )}')`,
    )
  ).records.map((record: any) => record.Id)

  // Figure out which fields already have permissions
  // TODO: Paginate
  const {records: existingFieldPermissions} = await sfdc.query(
    `SELECT Field FROM FieldPermissions WHERE SobjectType='${objectName}' AND ParentId IN ('${permissionSetIds.join(
      "','",
    )}')`,
  )
  const existingFieldPermissionFieldNames = existingFieldPermissions.map(
    (fieldPermission: any) => fieldPermission.Field,
  )
  const fieldsToAddPermissionsFor = nonPrimaryFields.filter(
    (field) =>
      !existingFieldPermissionFieldNames.includes(`${objectName}.${field}`),
  )

  const {compositeResponse} = await sfdc.requestPost<{
    compositeResponse: {httpStatusCode: number}[]
  }>(`/services/data/v${API_VERSION}/composite`, {
    // We're doing this for all fields, not just the added ones, in case the previous
    // call to this endpoint succeeded creating additional fields but failed to
    // add permissions for them.
    compositeRequest: fieldsToAddPermissionsFor.flatMap((field) =>
      permissionSetIds.map((permissionSetId) => ({
        referenceId: `${field}_${permissionSetId}`,
        method: 'POST',
        url: `/services/data/v${API_VERSION}/sobjects/FieldPermissions/`,
        body: {
          ParentId: permissionSetId,
          SobjectType: objectName,
          Field: `${objectName}.${field}`,
          PermissionsEdit: true,
          PermissionsRead: true,
        },
      })),
    ),
  })
  // if not 2xx
  if (
    compositeResponse.some(
      (response: any) =>
        response.httpStatusCode < 200 || response.httpStatusCode >= 300,
    )
  ) {
    throw new Error(
      `Failed to add field permissions: ${JSON.stringify(
        compositeResponse,
        null,
        2,
      )}`,
    )
  }
}
