/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const approveCreator = /* GraphQL */ `mutation ApproveCreator($profileId: String!) {
  approveCreator(profileId: $profileId)
}
` as GeneratedMutation<
  APITypes.ApproveCreatorMutationVariables,
  APITypes.ApproveCreatorMutation
>;
export const becomePending = /* GraphQL */ `mutation BecomePending(
  $accountName: String!
  $bankAccount: String!
  $profileData: String!
  $type: String!
  $userId: String!
) {
  becomePending(
    accountName: $accountName
    bankAccount: $bankAccount
    profileData: $profileData
    type: $type
    userId: $userId
  )
}
` as GeneratedMutation<
  APITypes.BecomePendingMutationVariables,
  APITypes.BecomePendingMutation
>;
export const createNfcScan = /* GraphQL */ `mutation CreateNfcScan(
  $condition: ModelNfcScanConditionInput
  $input: CreateNfcScanInput!
) {
  createNfcScan(condition: $condition, input: $input) {
    address
    createdAt
    id
    lastScannedAt
    owner
    profileId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateNfcScanMutationVariables,
  APITypes.CreateNfcScanMutation
>;
export const createProfile = /* GraphQL */ `mutation CreateProfile(
  $condition: ModelProfileConditionInput
  $input: CreateProfileInput!
) {
  createProfile(condition: $condition, input: $input) {
    about_me
    business_type
    charity_number
    createdAt
    email
    full_name
    id
    image
    image_thumbnail
    leaderboard
    organization_description
    organization_name
    owner
    phone
    points
    primary_contact_name
    primary_contact_phone
    primary_contact_position
    registration_number
    role
    secondary_contact_name
    secondary_contact_phone
    secondary_contact_position
    seeker_rank
    stripeAccountId
    stripeOnboarded
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateProfileMutationVariables,
  APITypes.CreateProfileMutation
>;
export const createQuest = /* GraphQL */ `mutation CreateQuest(
  $condition: ModelQuestConditionInput
  $input: CreateQuestInput!
) {
  createQuest(condition: $condition, input: $input) {
    createdAt
    creator_id
    creator_message
    id
    quest_details
    quest_end_at
    quest_entry
    quest_image
    quest_image_thumb
    quest_name
    quest_prize
    quest_prize_info
    quest_sponsor
    quest_start_at
    quest_tasks
    quest_winners
    region
    status
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuestMutationVariables,
  APITypes.CreateQuestMutation
>;
export const createQuestEntrySession = /* GraphQL */ `mutation CreateQuestEntrySession(
  $entryFee: Int!
  $profileId: String!
  $questId: String!
  $questName: String!
  $returnUrl: String!
) {
  createQuestEntrySession(
    entryFee: $entryFee
    profileId: $profileId
    questId: $questId
    questName: $questName
    returnUrl: $returnUrl
  )
}
` as GeneratedMutation<
  APITypes.CreateQuestEntrySessionMutationVariables,
  APITypes.CreateQuestEntrySessionMutation
>;
export const createStripeSession = /* GraphQL */ `mutation CreateStripeSession(
  $profileId: String!
  $questId: String!
  $returnUrl: String!
) {
  createStripeSession(
    profileId: $profileId
    questId: $questId
    returnUrl: $returnUrl
  )
}
` as GeneratedMutation<
  APITypes.CreateStripeSessionMutationVariables,
  APITypes.CreateStripeSessionMutation
>;
export const createTagLocation = /* GraphQL */ `mutation CreateTagLocation(
  $condition: ModelTagLocationConditionInput
  $input: CreateTagLocationInput!
) {
  createTagLocation(condition: $condition, input: $input) {
    address
    createdAt
    id
    lat
    lng
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateTagLocationMutationVariables,
  APITypes.CreateTagLocationMutation
>;
export const createUserQuest = /* GraphQL */ `mutation CreateUserQuest(
  $condition: ModelUserQuestConditionInput
  $input: CreateUserQuestInput!
) {
  createUserQuest(condition: $condition, input: $input) {
    createdAt
    id
    joinedAt
    owner
    points
    profileId
    questId
    status
    tasks
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserQuestMutationVariables,
  APITypes.CreateUserQuestMutation
>;
export const deleteNfcScan = /* GraphQL */ `mutation DeleteNfcScan(
  $condition: ModelNfcScanConditionInput
  $input: DeleteNfcScanInput!
) {
  deleteNfcScan(condition: $condition, input: $input) {
    address
    createdAt
    id
    lastScannedAt
    owner
    profileId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteNfcScanMutationVariables,
  APITypes.DeleteNfcScanMutation
>;
export const deleteProfile = /* GraphQL */ `mutation DeleteProfile(
  $condition: ModelProfileConditionInput
  $input: DeleteProfileInput!
) {
  deleteProfile(condition: $condition, input: $input) {
    about_me
    business_type
    charity_number
    createdAt
    email
    full_name
    id
    image
    image_thumbnail
    leaderboard
    organization_description
    organization_name
    owner
    phone
    points
    primary_contact_name
    primary_contact_phone
    primary_contact_position
    registration_number
    role
    secondary_contact_name
    secondary_contact_phone
    secondary_contact_position
    seeker_rank
    stripeAccountId
    stripeOnboarded
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteProfileMutationVariables,
  APITypes.DeleteProfileMutation
>;
export const deleteQuest = /* GraphQL */ `mutation DeleteQuest(
  $condition: ModelQuestConditionInput
  $input: DeleteQuestInput!
) {
  deleteQuest(condition: $condition, input: $input) {
    createdAt
    creator_id
    creator_message
    id
    quest_details
    quest_end_at
    quest_entry
    quest_image
    quest_image_thumb
    quest_name
    quest_prize
    quest_prize_info
    quest_sponsor
    quest_start_at
    quest_tasks
    quest_winners
    region
    status
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuestMutationVariables,
  APITypes.DeleteQuestMutation
>;
export const deleteTagLocation = /* GraphQL */ `mutation DeleteTagLocation(
  $condition: ModelTagLocationConditionInput
  $input: DeleteTagLocationInput!
) {
  deleteTagLocation(condition: $condition, input: $input) {
    address
    createdAt
    id
    lat
    lng
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteTagLocationMutationVariables,
  APITypes.DeleteTagLocationMutation
>;
export const deleteUserQuest = /* GraphQL */ `mutation DeleteUserQuest(
  $condition: ModelUserQuestConditionInput
  $input: DeleteUserQuestInput!
) {
  deleteUserQuest(condition: $condition, input: $input) {
    createdAt
    id
    joinedAt
    owner
    points
    profileId
    questId
    status
    tasks
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserQuestMutationVariables,
  APITypes.DeleteUserQuestMutation
>;
export const joinQuest = /* GraphQL */ `mutation JoinQuest($profileId: String!, $questId: String!) {
  joinQuest(profileId: $profileId, questId: $questId)
}
` as GeneratedMutation<
  APITypes.JoinQuestMutationVariables,
  APITypes.JoinQuestMutation
>;
export const mutateQuest = /* GraphQL */ `mutation MutateQuest(
  $action: MutateQuestAction!
  $creator_message: String
  $details: String
  $endAt: AWSDateTime
  $entryFee: Int
  $imagePath: String
  $imageThumbPath: String
  $name: String
  $prizes: AWSJSON
  $questId: String
  $quest_winners: String
  $region: String
  $sponsors: AWSJSON
  $startAt: AWSDateTime
  $status: String
  $tasks: AWSJSON
) {
  mutateQuest(
    action: $action
    creator_message: $creator_message
    details: $details
    endAt: $endAt
    entryFee: $entryFee
    imagePath: $imagePath
    imageThumbPath: $imageThumbPath
    name: $name
    prizes: $prizes
    questId: $questId
    quest_winners: $quest_winners
    region: $region
    sponsors: $sponsors
    startAt: $startAt
    status: $status
    tasks: $tasks
  ) {
    questId
    status
    __typename
  }
}
` as GeneratedMutation<
  APITypes.MutateQuestMutationVariables,
  APITypes.MutateQuestMutation
>;
export const rejectCreator = /* GraphQL */ `mutation RejectCreator($profileId: String!) {
  rejectCreator(profileId: $profileId)
}
` as GeneratedMutation<
  APITypes.RejectCreatorMutationVariables,
  APITypes.RejectCreatorMutation
>;
export const sendQuestCreatorMessage = /* GraphQL */ `mutation SendQuestCreatorMessage(
  $creatorMessage: String!
  $creatorName: String
  $questId: String!
) {
  sendQuestCreatorMessage(
    creatorMessage: $creatorMessage
    creatorName: $creatorName
    questId: $questId
  ) {
    emailsSent
    failures
    message
    __typename
  }
}
` as GeneratedMutation<
  APITypes.SendQuestCreatorMessageMutationVariables,
  APITypes.SendQuestCreatorMessageMutation
>;
export const updateNfcScan = /* GraphQL */ `mutation UpdateNfcScan(
  $condition: ModelNfcScanConditionInput
  $input: UpdateNfcScanInput!
) {
  updateNfcScan(condition: $condition, input: $input) {
    address
    createdAt
    id
    lastScannedAt
    owner
    profileId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateNfcScanMutationVariables,
  APITypes.UpdateNfcScanMutation
>;
export const updateProfile = /* GraphQL */ `mutation UpdateProfile(
  $condition: ModelProfileConditionInput
  $input: UpdateProfileInput!
) {
  updateProfile(condition: $condition, input: $input) {
    about_me
    business_type
    charity_number
    createdAt
    email
    full_name
    id
    image
    image_thumbnail
    leaderboard
    organization_description
    organization_name
    owner
    phone
    points
    primary_contact_name
    primary_contact_phone
    primary_contact_position
    registration_number
    role
    secondary_contact_name
    secondary_contact_phone
    secondary_contact_position
    seeker_rank
    stripeAccountId
    stripeOnboarded
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateProfileMutationVariables,
  APITypes.UpdateProfileMutation
>;
export const updateQuest = /* GraphQL */ `mutation UpdateQuest(
  $condition: ModelQuestConditionInput
  $input: UpdateQuestInput!
) {
  updateQuest(condition: $condition, input: $input) {
    createdAt
    creator_id
    creator_message
    id
    quest_details
    quest_end_at
    quest_entry
    quest_image
    quest_image_thumb
    quest_name
    quest_prize
    quest_prize_info
    quest_sponsor
    quest_start_at
    quest_tasks
    quest_winners
    region
    status
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuestMutationVariables,
  APITypes.UpdateQuestMutation
>;
export const updateTagLocation = /* GraphQL */ `mutation UpdateTagLocation(
  $condition: ModelTagLocationConditionInput
  $input: UpdateTagLocationInput!
) {
  updateTagLocation(condition: $condition, input: $input) {
    address
    createdAt
    id
    lat
    lng
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateTagLocationMutationVariables,
  APITypes.UpdateTagLocationMutation
>;
export const updateUserQuest = /* GraphQL */ `mutation UpdateUserQuest(
  $condition: ModelUserQuestConditionInput
  $input: UpdateUserQuestInput!
) {
  updateUserQuest(condition: $condition, input: $input) {
    createdAt
    id
    joinedAt
    owner
    points
    profileId
    questId
    status
    tasks
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserQuestMutationVariables,
  APITypes.UpdateUserQuestMutation
>;
