import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export const updateUserRole = async (
  userId: string,
  newRole: string,
  tableName: string,
) => {
  console.log('=== updateUserRole called ===')
  console.log('userId:', userId)
  console.log('newRole:', newRole)
  console.log('tableName:', tableName)

  try {
    console.log('Updating DynamoDB...')
    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: userId },
        UpdateExpression: 'SET #role = :role',
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': newRole },
      }),
    )
    console.log('DynamoDB update complete')
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    throw error
  }
}
