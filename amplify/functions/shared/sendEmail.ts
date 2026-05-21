// /amplify/functions/shared/sendEmail.ts

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'

// TYPES

type Role = 'seeker' | 'creator' | 'pending'

export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string
  organization_name: string
  registration_number: string
  charity_number: string
  business_type: string
  organization_description: string
  primary_contact_name: string
  primary_contact_position: string
  primary_contact_phone: string
  secondary_contact_name: string
  secondary_contact_position: string
  secondary_contact_phone: string
  about_me: string
  image: string
  image_thumbnail: string
  role: Role
  points: number
}

// AWS CLIENTS

const ses = new SESClient({ region: 'ap-southeast-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const cognito = new CognitoIdentityProviderClient({ region: 'ap-southeast-2' })

// CONFIGURATION

const USER_POOL_ID = process.env.AMPLIFY_USER_POOL_ID!
const FROM_ADDRESS = 'tari@tiakiwhenua.co.nz'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tari@tiakiwhenua.co.nz'

// UTILITY FUNCTIONS

export const getEmailFromCognito = async (
  userId: string,
): Promise<string | undefined> => {
  try {
    const result = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
      }),
    )
    const emailAttr = result.UserAttributes?.find(
      (attr) => attr.Name === 'email',
    )
    return emailAttr?.Value
  } catch (err) {
    console.error('Failed to fetch email from Cognito for user:', userId, err)
    return undefined
  }
}

const safeSend = async (command: SendEmailCommand) => {
  try {
    await ses.send(command)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'MessageRejected') {
      console.warn('SES sandbox rejected email:', err.message)
    } else {
      console.error('SES unexpected error:', err)
    }
  }
}

// CREATOR APPLICATION EMAILS

export const sendCreatorApplicationEmail = async (
  userId: string,
  accountName: string,
  bankAccount: string,
  profileData: Partial<Profile>,
) => {
  const footer = `\n\n---\nThis is an automated transactional message from the Quest Seeker admin system.`

  const userName = profileData.full_name ?? 'Unknown User'
  const userEmail = await getEmailFromCognito(userId)

  const emailBody = `
New Creator Application Received

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPLICANT DETAILS
Name: ${userName}
Email: ${userEmail ?? 'Not available'}
User ID: ${userId}

ORGANIZATION DETAILS
Organization Name: ${profileData.organization_name ?? 'N/A'}
Business Type: ${profileData.business_type ?? 'N/A'}
${profileData.registration_number ? `Registration Number: ${profileData.registration_number}` : ''}
${profileData.charity_number ? `Charity Number: ${profileData.charity_number}` : ''}

Organization Description:
${profileData.organization_description ?? 'N/A'}

PRIMARY CONTACT
Name: ${profileData.primary_contact_name ?? 'N/A'}
Position: ${profileData.primary_contact_position ?? 'N/A'}
Phone: ${profileData.primary_contact_phone ?? 'N/A'}

${
  profileData.secondary_contact_name
    ? `SECONDARY CONTACT
Name: ${profileData.secondary_contact_name}
Position: ${profileData.secondary_contact_position ?? 'N/A'}
Phone: ${profileData.secondary_contact_phone ?? 'N/A'}
`
    : ''
}
BANK DETAILS (For Verification)
Account Name: ${accountName}
Account Number: ${bankAccount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review this application in the admin panel.
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [ADMIN_EMAIL] },
      Message: {
        Subject: { Data: `New Creator Application: ${userName}` },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  )
}

export const sendSeekerConfirmationEmail = async (
  userId: string,
  userName: string,
  userEmail: string,
) => {
  const footer = `\n\n---\nThis is an automated message from Quest Seeker.`

  const emailBody = `
Hi ${userName},

Thank you for submitting your creator application!

We've received your application and our team will review it shortly. You'll receive an email notification once your application has been reviewed.

In the meantime, you can continue using Quest Seeker as a seeker.

If you have any questions, please don't hesitate to reach out.

Best regards,
The Quest Seeker Team
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: 'Your Creator Application Has Been Received' },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  )
}

export const sendCreatorApprovalEmail = async (
  userId: string,
  userName: string,
  userEmail: string,
) => {
  const footer = `\n\n---\nThis is an automated message from Quest Seeker.`

  const emailBody = `
Hi ${userName},

Great news! Your creator application has been approved! 🎉

You can now create and manage quests on the Quest Seeker platform. Log in to your account to get started.

What you can do as a creator:
- Create and publish quests
- Manage your quest listings
- Track applications and engagement
- Earn points and build your reputation

If you have any questions or need help getting started, please don't hesitate to reach out.

Welcome to the Quest Seeker creator community!

Best regards,
The Quest Seeker Team
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: '🎉 Your Creator Application Has Been Approved!' },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  )
}

export const sendCreatorRejectionEmail = async (
  userId: string,
  userName: string,
  userEmail: string,
) => {
  const footer = `\n\n---\nThis is an automated message from Quest Seeker.`

  const emailBody = `
Hi ${userName},

Unfortunately, we have not been able to apporve your request to become a Quest Creator at this time! 🎉

This may be due to insufficient information or possible errors with your form submission.

Please resubmit if you can see any issues yourself, or contact us at questseekernz@gmail.com if you would like
to query this decision.

Best regards,
The Quest Seeker Team
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: 'Quest Creator Application' },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  )
}

