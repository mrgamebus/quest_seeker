import { type ClientSchema, a, defineData } from '@aws-amplify/backend'
import { expiredQuests } from '../functions/expiredQuests/resource'
import { postRegistration } from '../functions/postRegistration/resource'
import { joinQuest } from '../functions/joinQuest/resource'
import { approveCreator } from '../functions/approveCreator/resource'
import { becomePending } from '../functions/becomePending/resource'
import { mutateQuest } from '../functions/mutateQuest/resource'
import { createQuestEntrySession } from '../functions/createQuestEntrySession/resource'
import { createStripeSession } from '../functions/createStripeSession/resource'
import { stripeWebhook } from '../functions/stripeWebhook/resource'
import { rejectCreator } from '../functions/rejectCreator/resource'
import { questCreatorMessage } from '../functions/questCreatorMessage/resource'

export const schema = a
  .schema({
    /* ------------------ CUSTOM MUTATION ------------------ */
    joinQuest: a
      .mutation()
      .arguments({
        questId: a.string().required(),
        profileId: a.string().required(),
      })
      .returns(a.boolean())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(joinQuest)),
    approveCreator: a
      .mutation()
      .arguments({
        profileId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin')])
      .handler(a.handler.function(approveCreator)),
    rejectCreator: a
      .mutation()
      .arguments({
        profileId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin')])
      .handler(a.handler.function(rejectCreator)),
    becomePending: a
      .mutation()
      .arguments({
        type: a.string().required(),
        userId: a.string().required(),
        accountName: a.string().required(),
        bankAccount: a.string().required(),
        profileData: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(becomePending)),

    SendEmailResult: a.customType({
      message: a.string().required(),
      emailsSent: a.integer().required(),
      failures: a.integer(),
    }),

    sendQuestCreatorMessage: a
      .mutation()
      .arguments({
        questId: a.string().required(),
        creatorMessage: a.string().required(),
        creatorName: a.string(),
      })
      .returns(a.ref('SendEmailResult'))
      .authorization((allow) => [allow.groups(['creator', 'Admin'])])
      .handler(a.handler.function(questCreatorMessage)),

    /* --- 1. DEFINE CUSTOM TYPES & ENUMS FIRST --- */
    QuestStatus: a.enum([
      'draft',
      'published',
      'expired',
      'archived',
      'upcoming',
      'occurring',
      'completed',
    ]),

    MutateQuestAction: a.enum([
      'CREATE_DRAFT',
      'UPDATE_DRAFT',
      'PUBLISH',
      'UPDATE_PUBLISHED',
      'UPDATE_COMPLETED',
    ]),

    MutateQuestResponse: a.customType({
      questId: a.string().required(),
      status: a.ref('QuestStatus').required(),
    }),
    /* --- CUSTOM MUTATIONS --- */

    mutateQuest: a
      .mutation()
      .arguments({
        action: a.ref('MutateQuestAction').required(),
        questId: a.string(),
        name: a.string(),
        details: a.string(),
        imagePath: a.string(),
        imageThumbPath: a.string(),
        startAt: a.datetime(),
        endAt: a.datetime(),
        region: a.string(),
        entryFee: a.integer(),
        prizes: a.json(),
        sponsors: a.json(),
        tasks: a.json(),
        quest_winners: a.string(),
        status: a.string(),
        creator_message: a.string(),
      })
      .returns(a.ref('MutateQuestResponse'))
      .authorization((allow) => [allow.groups(['creator', 'Admin'])])
      .handler(a.handler.function(mutateQuest)),

    createStripeSession: a
      .mutation()
      .arguments({
        questId: a.string().required(),
        profileId: a.string().required(),
        returnUrl: a.string().required(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(createStripeSession)),

    createQuestEntrySession: a
      .mutation()
      .arguments({
        questId: a.string().required(),
        profileId: a.string().required(),
        questName: a.string().required(),
        entryFee: a.integer().required(),
        returnUrl: a.string().required(),
      })
      .returns(a.string())
      .handler(a.handler.function(createQuestEntrySession))
      .authorization((allow) => [allow.authenticated()]),

    /* ------------------ QUEST MODEL ------------------ */
    Quest: a
      .model({
        quest_name: a.string(),
        quest_details: a.string(),
        quest_image: a.string(),
        quest_image_thumb: a.string(),
        quest_start_at: a.datetime(),
        quest_end_at: a.datetime(),
        quest_prize: a.boolean(),
        quest_prize_info: a.string(),
        quest_sponsor: a.string(),
        region: a.string(),
        quest_entry: a.integer(),
        quest_tasks: a.json(),
        creator_id: a.string(),
        status: a.ref('QuestStatus'),
        quest_winners: a.string(),
        creator_message: a.string(),
      })
      .authorization((allow) => [
        allow.groups(['creator']).to(['create', 'update', 'delete', 'read']),
        allow.groups(['Admin']).to(['create', 'update', 'delete', 'read']),
        allow.authenticated().to(['read']),
        allow.guest().to(['read', 'update']),
      ]),

    /* ------------------ PROFILE MODEL ------------------ */
    Profile: a
      .model({
        full_name: a.string(),
        email: a.string(),
        phone: a.string(),
        organization_name: a.string(),
        registration_number: a.string(),
        charity_number: a.string(),
        business_type: a.string(),
        organization_description: a.string(),
        primary_contact_name: a.string(),
        primary_contact_position: a.string(),
        primary_contact_phone: a.string(),
        about_me: a.string(),
        secondary_contact_name: a.string(),
        secondary_contact_position: a.string(),
        secondary_contact_phone: a.string(),
        image: a.string(),
        image_thumbnail: a.string(),
        points: a.integer(),
        leaderboard: a.string().default('GLOBAL'),
        role: a.enum(['seeker', 'creator', 'Admin', 'pending']),
        seeker_rank: a.enum([
          'wanderer',
          'scout',
          'tracker',
          'trailblazer',
          'navigator',
        ]),
      })
      .secondaryIndexes((index) => [
        index('leaderboard').sortKeys(['points']).queryField('listLeaderboard'),
      ])
      .authorization((allow) => [
        allow.owner().to(['read', 'create', 'update']),
        allow.authenticated().to(['read', 'update', 'create']),
        allow.groups(['Admin']).to(['read', 'update', 'delete']),
        allow.guest().to(['read']),
      ]),

    /* ------------------ USER QUEST MODEL ------------------ */
    UserQuestStatus: a.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']),

    UserQuest: a
      .model({
        profileId: a.string().required(),
        questId: a.string().required(),
        status: a.ref('UserQuestStatus'),
        joinedAt: a.datetime(),
        points: a.integer(),
        tasks: a.json(),
      })
      .secondaryIndexes((index) => [
        index('questId').queryField('listUsersByQuest'),
        index('questId')
          .sortKeys(['status'])
          .queryField('listUsersByQuestAndStatus'),
      ])
      .authorization((allow) => [
        allow.owner().to(['read', 'create', 'update']),
        allow.authenticated().to(['read']),
        allow.groups(['Admin']).to(['read', 'update', 'delete']),
      ]),
  })
  .authorization((allow) => [
    allow.resource(joinQuest),
    allow.resource(expiredQuests).to(['query', 'mutate']),
    allow.resource(postRegistration).to(['mutate']),
    allow.resource(approveCreator).to(['query', 'mutate']),
    allow.resource(rejectCreator).to(['query', 'mutate']),
    allow.resource(becomePending).to(['query', 'mutate']),
    allow.resource(mutateQuest).to(['mutate', 'query']),
    allow.resource(createStripeSession).to(['query']),
    allow.resource(stripeWebhook).to(['query', 'mutate']),
    allow.resource(joinQuest).to(['query', 'mutate']),
    allow.resource(questCreatorMessage).to(['query', 'mutate']),
  ])

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
