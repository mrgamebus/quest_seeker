// import { defineFunction } from '@aws-amplify/backend'
// import {
//   Function as CdkFunction,
//   Runtime,
//   Code,
//   FunctionUrlAuthType,
// } from 'aws-cdk-lib/aws-lambda'

// export const nfcAward = defineFunction((scope) => {
//   const fn = new CdkFunction(scope, 'nfcAward', {
//     runtime: Runtime.NODEJS_20_X,
//     handler: 'handler.handler',
//     code: Code.fromAsset('./', {
//       exclude: ['.amplify/**', 'cdk.out/**', 'node_modules/**'],
//     }),
//   })

//   fn.addFunctionUrl({
//     authType: FunctionUrlAuthType.NONE,
//   })

//   return fn
// })

import { defineFunction } from '@aws-amplify/backend'

export const nfcAward = defineFunction({
  name: 'nfcAward',
  entry: './handler.ts',
})