// BANK UPDATE EMAILS

export const sendBankUpdateEmail = async (
  userId: string,
  accountName: string,
  bankAccount: string,
  profileTableName: string,
) => {
  const { Item: profile } = await ddb.send(
    new GetCommand({ TableName: profileTableName, Key: { id: userId } }),
  )

  const userName = profile?.full_name ?? 'Unknown User'
  const userEmail = await getEmailFromCognito(userId)
  const footer = `\n\n---\nThis is an automated transactional message from the Quest Seeker admin system.`

  const emailBody = `
Bank Details Update Request

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER DETAILS
Name: ${userName}
Email: ${userEmail ?? 'Not available'}
User ID: ${userId}

BANK DETAILS (For Verification)
Account Name: ${accountName}
Account Number: ${bankAccount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please verify and update these bank details in the system.
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [ADMIN_EMAIL] },
      Message: {
        Subject: { Data: `Bank Details Update: ${userName}` },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  )
}

// QUEST-RELATED EMAILS

export const sendJoinEmails = async (
  questId: string,
  profileId: string,
  profileTableName: string,
  questTableName: string,
) => {
  const [{ Item: quest }, { Item: joinerProfile }] = await Promise.all([
    ddb.send(
      new GetCommand({ TableName: questTableName, Key: { id: questId } }),
    ),
    ddb.send(
      new GetCommand({ TableName: profileTableName, Key: { id: profileId } }),
    ),
  ])

  if (!quest || !joinerProfile) {
    console.warn('sendJoinEmails: quest or joiner profile not found')
    return
  }

  const questName = quest.quest_name ?? 'a quest'
  const joinerName = joinerProfile.full_name ?? 'there'
  const creatorId = quest.creator_id
  const footer = `\n\n---\nThis is an automated transactional message. You are receiving this because you have an account on questseeker.co.nz.`

  // Fetch emails from Cognito
  const [joinerEmail, creatorEmail] = await Promise.all([
    getEmailFromCognito(profileId),
    creatorId ? getEmailFromCognito(creatorId) : Promise.resolve(undefined),
  ])

  // Email creator
  if (creatorId && creatorEmail) {
    const { Item: creatorProfile } = await ddb.send(
      new GetCommand({ TableName: profileTableName, Key: { id: creatorId } }),
    )
    const creatorName = creatorProfile?.full_name ?? 'there'

    await safeSend(
      new SendEmailCommand({
        Source: FROM_ADDRESS,
        Destination: { ToAddresses: [creatorEmail] },
        Message: {
          Subject: { Data: `New participant joined "${questName}"!` },
          Body: {
            Text: {
              Data: `Hi there ${creatorName},\n\n${joinerName} has just joined your quest "${questName}".\n\nYou can view your quest participants by logging into your account at questseeker.co.nz.\n\nNgā mihi,\nThe Quest Seeker Team${footer}`,
            },
          },
        },
      }),
    )
  }

  // Email joiner
  if (joinerEmail) {
    await safeSend(
      new SendEmailCommand({
        Source: FROM_ADDRESS,
        Destination: { ToAddresses: [joinerEmail] },
        Message: {
          Subject: { Data: `You've joined "${questName}"!` },
          Body: {
            Text: {
              Data: `Hi there ${joinerName},\n\nYou've successfully joined the quest "${questName}". Good luck!\n\nYou can track your progress and complete tasks by logging into your account at questseeker.co.nz.\n\nNgā mihi,\nThe Quest Seeker Team${footer}`,
            },
          },
        },
      }),
    )
  }
}

export const sendPublishedEmail = async (
  creatorId: string,
  questName: string,
  profileTableName: string,
) => {
  const { Item: creatorProfile } = await ddb.send(
    new GetCommand({ TableName: profileTableName, Key: { id: creatorId } }),
  )

  const creatorName = creatorProfile?.full_name ?? 'there'
  const creatorEmail = await getEmailFromCognito(creatorId)
  const footer = `\n\n---\nThis is an automated transactional message. You are receiving this because you are a registered quest creator on questseeker.co.nz.`

  if (!creatorEmail) {
    console.warn('sendPublishedEmail: creator email not found')
    return
  }

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [creatorEmail] },
      Message: {
        Subject: { Data: `Your quest "${questName}" is now live!` },
        Body: {
          Text: {
            Data: `Hi there ${creatorName},\n\nGreat news! Your quest "${questName}" has been successfully published and is now live on the platform.\n\nParticipants can now find and join your quest.\n\nNgā mihi,\nThe Quest Seeker Team${footer}`,
          },
        },
      },
    }),
  )
}

