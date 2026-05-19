import * as iam from 'aws-cdk-lib/aws-iam'
import { defineBackend } from '@aws-amplify/backend'
import * as lambda from 'aws-cdk-lib/aws-lambda'

import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { expiredQuests } from './functions/expiredQuests/resource'
import { postRegistration } from './functions/postRegistration/resource'
import { joinQuest } from './functions/joinQuest/resource'
import { approveCreator } from './functions/approveCreator/resource'
import { becomePending } from './functions/becomePending/resource'
import { mutateQuest } from './functions/mutateQuest/resource'
import { createQuestEntrySession } from './functions/createQuestEntrySession/resource'
import { createStripeSession } from './functions/createStripeSession/resource'
import { stripeWebhook } from './functions/stripeWebhook/resource'
import { support } from './functions/support/resource'
import { rejectCreator } from './functions/rejectCreator/resource'

const backend = defineBackend({
  auth,
  data,
  storage,
  expiredQuests,
  postRegistration,
  joinQuest,
  approveCreator,
  rejectCreator,
  becomePending,
  mutateQuest,
  createQuestEntrySession,
  createStripeSession,
  stripeWebhook,
  support,
})

// Tables

const questTable = backend.data.resources.tables['Quest']
const profileTable = backend.data.resources.tables['Profile']

// mutateQuest permissions

questTable.grantReadWriteData(
  backend.mutateQuest.resources.lambda as lambda.Function,
)

backend.mutateQuest.addEnvironment('QUEST_TABLE_NAME', questTable.tableName)

// --- Stripe Webhook & Session Setup ---

const stripeWebhookLambda = backend.stripeWebhook.resources
  .lambda as lambda.Function
const stripeSessionLambda = backend.createStripeSession.resources
  .lambda as lambda.Function
const joinQuestLambda = backend.joinQuest.resources.lambda as lambda.Function
const expiredQuestsLambda = backend.expiredQuests.resources
  .lambda as lambda.Function
const supportLambda = backend.support.resources.lambda as lambda.Function

stripeWebhookLambda.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [lambda.HttpMethod.POST],
    allowedHeaders: ['content-type', 'stripe-signature'],
  },
})

stripeWebhookLambda.addPermission('StripePublicInvoke', {
  principal: new iam.AnyPrincipal(),
  action: 'lambda:InvokeFunctionUrl',
  functionUrlAuthType: lambda.FunctionUrlAuthType.NONE,
})

const graphqlUrl =
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl

const stripeLambdas = [stripeWebhookLambda, stripeSessionLambda]
stripeLambdas.forEach((l) => {
  l.addEnvironment(
    'AMPLIFY_USER_POOL_ID',
    backend.auth.resources.userPool.userPoolId,
  )
  l.addEnvironment('AMPLIFY_DATA_ENDPOINT', graphqlUrl)
})

backend.data.resources.graphqlApi.grantQuery(stripeSessionLambda)
backend.data.resources.tables['Profile'].grantReadData(stripeSessionLambda)
questTable.grantReadData(joinQuestLambda)

questTable.grantReadWriteData(stripeWebhookLambda)
stripeWebhookLambda.addEnvironment('QUEST_TABLE_NAME', questTable.tableName)
joinQuestLambda.addEnvironment('QUEST_TABLE_NAME', questTable.tableName)

const userQuestTable = backend.data.resources.tables['UserQuest']
userQuestTable.grantReadWriteData(joinQuestLambda)
joinQuestLambda.addEnvironment(
  'USER_QUEST_TABLE_NAME',
  userQuestTable.tableName,
)

profileTable.grantReadWriteData(joinQuestLambda)
joinQuestLambda.addEnvironment('PROFILE_TABLE_NAME', profileTable.tableName)

userQuestTable.grantReadWriteData(stripeWebhookLambda)
stripeWebhookLambda.addEnvironment(
  'USER_QUEST_TABLE_NAME',
  userQuestTable.tableName,
)
profileTable.grantReadWriteData(stripeWebhookLambda)
stripeWebhookLambda.addEnvironment('PROFILE_TABLE_NAME', profileTable.tableName)

const sesPolicy = new iam.PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
})

joinQuestLambda.addToRolePolicy(sesPolicy)
stripeWebhookLambda.addToRolePolicy(sesPolicy)
expiredQuestsLambda.addToRolePolicy(sesPolicy)
supportLambda.addToRolePolicy(sesPolicy)

const cognitoPolicy = new iam.PolicyStatement({
  actions: [
    'cognito-idp:AdminGetUser',
    'cognito-idp:AdminUpdateUserAttributes',
    'cognito-idp:AdminAddUserToGroup',
  ],
  resources: [
    `arn:aws:cognito-idp:ap-southeast-2:469642840324:userpool/${backend.auth.resources.userPool.userPoolId}`,
  ],
})

joinQuestLambda.addToRolePolicy(cognitoPolicy)
stripeWebhookLambda.addToRolePolicy(cognitoPolicy)
expiredQuestsLambda.addToRolePolicy(cognitoPolicy)

joinQuestLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

expiredQuestsLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

supportLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

const becomePendingLambda = backend.becomePending.resources
  .lambda as lambda.Function

profileTable.grantReadWriteData(becomePendingLambda)
becomePendingLambda.addEnvironment('PROFILE_TABLE_NAME', profileTable.tableName)

becomePendingLambda.addToRolePolicy(sesPolicy)

becomePendingLambda.addToRolePolicy(cognitoPolicy)

becomePendingLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

const approveCreatorLambda = backend.approveCreator.resources
  .lambda as lambda.Function

profileTable.grantReadWriteData(approveCreatorLambda)
approveCreatorLambda.addEnvironment(
  'PROFILE_TABLE_NAME',
  profileTable.tableName,
)

approveCreatorLambda.addToRolePolicy(sesPolicy)

approveCreatorLambda.addToRolePolicy(cognitoPolicy)

approveCreatorLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

const rejectCreatorLambda = backend.rejectCreator.resources
  .lambda as lambda.Function

profileTable.grantReadWriteData(rejectCreatorLambda)
rejectCreatorLambda.addEnvironment('PROFILE_TABLE_NAME', profileTable.tableName)

rejectCreatorLambda.addToRolePolicy(sesPolicy)

rejectCreatorLambda.addToRolePolicy(cognitoPolicy)

rejectCreatorLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

const supportFunctionUrl = supportLambda.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [lambda.HttpMethod.POST],
    allowedHeaders: ['*'],
  },
})

supportLambda.addPermission('SupportPublicInvoke', {
  principal: new iam.AnyPrincipal(),
  action: 'lambda:InvokeFunctionUrl',
  functionUrlAuthType: lambda.FunctionUrlAuthType.NONE,
})

backend.addOutput({
  custom: {
    supportFunctionUrl: supportFunctionUrl.url,
  },
})
