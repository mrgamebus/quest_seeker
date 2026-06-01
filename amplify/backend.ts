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
import { questCreatorMessage } from './functions/questCreatorMessage/resource'
import { stripeIdentity } from './functions/stripeIdentity/resource'
import { updateSeekerRank } from './functions/updateSeekerRank/resource'
import { StartingPosition } from 'aws-cdk-lib/aws-lambda'

const backend = defineBackend({
  approveCreator,
  auth,
  becomePending,
  createQuestEntrySession,
  createStripeSession,
  data,
  expiredQuests,
  joinQuest,
  mutateQuest,
  postRegistration,
  questCreatorMessage,
  rejectCreator,
  updateSeekerRank,
  storage,
  stripeIdentity,
  stripeWebhook,
  support,
})

// Tables

const questTable = backend.data.resources.tables['Quest']
const profileTable = backend.data.resources.tables['Profile']

const cfnTable = backend.data.node
  .findAll()
  .find(
    (c) =>
      c.node.path.toLowerCase().includes('profile') &&
      (c as any).cfnResourceType === 'Custom::AmplifyDynamoDBTable',
  ) as any

cfnTable.addPropertyOverride('StreamSpecification', {
  StreamViewType: 'NEW_AND_OLD_IMAGES',
})

// mutateQuest permissions

questTable.grantReadWriteData(
  backend.mutateQuest.resources.lambda as lambda.Function,
)

backend.mutateQuest.addEnvironment('QUEST_TABLE_NAME', questTable.tableName)

// --- Stripe Webhook & Session Setup ---

const stripeIdentityLambda = backend.stripeIdentity.resources
  .lambda as lambda.Function
const stripeWebhookLambda = backend.stripeWebhook.resources
  .lambda as lambda.Function
const stripeSessionLambda = backend.createStripeSession.resources
  .lambda as lambda.Function
const joinQuestLambda = backend.joinQuest.resources.lambda as lambda.Function
const expiredQuestsLambda = backend.expiredQuests.resources
  .lambda as lambda.Function
const supportLambda = backend.support.resources.lambda as lambda.Function
const questCreatorMessageLambda = backend.questCreatorMessage.resources
  .lambda as lambda.Function
const updateSeekerRankLambda = backend.updateSeekerRank.resources
  .lambda as lambda.Function

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

const stripeLambdas = [
  stripeWebhookLambda,
  stripeSessionLambda,
  stripeIdentityLambda,
]
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

profileTable.grantReadWriteData(stripeIdentityLambda)
stripeIdentityLambda.addEnvironment(
  'PROFILE_TABLE_NAME',
  profileTable.tableName,
)

profileTable.grantReadWriteData(updateSeekerRankLambda)
updateSeekerRankLambda.addEnvironment(
  'PROFILE_TABLE_NAME',
  profileTable.tableName,
)

updateSeekerRankLambda.addEventSourceMapping('ProfileStreamTrigger', {
  eventSourceArn: profileTable.tableStreamArn!,
  startingPosition: StartingPosition.LATEST,
  batchSize: 10,
  bisectBatchOnError: true,
})

updateSeekerRankLambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetRecords',
      'dynamodb:GetShardIterator',
      'dynamodb:DescribeStream',
      'dynamodb:ListStreams',
    ],
    resources: [`${profileTable.tableArn}/stream/*`],
  }),
)

const sesPolicy = new iam.PolicyStatement({
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
})

joinQuestLambda.addToRolePolicy(sesPolicy)
stripeWebhookLambda.addToRolePolicy(sesPolicy)
expiredQuestsLambda.addToRolePolicy(sesPolicy)
supportLambda.addToRolePolicy(sesPolicy)
questCreatorMessageLambda.addToRolePolicy(sesPolicy)

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
questCreatorMessageLambda.addToRolePolicy(cognitoPolicy)
stripeIdentityLambda.addToRolePolicy(cognitoPolicy)

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

questCreatorMessageLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

stripeIdentityLambda.addEnvironment(
  'AMPLIFY_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
)

backend.data.resources.graphqlApi.grantQuery(questCreatorMessageLambda)
backend.data.resources.graphqlApi.grantMutation(questCreatorMessageLambda)

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

const stripeIdentityFunctionUrl = stripeIdentityLambda.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [lambda.HttpMethod.POST],
    allowedHeaders: ['content-type', 'stripe-signature'],
  },
})

const supportFunctionUrl = supportLambda.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [lambda.HttpMethod.POST],
    allowedHeaders: ['*'],
  },
})

stripeIdentityLambda.addPermission('StripePublicInvoke', {
  principal: new iam.AnyPrincipal(),
  action: 'lambda:InvokeFunctionUrl',
  functionUrlAuthType: lambda.FunctionUrlAuthType.NONE,
})

supportLambda.addPermission('SupportPublicInvoke', {
  principal: new iam.AnyPrincipal(),
  action: 'lambda:InvokeFunctionUrl',
  functionUrlAuthType: lambda.FunctionUrlAuthType.NONE,
})

backend.addOutput({
  custom: {
    supportFunctionUrl: supportFunctionUrl.url,
    stripeIdentityFunctionUrl: stripeIdentityFunctionUrl.url,
  },
})