export const sendQuestExpiredEmail = async (
  creatorId: string,
  questName: string,
  questId: string,
) => {
  const creatorEmail = await getEmailFromCognito(creatorId)

  if (!creatorEmail) {
    console.warn(
      'sendQuestExpiredEmail: creator email not found for',
      creatorId,
    )
    return
  }

  const questUrl = `https://questseeker.co.nz/user/quest/${questId}`
  const footer = `\n\n---\nThis is an automated transactional message. You are receiving this because you are a registered quest creator on questseeker.co.nz.`

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [creatorEmail] },
      Message: {
        Subject: { Data: `Your quest "${questName}" has expired` },
        Body: {
          Text: {
            Data: `Kia ora!\n\nYour quest "${questName}" has now expired. You can view the results and pick a winner by visiting the quest page:\n\n${questUrl}\n\nNgā mihi,\nThe QuestSeeker Team${footer}`,
          },
        },
      },
    }),
  )
}

export const sendSeekerQuestExpiredEmail = async (
  seekerId: string,
  questName: string,
  questId: string,
) => {
  const seekerEmail = await getEmailFromCognito(seekerId)

  if (!seekerEmail) {
    console.warn(
      'sendSeekerQuestExpiredEmail: seeker email not found for',
      seekerId,
    )
    return
  }

  const questUrl = `https://questseeker.co.nz/user/quest/${questId}`
  const footer = `\n\n---\nThis is an automated transactional message. You are receiving this because you joined a quest on questseeker.co.nz.`

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [seekerEmail] },
      Message: {
        Subject: { Data: `Quest "${questName}" has ended` },
        Body: {
          Text: {
            Data: `Kia ora!\n\nThe quest "${questName}" you were participating in has now ended.\n\nYou can view your completed tasks and see if you won any prizes by visiting:\n\n${questUrl}\n\nThank you for participating!\n\nNgā mihi,\nThe QuestSeeker Team${footer}`,
          },
        },
      },
    }),
  )
}

// SUPPORT FORM EMAIL

export const sendSupportEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string,
) => {
  const footer = `\n\n---\nThis is an automated message from the Quest Seeker support form.`

  const emailBody = `
New Support Request

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM
Name: ${name}
Email: ${email}

SUBJECT
${subject}

MESSAGE
${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply to: ${email}
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [ADMIN_EMAIL] },
      ReplyToAddresses: [email],
      Message: {
        Subject: { Data: `Support Request: ${subject}` },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  )

  // Optional: Send confirmation to user
  const confirmationBody = `
Hi ${name},

Thank you for contacting Quest Seeker support. We've received your message and will get back to you as soon as possible.

Your message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subject: ${subject}

${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
The Quest Seeker Team
${footer}
  `.trim()

  await safeSend(
    new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'We received your support request' },
        Body: {
          Text: { Data: confirmationBody },
        },
      },
    }),
  )
}

export const sendCreatorMessageEmail = async (
  profileId: string,
  questName: string,
  questId: string,
  creatorMessage: string,
  creatorName?: string,
) => {
  try {
    // Get user email from Cognito
    const email = await getEmailFromCognito(profileId)

    if (!email) {
      console.warn(`No email found for profile: ${profileId}`)
      return
    }

    const questUrl = `${process.env.APP_URL || 'https://yourapp.com'}/user/quest/${questId}`

    await safeSend(
      new SendEmailCommand({
        Source: FROM_ADDRESS,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: `Message from ${creatorName || 'Quest Creator'}: ${questName}`,
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">📢 Message from ${creatorName || 'Quest Creator'}</h2>
                  <p style="color: #666; font-size: 14px;">Quest: <strong>${questName}</strong></p>
                  <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">${creatorMessage}</p>
                  </div>
                  <div style="margin: 20px 0;">
                    <a href="${questUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                      View Quest
                    </a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="color: #9ca3af; font-size: 12px;">
                    This message was sent to all participants of this quest.
                  </p>
                </div>
              `,
            },
            Text: {
              Data: `
Message from ${creatorName || 'Quest Creator'}

Quest: ${questName}

${creatorMessage}

View Quest: ${questUrl}

---
This message was sent to all participants of this quest.
              `.trim(),
            },
          },
        },
      }),
    )

    console.log(
      `✅ Creator message email sent to ${email} for quest ${questId}`,
    )
  } catch (err) {
    console.error(
      `Failed to send creator message email to profile ${profileId}:`,
      err,
    )
  }
}
