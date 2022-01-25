const TokenValidator = require('twilio-flex-token-validator').validator;

exports.handler = async function (context, event, callback) {


  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  let client = context.getTwilioClient();

  try {
    const flexToken = event.token;
    if (flexToken == null) {
      response.setStatusCode(400);
      response.setBody("<h1>token is required</h1>");
      return callback(null, response);
    }



    const tokenResult = await TokenValidator(flexToken, context.ACCOUNT_SID, context.AUTH_TOKEN).catch(e => { console.error(e); return null });
    if (tokenResult == null) {
      response.setStatusCode(400);
      response.setBody("<h1>ssoToken is invalid</h1>");
      return callback(null, response);
    }

    const workerName = event.workerName
    const dateAccepted = event.reservationAccepted
    const channelSid = event.channelSid
    const configuredFeatures = event.configuredFeatures
    const chatService = context.TWILIO_CHAT_SERVICE;

    response.body = {}

    client.chat.services(chatService)
      .channels(channelSid)
      .messages
      .list()
      .then(messages => {
        // agent first reply
        if (configuredFeatures['firstAgentResponse']) {
          const agentFirstResponse = messages.find(m => m.from === workerName);
          let firstAgentMessageDuration = 0;

          if (agentFirstResponse) {
            const agentFirstResponseTimeUTC = new Date(new Date(agentFirstResponse.dateCreated).toISOString());
            const dateAcceptedUTC = new Date(dateAccepted);
            firstAgentMessageDuration = (agentFirstResponseTimeUTC - dateAcceptedUTC) / 1000;
            response.body['firstAgentResponse'] = firstAgentMessageDuration
          }
        }

        // average message time
        if (configuredFeatures['averageResponseTime']) {
          let durations = []

          for (let i = 0; i < messages.length; i++) {
            if (i > 0) {
              if (messages[i].from === workerName && messages[i].from !== messages[i - 1].from) {
                durations.push((new Date(messages[i].dateCreated) - new Date(messages[i - 1].dateCreated)) / 1000)
              }
            }
          }
          durations.shift() // exclude first agent response
          const averageTime = (durations.length > 0) ? durations.reduce((a, b) => a + b, 0) / durations.length : null
          response.body['averageResponseTime'] = averageTime
        }

        // agent message count
        if (configuredFeatures['agentMessages']) {
          const agentMessages = messages.filter(({ from }) => from === workerName).length
          response.body['agentMessages'] = agentMessages
        }

        // customer message count
        if (configuredFeatures['customerMessages']) {
          const customerMessages = messages.filter(({ from }) => from != workerName).length
          response.body['customerMessages'] = customerMessages
        }

        // agent average length
        if (configuredFeatures['averageAgentLength']) {
          const agentMessages = messages.filter(({ from }) => from === workerName).length
          let totalLength = 0

          for (let i = 0; i < messages.length; i++) {
            (messages[i].from === workerName) ? totalLength += messages[i].body.length : null
          }

          const averageAgentLength = totalLength / agentMessages
          response.body['averageAgentLength'] = averageAgentLength
        }

        // customer average lenght
        if (configuredFeatures['averageCustomerLength']) {
          const customerMessages = messages.filter(({ from }) => from != workerName).length
          let totalLength = 0

          for (let i = 0; i < messages.length; i++) {
            (messages[i].from != workerName) ? totalLength += messages[i].body.length : null
          }

          const averageCustomerLength = totalLength / customerMessages
          response.body['averageCustomerLength'] = averageCustomerLength
        }

        console.log('response :>> ', response);
        return response
      }).then(response => {
        callback(null, response)
      }
      )
      .catch((error) => {
        callback(error);
      });;

  } catch (e) {
    response.setStatusCode(500);
    response.setBody("<h1>Internal Server Error</h1>");
    return callback(null, response);
  }
}