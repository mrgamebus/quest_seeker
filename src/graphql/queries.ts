/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getNfcScan = /* GraphQL */ `query GetNfcScan($id: ID!) {
  getNfcScan(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetNfcScanQueryVariables,
  APITypes.GetNfcScanQuery
>;
export const getProfile = /* GraphQL */ `query GetProfile($id: ID!) {
  getProfile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetProfileQueryVariables,
  APITypes.GetProfileQuery
>;
export const getQuest = /* GraphQL */ `query GetQuest($id: ID!) {
  getQuest(id: $id) {
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
` as GeneratedQuery<APITypes.GetQuestQueryVariables, APITypes.GetQuestQuery>;
export const getTagLocation = /* GraphQL */ `query GetTagLocation($id: ID!) {
  getTagLocation(id: $id) {
    address
    createdAt
    id
    lat
    lng
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTagLocationQueryVariables,
  APITypes.GetTagLocationQuery
>;
export const getUserQuest = /* GraphQL */ `query GetUserQuest($id: ID!) {
  getUserQuest(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetUserQuestQueryVariables,
  APITypes.GetUserQuestQuery
>;
export const listLeaderboard = /* GraphQL */ `query ListLeaderboard(
  $filter: ModelProfileFilterInput
  $leaderboard: String!
  $limit: Int
  $nextToken: String
  $points: ModelIntKeyConditionInput
  $sortDirection: ModelSortDirection
) {
  listLeaderboard(
    filter: $filter
    leaderboard: $leaderboard
    limit: $limit
    nextToken: $nextToken
    points: $points
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListLeaderboardQueryVariables,
  APITypes.ListLeaderboardQuery
>;
export const listNfcScans = /* GraphQL */ `query ListNfcScans(
  $filter: ModelNfcScanFilterInput
  $limit: Int
  $nextToken: String
) {
  listNfcScans(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      address
      createdAt
      id
      lastScannedAt
      owner
      profileId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListNfcScansQueryVariables,
  APITypes.ListNfcScansQuery
>;
export const listProfiles = /* GraphQL */ `query ListProfiles(
  $filter: ModelProfileFilterInput
  $limit: Int
  $nextToken: String
) {
  listProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProfilesQueryVariables,
  APITypes.ListProfilesQuery
>;
export const listQuests = /* GraphQL */ `query ListQuests(
  $filter: ModelQuestFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuestsQueryVariables,
  APITypes.ListQuestsQuery
>;
export const listTagLocations = /* GraphQL */ `query ListTagLocations(
  $filter: ModelTagLocationFilterInput
  $limit: Int
  $nextToken: String
) {
  listTagLocations(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      address
      createdAt
      id
      lat
      lng
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTagLocationsQueryVariables,
  APITypes.ListTagLocationsQuery
>;
export const listUserQuests = /* GraphQL */ `query ListUserQuests(
  $filter: ModelUserQuestFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserQuests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUserQuestsQueryVariables,
  APITypes.ListUserQuestsQuery
>;
export const listUsersByQuest = /* GraphQL */ `query ListUsersByQuest(
  $filter: ModelUserQuestFilterInput
  $limit: Int
  $nextToken: String
  $questId: String!
  $sortDirection: ModelSortDirection
) {
  listUsersByQuest(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    questId: $questId
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUsersByQuestQueryVariables,
  APITypes.ListUsersByQuestQuery
>;
export const listUsersByQuestAndStatus = /* GraphQL */ `query ListUsersByQuestAndStatus(
  $filter: ModelUserQuestFilterInput
  $limit: Int
  $nextToken: String
  $questId: String!
  $sortDirection: ModelSortDirection
  $status: ModelStringKeyConditionInput
) {
  listUsersByQuestAndStatus(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    questId: $questId
    sortDirection: $sortDirection
    status: $status
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUsersByQuestAndStatusQueryVariables,
  APITypes.ListUsersByQuestAndStatusQuery
>;
