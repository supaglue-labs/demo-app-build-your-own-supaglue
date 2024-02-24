import * as jsforce from 'jsforce'

const SALESFORCE_API_VERSION = '57.0'
const conn = new jsforce.Connection({
  instanceUrl: process.env['SFDC_INSTANCE_URL']!,
  accessToken: process.env['SFDC_ACCESS_TOKEN']!,
  maxRequest: 10,
  version: SALESFORCE_API_VERSION,
})

void conn.metadata.read('CustomObject', 'Account')
