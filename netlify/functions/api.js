const serverless = require("serverless-http");
const { app, ready } = require("../../server");

const handler = serverless(app, { basePath: "/.netlify/functions/api" });

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await ready;
  return handler(event, context);
};
